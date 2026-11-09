"""
موتور ۶ — تجاری‌سازی دارایی‌های نامشهود
Commercialization Engine (Engine 06)

۵ گام:
  1. ارزیابی آمادگی تجاری‌سازی
  2. انتخاب مدل تجاری‌سازی + Business Case
  3. شناسایی و ارزیابی شرکا
  4. مذاکره و تنظیم قرارداد
  5. مدیریت قرارداد و وصول درآمد
"""

from django.db import models
from django.conf import settings
from django.utils import timezone


# ============================================================
# ۰. پایگاه شرکا (Partner Database)
# ============================================================
class Partner(models.Model):
    """پایگاه شرکای بالقوه برای تجاری‌سازی"""

    PARTNER_TYPE_CHOICES = [
        ("licensee", "مجوزگیرنده (Licensee)"),
        ("jv", "شریک سرمایه‌گذاری مشترک (JV)"),
        ("acquirer", "خریدار کامل"),
        ("franchisee", "فرنچایزگیرنده"),
        ("service_consumer", "مصرف‌کننده خدمات دانشی"),
    ]

    RISK_LEVEL_CHOICES = [
        ("low", "کم"),
        ("medium", "متوسط"),
        ("high", "بالا"),
    ]

    name = models.CharField(max_length=300, verbose_name="نام شریک")
    name_en = models.CharField(max_length=300, blank=True, verbose_name="نام انگلیسی")
    partner_type = models.CharField(max_length=30, choices=PARTNER_TYPE_CHOICES, default="licensee")
    country = models.CharField(max_length=100, blank=True, verbose_name="کشور")
    industry = models.CharField(max_length=200, blank=True, verbose_name="صنعت")

    # معیارهای ارزیابی
    financial_capacity_score = models.PositiveSmallIntegerField(default=0, verbose_name="توان مالی (0-100)")
    track_record_score = models.PositiveSmallIntegerField(default=0, verbose_name="سابقه (0-100)")
    strategic_alignment_score = models.PositiveSmallIntegerField(default=0, verbose_name="هم‌راستایی راهبردی (0-100)")
    market_access_score = models.PositiveSmallIntegerField(default=0, verbose_name="دسترسی به بازار (0-100)")
    reputation_score = models.PositiveSmallIntegerField(default=0, verbose_name="اعتبار (0-100)")

    # پرچم‌های منع
    has_conflict_of_interest = models.BooleanField(default=False, verbose_name="تعارض منافع")
    has_contract_breach_history = models.BooleanField(default=False, verbose_name="سابقه نقض قرارداد")
    is_sanctioned = models.BooleanField(default=False, verbose_name="تحریم‌شده")

    # اطلاعات تماس
    contact_person = models.CharField(max_length=200, blank=True, verbose_name="شخص تماس")
    contact_email = models.EmailField(blank=True, verbose_name="ایمیل")
    contact_phone = models.CharField(max_length=50, blank=True, verbose_name="تلفن")

    notes = models.TextField(blank=True, verbose_name="یادداشت")
    is_active = models.BooleanField(default=True, verbose_name="فعال")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "engine06_partner"
        verbose_name = "شریک تجاری"
        verbose_name_plural = "پایگاه شرکا"
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.name} ({self.get_partner_type_display()})"

    @property
    def is_blacklisted(self):
        return (
            self.has_conflict_of_interest
            or self.has_contract_breach_history
            or self.is_sanctioned
        )

    @property
    def weighted_score(self):
        """امتیاز وزنی — وزن‌ها از Config خوانده می‌شود"""
        from intangible_assets.engine_06.config import ConfigLoader
        criteria = ConfigLoader.partner_evaluation_criteria()["criteria"]
        weights = {c["id"]: c["weight"] for c in criteria}
        total_weight = sum(weights.values()) or 1
        return round(
            (
                self.financial_capacity_score * weights.get("financial_capacity", 0)
                + self.track_record_score * weights.get("track_record", 0)
                + self.strategic_alignment_score * weights.get("strategic_alignment", 0)
                + self.market_access_score * weights.get("market_access", 0)
                + self.reputation_score * weights.get("reputation", 0)
            ) / total_weight,
            2,
        )


