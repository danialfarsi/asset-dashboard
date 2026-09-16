from django.db import models
from django.conf import settings


class DevelopmentOpportunity(models.Model):
    """
    فرصت توسعه دارایی (گام ۱ موتور ۴ — تحلیل شکاف)
    
    طبق سند META-ENG4-SPEC-v1.0:
    {opp_id, asset_ref_id, gap_type, gap_score, potential_value, target_module: DEV}
    """
    
    class GapType(models.TextChoices):
        STRATEGIC = 'strategic', 'شکاف استراتژیک'
        TECHNICAL = 'technical', 'شکاف فنی'
        OPERATIONAL = 'operational', 'شکاف عملیاتی'
        MARKET = 'market', 'شکاف بازار'
        RISK = 'risk', 'شکاف ریسک'
        MIXED = 'mixed', 'شکاف ترکیبی'
    
    class TargetModule(models.TextChoices):
        DEV = 'DEV', 'توسعه دارایی موجود'
        INNO = 'INNO', 'خلق دارایی جدید'
    
    class Status(models.TextChoices):
        IDENTIFIED = 'identified', 'شناسایی شده'
        SCORED = 'scored', 'امتیازدهی شده'
        APPROVED = 'approved', 'تأیید شده'
        BACKLOG = 'backlog', 'در انتظار'
        REJECTED = 'rejected', 'رد شده'
        IN_PROGRESS = 'in_progress', 'در حال اجرا'
        COMPLETED = 'completed', 'تکمیل شده'
    
    # ارتباط با دارایی
    asset = models.ForeignKey(
        'ScreenedAsset',
        on_delete=models.CASCADE,
        related_name='development_opportunities',
        null=True, blank=True,
        verbose_name='دارایی مرجع'
    )
    asset_name = models.CharField(max_length=500, verbose_name='نام دارایی')
    
    # سازمان
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='development_opportunities',
        null=True, blank=True,
        verbose_name='سازمان'
    )
    
    # نوع شکاف
    gap_type = models.CharField(
        max_length=20,
        choices=GapType.choices,
        default=GapType.MIXED,
        verbose_name='نوع شکاف'
    )
    
    # امتیازهای ابعاد (طبق موتور ۲)
    current_s = models.FloatField(default=0, verbose_name='امتیاز فعلی استراتژیک')
    current_t = models.FloatField(default=0, verbose_name='امتیاز فعلی فنی')
    current_o = models.FloatField(default=0, verbose_name='امتیاز فعلی عملیاتی')
    current_m = models.FloatField(default=0, verbose_name='امتیاز فعلی بازار')
    current_r = models.FloatField(default=0, verbose_name='امتیاز فعلی ریسک')
    
    # امتیازهای هدف
    target_s = models.FloatField(default=4.5, verbose_name='هدف استراتژیک')
    target_t = models.FloatField(default=4.5, verbose_name='هدف فنی')
    target_o = models.FloatField(default=4.5, verbose_name='هدف عملیاتی')
    target_m = models.FloatField(default=4.5, verbose_name='هدف بازار')
    target_r = models.FloatField(default=4.5, verbose_name='هدف ریسک')
    
    # امتیاز شکاف کل
    gap_score = models.FloatField(default=0, verbose_name='امتیاز شکاف کل')
    is_critical = models.BooleanField(default=False, verbose_name='شکاف بحرانی')
    
    # ارزش بالقوه
    potential_value = models.DecimalField(
        max_digits=20,
        decimal_places=2,
        default=0,
        verbose_name='ارزش بالقوه (ریال)'
    )
    
    # ماژول مقصد
    target_module = models.CharField(
        max_length=10,
        choices=TargetModule.choices,
        default=TargetModule.DEV,
        verbose_name='ماژول مقصد'
    )
    
    # وضعیت
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.IDENTIFIED,
        verbose_name='وضعیت'
    )
    
    # توضیحات
    description = models.TextField(blank=True, verbose_name='توضیحات')
    recommendation = models.TextField(blank=True, verbose_name='توصیه اقدام')
    
    # متادیتا
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='created_opportunities',
        verbose_name='ایجادکننده'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'فرصت توسعه'
        verbose_name_plural = 'فرصت‌های توسعه'
        ordering = ['-gap_score', '-created_at']
        indexes = [
            models.Index(fields=['organization', 'status']),
            models.Index(fields=['target_module', 'status']),
            models.Index(fields=['is_critical']),
        ]
    
    def __str__(self):
        return f"{self.asset_name} - {self.get_gap_type_display()} ({self.gap_score:.2f})"
    
    def calculate_gap_score(self, weights=None):
        """
        محاسبه امتیاز شکاف کل:
        Total_Gap = Σ (w_d × max(0, Target_d - Current_d))
        """
        if weights is None:
            weights = {
                's': 0.2,
                't': 0.2,
                'o': 0.2,
                'm': 0.2,
                'r': 0.2,
            }
        
        gaps = {
            's': max(0, self.target_s - self.current_s),
            't': max(0, self.target_t - self.current_t),
            'o': max(0, self.target_o - self.current_o),
            'm': max(0, self.target_m - self.current_m),
            'r': max(0, self.target_r - self.current_r),
        }
        
        total = sum(weights[k] * gaps[k] for k in gaps)
        self.gap_score = round(total, 2)
        return self.gap_score


