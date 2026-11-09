"""
مدل‌های بازسازی‌شده گام ۱ — ارزیابی آمادگی تجاری‌سازی
مطابق دقیق PDF «گام ۱ موتور ۵» (که در واقع موتور ۶ است)
"""

from django.db import models
from django.conf import settings
from django.utils import timezone

# استفاده از BusinessType موجود در role_models (نه ساخت دوباره)
from intangible_assets.role_models import BusinessType


# ============================================================
# ۱. خانواده دارایی (۶ خانواده)
# ============================================================
class AssetFamily(models.Model):
    """۶ خانواده اصلی دارایی"""

    code = models.CharField(max_length=10, unique=True, verbose_name="کد")
    name_fa = models.CharField(max_length=200, verbose_name="نام فارسی")
    name_en = models.CharField(max_length=200, blank=True, verbose_name="نام انگلیسی")
    description_fa = models.TextField(blank=True, verbose_name="توضیح")
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = "engine06_asset_family"
        verbose_name = "خانواده دارایی"
        verbose_name_plural = "خانواده‌های دارایی"
        ordering = ["order", "code"]

    def __str__(self):
        return f"{self.code} — {self.name_fa}"


# ============================================================
# ۳. نگاشت AssetType → خانواده
# ============================================================
class AssetFamilyMap(models.Model):
    """نگاشت هر AssetType به خانواده اصلی و (اختیاری) فرعی"""

    asset_type = models.OneToOneField(
        "intangible_assets.AssetType",
        on_delete=models.CASCADE,
        related_name="family_mapping",
        verbose_name="نوع دارایی",
    )
    primary_family = models.ForeignKey(
        AssetFamily,
        on_delete=models.PROTECT,
        related_name="primary_mappings",
        verbose_name="خانواده اصلی",
    )
    secondary_family = models.ForeignKey(
        AssetFamily,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="secondary_mappings",
        verbose_name="خانواده فرعی",
    )
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "engine06_asset_family_map"
        verbose_name = "نگاشت خانواده"
        verbose_name_plural = "نگاشت‌های خانواده"

    def __str__(self):
        return f"{self.asset_type.name} → {self.primary_family.code}"


# ============================================================
# ۴. بعد آمادگی (۹ بعد)
# ============================================================
class ReadinessDimension(models.Model):
    """۹ بعد هسته"""

    code = models.CharField(max_length=10, unique=True, verbose_name="کد")
    name_fa = models.CharField(max_length=200, verbose_name="نام فارسی")
    description_fa = models.TextField(blank=True)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = "engine06_readiness_dimension"
        verbose_name = "بعد آمادگی"
        verbose_name_plural = "ابعاد آمادگی"
        ordering = ["order", "code"]

    def __str__(self):
        return f"{self.code} — {self.name_fa}"


# ============================================================
# ۵. گویه (Criterion) — ۴۳ گویه
# ============================================================
class ReadinessCriterion(models.Model):
    """گویه‌های پرسشنامه — ۳۶ هسته + ۱۸ خانواده + ۱۶ کسب‌وکار"""

    SECTION_CHOICES = [
        ("core", "هسته (۹ بعد)"),
        ("family", "خانواده دارایی"),
        ("business", "نوع کسب‌وکار"),
    ]

    code = models.CharField(max_length=20, unique=True, verbose_name="کد گویه")
    section = models.CharField(max_length=20, choices=SECTION_CHOICES)

    # برای بخش هسته
    dimension = models.ForeignKey(
        ReadinessDimension,
        on_delete=models.PROTECT,
        null=True, blank=True,
        related_name="criteria",
    )

    # برای بخش خانواده
    family = models.ForeignKey(
        AssetFamily,
        on_delete=models.PROTECT,
        null=True, blank=True,
        related_name="criteria",
    )

    # برای بخش کسب‌وکار
    business_type = models.ForeignKey(
        BusinessType,
        on_delete=models.PROTECT,
        null=True, blank=True,
        related_name="criteria",
    )

    text_fa = models.TextField(verbose_name="متن گویه (بیرونی)")
    text_internal_fa = models.TextField(
        blank=True,
        verbose_name="متن گویه (درون‌گروهی)",
        help_text="برای گویه‌های 2D و 6D در مسیر درون‌گروهی",
    )
    suggested_evidence = models.TextField(blank=True, verbose_name="شاهد پیشنهادی")

    is_required_evidence = models.BooleanField(default=False, verbose_name="شاهد الزامی (★)")
    is_critical = models.BooleanField(default=False, verbose_name="گویه بحرانی (K)")

    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = "engine06_readiness_criterion"
        verbose_name = "گویه آمادگی"
        verbose_name_plural = "گویه‌های آمادگی"
        ordering = ["section", "order", "code"]

    def __str__(self):
        return f"{self.code} — {self.text_fa[:50]}"

    def text_for_path(self, path):
        """متن گویه بر اساس مسیر (بیرونی/درون‌گروهی)"""
        if path == "internal" and self.text_internal_fa:
            return self.text_internal_fa
        return self.text_fa