# ============================================================
# ۱. پرونده تجاری‌سازی (Case)
# ============================================================
class CommercializationCase(models.Model):
    """پرونده تجاری‌سازی برای هر دارایی — کانتینر ۵ گام"""

    STATUS_CHOICES = [
        ("draft", "پیش‌نویس"),
        ("step_1_readiness", "گام ۱ — ارزیابی آمادگی"),
        ("step_2_business_model", "گام ۲ — انتخاب مدل تجاری‌سازی"),
        ("step_3_partners", "گام ۳ — شناسایی شرکا"),
        ("step_4_contract", "گام ۴ — مذاکره و قرارداد"),
        ("step_5_revenue", "گام ۵ — وصول درآمد"),
        ("closed_won", "بسته‌شده — موفق"),
        ("closed_lost", "بسته‌شده — ناموفق"),
        ("on_hold", "متوقف"),
    ]

    # اتصال به دارایی
    asset = models.OneToOneField(
        "intangible_assets.ScreenedAsset",
        on_delete=models.PROTECT,
        related_name="commercialization_case",
        verbose_name="دارایی",
    )
    organization = models.ForeignKey(
        "accounts.Organization",
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name="commercialization_cases",
        verbose_name="سازمان",
    )
    department = models.ForeignKey(
        "accounts.Department",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="commercialization_cases",
        verbose_name="واحد",
    )

    # وضعیت جریان
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default="draft")
    current_step = models.PositiveSmallIntegerField(default=1, verbose_name="گام فعلی (1-5)")
    started_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    closure_reason = models.TextField(blank=True, verbose_name="دلیل بسته‌شدن")

    # مسئول
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="owned_commercialization_cases",
        verbose_name="مدیر BD مسئول",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="created_commercialization_cases",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "engine06_case"
        verbose_name = "پرونده تجاری‌سازی"
        verbose_name_plural = "پرونده‌های تجاری‌سازی"
        ordering = ["-created_at"]

    def __str__(self):
        return f"COM-{self.id} — {self.asset.asset_name if self.asset else '?'}"

    def advance_to_step(self, step: int):
        """پیشبرد پرونده به گام بعدی"""
        if step < 1 or step > 5:
            raise ValueError("گام باید بین ۱ تا ۵ باشد")
        self.current_step = step
        self.status = {
            1: "step_1_readiness",
            2: "step_2_business_model",
            3: "step_3_partners",
            4: "step_4_contract",
            5: "step_5_revenue",
        }[step]
        self.save(update_fields=["current_step", "status", "updated_at"])


# ============================================================
# ۲. گام ۱ — ارزیابی آمادگی
# ============================================================
class ReadinessAssessment(models.Model):
    """ارزیابی آمادگی تجاری‌سازی (گام ۱)"""

    RECOMMENDATION_CHOICES = [
        ("go", "Go — برو به گام ۲"),
        ("develop_further", "Develop Further — بازگشت به موتور ۴"),
        ("no_go", "No-Go — بایگانی"),
        ("pending", "در انتظار"),
    ]

    case = models.OneToOneField(
        CommercializationCase,
        on_delete=models.CASCADE,
        related_name="readiness_assessment",
    )

    # امتیازهای معیارها (JSON: {"criterion_id": {"score": 80, "evidence": "..."}})
    criteria_scores = models.JSONField(default=dict, verbose_name="امتیاز معیارها")

    total_score = models.DecimalField(max_digits=5, decimal_places=2, default=0, verbose_name="امتیاز کل")
    confidence_level = models.PositiveSmallIntegerField(default=0, verbose_name="سطح اطمینان (0-100)")

    recommendation = models.CharField(
        max_length=20, choices=RECOMMENDATION_CHOICES, default="pending"
    )
    auto_recommendation = models.CharField(
        max_length=20, blank=True, verbose_name="توصیه خودکار سیستم"
    )

    # Override توسط کمیته
    is_overridden = models.BooleanField(default=False, verbose_name="تغییر یافته توسط کمیته")
    override_reason = models.TextField(blank=True, verbose_name="دلیل تغییر")
    overridden_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="readiness_overrides",
    )
    overridden_at = models.DateTimeField(null=True, blank=True)

    assessed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="readiness_assessments",
        verbose_name="کارشناس ارزیاب",
    )
    assessed_at = models.DateTimeField(default=timezone.now, verbose_name="تاریخ ارزیابی")

    class Meta:
        db_table = "engine06_readiness"
        verbose_name = "ارزیابی آمادگی"
        verbose_name_plural = "ارزیابی‌های آمادگی"

    def __str__(self):
        return f"Readiness COM-{self.case_id} — {self.total_score}"


