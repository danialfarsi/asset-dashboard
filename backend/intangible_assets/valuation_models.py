from django.db import models
from django.conf import settings
from .models import ScreenedAsset

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
    
    # امتیازات نهایی
    final_score = models.FloatField(default=0)
    strategic_score = models.FloatField(default=0)
    technical_score = models.FloatField(default=0)
    operational_score = models.FloatField(default=0)
    market_score = models.FloatField(default=0)
    risk_score = models.FloatField(default=0)
    
    def calculate_final_score(self):
        """محاسبه امتیاز نهایی = جمع کل امتیازات (نه میانگین)"""
        answers = self.answers.all()
        if not answers.exists():
            return 0
        
        # گروه‌بندی بر اساس بُعد
        dim_scores = {}
        total_score = 0
        
        for answer in answers:
            if answer.score is not None:
                dim = answer.question.dimension.name
                if dim not in dim_scores:
                    dim_scores[dim] = []
                dim_scores[dim].append(answer.score)
                total_score += answer.score  # جمع کل
        
        # محاسبه مجموع هر بُعد
        self.strategic_score = sum(dim_scores.get('strategic', []))
        self.technical_score = sum(dim_scores.get('technical', []))
        self.operational_score = sum(dim_scores.get('operational', []))
        self.market_score = sum(dim_scores.get('market', []))
        self.risk_score = sum(dim_scores.get('risk', []))
        
        # امتیاز نهایی = جمع کل (بدون میانگین)
        self.final_score = float(total_score)
        
        self.save()
        return self.final_score
    
    def calculate_weighted_score(self, organization_type):
        """
        محاسبه امتیاز وزنی بر اساس نوع سازمان
        
        Args:
            organization_type: str - نوع سازمان (manufacturing, service, rto, holding)
        
        Returns:
            float: امتیاز نهایی وزنی
        """
        try:
            weights = ValuationWeight.objects.get(
                asset_type=self.asset_type,
                organization_type=organization_type
            )
        except ValuationWeight.DoesNotExist:
            # اگر ضریب وجود نداشت، از ضرایب پیش‌فرض استفاده کن
            default_weights = {
                'strategic': 0.25,
                'technical': 0.20,
                'operational': 0.20,
                'market': 0.25,
                'risk': 0.10,
            }
            return self.calculate_fallback_score(default_weights)
        
        # تعداد سوالات هر بُعد
        dimension_counts = {
            'strategic': 6,
            'technical': 4,
            'operational': 4,
            'market': 5,
            'risk': 4,
        }
        
        # محاسبه میانگین هر بُعد
        strategic_avg = self.strategic_score / dimension_counts['strategic'] if dimension_counts['strategic'] > 0 else 0
        technical_avg = self.technical_score / dimension_counts['technical'] if dimension_counts['technical'] > 0 else 0
        operational_avg = self.operational_score / dimension_counts['operational'] if dimension_counts['operational'] > 0 else 0
        market_avg = self.market_score / dimension_counts['market'] if dimension_counts['market'] > 0 else 0
        risk_avg = self.risk_score / dimension_counts['risk'] if dimension_counts['risk'] > 0 else 0
        
        # محاسبه امتیاز نهایی با ضرایب
        final_score = (
            strategic_avg * weights.strategic_weight +
            technical_avg * weights.technical_weight +
            operational_avg * weights.operational_weight +
            market_avg * weights.market_weight +
            risk_avg * weights.risk_weight
        )
        
        return round(final_score, 2)
    
    def calculate_fallback_score(self, default_weights):
        """محاسبه با ضرایب پیش‌فرض در صورت نبود ضریب در دیتابیس"""
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
        """
        دریافت خلاصه کامل امتیازات برای نمایش
        
        Returns:
            dict: شامل امتیازات هر بُعد و امتیاز نهایی
        """
        dimension_counts = {
            'strategic': 6,
            'technical': 4,
            'operational': 4,
            'market': 5,
            'risk': 4,
        }
        
        # دریافت ضرایب
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
        
        # محاسبه میانگین‌ها
        averages = {
            'strategic': self.strategic_score / dimension_counts['strategic'] if dimension_counts['strategic'] > 0 else 0,
            'technical': self.technical_score / dimension_counts['technical'] if dimension_counts['technical'] > 0 else 0,
            'operational': self.operational_score / dimension_counts['operational'] if dimension_counts['operational'] > 0 else 0,
            'market': self.market_score / dimension_counts['market'] if dimension_counts['market'] > 0 else 0,
            'risk': self.risk_score / dimension_counts['risk'] if dimension_counts['risk'] > 0 else 0,
        }
        
        # محاسبه امتیاز وزنی هر بُعد
        weighted_scores = {}
        for dim in averages:
            weighted_scores[dim] = round(averages[dim] * weights_dict.get(dim, 0.20), 2)
        
        # محاسبه امتیاز نهایی
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
    
    # 🔥 فیلدهای جدید برای فایل‌های شواهد
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
    def calculate_weighted_score(self, organization_type):
        """محاسبه امتیاز وزنی بر اساس نوع سازمان"""
        from .models import ValuationWeight
        
        try:
            weights = ValuationWeight.objects.get(
                asset_type=self.asset_type,
                organization_type=organization_type
            )
        except ValuationWeight.DoesNotExist:
            default_weights = {'strategic': 0.25, 'technical': 0.20, 'operational': 0.20, 'market': 0.25, 'risk': 0.10}
            return self.calculate_fallback_score(default_weights)
        
        dimension_counts = {'strategic': 6, 'technical': 4, 'operational': 4, 'market': 5, 'risk': 4}
        
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
        """محاسبه با ضرایب پیش‌فرض"""
        dimension_counts = {'strategic': 6, 'technical': 4, 'operational': 4, 'market': 5, 'risk': 4}
        
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
        """دریافت خلاصه کامل امتیازات"""
        from .models import ValuationWeight
        
        dimension_counts = {'strategic': 6, 'technical': 4, 'operational': 4, 'market': 5, 'risk': 4}
        
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
            weights_dict = {'strategic': 0.25, 'technical': 0.20, 'operational': 0.20, 'market': 0.25, 'risk': 0.10}
        
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
