from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator

class IAMRole(models.Model):
    ROLE_TYPES = [
        ('bod', 'هیئت مدیره / مدیرعامل (BOD)'),
        ('sc', 'کمیته راهبری IAM (SC)'),
        ('iam_group', 'مدیر IAM گروه (IAM)'),
        ('iam_unit', 'مدیر IAM واحد (CHM)'),
        ('asset_owner', 'مالک دارایی (OWN)'),
        ('asset_custodian', 'متولی دارایی (CUS)'),
        ('auditor', 'ممیز مستقل (AUD)'),
        ('plt', 'مدیر پلتفرم متا (PLT)'),
    ]
    
    ACCESS_LEVELS = [
        ('group', 'دسترسی گروه'),
        ('unit', 'دسترسی واحد'),
        ('personal', 'دسترسی شخصی'),
    ]
    
    name = models.CharField(max_length=100, verbose_name='نام نقش')
    role_type = models.CharField(max_length=20, choices=ROLE_TYPES, unique=True, verbose_name='نوع نقش')
    description = models.TextField(blank=True, verbose_name='توضیحات')
    access_level = models.CharField(max_length=20, choices=ACCESS_LEVELS, default='personal', verbose_name='سطح دسترسی')
    permissions = models.JSONField(default=list, blank=True, verbose_name='مجوزها')
    is_active = models.BooleanField(default=True, verbose_name='فعال')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'نقش IAM'
        verbose_name_plural = 'نقش های IAM'
        ordering = ['role_type']
    
    def __str__(self):
        return self.get_role_type_display()


class IAMUserProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='iam_profile'
    )
    role = models.ForeignKey(
        IAMRole,
        on_delete=models.PROTECT,
        related_name='users',
        verbose_name='نقش IAM'
    )
    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='children',
        verbose_name='مدیر بالادستی'
    )
    responsibility_area = models.CharField(
        max_length=255,
        blank=True,
        verbose_name='حوزه مسئولیت'
    )
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='iam_users'
    )
    is_active = models.BooleanField(default=True, verbose_name='فعال')
    appointed_at = models.DateTimeField(null=True, blank=True, verbose_name='تاریخ انتصاب')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'پروفایل IAM'
        verbose_name_plural = 'پروفایل های IAM'
        ordering = ['-created_at']
    
    def __str__(self):
        return f'{self.user.email} - {self.role.name}'
    
    def get_all_managed_units(self):
        if self.role.role_type == 'iam_group':
            return self.children.all()
        return IAMUserProfile.objects.none()
    
    def can_manage_asset(self, asset):
        if self.role.access_level == 'group':
            return True
        elif self.role.access_level == 'unit':
            if hasattr(asset, 'organization') and asset.organization:
                return asset.organization_id == self.organization_id
            return False
        return False


class IAMCommittee(models.Model):
    name = models.CharField(max_length=255, verbose_name='نام کمیته')
    description = models.TextField(blank=True, verbose_name='توضیحات')
    chairperson = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='chaired_committees',
        verbose_name='رئیس کمیته'
    )
    secretary = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='secretary_committees',
        verbose_name='دبیر کمیته'
    )
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='committees',
        through='IAMCommitteeMembership'
    )
    is_active = models.BooleanField(default=True, verbose_name='فعال')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'کمیته IAM'
        verbose_name_plural = 'کمیته های IAM'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name