# ============================================================
# ۳. گام ۲ — انتخاب مدل تجاری‌سازی
# ============================================================
class BusinessModelSelection(models.Model):
    """انتخاب مدل تجاری‌سازی + Business Case (گام ۲)"""

    MODEL_CHOICES = [
        ("exclusive_license", "لایسنس انحصاری"),
        ("non_exclusive_license", "لایسنس غیرانحصاری"),
        ("full_sale", "فروش کامل"),
        ("joint_venture", "سرمایه‌گذاری مشترک (JV)"),
        ("spin_off", "اسپین‌آف"),
        ("franchise", "فرنچایز"),
        ("knowledge_services", "خدمات دانشی"),
    ]

    case = models.OneToOneField(
        CommercializationCase,
        on_delete=models.CASCADE,
        related_name="business_model_selection",
    )

    selected_model = models.CharField(
        max_length=50, choices=MODEL_CHOICES, verbose_name="مدل تجاری‌سازی منتخب"
    )

    # Business Case با سه سناریو
    business_case_data = models.JSONField(
        default=dict, verbose_name="داده‌های Business Case (سه سناریو)"
    )

    # خلاصه نتایج
    npv_base = models.DecimalField(max_digits=20, decimal_places=2, default=0, verbose_name="NPV سناریوی پایه")
    irr_base = models.DecimalField(max_digits=6, decimal_places=2, default=0, verbose_name="IRR سناریوی پایه (٪)")
    payback_months = models.PositiveIntegerField(default=0, verbose_name="دوره بازگشت (ماه)")

    # توجیه در صورت انتخاب مدل غیر از رتبه اول سیستم
    system_rank_1_model = models.CharField(max_length=50, blank=True, verbose_name="مدل رتبه ۱ سیستم")
    requires_justification = models.BooleanField(default=False)
    justification = models.TextField(blank=True, verbose_name="توجیه انتخاب")

    approved_by_committee = models.BooleanField(default=False, verbose_name="تصویب کمیته")
    approved_at = models.DateTimeField(null=True, blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="business_model_selections",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "engine06_business_model"
        verbose_name = "انتخاب مدل تجاری‌سازی"
        verbose_name_plural = "انتخاب‌های مدل تجاری‌سازی"

    def __str__(self):
        return f"BM COM-{self.case_id} — {self.get_selected_model_display()}"


# ============================================================
# ۴. گام ۳ — فهرست کوتاه شرکا
# ============================================================
class PartnerShortlist(models.Model):
    """فهرست کوتاه شرکای واجد شرایط (گام ۳)"""

    case = models.OneToOneField(
        CommercializationCase,
        on_delete=models.CASCADE,
        related_name="partner_shortlist",
    )

    # لیست شرکا با امتیاز و رتبه (JSON)
    partners_data = models.JSONField(
        default=list, verbose_name="لیست شرکا با امتیاز و رتبه"
    )

    # لیست شرکای حذف‌شده و دلیل (JSON)
    rejected_partners = models.JSONField(
        default=list, verbose_name="شرکای حذف‌شده و دلیل"
    )

    # NDA — دروازه اجباری پیش از تبادل فنی
    nda_required = models.BooleanField(default=True, verbose_name="NDA اجباری")
    nda_signed = models.BooleanField(default=False, verbose_name="NDA امضا شده")
    nda_signed_at = models.DateTimeField(null=True, blank=True, verbose_name="تاریخ امضای NDA")
    nda_signed_with = models.JSONField(
        default=list,
        verbose_name="لیست شرکای دارای NDA امضاشده (partner_id)",
    )

    approved_by_committee = models.BooleanField(default=False, verbose_name="تصویب کمیته")
    approved_at = models.DateTimeField(null=True, blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="partner_shortlists",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "engine06_partner_shortlist"
        verbose_name = "فهرست کوتاه شرکا"
        verbose_name_plural = "فهرست‌های کوتاه شرکا"

    def __str__(self):
        return f"Shortlist COM-{self.case_id} — {len(self.partners_data or [])} شریک"


# ============================================================
# ۵. گام ۴ — قرارداد تجاری‌سازی
# ============================================================
class CommercializationContract(models.Model):
    """قرارداد تجاری‌سازی (گام ۴)"""

    STATUS_CHOICES = [
        ("draft", "پیش‌نویس"),
        ("negotiation", "در حال مذاکره"),
        ("legal_review", "بازبینی حقوقی"),
        ("approval_pending", "در انتظار تصویب"),
        ("signed", "امضا شده"),
        ("active", "فعال"),
        ("terminated", "فسخ شده"),
        ("expired", "منقضی شده"),
    ]

    case = models.OneToOneField(
        CommercializationCase,
        on_delete=models.CASCADE,
        related_name="contract",
    )

    partner = models.ForeignKey(
        Partner, on_delete=models.PROTECT,
        related_name="contracts",
        verbose_name="شریک",
    )

    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default="draft")

    # شرایط کلیدی (JSON)
    terms = models.JSONField(
        default=dict,
        verbose_name="شرایط کلیدی (نرخ رویالتی، مدت، قلمرو، انحصار، ...)",
    )

    # چک‌لیست ۱۴ بندی حقوقی
    legal_checklist = models.JSONField(
        default=dict, verbose_name="چک‌لیست ۱۴ بندی حقوقی"
    )
    legal_checklist_complete = models.BooleanField(default=False, verbose_name="چک‌لیست کامل شده")

    # تخته مذاکره (تاریخچه دورها)
    negotiation_log = models.JSONField(
        default=list, verbose_name="تاریخچه مذاکرات"
    )

    # امضا
    signed_at = models.DateTimeField(null=True, blank=True, verbose_name="تاریخ امضا")
    signed_by_name = models.CharField(max_length=200, blank=True, verbose_name="نام امضاکننده")

    # ثبت در CLM
    clm_reference = models.CharField(max_length=200, blank=True, verbose_name="شناسه CLM")

    # هشدارها
    warnings = models.JSONField(default=list, verbose_name="هشدارها")
    needs_exception_approval = models.BooleanField(default=False, verbose_name="نیاز به تصویب استثنا")
    exception_approved_by = models.CharField(max_length=200, blank=True, verbose_name="تأییدکننده استثنا")

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="created_contracts",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "engine06_contract"
        verbose_name = "قرارداد تجاری‌سازی"
        verbose_name_plural = "قراردادهای تجاری‌سازی"

    def __str__(self):
        return f"Contract COM-{self.case_id} — {self.partner.name if self.partner else '?'}"


# ============================================================
# ۵.۵ تقویم پرداخت (Payment Schedule)
# ============================================================
class PaymentSchedule(models.Model):
    """تقویم تعهدات و سررسیدهای پرداخت — تولید خودکار بر اساس قرارداد"""

    STATUS_CHOICES = [
        ("pending", "در انتظار"),
        ("due_soon", "نزدیک سررسید"),
        ("overdue", "معوق"),
        ("paid", "پرداخت شده"),
        ("waived", "بخشیده شده"),
    ]

    contract = models.ForeignKey(
        CommercializationContract,
        on_delete=models.CASCADE,
        related_name="payment_schedules",
        verbose_name="قرارداد",
    )

    title = models.CharField(max_length=200, verbose_name="عنوان تعهد")
    due_date = models.DateField(verbose_name="سررسید")
    amount_expected = models.DecimalField(
        max_digits=20, decimal_places=2, default=0,
        verbose_name="مبلغ مورد انتظار",
    )
    amount_paid = models.DecimalField(
        max_digits=20, decimal_places=2, default=0,
        verbose_name="مبلغ پرداخت‌شده",
    )

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    reminder_sent_at = models.DateTimeField(null=True, blank=True, verbose_name="تاریخ ارسال یادآوری")
    paid_at = models.DateTimeField(null=True, blank=True, verbose_name="تاریخ پرداخت")
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "engine06_payment_schedule"
        verbose_name = "تقویم پرداخت"
        verbose_name_plural = "تقویم‌های پرداخت"
        ordering = ["due_date"]

    def __str__(self):
        return f"Pay {self.contract_id} — {self.title} ({self.due_date})"


# ============================================================
# ۶. گام ۵ — درآمد (Revenue Record)
# ============================================================
class RevenueRecord(models.Model):
    """ثبت درآمد و وصول (گام ۵)"""

    STATUS_CHOICES = [
        ("pending", "در انتظار"),
        ("calculated", "محاسبه شده"),
        ("disputed", "اختلاف"),
        ("collected", "وصول شده"),
        ("partial", "وصول جزئی"),
    ]

    contract = models.ForeignKey(
        CommercializationContract,
        on_delete=models.CASCADE,
        related_name="revenue_records",
        verbose_name="قرارداد",
    )

    period_label = models.CharField(max_length=50, verbose_name="دوره (مثلاً ۱۴۰۳-Q۱)")
    period_start = models.DateField(verbose_name="شروع دوره")
    period_end = models.DateField(verbose_name="پایان دوره")

    # درآمد اعلامی شریک
    reported_revenue = models.DecimalField(
        max_digits=20, decimal_places=2, default=0, verbose_name="درآمد اعلامی شریک"
    )

    # درآمد محاسبه مستقل سیستم
    calculated_revenue = models.DecimalField(
        max_digits=20, decimal_places=2, default=0, verbose_name="درآمد محاسبه مستقل سیستم"
    )

    # مغایرت
    variance = models.DecimalField(
        max_digits=20, decimal_places=2, default=0, verbose_name="مغایرت"
    )
    variance_percent = models.DecimalField(
        max_digits=6, decimal_places=2, default=0, verbose_name="درصد مغایرت"
    )
    has_significant_variance = models.BooleanField(default=False, verbose_name="مغایرت معنادار")

    # وصول
    collected_amount = models.DecimalField(
        max_digits=20, decimal_places=2, default=0, verbose_name="مبلغ وصول شده"
    )
    collected_at = models.DateTimeField(null=True, blank=True, verbose_name="تاریخ وصول")
    bank_reference = models.CharField(max_length=200, blank=True, verbose_name="مرجع بانکی")

    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default="pending")

    # داده اضافی (فاکتور، توضیحات)
    extra_data = models.JSONField(default=dict, verbose_name="داده اضافی")

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="created_revenue_records",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "engine06_revenue"
        verbose_name = "ثبت درآمد"
        verbose_name_plural = "ثبت‌های درآمد"
        ordering = ["-period_end"]
        indexes = [
            models.Index(fields=["contract", "period_end"]),
        ]

    def __str__(self):
        return f"Rev Contract-{self.contract_id} — {self.period_label}"


