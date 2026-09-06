from django.db import models

class ProtectionTool(models.Model):
    TOOL_TYPE_CHOICES = [
        ('legal', 'حقوقی'),
        ('technical', 'فنی'),
        ('procedural', 'فرآیندی'),
    ]
    
    ARCHETYPE_CHOICES = [
        ('PA-1', 'مالکیت فکری ثبتی'),
        ('PA-2', 'قراردادی'),
        ('PA-3', 'راز تجاری'),
        ('PA-4', 'دیجیتال/داده'),
        ('PA-5', 'رویه‌ای/فرهنگی'),
    ]
    
    name = models.CharField(max_length=255, verbose_name='نام ابزار')
    code = models.CharField(max_length=20, unique=True, verbose_name='کد ابزار')
    tool_type = models.CharField(max_length=20, choices=TOOL_TYPE_CHOICES, verbose_name='نوع ابزار')
    archetype = models.CharField(max_length=5, choices=ARCHETYPE_CHOICES, verbose_name='آرکی‌تایپ مرتبط')
    description = models.TextField(blank=True, verbose_name='توضیحات')
    icon = models.CharField(max_length=50, blank=True, verbose_name='آیکون')
    weight = models.FloatField(default=1.0, verbose_name='وزن در امتیاز')
    is_active = models.BooleanField(default=True, verbose_name='فعال')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['archetype', 'tool_type', 'name']
        verbose_name = 'ابزار حفاظتی'
        verbose_name_plural = 'ابزارهای حفاظتی'
    
    def __str__(self):
        return f'{self.code} - {self.name}'