# ============================================================
# ۶. مقیاس لیکرت (۵ سطح)
# ============================================================
class LikertScale(models.Model):
    """۵ سطح تحقق — بلوغ مبتنی بر شاهد"""

    level = models.PositiveSmallIntegerField(unique=True, verbose_name="سطح")
    label_fa = models.CharField(max_length=100, verbose_name="برچسب")
    meaning_fa = models.TextField(blank=True, verbose_name="معنا")
    base_score = models.PositiveSmallIntegerField(verbose_name="نمره پایه")

    class Meta:
        db_table = "engine06_likert_scale"
        verbose_name = "سطح لیکرت"
        verbose_name_plural = "سطوح لیکرت"
        ordering = ["level"]

    def __str__(self):
        return f"{self.level} — {self.label_fa} ({self.base_score})"


# ============================================================
# ۷. ضریب اعتبار شاهد (۴ سطح)
# ============================================================
class EvidenceFactor(models.Model):
    """سطوح شاهد — تأثیرگذار بر نمره نهایی"""

    code = models.CharField(max_length=5, unique=True, verbose_name="کد")
    label_fa = models.CharField(max_length=100, verbose_name="برچسب")
    description_fa = models.TextField(blank=True)
    factor_required = models.DecimalField(
        max_digits=4, decimal_places=2,
        verbose_name="ضریب برای گویه الزامی (★)",
    )
    factor_optional = models.DecimalField(
        max_digits=4, decimal_places=2,
        verbose_name="ضریب برای گویه غیرالزامی",
    )

    class Meta:
        db_table = "engine06_evidence_factor"
        verbose_name = "ضریب شاهد"
        verbose_name_plural = "ضرایب شاهد"
        ordering = ["code"]

    def __str__(self):
        return f"{self.code} — {self.label_fa}"


# ============================================================
# ۸. وزن ابعاد بر اساس نوع کسب‌وکار
# ============================================================
class DimensionWeight(models.Model):
    """وزن هر بعد برای هر نوع کسب‌وکار (جمع = ۱۰۰)"""

    dimension = models.ForeignKey(
        ReadinessDimension, on_delete=models.CASCADE,
        related_name="weights",
    )
    business_type = models.ForeignKey(
        BusinessType, on_delete=models.CASCADE,
        related_name="dimension_weights",
    )
    weight = models.DecimalField(max_digits=5, decimal_places=2, verbose_name="وزن")

    class Meta:
        db_table = "engine06_dimension_weight"
        verbose_name = "وزن بعد"
        verbose_name_plural = "وزن‌های ابعاد"
        unique_together = [("dimension", "business_type")]

    def __str__(self):
        return f"{self.dimension.code} / {self.business_type.code}: {self.weight}"


# ============================================================
# ۹. وزن بخش‌ها (الف، ب، ج)
# ============================================================
class PartWeight(models.Model):
    """وزن سه بخش در محاسبه نهایی"""

    PART_CHOICES = [
        ("A", "الف — هسته"),
        ("B", "ب — خانواده"),
        ("C", "ج — کسب‌وکار"),
    ]

    part = models.CharField(max_length=1, choices=PART_CHOICES, unique=True)
    weight = models.DecimalField(max_digits=4, decimal_places=3, verbose_name="وزن")

    class Meta:
        db_table = "engine06_part_weight"
        verbose_name = "وزن بخش"
        verbose_name_plural = "وزن بخش‌ها"

    def __str__(self):
        return f"{self.get_part_display()} = {self.weight}"


