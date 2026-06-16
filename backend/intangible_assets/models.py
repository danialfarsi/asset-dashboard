from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator

class DiscoveryForm(models.Model):
    """IA-F-02-01: فرم کشف دارایی‌های نامشهود"""
    
    # ========== اطلاعات کلی ==========
    company = models.CharField(max_length=255, null=True, blank=True, verbose_name='شرکت')
    date = models.DateField(null=True, blank=True, verbose_name='تاریخ')  # auto_now_add حذف شد
    department = models.CharField(max_length=255, null=True, blank=True, verbose_name='واحد/بخش')
    responsible_person = models.CharField(max_length=255, null=True, blank=True, verbose_name='مسئول تکمیل')
    
    # ========== بخش ۱ ==========
    project_name = models.CharField(max_length=255, null=True, blank=True, verbose_name='نام پروژه کشف')
    project_goal = models.TextField(null=True, blank=True, verbose_name='هدف کشف')
    search_scope = models.TextField(null=True, blank=True, verbose_name='محدوده جستجو')
    duration = models.CharField(max_length=100, null=True, blank=True, verbose_name='مدت زمان کشف')
    allocated_resources = models.TextField(null=True, blank=True, verbose_name='منابع اختصاص یافته')
    
    # ========== بخش ۲ ==========
    discovery_methods_documentation = models.BooleanField(default=False)
    discovery_methods_reports = models.BooleanField(default=False)
    discovery_methods_processes = models.BooleanField(default=False)
    discovery_methods_contracts = models.BooleanField(default=False)
    discovery_methods_instructions = models.BooleanField(default=False)
    discovery_methods_projects = models.BooleanField(default=False)
    discovery_methods_interviews = models.BooleanField(default=False)
    discovery_methods_databases = models.BooleanField(default=False)
    discovery_methods_knowledge = models.BooleanField(default=False)
    discovery_methods_social = models.BooleanField(default=False)
    
    # ========== بخش ۳ ==========
    strategic_assets = models.JSONField(default=list, null=True, blank=True)
    operational_assets = models.JSONField(default=list, null=True, blank=True)
    support_assets = models.JSONField(default=list, null=True, blank=True)
    
    # ========== بخش ۴ ==========
    economic_patents = models.TextField(null=True, blank=True)
    economic_trademarks = models.TextField(null=True, blank=True)
    economic_copyrights = models.TextField(null=True, blank=True)
    economic_business_models = models.TextField(null=True, blank=True)
    economic_customer_data = models.TextField(null=True, blank=True)
    economic_market_data = models.TextField(null=True, blank=True)
    
    social_csr = models.TextField(null=True, blank=True)
    social_charity = models.TextField(null=True, blank=True)
    social_stakeholders = models.TextField(null=True, blank=True)
    social_business_networks = models.TextField(null=True, blank=True)
    
    knowledge_technical = models.TextField(null=True, blank=True)
    knowledge_experiences = models.TextField(null=True, blank=True)
    knowledge_rd_results = models.TextField(null=True, blank=True)
    knowledge_new_tech = models.TextField(null=True, blank=True)
    
    cultural_values = models.TextField(null=True, blank=True)
    cultural_innovation = models.TextField(null=True, blank=True)
    cultural_brand = models.TextField(null=True, blank=True)
    cultural_image = models.TextField(null=True, blank=True)
    
    environmental_green_tech = models.TextField(null=True, blank=True)
    environmental_sustainable = models.TextField(null=True, blank=True)
    environmental_carbon = models.TextField(null=True, blank=True)
    environmental_resource = models.TextField(null=True, blank=True)
    
    # ========== بخش ۵ ==========
    challenges = models.TextField(null=True, blank=True)
    limitations = models.TextField(null=True, blank=True)
    
    # ========== بخش ۶ ==========
    actions_immediate = models.TextField(null=True, blank=True)
    actions_medium = models.TextField(null=True, blank=True)
    actions_long = models.TextField(null=True, blank=True)
    
    # ========== امضاءها ==========
    prepared_by = models.CharField(max_length=255, null=True, blank=True)
    prepared_signature = models.CharField(max_length=100, null=True, blank=True)
    prepared_date = models.DateField(null=True, blank=True)
    
    reviewed_by = models.CharField(max_length=255, null=True, blank=True)
    reviewed_signature = models.CharField(max_length=100, null=True, blank=True)
    reviewed_date = models.DateField(null=True, blank=True)
    
    approved_by = models.CharField(max_length=255, null=True, blank=True)
    approved_signature = models.CharField(max_length=100, null=True, blank=True)
    approved_date = models.DateField(null=True, blank=True)
    
    # ========== متادیتا ==========
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.project_name or 'بدون نام'} - {self.company or 'بدون شرکت'}"


