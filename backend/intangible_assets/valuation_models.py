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
    
    def __str__(self):
        return f"ارزیابی {self.asset.asset_name} - {self.final_score:.2f}"


class ValuationAnswer(models.Model):
    valuation = models.ForeignKey(AssetValuation, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(ValuationQuestion, on_delete=models.CASCADE)
    score = models.IntegerField(choices=[(1, '۱'), (2, '۲'), (3, '۳'), (4, '۴'), (5, '۵')], null=True, blank=True)
    evidence = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['valuation', 'question']
    
    def __str__(self):
        return f"{self.valuation.asset.asset_name} - {self.question.code}: {self.score or '-'}"