# ============================================================
# ۱۰. آستانه آمادگی بر اساس نوع کسب‌وکار
# ============================================================
class ReadinessThreshold(models.Model):
    """آستانه‌های Go/Develop/No-Go برای هر نوع کسب‌وکار"""

    business_type = models.OneToOneField(
        BusinessType, on_delete=models.CASCADE,
        related_name="threshold",
    )
    go_min_score = models.PositiveSmallIntegerField(verbose_name="حداقل امتیاز Go")
    go_min_confidence = models.PositiveSmallIntegerField(verbose_name="حداقل اطمینان Go")
    no_go_max_score = models.PositiveSmallIntegerField(verbose_name="حد بالای No-Go")

    class Meta:
        db_table = "engine06_readiness_threshold"
        verbose_name = "آستانه آمادگی"
        verbose_name_plural = "آستانه‌های آمادگی"

    def __str__(self):
        return f"{self.business_type.code}: Go≥{self.go_min_score}, No-Go<{self.no_go_max_score}"


# ============================================================
# ۱۱. قاعده توصیه (۶ قاعده)
# ============================================================
class RecommendationRule(models.Model):
    """۶ قاعده تولید توصیه پیش‌فرض — به ترتیب بررسی می‌شوند"""

    CONDITION_CHOICES = [
        ("blocker_exists", "گویه بحرانی با مانع قطعی"),
        ("below_no_go", "امتیاز زیر حد پایین توقف"),
        ("critical_low_score", "امتیاز کافی ولی گویه بحرانی سطح ۱/۲"),
        ("confidence_low", "امتیاز کافی ولی اطمینان کم"),
        ("between_thresholds", "امتیاز بین دو آستانه"),
        ("all_pass", "همه شروط برآورده"),
    ]

    RECOMMENDATION_CHOICES = [
        ("go", "Go"),
        ("develop", "Develop"),
        ("no_go", "No-Go"),
    ]

    order = models.PositiveSmallIntegerField(unique=True, verbose_name="ترتیب")
    condition_type = models.CharField(max_length=30, choices=CONDITION_CHOICES)
    recommendation = models.CharField(max_length=10, choices=RECOMMENDATION_CHOICES)
    sub_state_fa = models.CharField(max_length=200, verbose_name="زیرحالت")
    message_template = models.TextField(verbose_name="قالب پیام")
    destination = models.CharField(
        max_length=200, blank=True,
        verbose_name="مقصد ارجاع (برای Develop)",
    )

    class Meta:
        db_table = "engine06_recommendation_rule"
        verbose_name = "قاعده توصیه"
        verbose_name_plural = "قواعد توصیه"
        ordering = ["order"]

    def __str__(self):
        return f"{self.order}. {self.condition_type} → {self.recommendation}"


# ============================================================
# ۱۲. مسیر ارجاع در Develop
# ============================================================
class RoutingRule(models.Model):
    """مسیر ارجاع در حالت Develop — بعد ضعیف → اقدام → مقصد"""

    weak_dimension = models.ForeignKey(
        ReadinessDimension, on_delete=models.CASCADE,
        related_name="routing_rules",
        null=True, blank=True,
        verbose_name="بعد ضعیف",
    )
    weak_condition = models.CharField(
        max_length=100, blank=True,
        verbose_name="شرط ضعف (مثلاً: قابلیت انتقال، شواهد ناکافی)",
    )
    suggested_action_fa = models.TextField(verbose_name="اقدام پیشنهادی")
    destination = models.CharField(max_length=200, verbose_name="مقصد")
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = "engine06_routing_rule"
        verbose_name = "قاعده ارجاع"
        verbose_name_plural = "قواعد ارجاع"
        ordering = ["order"]

    def __str__(self):
        return f"{self.weak_dimension.code if self.weak_dimension else self.weak_condition} → {self.destination}"