class InnovationIdea(models.Model):
    """
    ایده نوآوری و خلق دارایی جدید (گام ۱ موتور ۴)
    
    طبق سند META-ENG4-SPEC-v1.0:
    {idea_id, title, concept_desc, source, tech_domain, strategic_alignment, target_module: INNO}
    """
    
    class Source(models.TextChoices):
        RND = 'rnd', 'R&D داخلی'
        EMPLOYEE = 'employee', 'پیشنهاد کارکنان'
        EXTERNAL = 'external', 'شریک خارجی'
        UNIVERSITY = 'university', 'دانشگاه'
        MARKET = 'market', 'بازار'
        OTHER = 'other', 'سایر'
    
    class TechDomain(models.TextChoices):
        SOFTWARE = 'software', 'نرم‌افزار'
        HARDWARE = 'hardware', 'سخت‌افزار'
        CHEMICAL = 'chemical', 'شیمیایی'
        MECHANICAL = 'mechanical', 'مکانیکی'
        BIOTECH = 'biotech', 'بیوتکنولوژی'
        PROCESS = 'process', 'فرآیند'
        BUSINESS_MODEL = 'business_model', 'مدل کسب‌وکار'
        OTHER = 'other', 'سایر'
    
    class Status(models.TextChoices):
        DRAFT = 'draft', 'پیش‌نویس'
        SUBMITTED = 'submitted', 'ارسال شده'
        SCORED = 'scored', 'امتیازدهی شده'
        APPROVED = 'approved', 'تأیید شده'
        BACKLOG = 'backlog', 'در انتظار'
        REJECTED = 'rejected', 'رد شده'
        IN_PROGRESS = 'in_progress', 'در حال اجرا'
        COMPLETED = 'completed', 'تکمیل شده'
    
    # اطلاعات پایه
    title = models.CharField(max_length=500, verbose_name='عنوان ایده')
    concept_desc = models.TextField(verbose_name='شرح مفهوم')
    
    # منبع
    source = models.CharField(
        max_length=20,
        choices=Source.choices,
        default=Source.RND,
        verbose_name='منبع'
    )
    
    # حوزه فناوری
    tech_domain = models.CharField(
        max_length=30,
        choices=TechDomain.choices,
        default=TechDomain.OTHER,
        verbose_name='حوزه فناوری'
    )
    
    # همسویی استراتژیک
    strategic_alignment = models.FloatField(
        default=0,
        verbose_name='همسویی استراتژیک (۰-۵)'
    )
    
    # سازمان
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='innovation_ideas',
        null=True, blank=True,
        verbose_name='سازمان'
    )
    
    # ماژول
    target_module = models.CharField(
        max_length=10,
        default='INNO',
        editable=False,
        verbose_name='ماژول مقصد'
    )
    
    # وضعیت
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        verbose_name='وضعیت'
    )
    
    # متادیتا
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='created_innovation_ideas',
        verbose_name='ایجادکننده'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'ایده نوآوری'
        verbose_name_plural = 'ایده‌های نوآوری'
        ordering = ['-strategic_alignment', '-created_at']
    
    def __str__(self):
        return f"{self.title} ({self.get_tech_domain_display()})"


# ═══════════════════════════════════════════════════════════
# گام ۲: اولویت‌بندی و انتخاب پروژه (MCDM)
# ═══════════════════════════════════════════════════════════

