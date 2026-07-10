from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator

# ==================== مدل‌های مرحله ۲: کشف و شناسایی ====================

class DiscoveryForm(models.Model):
    asset_name = models.CharField(max_length=255)
    asset_code = models.CharField(max_length=50, unique=True)
    asset_type = models.CharField(max_length=20)
    description = models.TextField()
    discovered_by = models.CharField(max_length=255)
    department = models.CharField(max_length=255)
    potential_value = models.TextField()
    attachment = models.FileField(upload_to='discovery/', null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)


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


class IdentityAssessment(models.Model):
    STATUS_CHOICES = [
        ('verified', 'تأیید شده'),
        ('pending', 'در انتظار'),
        ('rejected', 'رد شده'),
    ]
    asset_name = models.CharField(max_length=255)
    asset_type = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    q1 = models.IntegerField(default=3)
    q2 = models.IntegerField(default=3)
    q3 = models.IntegerField(default=3)
    q4 = models.IntegerField(default=3)
    q5 = models.IntegerField(default=3)
    q6 = models.IntegerField(default=3)
    q7 = models.IntegerField(default=3)
    q8 = models.IntegerField(default=3)
    q9 = models.IntegerField(default=3)
    q10 = models.IntegerField(default=3)
    q11 = models.IntegerField(default=3)
    q12 = models.IntegerField(default=3)
    q13 = models.IntegerField(default=3)
    q14 = models.IntegerField(default=3)
    q15 = models.IntegerField(default=3)
    q16 = models.IntegerField(default=3)
    q17 = models.IntegerField(default=3)
    q18 = models.IntegerField(default=3)
    q19 = models.IntegerField(default=3)
    q20 = models.IntegerField(default=3)
    total_score = models.FloatField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def calculate_score(self):
        questions = [self.q1, self.q2, self.q3, self.q4, self.q5,
                     self.q6, self.q7, self.q8, self.q9, self.q10,
                     self.q11, self.q12, self.q13, self.q14, self.q15,
                     self.q16, self.q17, self.q18, self.q19, self.q20]
        total = sum(questions)
        self.total_score = (total / 100) * 100
        return self.total_score
    
    def determine_status(self):
        if self.total_score >= 80:
            return 'verified'
        elif self.total_score >= 60:
            return 'pending'
        else:
            return 'rejected'
    
    def save(self, *args, **kwargs):
        self.calculate_score()
        self.status = self.determine_status()
        super().save(*args, **kwargs)
    
    class Meta:
        ordering = ['-created_at']


# ==================== مدل‌های غربالگری ====================

class OrganizationType(models.Model):
    TYPE_CHOICES = [
        ('manufacturing', 'تولیدی'),
        ('service', 'خدماتی'),
        ('rto', 'RTO'),
        ('holding', 'هلدینگ'),
    ]
    name = models.CharField(max_length=50, choices=TYPE_CHOICES, unique=True)
    display_name = models.CharField(max_length=100)
    
    def __str__(self):
        return self.display_name