class IAMCommitteeMembership(models.Model):
    ROLE_CHOICES = [
        ('chairperson', 'رئیس'),
        ('secretary', 'دبیر'),
        ('member', 'عضو'),
        ('observer', 'ناظر'),
        ('expert', 'کارشناس مشاور'),
    ]
    
    committee = models.ForeignKey(IAMCommittee, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member', verbose_name='نقش در کمیته')
    has_vote = models.BooleanField(default=True, verbose_name='حق رأی')
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['committee', 'user']
    
    def __str__(self):
        return f'{self.user.email} - {self.committee.name} ({self.get_role_display()})'


class IAMCommitteeMeeting(models.Model):
    STATUS_CHOICES = [
        ('scheduled', 'برنامه ریزی شده'),
        ('in_progress', 'در حال برگزاری'),
        ('completed', 'برگزار شده'),
        ('cancelled', 'لغو شده'),
    ]
    
    committee = models.ForeignKey(IAMCommittee, on_delete=models.CASCADE, related_name='meetings')
    title = models.CharField(max_length=255, verbose_name='عنوان جلسه')
    date = models.DateTimeField(verbose_name='تاریخ و زمان جلسه')
    duration = models.IntegerField(default=90, verbose_name='مدت جلسه (دقیقه)')
    agenda = models.JSONField(default=list, blank=True, verbose_name='دستور جلسه')
    minutes = models.TextField(blank=True, verbose_name='صورتجلسه')
    resolutions = models.JSONField(default=list, blank=True, verbose_name='مصوبات')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled', verbose_name='وضعیت')
    attendees = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='meetings',
        through='IAMMeetingAttendance'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'جلسه کمیته IAM'
        verbose_name_plural = 'جلسات کمیته IAM'
        ordering = ['-date']
    
    def __str__(self):
        return f'{self.title} - {self.date.strftime("%Y-%m-%d")}'


class IAMMeetingAttendance(models.Model):
    ATTENDANCE_STATUS = [
        ('present', 'حاضر'),
        ('absent', 'غایب'),
        ('excused', 'با عذر موجه'),
    ]
    
    meeting = models.ForeignKey(IAMCommitteeMeeting, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=ATTENDANCE_STATUS, default='present', verbose_name='وضعیت حضور')
    notes = models.TextField(blank=True, verbose_name='توضیحات')
    
    class Meta:
        unique_together = ['meeting', 'user']


class IAMResolution(models.Model):
    DECISION_TYPES = [
        ('register', 'تایید ثبت دارایی راهبردی'),
        ('ownership', 'تعیین مالک یا حل تعارض مالکیت'),
        ('protection', 'تصویب ثبت حقوقی، NDA یا برنامه حفاظت'),
        ('valuation', 'تصویب ارزش گذاری رسمی'),
        ('development', 'تایید پروژه توسعه یا نوآوری'),
        ('commercialization', 'تایید مدل تجاری سازی یا لایسنس'),
        ('disposal', 'تایید ادغام، واگذاری یا توقف دارایی'),
        ('budget', 'تصویب بودجه و مسئول اقدام'),
        ('compliance', 'ارجاع عدم انطباق به واحد مسئول'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'در انتظار'),
        ('in_progress', 'در حال اجرا'),
        ('completed', 'انجام شده'),
        ('overdue', 'تاخیر خورده'),
        ('cancelled', 'لغو شده'),
    ]
    
    meeting = models.ForeignKey(IAMCommitteeMeeting, on_delete=models.CASCADE, related_name='resolutions_list')
    title = models.CharField(max_length=255, verbose_name='عنوان مصوبه')
    description = models.TextField(verbose_name='توضیحات مصوبه')
    decision_type = models.CharField(max_length=20, choices=DECISION_TYPES, verbose_name='نوع تصمیم')
    responsible = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolutions',
        verbose_name='مسئول اجرا'
    )
    deadline = models.DateField(null=True, blank=True, verbose_name='مهلت اجرا')
    budget = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True, verbose_name='بودجه مصوب')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='وضعیت')
    evidence = models.FileField(
        upload_to='iam/resolutions/%Y/%m/%d/',
        null=True,
        blank=True,
        verbose_name='مدارک و شواهد'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'مصوبه IAM'
        verbose_name_plural = 'مصوبات IAM'
        ordering = ['-created_at']
    
    def __str__(self):
        return f'{self.get_decision_type_display()} - {self.title}'