class PrioritizedProject(models.Model):
    """
    پروژه اولویت‌بندی‌شده (گام ۲ موتور ۴)
    
    طبق سند META-ENG4-SPEC-v1.0:
    {project_id, opp_or_idea_id, score, rank, approval_status, approved_budget}
    """
    
    class ApprovalStatus(models.TextChoices):
        PENDING = 'pending', 'در انتظار تصمیم'
        APPROVED = 'approved', 'تأیید شده'
        BACKLOG = 'backlog', 'در انتظار'
        REJECTED = 'rejected', 'رد شده'
    
    class ProjectType(models.TextChoices):
        DEV = 'DEV', 'توسعه دارایی'
        INNO = 'INNO', 'خلق دارایی جدید'
    
    # منبع: یا فرصت یا ایده
    opportunity = models.ForeignKey(
        DevelopmentOpportunity,
        on_delete=models.CASCADE,
        related_name='prioritized_projects',
        null=True, blank=True,
        verbose_name='فرصت توسعه'
    )
    innovation_idea = models.ForeignKey(
        InnovationIdea,
        on_delete=models.CASCADE,
        related_name='prioritized_projects',
        null=True, blank=True,
        verbose_name='ایده نوآوری'
    )
    
    # عنوان پروژه
    title = models.CharField(max_length=500, verbose_name='عنوان پروژه')
    
    # نوع پروژه
    project_type = models.CharField(
        max_length=10,
        choices=ProjectType.choices,
        verbose_name='نوع پروژه'
    )
    
    # امتیازهای ۵ معیار (MCDM)
    c1_strategic = models.FloatField(default=0, verbose_name='ارزش استراتژیک (C1)')
    c2_roi = models.FloatField(default=0, verbose_name='بازگشت سرمایه (C2)')
    c3_feasibility = models.FloatField(default=0, verbose_name='امکان‌پذیری (C3)')
    c4_goal_alignment = models.FloatField(default=0, verbose_name='هم‌راستایی اهداف (C4)')
    c5_urgency = models.FloatField(default=0, verbose_name='فوریت (C5)')
    
    # امتیاز نهایی (محاسبه خودکار)
    priority_score = models.FloatField(default=0, verbose_name='امتیاز اولویت')
    rank = models.IntegerField(default=0, verbose_name='رتبه')
    
    # بودجه
    estimated_budget = models.DecimalField(
        max_digits=20, decimal_places=2, default=0,
        verbose_name='بودجه تخمینی (ریال)'
    )
    approved_budget = models.DecimalField(
        max_digits=20, decimal_places=2, default=0,
        verbose_name='بودجه مصوب (ریال)'
    )
    
    # وضعیت
    approval_status = models.CharField(
        max_length=20,
        choices=ApprovalStatus.choices,
        default=ApprovalStatus.PENDING,
        verbose_name='وضعیت تصویب'
    )
    
    # سازمان
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='prioritized_projects',
        null=True, blank=True,
        verbose_name='سازمان'
    )
    
    # کامنت کمیته
    committee_comment = models.TextField(blank=True, verbose_name='نظر کمیته')
    
    # متادیتا
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='approved_projects',
        verbose_name='تأییدکننده'
    )
    approved_at = models.DateTimeField(null=True, blank=True, verbose_name='تاریخ تأیید')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='created_projects',
        verbose_name='ایجادکننده'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'پروژه اولویت‌بندی‌شده'
        verbose_name_plural = 'پروژه‌های اولویت‌بندی‌شده'
        ordering = ['rank', '-priority_score']
        indexes = [
            models.Index(fields=['organization', 'approval_status']),
            models.Index(fields=['rank']),
        ]
    
    def __str__(self):
        return f"#{self.rank} {self.title} ({self.priority_score:.2f})"
    
    def calculate_priority_score(self, weights=None):
        """
        محاسبه امتیاز اولویت با MCDM:
        Priority Score = Σ (w_i × C_i)
        """
        if weights is None:
            weights = {
                'c1': 0.25,
                'c2': 0.25,
                'c3': 0.20,
                'c4': 0.15,
                'c5': 0.15,
            }
        
        score = (
            weights['c1'] * self.c1_strategic +
            weights['c2'] * self.c2_roi +
            weights['c3'] * self.c3_feasibility +
            weights['c4'] * self.c4_goal_alignment +
            weights['c5'] * self.c5_urgency
        )
        
        self.priority_score = round(score, 2)
        return self.priority_score


# ═══════════════════════════════════════════════════════════
# گام ۳: طراحی و برنامه‌ریزی پروژه
# ═══════════════════════════════════════════════════════════