# ============================================================
# ۱۳. پاسخ هر گویه
# ============================================================
class ReadinessCriterionResponse(models.Model):
    """پاسخ کارشناس به یک گویه"""

    assessment = models.ForeignKey(
        "intangible_assets.ReadinessAssessmentV2",
        on_delete=models.CASCADE,
        related_name="responses",
    )
    criterion = models.ForeignKey(
        ReadinessCriterion, on_delete=models.PROTECT,
        related_name="responses",
    )

    likert_level = models.PositiveSmallIntegerField(
        null=True, blank=True,
        verbose_name="سطح لیکرت (1-5)",
    )
    evidence_level = models.CharField(
        max_length=5, blank=True,
        verbose_name="سطح شاهد (0E/1E/2E/3E)",
    )
    evidence_description = models.TextField(blank=True, verbose_name="توضیح شاهد")

    is_blocker = models.BooleanField(
        default=False,
        verbose_name="مانع قطعی",
        help_text="فقط روی گویه‌های بحرانی (K) مجاز است",
    )
    is_irrelevant = models.BooleanField(default=False, verbose_name="نامربوط")
    irrelevant_reason = models.TextField(blank=True, verbose_name="دلیل نامربوط")

    # محاسبه شده
    score_base = models.PositiveSmallIntegerField(default=0, verbose_name="نمره پایه")
    score_final = models.DecimalField(
        max_digits=6, decimal_places=2, default=0,
        verbose_name="نمره نهایی (پس از ضریب)",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "engine06_criterion_response"
        verbose_name = "پاسخ گویه"
        verbose_name_plural = "پاسخ‌های گویه"
        unique_together = [("assessment", "criterion")]

    def __str__(self):
        return f"Resp {self.assessment_id}/{self.criterion.code}"


# ============================================================
# ۱۳.۵ شاهد آپلودشده برای هر گویه
# ============================================================
def evidence_upload_path(instance, filename):
    """مسیر ذخیره‌سازی: media/engine06/evidence/{assessment_id}/{criterion_code}/{filename}"""
    return f"engine06/evidence/{instance.response.assessment_id}/{instance.response.criterion.code}/{filename}"


class CriterionEvidence(models.Model):
    """فایل شاهد آپلودشده برای یک گویه"""

    EVIDENCE_TYPES = [
        ("document", "سند"),
        ("report", "گزارش"),
        ("link", "لینک"),
        ("image", "تصویر"),
        ("video", "ویدیو"),
        ("other", "سایر"),
    ]

    response = models.ForeignKey(
        "intangible_assets.ReadinessCriterionResponse",
        on_delete=models.CASCADE,
        related_name="evidence_files",
    )

    file = models.FileField(
        upload_to=evidence_upload_path,
        blank=True,
        null=True,
        verbose_name="فایل",
    )
    external_link = models.URLField(
        max_length=1000,
        blank=True,
        verbose_name="لینک بیرونی",
        help_text="لینک به سند بیرونی (Drive، SharePoint، وب‌سایت)",
    )
    title = models.CharField(max_length=300, blank=True, verbose_name="عنوان")
    description = models.TextField(blank=True, verbose_name="توضیحات")
    evidence_type = models.CharField(
        max_length=20, choices=EVIDENCE_TYPES, default="document",
    )

    # آیا تأیید مستقل شده؟ (برای 3E)
    is_independently_verified = models.BooleanField(
        default=False,
        verbose_name="تأیید مستقل شده",
    )
    verified_by = models.CharField(
        max_length=200, blank=True,
        verbose_name="تأییدکننده",
    )
    verified_at = models.DateTimeField(null=True, blank=True)

    file_size = models.PositiveBigIntegerField(default=0, verbose_name="حجم (بایت)")
    mime_type = models.CharField(max_length=100, blank=True)

    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="uploaded_evidence_files",
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "engine06_criterion_evidence"
        verbose_name = "فایل شاهد"
        verbose_name_plural = "فایل‌های شاهد"
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"{self.response.criterion.code} — {self.title or self.file.name}"

    def save(self, *args, **kwargs):
        if self.file and not self.file_size:
            try:
                self.file_size = self.file.size
            except Exception:
                pass
        super().save(*args, **kwargs)


# ============================================================
# ۱۴. ReadinessAssessment V2 — بازسازی‌شده
# ============================================================
class ReadinessAssessmentV2(models.Model):
    """ارزیابی آمادگی V2 — مطابق PDF"""

    PATH_CHOICES = [
        ("external", "بیرونی"),
        ("internal", "درون‌گروهی"),
    ]

    RECOMMENDATION_CHOICES = [
        ("go", "Go"),
        ("develop", "Develop"),
        ("no_go", "No-Go"),
        ("pending", "در انتظار"),
    ]

    case = models.OneToOneField(
        "intangible_assets.CommercializationCase",
        on_delete=models.CASCADE,
        related_name="readiness_v2",
    )

    # پیکربندی
    path = models.CharField(max_length=20, choices=PATH_CHOICES, default="external")
    business_type = models.ForeignKey(
        BusinessType, on_delete=models.PROTECT,
        null=True, blank=True,
        related_name="assessments",
    )
    asset_family = models.ForeignKey(
        AssetFamily, on_delete=models.PROTECT,
        null=True, blank=True,
        related_name="assessments",
    )

    # نمرات
    dimension_scores = models.JSONField(
        default=dict,
        verbose_name="نمرات ۹ بعد",
        help_text='{"1D": 80, "2D": 60, ...}',
    )
    core_score = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        verbose_name="نمره هسته (Core)",
    )
    family_avg_score = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        verbose_name="میانگین خانواده",
    )
    business_avg_score = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        verbose_name="میانگین کسب‌وکار",
    )
    final_score = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        verbose_name="امتیاز نهایی",
    )
    confidence_level = models.PositiveSmallIntegerField(
        default=0, verbose_name="سطح اطمینان",
    )

    # توصیه
    recommendation = models.CharField(
        max_length=20, choices=RECOMMENDATION_CHOICES, default="pending",
    )
    sub_state_fa = models.CharField(max_length=300, blank=True, verbose_name="زیرحالت")
    triggered_rule = models.ForeignKey(
        RecommendationRule, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="assessments",
    )
    routing_destination = models.CharField(
        max_length=200, blank=True,
        verbose_name="مقصد ارجاع",
    )
    recommendation_message = models.TextField(blank=True, verbose_name="پیام توصیه")

    # تحلیل
    top_strengths = models.JSONField(
        default=list, verbose_name="۳ بعد برتر",
        help_text='[{"code": "1D", "name": "...", "score": 85}, ...]',
    )
    top_weaknesses = models.JSONField(
        default=list, verbose_name="۳ بعد ضعیف‌تر",
    )
    critical_issues = models.JSONField(
        default=list, verbose_name="گویه‌های بحرانی مسئله‌دار",
    )
    is_blocked = models.BooleanField(default=False, verbose_name="مانع قطعی")

    # Override کمیته
    is_overridden = models.BooleanField(default=False)
    override_reason = models.TextField(blank=True)
    overridden_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="readiness_v2_overrides",
    )
    overridden_at = models.DateTimeField(null=True, blank=True)

    # ارزیابی
    assessed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="readiness_v2_assessments",
    )
    assessed_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField(
        null=True, blank=True,
        verbose_name="تاریخ انقضا (۶ ماه)",
    )

    class Meta:
        db_table = "engine06_readiness_v2"
        verbose_name = "ارزیابی آمادگی V2"
        verbose_name_plural = "ارزیابی‌های آمادگی V2"

    def __str__(self):
        return f"ReadinessV2 COM-{self.case_id} — {self.final_score}"


