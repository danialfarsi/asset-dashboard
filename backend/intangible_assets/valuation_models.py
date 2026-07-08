from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from .models import ScreenedAsset

# ============================================
# مدل‌های موجود (قبلاً نوشته شده)
# ============================================

class AssetType(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['name']


class ValuationDimension(models.Model):
    DIMENSION_CHOICES = [
        ('strategic', 'استراتژیک'),
        ('technical', 'فنی و بلوغ'),
        ('operational', 'عملیاتی'),
        ('market', 'بازار'),
        ('risk', 'ریسک'),
    ]
    name = models.CharField(max_length=20, choices=DIMENSION_CHOICES, unique=True)
    display_name = models.CharField(max_length=50)
    weight = models.DecimalField(max_digits=3, decimal_places=2, default=0.20)
    order = models.IntegerField(default=0)
    description = models.TextField(blank=True)
    
    def __str__(self):
        return self.display_name
    
    class Meta:
        ordering = ['order']


class ValuationQuestion(models.Model):
    asset_type = models.ForeignKey(AssetType, on_delete=models.CASCADE, related_name='questions')
    dimension = models.ForeignKey(ValuationDimension, on_delete=models.CASCADE, related_name='questions')
    code = models.CharField(max_length=10)
    question_text = models.TextField()
    description = models.TextField(blank=True)
    hint = models.TextField(blank=True)
    order = models.IntegerField(default=0)
    
    class Meta:
        unique_together = ['asset_type', 'code']
        ordering = ['order']
    
    def __str__(self):
        return f"{self.asset_type.code} - {self.code}: {self.question_text[:50]}..."


class ValuationScoreGuide(models.Model):
    question = models.ForeignKey(ValuationQuestion, on_delete=models.CASCADE, related_name='score_guides')
    score = models.IntegerField(choices=[(1, '۱'), (2, '۲'), (3, '۳'), (4, '۴'), (5, '۵')])
    condition = models.TextField()
    evidence_required = models.TextField(blank=True)
    
    class Meta:
        unique_together = ['question', 'score']
        ordering = ['score']
    
    def __str__(self):
        return f"{self.question.code} - امتیاز {self.score}"


class AssetValuation(models.Model):
    STATUS_CHOICES = [
        ('draft', 'پیش‌نویس'),
        ('in_progress', 'در حال ارزیابی'),
        ('completed', 'تکمیل شده'),
        ('verified', 'تأیید شده'),
    ]
    
    asset = models.ForeignKey(ScreenedAsset, on_delete=models.CASCADE, related_name='valuations')
    asset_type = models.ForeignKey(AssetType, on_delete=models.CASCADE, null=True, blank=True)
    evaluated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    evaluated_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    final_score = models.FloatField(default=0)
    strategic_score = models.FloatField(default=0)
    technical_score = models.FloatField(default=0)
    operational_score = models.FloatField(default=0)
    market_score = models.FloatField(default=0)
    risk_score = models.FloatField(default=0)
    
    def calculate_final_score(self):
        answers = self.answers.all()
        if not answers.exists():
            return 0
        
        dim_scores = {}
        total_score = 0
        
        for answer in answers:
            if answer.score is not None:
                dim = answer.question.dimension.name
                if dim not in dim_scores:
                    dim_scores[dim] = []
                dim_scores[dim].append(answer.score)
                total_score += answer.score
        
        self.strategic_score = sum(dim_scores.get('strategic', []))
        self.technical_score = sum(dim_scores.get('technical', []))
        self.operational_score = sum(dim_scores.get('operational', []))
        self.market_score = sum(dim_scores.get('market', []))
        self.risk_score = sum(dim_scores.get('risk', []))
        self.final_score = float(total_score)
        self.save()
        return self.final_score
    
    def calculate_weighted_score(self, organization_type):
        try:
            weights = ValuationWeight.objects.get(
                asset_type=self.asset_type,
                organization_type=organization_type
            )
        except ValuationWeight.DoesNotExist:
            default_weights = {
                'strategic': 0.25,
                'technical': 0.20,
                'operational': 0.20,
                'market': 0.25,
                'risk': 0.10,
            }
            return self.calculate_fallback_score(default_weights)
        
        dimension_counts = {
            'strategic': 6,
            'technical': 4,
            'operational': 4,
            'market': 5,
            'risk': 4,
        }
        
        strategic_avg = self.strategic_score / dimension_counts['strategic'] if dimension_counts['strategic'] > 0 else 0
        technical_avg = self.technical_score / dimension_counts['technical'] if dimension_counts['technical'] > 0 else 0
        operational_avg = self.operational_score / dimension_counts['operational'] if dimension_counts['operational'] > 0 else 0
        market_avg = self.market_score / dimension_counts['market'] if dimension_counts['market'] > 0 else 0
        risk_avg = self.risk_score / dimension_counts['risk'] if dimension_counts['risk'] > 0 else 0
        
        final_score = (
            strategic_avg * weights.strategic_weight +
            technical_avg * weights.technical_weight +
            operational_avg * weights.operational_weight +
            market_avg * weights.market_weight +
            risk_avg * weights.risk_weight
        )
        return round(final_score, 2)
    
    def calculate_fallback_score(self, default_weights):
        dimension_counts = {
            'strategic': 6,
            'technical': 4,
            'operational': 4,
            'market': 5,
            'risk': 4,
        }
        
        strategic_avg = self.strategic_score / dimension_counts['strategic'] if dimension_counts['strategic'] > 0 else 0
        technical_avg = self.technical_score / dimension_counts['technical'] if dimension_counts['technical'] > 0 else 0
        operational_avg = self.operational_score / dimension_counts['operational'] if dimension_counts['operational'] > 0 else 0
        market_avg = self.market_score / dimension_counts['market'] if dimension_counts['market'] > 0 else 0
        risk_avg = self.risk_score / dimension_counts['risk'] if dimension_counts['risk'] > 0 else 0
        
        final_score = (
            strategic_avg * default_weights.get('strategic', 0.25) +
            technical_avg * default_weights.get('technical', 0.20) +
            operational_avg * default_weights.get('operational', 0.20) +
            market_avg * default_weights.get('market', 0.25) +
            risk_avg * default_weights.get('risk', 0.10)
        )
        return round(final_score, 2)
    
    def get_score_summary(self, organization_type):
        dimension_counts = {
            'strategic': 6,
            'technical': 4,
            'operational': 4,
            'market': 5,
            'risk': 4,
        }
        
        try:
            weights = ValuationWeight.objects.get(
                asset_type=self.asset_type,
                organization_type=organization_type
            )
            weights_dict = {
                'strategic': weights.strategic_weight,
                'technical': weights.technical_weight,
                'operational': weights.operational_weight,
                'market': weights.market_weight,
                'risk': weights.risk_weight,
            }
        except ValuationWeight.DoesNotExist:
            weights_dict = {
                'strategic': 0.25,
                'technical': 0.20,
                'operational': 0.20,
                'market': 0.25,
                'risk': 0.10,
            }
        
        averages = {
            'strategic': self.strategic_score / dimension_counts['strategic'] if dimension_counts['strategic'] > 0 else 0,
            'technical': self.technical_score / dimension_counts['technical'] if dimension_counts['technical'] > 0 else 0,
            'operational': self.operational_score / dimension_counts['operational'] if dimension_counts['operational'] > 0 else 0,
            'market': self.market_score / dimension_counts['market'] if dimension_counts['market'] > 0 else 0,
            'risk': self.risk_score / dimension_counts['risk'] if dimension_counts['risk'] > 0 else 0,
        }
        
        weighted_scores = {}
        for dim in averages:
            weighted_scores[dim] = round(averages[dim] * weights_dict.get(dim, 0.20), 2)
        
        final_score = sum(weighted_scores.values())
        
        return {
            'averages': averages,
            'weights': weights_dict,
            'weighted_scores': weighted_scores,
            'final_score': round(final_score, 2),
            'total_questions': 23,
            'answered_questions': self.answers.filter(score__isnull=False).count(),
        }
    
    def __str__(self):
        return f"ارزیابی {self.asset.asset_name} - {self.final_score:.2f}"


class ValuationAnswer(models.Model):
    valuation = models.ForeignKey(AssetValuation, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(ValuationQuestion, on_delete=models.CASCADE)
    score = models.IntegerField(choices=[(1, '۱'), (2, '۲'), (3, '۳'), (4, '۴'), (5, '۵')], null=True, blank=True)
    evidence = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    evidence_interview = models.FileField(upload_to='evidence/interviews/%Y/%m/%d/', null=True, blank=True)
    evidence_document = models.FileField(upload_to='evidence/documents/%Y/%m/%d/', null=True, blank=True)
    evidence_process = models.FileField(upload_to='evidence/processes/%Y/%m/%d/', null=True, blank=True)
    evidence_database = models.FileField(upload_to='evidence/databases/%Y/%m/%d/', null=True, blank=True)
    
    class Meta:
        unique_together = ['valuation', 'question']
    
    def __str__(self):
        return f"{self.valuation.asset.asset_name} - {self.question.code}: {self.score or '-'}"


class ValuationWeight(models.Model):
    ORGANIZATION_TYPES = [
        ('manufacturing', 'تولیدی'),
        ('service', 'خدماتی'),
        ('rto', 'سازمان پژوهش و فناوری'),
        ('holding', 'هلدینگ یا مجموعه اقتصادی'),
    ]
    
    asset_type = models.ForeignKey('AssetType', on_delete=models.CASCADE, related_name='weights')
    organization_type = models.CharField(max_length=20, choices=ORGANIZATION_TYPES)
    
    strategic_weight = models.FloatField(default=0.25, verbose_name='وزن استراتژیک')
    technical_weight = models.FloatField(default=0.20, verbose_name='وزن فنی و بلوغ')
    operational_weight = models.FloatField(default=0.20, verbose_name='وزن عملیاتی')
    market_weight = models.FloatField(default=0.25, verbose_name='وزن بازار')
    risk_weight = models.FloatField(default=0.10, verbose_name='وزن ریسک')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['asset_type', 'organization_type']
        verbose_name = 'وزن ارزیابی'
        verbose_name_plural = 'وزن‌های ارزیابی'
        ordering = ['asset_type__code', 'organization_type']
    
    def __str__(self):
        return f'{self.asset_type.code} - {self.get_organization_type_display()}'
    
    def get_weights_dict(self):
        return {
            'strategic': self.strategic_weight,
            'technical': self.technical_weight,
            'operational': self.operational_weight,
            'market': self.market_weight,
            'risk': self.risk_weight,
        }


# ============================================
# 🔥 مدل‌های جدید برای ارزش‌گذاری (STEP 2)
# ============================================

class ValuationCategory(models.TextChoices):
    STRATEGIC = 'strategic', 'استراتژیک'
    OPERATIONAL = 'operational', 'عملیاتی'
    SUPPORT = 'support', 'پشتیبان'


class LifecycleStage(models.TextChoices):
    BIRTH = 'birth', 'تولد'
    GROWTH = 'growth', 'رشد'
    MATURITY = 'maturity', 'بلوغ'
    DECLINE = 'decline', 'افول'
    RE_INNOVATION = 're_innovation', 'نوآوری مجدد'


class CurrencyType(models.TextChoices):
    IRR = 'IRR', 'ریال'
    USD = 'USD', 'دلار'
    EUR = 'EUR', 'یورو'


class InflationBasis(models.TextChoices):
    COST = 'cost', 'هزینه'
    MARKET = 'market', 'بازار'


class SourceReliability(models.TextChoices):
    VERY_HIGH = 'very_high', 'بسیار بالا'
    HIGH = 'high', 'بالا'
    MEDIUM = 'medium', 'متوسط'
    LOW = 'low', 'پایین'
    VERY_LOW = 'very_low', 'بسیار پایین'


class OverlapRiskLevel(models.TextChoices):
    LOW = 'low', 'کم'
    MEDIUM = 'medium', 'متوسط'
    HIGH = 'high', 'زیاد'


class OverlapType(models.TextChoices):
    REVENUE = 'revenue', 'درآمد'
    COST = 'cost', 'هزینه'
    KNOWLEDGE = 'knowledge', 'دانش'
    MARKET = 'market', 'بازار'


class ReviewStatus(models.TextChoices):
    OPEN = 'open', 'باز'
    PENDING = 'pending', 'در انتظار'
    CLEARED = 'cleared', 'برطرف شده'


class AssumptionTag(models.TextChoices):
    GENERAL = 'general', 'عمومی'
    ASSET_SPECIFIC = 'asset_specific', 'مخصوص دارایی'


class EvidenceTag(models.TextChoices):
    ASSET_DESCRIPTION = 'asset_description', 'شرح دارایی'
    OWNERSHIP = 'ownership', 'مالکیت'
    FINANCIAL = 'financial', 'مالی'
    EXPERT = 'expert', 'نظر خبره'
    BENCHMARK = 'benchmark', 'معیار خارجی'


class ValuationCase(models.Model):
    """
    مدل اصلی ارزش‌گذاری - هر دارایی یک مورد ارزش‌گذاری دارد
    """
    # ارتباط با دارایی
    asset = models.ForeignKey(ScreenedAsset, on_delete=models.CASCADE, related_name='valuation_cases')
    
    # ماژول A - اطلاعات پایه
    category = models.CharField(max_length=20, choices=ValuationCategory.choices, default=ValuationCategory.OPERATIONAL)
    business_unit = models.CharField(max_length=255, blank=False)  # از Registry می‌آید
    lifecycle_stage = models.CharField(max_length=20, choices=LifecycleStage.choices, default=LifecycleStage.GROWTH, blank=True)
    
    # ماژول B - Quality Scores
    quality_override_reason = models.TextField(blank=True, null=True)  # شرطی: اگر Quality Score نیامد
    
    # ماژول C - Base Inputs
    currency = models.CharField(max_length=3, choices=CurrencyType.choices, default=CurrencyType.IRR)
    inflation_basis = models.CharField(max_length=10, choices=InflationBasis.choices, default=InflationBasis.COST, blank=True)
    tax_rate = models.FloatField(default=0.25, validators=[MinValueValidator(0), MaxValueValidator(0.50)])
    discount_rate = models.FloatField(default=0.18, validators=[MinValueValidator(0.10), MaxValueValidator(0.35)])
    forecast_horizon = models.IntegerField(default=5, validators=[MinValueValidator(3), MaxValueValidator(10)])
    terminal_growth_rate = models.FloatField(default=0.05)  # شرط: < discount_rate
    current_revenue = models.BigIntegerField(default=500000000000)  # ریال
    useful_life = models.IntegerField(default=5, validators=[MinValueValidator(1)], blank=True)
    source_reliability = models.CharField(max_length=20, choices=SourceReliability.choices, default=SourceReliability.HIGH)
    
    # ماژول D - Attachments & Evidence (فایل‌ها)
    asset_description_doc = models.FileField(upload_to='valuation/docs/%Y/%m/%d/', null=True, blank=True)
    ownership_doc = models.FileField(upload_to='valuation/docs/%Y/%m/%d/', null=True, blank=True)
    financial_source_doc = models.FileField(upload_to='valuation/docs/%Y/%m/%d/', null=True, blank=True)
    expert_input_doc = models.FileField(upload_to='valuation/docs/%Y/%m/%d/', null=True, blank=True)
    external_benchmark_doc = models.FileField(upload_to='valuation/docs/%Y/%m/%d/', null=True, blank=True)  # شرطی: برای M-01 تا M-04
    
    # ماژول E - Dependencies
    linked_assets = models.ManyToManyField(ScreenedAsset, related_name='linked_valuations', blank=True)
    overlap_risk_level = models.CharField(max_length=10, choices=OverlapRiskLevel.choices, default=OverlapRiskLevel.MEDIUM)
    overlap_type = models.CharField(max_length=10, choices=OverlapType.choices, default=OverlapType.REVENUE)
    review_status = models.CharField(max_length=10, choices=ReviewStatus.choices, default=ReviewStatus.PENDING)
    expert_note = models.TextField(blank=True, null=True)
    
    # ماژول F - Assumptions (به صورت جداگانه مدیریت می‌شود)
    # ماژول G - Valuation Method
    valuation_method = models.CharField(max_length=20, blank=True, null=True)  # M-01 تا M-09
    
    # وضعیت
    status = models.CharField(max_length=20, choices=AssetValuation.STATUS_CHOICES, default='draft')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='valuation_cases')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # امتیاز نهایی
    final_score = models.FloatField(default=0)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'مورد ارزش‌گذاری'
        verbose_name_plural = 'موارد ارزش‌گذاری'
    
    def __str__(self):
        return f"{self.asset.asset_name} - {self.get_category_display()}"


class ValuationAssumption(models.Model):
    """
    مدل فرضیات ارزش‌گذاری (ماژول F)
    """
    valuation_case = models.ForeignKey(ValuationCase, on_delete=models.CASCADE, related_name='assumptions')
    assumption_text = models.TextField()
    assumption_tag = models.CharField(max_length=20, choices=AssumptionTag.choices, default=AssumptionTag.GENERAL)
    assumption_critical = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.valuation_case.asset.asset_name} - {self.assumption_text[:50]}"


class ValuationEvidenceTag(models.Model):
    """
    مدل تگ‌های شواهد (ماژول D)
    """
    valuation_case = models.ForeignKey(ValuationCase, on_delete=models.CASCADE, related_name='evidence_tags')
    file_field = models.CharField(max_length=50)  # نام فیلدی که تگ به آن مربوط می‌شود
    tag = models.CharField(max_length=30, choices=EvidenceTag.choices)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['valuation_case', 'file_field']
    
    def __str__(self):
        return f"{self.valuation_case.asset.asset_name} - {self.get_tag_display()}"