class ProjectCharter(models.Model):
    """
    منشور پروژه (گام ۳ موتور ۴)
    
    طبق سند META-ENG4-SPEC-v1.0:
    {charter_id, project_id, scope, business_case, target_kpis, methodology, team_assigned}
    """
    
    class Methodology(models.TextChoices):
        LINEAR = 'linear', 'آبشاری / خطی'
        STAGE_GATE = 'stage_gate', 'مرحله‌ای (Stage-Gate)'
    
    class Status(models.TextChoices):
        DRAFT = 'draft', 'پیش‌نویس'
        APPROVED = 'approved', 'تأیید شده'
        ACTIVE = 'active', 'فعال'
        COMPLETED = 'completed', 'تکمیل شده'
        CANCELLED = 'cancelled', 'لغو شده'
    
    project = models.OneToOneField(
        PrioritizedProject,
        on_delete=models.CASCADE,
        related_name='charter',
        verbose_name='پروژه'
    )
    
    # محدوده
    scope = models.TextField(verbose_name='محدوده پروژه')
    
    # توجیه کسب‌وکار
    business_case = models.TextField(blank=True, verbose_name='توجیه کسب‌وکار')
    
    # اهداف و KPIها
    target_kpis = models.JSONField(
        default=list,
        verbose_name='KPIهای هدف',
        help_text="لیست: [{name, target, unit}]"
    )
    
    # متدولوژی
    methodology = models.CharField(
        max_length=20,
        choices=Methodology.choices,
        default=Methodology.LINEAR,
        verbose_name='متدولوژی'
    )
    
    # تیم
    team_assigned = models.JSONField(
        default=list,
        verbose_name='تیم تخصیص‌یافته',
        help_text="لیست: [{user_id, role, name}]"
    )
    
    # ریسک‌ها
    risks = models.JSONField(
        default=list,
        verbose_name='ریسک‌ها',
        help_text="لیست: [{risk, impact, mitigation}]"
    )
    
    # وضعیت
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        verbose_name='وضعیت'
    )
    
    # متادیتا
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='created_charters',
        verbose_name='ایجادکننده'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'منشور پروژه'
        verbose_name_plural = 'منشورهای پروژه'
    
    def __str__(self):
        return f"منشور: {self.project.title}"


class GanttSchedule(models.Model):
    """
    زمان‌بندی گانت (گام ۳ موتور ۴)
    
    طبق سند META-ENG4-SPEC-v1.0:
    {schedule_id, project_id, milestones: [{ms_id, name, due_date, gate_decision_required}]}
    """
    
    project = models.OneToOneField(
        PrioritizedProject,
        on_delete=models.CASCADE,
        related_name='gantt_schedule',
        verbose_name='پروژه'
    )
    
    # تاریخ‌ها
    start_date = models.DateField(null=True, blank=True, verbose_name='تاریخ شروع')
    end_date = models.DateField(null=True, blank=True, verbose_name='تاریخ پایان')
    
    # Milestones
    milestones = models.JSONField(
        default=list,
        verbose_name='Milestoneها',
        help_text="لیست: [{id, name, due_date, gate_decision_required, status}]"
    )
    
    # WBS (Work Breakdown Structure)
    wbs = models.JSONField(
        default=list,
        verbose_name='WBS',
        help_text="لیست: [{id, name, parent, duration, owner, status}]"
    )
    
    # پیشرفت
    physical_progress = models.FloatField(default=0, verbose_name='پیشرفت فیزیکی (%)')
    
    # متادیتا
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='created_schedules',
        verbose_name='ایجادکننده'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'زمان‌بندی گانت'
        verbose_name_plural = 'زمان‌بندی‌های گانت'
    
    def __str__(self):
        return f"گانت: {self.project.title}"