# ============================================================
# ۱۵. CommitteeDecision — Override کامل
# ============================================================
class CommitteeDecision(models.Model):
    """تصمیم کمیته تجاری‌سازی — Override کامل مطابق PDF"""

    DECISION_TYPE_CHOICES = [
        ("confirm", "تأیید توصیه سیستم"),
        ("upgrade", "ارتقا (مثلاً Develop → Go)"),
        ("downgrade", "تنزل (مثلاً Go → Develop)"),
    ]

    assessment = models.ForeignKey(
        ReadinessAssessmentV2, on_delete=models.CASCADE,
        related_name="committee_decisions",
    )
    system_recommendation = models.CharField(max_length=20, verbose_name="توصیه سیستم")
    committee_decision = models.CharField(
        max_length=20,
        choices=[("go", "Go"), ("develop", "Develop"), ("no_go", "No-Go")],
    )
    decision_type = models.CharField(max_length=20, choices=DECISION_TYPE_CHOICES)

    reason = models.TextField(verbose_name="دلیل مکتوب")
    risk_acceptance = models.TextField(
        blank=True,
        verbose_name="پذیرش ریسک (برای ارتقا)",
    )
    risk_owner = models.CharField(
        max_length=200, blank=True,
        verbose_name="مسئول ریسک",
    )
    conditional_actions = models.JSONField(
        default=list,
        verbose_name="شرایط تعلیقی (برای Go مشروط)",
        help_text='[{"action": "...", "owner": "...", "deadline": "..."}, ...]',
    )
    signed_by = models.JSONField(
        default=list,
        verbose_name="امضاکنندگان",
        help_text='[{"name": "...", "role": "...", "signed_at": "..."}, ...]',
    )
    votes_for = models.PositiveSmallIntegerField(default=0, verbose_name="آرای موافق")
    votes_against = models.PositiveSmallIntegerField(default=0, verbose_name="آرای مخالف")
    required_majority = models.CharField(
        max_length=20, default="simple",
        verbose_name="حد نصاب",
        help_text="simple | two_thirds",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True,
    )

    class Meta:
        db_table = "engine06_committee_decision"
        verbose_name = "تصمیم کمیته"
        verbose_name_plural = "تصمیمات کمیته"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Decision {self.assessment_id} — {self.committee_decision}"