# ============================================================
# ۷. لاگ فعالیت‌ها
# ============================================================
class CommercializationActivityLog(models.Model):
    """لاگ همه فعالیت‌های پرونده (برای audit trail)"""

    ACTION_CHOICES = [
        ("created", "ایجاد پرونده"),
        ("step_advanced", "پیشبرد گام"),
        ("readiness_submitted", "ارزیابی آمادگی ثبت شد"),
        ("readiness_overridden", "توصیه تغییر یافت"),
        ("business_model_selected", "مدل انتخاب شد"),
        ("partners_shortlisted", "شرکا فیلتر شدند"),
        ("contract_drafted", "قرارداد پیش‌نویس"),
        ("contract_signed", "قرارداد امضا شد"),
        ("revenue_recorded", "درآمد ثبت شد"),
        ("case_closed", "پرونده بسته شد"),
        ("other", "سایر"),
    ]

    case = models.ForeignKey(
        CommercializationCase,
        on_delete=models.CASCADE,
        related_name="activity_logs",
    )
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    description = models.TextField(blank=True)
    extra_data = models.JSONField(default=dict)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "engine06_activity_log"
        verbose_name = "لاگ فعالیت"
        verbose_name_plural = "لاگ فعالیت‌ها"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Log COM-{self.case_id} — {self.get_action_display()}"