class AllocatedBudget(models.Model):
    """
    بودجه تخصیص‌یافته (گام ۳ موتور ۴)
    
    طبق سند META-ENG4-SPEC-v1.0:
    {budget_id, project_id, cap_ex, op_ex, contingency_reserve, total_amount}
    """
    
    project = models.OneToOneField(
        PrioritizedProject,
        on_delete=models.CASCADE,
        related_name='allocated_budget',
        verbose_name='پروژه'
    )
    
    # Capex (سرمایه‌ای)
    capex = models.DecimalField(
        max_digits=20, decimal_places=2, default=0,
        verbose_name='هزینه سرمایه‌ای (Capex) - ریال'
    )
    
    # Opex (عملیاتی)
    opex = models.DecimalField(
        max_digits=20, decimal_places=2, default=0,
        verbose_name='هزینه عملیاتی (Opex) - ریال'
    )
    
    # ذخیره احتمالی
    contingency_reserve = models.DecimalField(
        max_digits=20, decimal_places=2, default=0,
        verbose_name='ذخیره احتمالی - ریال'
    )
    
    # جمع کل
    total_amount = models.DecimalField(
        max_digits=20, decimal_places=2, default=0,
        verbose_name='جمع کل - ریال'
    )
    
    # مصرف
    consumed_amount = models.DecimalField(
        max_digits=20, decimal_places=2, default=0,
        verbose_name='مصرف‌شده - ریال'
    )
    
    # متادیتا
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='created_budgets',
        verbose_name='ایجادکننده'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'بودجه تخصیص‌یافته'
        verbose_name_plural = 'بودجه‌های تخصیص‌یافته'
    
    def __str__(self):
        return f"بودجه: {self.project.title} - {self.total_amount}"
    
    def save(self, *args, **kwargs):
        """محاسبه خودکار total_amount"""
        self.total_amount = self.capex + self.opex + self.contingency_reserve
        super().save(*args, **kwargs)


# ═══════════════════════════════════════════════════════════
# گام ۴: اجرا، پایش و Stage-Gate
# ═══════════════════════════════════════════════════════════

class ProgressReport(models.Model):
    """
    گزارش پیشرفت (گام ۴ موتور ۴)
    
    طبق سند META-ENG4-SPEC-v1.0:
    {report_id, project_id, physical_progress_pct, budget_consumed_pct, variance_spi_cpi, active_risks}
    """
    
    class GateDecision(models.TextChoices):
        GO = 'go', 'ادامه به فاز بعد'
        RECYCLE = 'recycle', 'اصلاح فاز فعلی'
        HOLD = 'hold', 'تعلیق موقت'
        KILL = 'kill', 'توقف و ابطال'
        NOT_APPLICABLE = 'na', 'بدون تصمیم'
    
    project = models.ForeignKey(
        PrioritizedProject,
        on_delete=models.CASCADE,
        related_name='progress_reports',
        verbose_name='پروژه'
    )
    
    # گزارش
    report_number = models.IntegerField(default=1, verbose_name='شماره گزارش')
    report_date = models.DateField(auto_now_add=True, verbose_name='تاریخ گزارش')
    
    # پیشرفت فیزیکی
    physical_progress_pct = models.FloatField(default=0, verbose_name='پیشرفت فیزیکی (%)')
    
    # مصرف بودجه
    budget_consumed_pct = models.FloatField(default=0, verbose_name='مصرف بودجه (%)')
    
    # شاخص‌های EVM
    spi = models.FloatField(default=1.0, verbose_name='SPI (شاخص عملکرد زمانی)')
    cpi = models.FloatField(default=1.0, verbose_name='CPI (شاخص عملکرد هزینه)')
    
    # ریسک‌های فعال
    active_risks = models.JSONField(
        default=list,
        verbose_name='ریسک‌های فعال',
        help_text="لیست: [{risk, impact, status}]"
    )
    
    # تصمیم گیت
    gate_decision = models.CharField(
        max_length=20,
        choices=GateDecision.choices,
        default=GateDecision.NOT_APPLICABLE,
        verbose_name='تصمیم گیت'
    )
    gate_notes = models.TextField(blank=True, verbose_name='یادداشت تصمیم گیت')
    
    # توضیحات
    notes = models.TextField(blank=True, verbose_name='توضیحات')
    
    # متادیتا
    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='reported_progress',
        verbose_name='گزارش‌دهنده'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'گزارش پیشرفت'
        verbose_name_plural = 'گزارش‌های پیشرفت'
        ordering = ['-report_date', '-report_number']
    
    def __str__(self):
        return f"گزارش {self.report_number}: {self.project.title} - {self.physical_progress_pct}%"


# ═══════════════════════════════════════════════════════════
# گام ۵: تکمیل، انتقال و یکپارچه‌سازی
# ═══════════════════════════════════════════════════════════