class ExpertInterview(models.Model):
    discovery_form = models.ForeignKey(DiscoveryForm, on_delete=models.CASCADE, related_name='interviews')
    expert_name = models.CharField(max_length=255)
    expert_position = models.CharField(max_length=255)
    interview_date = models.DateField()
    tacit_knowledge = models.TextField()
    recorded_at = models.DateTimeField(auto_now_add=True)


class TacitKnowledgeForm(models.Model):
    discovery_form = models.ForeignKey(DiscoveryForm, on_delete=models.CASCADE, related_name='tacit_knowledge')
    knowledge_title = models.CharField(max_length=255)
    knowledge_description = models.TextField()
    source_person = models.CharField(max_length=255)
    department = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)


class AssetListForm(models.Model):
    discovery_form = models.ForeignKey(DiscoveryForm, on_delete=models.CASCADE, related_name='asset_lists')
    list_date = models.DateField(auto_now_add=True)
    total_count = models.IntegerField()
    notes = models.TextField(blank=True)


class ClassificationForm(models.Model):
    CATEGORY_CHOICES = [
        ('technological', 'فناورانه'),
        ('knowledge', 'دانشی'),
        ('relational', 'ارتباطی'),
        ('human', 'انسانی'),
        ('structural', 'ساختاری'),
    ]
    discovery_form = models.ForeignKey(DiscoveryForm, on_delete=models.CASCADE, related_name='classifications')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    sub_category = models.CharField(max_length=100, blank=True)
    classification_date = models.DateField(auto_now_add=True)


class HiddenAssetChecklist(models.Model):
    discovery_form = models.ForeignKey(DiscoveryForm, on_delete=models.CASCADE, related_name='hidden_checklists')
    is_documented = models.BooleanField(default=False)
    is_in_use = models.BooleanField(default=False)
    has_expert = models.BooleanField(default=False)
    has_market_value = models.BooleanField(default=False)
    notes = models.TextField(blank=True)


class PreliminaryEvaluation(models.Model):
    discovery_form = models.ForeignKey(DiscoveryForm, on_delete=models.CASCADE, related_name='evaluations')
    estimated_value = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    confidence_level = models.IntegerField(default=50, validators=[MinValueValidator(0), MaxValueValidator(100)])
    evaluator = models.CharField(max_length=255)
    evaluation_date = models.DateField(auto_now_add=True)

# ==================== هویت‌سنجی دارایی‌های نامشهود ====================