class ScreeningTemplate(models.Model):
    CATEGORY_CHOICES = [
        ('strategic_economic', 'استراتژیک - اقتصادی'),
        ('strategic_social', 'استراتژیک - اجتماعی'),
        ('strategic_knowledge', 'استراتژیک - دانشی'),
        ('strategic_cultural', 'استراتژیک - فرهنگی'),
        ('strategic_environmental', 'استراتژیک - زیست‌محیطی'),
        ('operational_economic', 'عملیاتی - اقتصادی'),
        ('operational_social', 'عملیاتی - اجتماعی'),
        ('operational_knowledge', 'عملیاتی - دانشی'),
        ('operational_cultural', 'عملیاتی - فرهنگی'),
        ('operational_environmental', 'عملیاتی - زیست‌محیطی'),
        ('support_economic', 'پشتیبان - اقتصادی'),
        ('support_social', 'پشتیبان - اجتماعی'),
        ('support_knowledge', 'پشتیبان - دانشی'),
        ('support_cultural', 'پشتیبان - فرهنگی'),
        ('support_environmental', 'پشتیبان - زیست‌محیطی'),
    ]
    RESULT_CHOICES = [
        ('confirmed', 'دارایی قطعی'),
        ('conditional', 'مشروط'),
        ('rejected', 'رد شده'),
    ]
    
    organization_type = models.ForeignKey(OrganizationType, on_delete=models.CASCADE, related_name='templates')
    item_name = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    default_result = models.CharField(max_length=20, choices=RESULT_CHOICES, default='confirmed')
    is_active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    description = models.TextField(blank=True)
    condition_1_non_physical = models.BooleanField(default=True)
    condition_2_identifiable = models.BooleanField(default=True)
    condition_3_controllable = models.BooleanField(default=True)
    condition_4_value_creating = models.BooleanField(default=True)
    
    asset_type = models.ForeignKey(
        'AssetType',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='screening_templates'
    )
    
    valuation_method = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        choices=[
            ('M-01', 'M-01 - Relief from Royalty'),
            ('M-02', 'M-02 - Discounted Cash Flow'),
            ('M-03', 'M-03 - Replacement Cost Method'),
            ('M-04', 'M-04 - Weighted Weighted Method'),
            ('M-05', 'M-05 - Multi-Period Excess Earnings'),
            ('M-06', 'M-06 - Replacement Cost Method (Adjusted)'),
            ('M-07', 'M-07 - Total Weighted Cost'),
            ('M-08', 'M-08 - Cost to Market'),
            ('M-09', 'M-09 - Market Multiple Method'),
        ],
        help_text='روش اصلی ارزش‌گذاری برای این دارایی'
    )
    
    def __str__(self):
        return f"{self.organization_type.display_name} - {self.item_name}"


# ==================== مدل اصلی ScreenedAsset ====================
class ScreenedAsset(models.Model):
    RESULT_CHOICES = [
        ('confirmed', 'دارایی قطعی'),
        ('conditional', 'مشروط'),
        ('rejected', 'رد شده'),
    ]
    
    asset_name = models.CharField(max_length=255, default='دارایی بدون نام')
    asset_uid = models.CharField(max_length=50, unique=True, null=True, blank=True)
    category = models.CharField(max_length=50, default='unknown')
    result = models.CharField(max_length=20, choices=RESULT_CHOICES, default='confirmed')
    discovery_date = models.DateField(null=True, blank=True)
    version = models.CharField(max_length=20, default='1.0.0')
    description = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    
    asset_type = models.ForeignKey(
        'AssetType',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='screened_assets'
    )
    
    valuation_method = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        help_text='روش ارزش‌گذاری انتخاب شده برای این دارایی'
    )
    
    def __str__(self):
        return f"{self.asset_uid or 'بدون کد'} - {self.asset_name}"


# ==================== مدل فایل‌های پیوست ====================

class AssetFile(models.Model):
    FILE_TYPES = [
        ('interview', 'مصاحبه'),
        ('document', 'سند'),
        ('process', 'فرآیند'),
        ('database', 'پایگاه داده'),
        ('rd_project', 'پروژه R&D'),
    ]
    
    asset = models.ForeignKey(ScreenedAsset, on_delete=models.CASCADE, related_name='files')
    file_type = models.CharField(max_length=20, choices=FILE_TYPES)
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='asset_files/%Y/%m/%d/')
    description = models.TextField(blank=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.get_file_type_display()} - {self.title}"
    
    class Meta:
        ordering = ['-uploaded_at']


# ============ مدل‌های مرحله ۳: ارزیابی ============
from .valuation_models import (
    AssetType, ValuationDimension, ValuationQuestion,
    ValuationScoreGuide, AssetValuation, ValuationAnswer,
    ValuationWeight
)

# ============ مدل نوتیفیکیشن ============
from .notification_models import Notification

# ============ مدل‌های STEP 3 ============
from .valuation_step3_models import ValuationStep3, ValuationStep3Evidence

# ============ مدل‌های ارزش‌گذاری ============
from .valuation_models import (
    ValuationCase, ValuationAssumption, ValuationEvidenceTag,
    ValuationCategory, LifecycleStage, CurrencyType,
    InflationBasis, SourceReliability, OverlapRiskLevel,
    OverlapType, ReviewStatus, AssumptionTag, EvidenceTag
)

# ============ مدل‌های STEP 4 ============
from .valuation_step4_models import ValuationStep4