class DevelopedOrNewAsset(models.Model):
    """
    دارایی توسعه‌یافته یا جدید (گام ۵ موتور ۴)
    
    طبق سند META-ENG4-SPEC-v1.0:
    {asset_package_id, is_new, source_asset_id, tech_docs_url, source_code_or_design, version}
    """
    
    project = models.ForeignKey(
        PrioritizedProject,
        on_delete=models.CASCADE,
        related_name='developed_assets',
        verbose_name='پروژه'
    )
    
    # آیا جدید است یا توسعه‌یافته؟
    is_new = models.BooleanField(default=False, verbose_name='دارایی جدید؟')
    
    # دارایی مرجع (اگه توسعه‌یافته)
    source_asset = models.ForeignKey(
        'ScreenedAsset',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='developed_versions',
        verbose_name='دارایی مرجع'
    )
    
    # دارایی جدید (بعد از ثبت در موتور ۱)
    new_asset = models.ForeignKey(
        'ScreenedAsset',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='created_from_projects',
        verbose_name='دارایی جدید'
    )
    
    # اطلاعات فنی
    tech_docs_url = models.URLField(blank=True, verbose_name='لینک مستندات فنی')
    source_code_or_design = models.TextField(blank=True, verbose_name='سورس‌کد یا طراحی')
    version = models.CharField(max_length=50, default='1.0.0', verbose_name='نسخه')
    
    # فایل‌های پیوست
    attachments = models.JSONField(
        default=list,
        verbose_name='فایل‌های پیوست',
        help_text="لیست: [{name, url, type}]"
    )
    
    # وضعیت ثبت در موتورها
    registered_in_engine_1 = models.BooleanField(default=False, verbose_name='ثبت در موتور ۱')
    protected_in_engine_3 = models.BooleanField(default=False, verbose_name='حفاظت در موتور ۳')
    valued_in_engine_2 = models.BooleanField(default=False, verbose_name='ارزش‌گذاری در موتور ۲')
    
    # متادیتا
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='created_developed_assets',
        verbose_name='ایجادکننده'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'دارایی توسعه‌یافته/جدید'
        verbose_name_plural = 'دارایی‌های توسعه‌یافته/جدید'
        ordering = ['-created_at']
    
    def __str__(self):
        type_str = 'جدید' if self.is_new else 'توسعه‌یافته'
        return f"{type_str}: {self.project.title} v{self.version}"


class ProjectClosureReport(models.Model):
    """
    گزارش اختتام پروژه (گام ۵ موتور ۴)
    
    طبق سند META-ENG4-SPEC-v1.0:
    {closure_id, project_id, final_kpi_score, variance_summary, lessons_learned, signoff_status}
    """
    
    class SignoffStatus(models.TextChoices):
        PENDING = 'pending', 'در انتظار امضا'
        SIGNED = 'signed', 'امضا شده'
        REJECTED = 'rejected', 'رد شده'
    
    project = models.OneToOneField(
        PrioritizedProject,
        on_delete=models.CASCADE,
        related_name='closure_report',
        verbose_name='پروژه'
    )
    
    # KPI نهایی
    final_kpi_score = models.FloatField(default=0, verbose_name='امتیاز نهایی KPI')
    
    # خلاصه انحرافات
    variance_summary = models.JSONField(
        default=dict,
        verbose_name='خلاصه انحرافات',
        help_text="{schedule_variance, cost_variance, scope_variance}"
    )
    
    # درس‌آموخته‌ها
    lessons_learned = models.TextField(blank=True, verbose_name='درس‌آموخته‌ها')
    
    # ROI محقق‌شده
    realized_roi = models.FloatField(default=0, verbose_name='ROI محقق‌شده (%)')
    
    # وضعیت امضا
    signoff_status = models.CharField(
        max_length=20,
        choices=SignoffStatus.choices,
        default=SignoffStatus.PENDING,
        verbose_name='وضعیت امضا'
    )
    
    # امضاکنندگان
    signoffs = models.JSONField(
        default=list,
        verbose_name='امضاکنندگان',
        help_text="لیست: [{user_id, role, name, signed_at}]"
    )
    
    # فایل گزارش
    report_file = models.FileField(
        upload_to='engine_05/closure_reports/',
        null=True, blank=True,
        verbose_name='فایل گزارش'
    )
    
    # متادیتا
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='created_closures',
        verbose_name='ایجادکننده'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'گزارش اختتام پروژه'
        verbose_name_plural = 'گزارش‌های اختتام پروژه'
    
    def __str__(self):
        return f"اختتام: {self.project.title}"