class IdentityAssessment(models.Model):
    """IA-F-00-01: فرم هویت‌سنجی دارایی‌های نامشهود"""
    
    STATUS_CHOICES = [
        ('verified', 'تأیید شده'),
        ('pending', 'در انتظار'),
        ('rejected', 'رد شده'),
    ]
    
    # اطلاعات دارایی
    asset_name = models.CharField(max_length=255, verbose_name='نام دارایی')
    asset_type = models.CharField(max_length=100, blank=True, verbose_name='نوع دارایی')
    description = models.TextField(blank=True, verbose_name='توضیحات')
    
    # ارتباط با دارایی کشف شده (اختیاری)
    discovery_form = models.ForeignKey(
        'DiscoveryForm', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='identity_assessments',
        verbose_name='فرم کشف مرتبط'
    )
    
    # ۲۰ سوال پرسشنامه (امتیاز ۱ تا ۵)
    q1 = models.IntegerField(default=3, validators=[MinValueValidator(1), MaxValueValidator(5)])
    q2 = models.IntegerField(default=3, validators=[MinValueValidator(1), MaxValueValidator(5)])
    q3 = models.IntegerField(default=3, validators=[MinValueValidator(1), MaxValueValidator(5)])
    q4 = models.IntegerField(default=3, validators=[MinValueValidator(1), MaxValueValidator(5)])
    q5 = models.IntegerField(default=3, validators=[MinValueValidator(1), MaxValueValidator(5)])
    q6 = models.IntegerField(default=3, validators=[MinValueValidator(1), MaxValueValidator(5)])
    q7 = models.IntegerField(default=3, validators=[MinValueValidator(1), MaxValueValidator(5)])
    q8 = models.IntegerField(default=3, validators=[MinValueValidator(1), MaxValueValidator(5)])
    q9 = models.IntegerField(default=3, validators=[MinValueValidator(1), MaxValueValidator(5)])
    q10 = models.IntegerField(default=3, validators=[MinValueValidator(1), MaxValueValidator(5)])
    q11 = models.IntegerField(default=3, validators=[MinValueValidator(1), MaxValueValidator(5)])
    q12 = models.IntegerField(default=3, validators=[MinValueValidator(1), MaxValueValidator(5)])
    q13 = models.IntegerField(default=3, validators=[MinValueValidator(1), MaxValueValidator(5)])
    q14 = models.IntegerField(default=3, validators=[MinValueValidator(1), MaxValueValidator(5)])
    q15 = models.IntegerField(default=3, validators=[MinValueValidator(1), MaxValueValidator(5)])
    q16 = models.IntegerField(default=3, validators=[MinValueValidator(1), MaxValueValidator(5)])
    q17 = models.IntegerField(default=3, validators=[MinValueValidator(1), MaxValueValidator(5)])
    q18 = models.IntegerField(default=3, validators=[MinValueValidator(1), MaxValueValidator(5)])
    q19 = models.IntegerField(default=3, validators=[MinValueValidator(1), MaxValueValidator(5)])
    q20 = models.IntegerField(default=3, validators=[MinValueValidator(1), MaxValueValidator(5)])
    
    # نتیجه
    total_score = models.FloatField(default=0, verbose_name='امتیاز نهایی')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='وضعیت')
    
    # متادیتا
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def calculate_score(self):
        """محاسبه امتیاز نهایی از ۲۰ سوال"""
        questions = [self.q1, self.q2, self.q3, self.q4, self.q5,
                     self.q6, self.q7, self.q8, self.q9, self.q10,
                     self.q11, self.q12, self.q13, self.q14, self.q15,
                     self.q16, self.q17, self.q18, self.q19, self.q20]
        total = sum(questions)
        self.total_score = (total / 100) * 100
        return self.total_score
    
    def determine_status(self):
        """تعیین وضعیت بر اساس امتیاز"""
        if self.total_score >= 80:
            return 'verified'
        elif self.total_score >= 60:
            return 'pending'
        else:
            return 'rejected'
    
    def save(self, *args, **kwargs):
        """قبل از ذخیره، امتیاز و وضعیت را محاسبه کن"""
        self.calculate_score()
        self.status = self.determine_status()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.asset_name} - {self.get_status_display()} ({self.total_score:.1f}%)"
    
    class Meta:
        verbose_name = 'هویت‌سنجی دارایی'
        verbose_name_plural = 'هویت‌سنجی دارایی‌ها'
        ordering = ['-created_at']
