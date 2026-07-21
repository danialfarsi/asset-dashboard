from django.db import models
from django.conf import settings
from .models import ScreenedAsset


class DiscoveryAssessment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'در انتظار'),
        ('in_progress', 'در حال انجام'),
        ('completed', 'تکمیل شده'),
    ]
    
    FINAL_STATUS_CHOICES = [
        ('CONFIRMED', 'قطعی'),
        ('CONDITIONAL', 'مشروط'),
        ('REJECTED', 'رد شده'),
    ]
    
    asset = models.OneToOneField(
        ScreenedAsset,
        on_delete=models.CASCADE,
        related_name='discovery'
    )
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    n1 = models.BooleanField(default=False)
    n2 = models.BooleanField(default=False)
    n3 = models.BooleanField(default=False)
    n4 = models.BooleanField(default=False)
    n5 = models.BooleanField(default=False)
    n6 = models.BooleanField(default=False)
    n_score = models.IntegerField(default=0)
    n_status = models.CharField(max_length=20, null=True, blank=True)
    
    i1 = models.BooleanField(default=False)
    i2 = models.BooleanField(default=False)
    i3 = models.BooleanField(default=False)
    i4 = models.BooleanField(default=False)
    i5 = models.BooleanField(default=False)
    i6 = models.BooleanField(default=False)
    i7 = models.BooleanField(default=False)
    i_score = models.IntegerField(default=0)
    i_status = models.CharField(max_length=20, null=True, blank=True)
    
    c1 = models.BooleanField(default=False)
    c2 = models.BooleanField(default=False)
    c3 = models.BooleanField(default=False)
    c4 = models.BooleanField(default=False)
    c5 = models.BooleanField(default=False)
    c6 = models.BooleanField(default=False)
    c7 = models.BooleanField(default=False)
    c_score = models.IntegerField(default=0)
    c_status = models.CharField(max_length=20, null=True, blank=True)
    
    v1 = models.BooleanField(default=False)
    v2 = models.BooleanField(default=False)
    v3 = models.BooleanField(default=False)
    v4 = models.BooleanField(default=False)
    v5 = models.BooleanField(default=False)
    v6 = models.BooleanField(default=False)
    v7 = models.BooleanField(default=False)
    v8 = models.BooleanField(default=False)
    v9 = models.BooleanField(default=False)
    v_score = models.IntegerField(default=0)
    v_status = models.CharField(max_length=20, null=True, blank=True)
    
    final_status = models.CharField(max_length=20, choices=FINAL_STATUS_CHOICES, null=True, blank=True)
    recommendations = models.JSONField(null=True, blank=True)
    total_score = models.IntegerField(default=0)
    max_score = models.IntegerField(default=29)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'discovery_assessments'
        verbose_name = 'ارزیابی شناسایی'
        verbose_name_plural = 'ارزیابی‌های شناسایی'
    
    def __str__(self):
        return f'ارزیابی {self.asset.asset_name} - {self.final_status or "در حال انجام"}'
    
    def calculate_n_score(self):
        score = sum([self.n1, self.n2, self.n3, self.n4, self.n5, self.n6])
        self.n_score = score
        self.n_status = 'PASS' if score >= 2 else 'FAIL'
        return score
    
    def calculate_i_score(self):
        score = sum([self.i1, self.i2, self.i3, self.i4, self.i5, self.i6, self.i7])
        self.i_score = score
        self.i_status = 'PASS' if (self.i1 or self.i2 or self.i4) else 'FAIL'
        return score
    
    def calculate_c_score(self):
        score = sum([self.c1, self.c2, self.c3, self.c4, self.c5, self.c6, self.c7])
        self.c_score = score
        c_strong = any([self.c1, self.c2, self.c3, self.c4, self.c5])
        if c_strong:
            self.c_status = 'PASS'
        elif self.c6:
            self.c_status = 'CONDITIONAL'
        else:
            self.c_status = 'FAIL'
        return score
    
    def calculate_v_score(self):
        score = sum([self.v1, self.v2, self.v3, self.v4, self.v5, self.v6, self.v7, self.v8, self.v9])
        self.v_score = score
        self.v_status = 'PASS' if score >= 1 else 'FAIL'
        return score
    
    def calculate_final_result(self):
        self.calculate_n_score()
        self.calculate_i_score()
        self.calculate_c_score()
        self.calculate_v_score()
        self.total_score = self.n_score + self.i_score + self.c_score + self.v_score
        
        if (self.n_status == 'PASS' and 
            self.i_status == 'PASS' and 
            self.v_status == 'PASS'):
            if self.c_status == 'PASS':
                self.final_status = 'CONFIRMED'
            elif self.c_status == 'CONDITIONAL':
                self.final_status = 'CONDITIONAL'
            else:
                self.final_status = 'REJECTED'
        else:
            self.final_status = 'REJECTED'
        
        recommendations = []
        if self.n_status != 'PASS':
            recommendations.append('دارایی ماهیت فیزیکی دارد یا غیرفیزیکی بودن آن اثبات نشده است')
        if self.i_status != 'PASS':
            recommendations.append('دارایی فاقد معیار تفکیک‌پذیری یا پشتوانه قانونی است')
        if self.c_status == 'CONDITIONAL':
            recommendations.append('کنترل دارایی صرفاً موقعیتی است - نیاز به رسمی‌سازی قراردادی')
        if self.c_status == 'FAIL':
            recommendations.append('دارایی فاقد هرگونه مکانیزم کنترل است')
        if self.v_status != 'PASS':
            recommendations.append('دارایی فاقد توجیه اقتصادی و ارزش‌آفرینی است')
        
        self.recommendations = recommendations
        self.status = 'completed'
        self.promote_to_screened()
        self.save()
        
        return {
            'final_status': self.final_status,
            'recommendations': recommendations,
            'n_status': self.n_status,
            'i_status': self.i_status,
            'c_status': self.c_status,
            'v_status': self.v_status,
        }
    
    def promote_to_screened(self):
        if self.final_status == 'CONFIRMED':
            self.asset.result = 'confirmed'
            self.asset.valuation_method = 'M-05'
            self.asset.save()
            return True
        return False
