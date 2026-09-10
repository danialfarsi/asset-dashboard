from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class IAMCompetencyFramework(models.Model):
    """چارچوب شایستگی IAM"""
    
    class RoleType(models.TextChoices):
        MANAGER = 'manager', 'مدیر IAM'
        CONSULTANT = 'consultant', 'مشاور IAM'
        AUDITOR = 'auditor', 'ممیز IAM'
    
    class Level(models.TextChoices):
        LEVEL_1 = 'level_1', 'سطح ۱ - مبتدی/متخصص'
        LEVEL_2 = 'level_2', 'سطح ۲ - حرفه‌ای'
        LEVEL_3 = 'level_3', 'سطح ۳ - خبره'
    
    class Status(models.TextChoices):
        DRAFT = 'draft', 'پیش‌نویس'
        ACTIVE = 'active', 'فعال'
        ARCHIVED = 'archived', 'بایگانی شده'
    
    # اطلاعات پایه
    title = models.CharField(max_length=255, verbose_name="عنوان")
    role_type = models.CharField(
        max_length=20,
        choices=RoleType.choices,
        verbose_name="نوع نقش"
    )
    level = models.CharField(
        max_length=20,
        choices=Level.choices,
        verbose_name="سطح"
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        verbose_name="وضعیت"
    )
    
    # ابعاد شایستگی (طبق PDF: نگرش + دانش + مهارت + تجربه)
    attitude = models.JSONField(
        default=list,
        verbose_name="شایستگی‌های نگرشی",
        help_text="باور به ارزش، محرمانگی، مسئولیت‌پذیری، نگاه سیستمی"
    )
    knowledge = models.JSONField(
        default=list,
        verbose_name="شایستگی‌های دانشی",
        help_text="مفاهیم IP، برند، داده، فناوری، ارزش‌گذاری، حکمرانی"
    )
    skills = models.JSONField(
        default=list,
        verbose_name="شایستگی‌های مهارتی",
        help_text="کشف، مصاحبه، مستندسازی، غربالگری، تحلیل، ارزش‌گذاری"
    )
    experience = models.JSONField(
        default=list,
        verbose_name="شایستگی‌های تجربی",
        help_text="انجام پروژه واقعی، بررسی پرونده، مدیریت امداد، حضور در کمیته"
    )
    
    # الزامات
    requirements = models.JSONField(
        default=dict,
        verbose_name="الزامات احراز",
        help_text="آموزش، تمرین، پروژه، ارزیابی"
    )
    
    # گواهی
    certificate_template = models.FileField(
        upload_to='viam/certificates/templates/',
        null=True, blank=True,
        verbose_name="قالب گواهی"
    )
    certificate_title = models.CharField(
        max_length=255,
        blank=True,
        verbose_name="عنوان گواهی"
    )
    
    # توضیحات
    description = models.TextField(blank=True, verbose_name="توضیحات")
    expected_outcomes = models.JSONField(
        default=list,
        verbose_name="خروجی‌های مورد انتظار"
    )
    
    # سیستمی
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='competency_frameworks',
        verbose_name="ایجادکننده"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "چارچوب شایستگی IAM"
        verbose_name_plural = "چارچوب‌های شایستگی IAM"
        unique_together = ['role_type', 'level']
        ordering = ['role_type', 'level']
    
    def __str__(self):
        return f"{self.get_role_type_display()} - {self.get_level_display()}"


class IAMCompetency(models.Model):
    """شایستگی‌های فردی IAM"""
    
    class Status(models.TextChoices):
        NOT_STARTED = 'not_started', 'شروع نشده'
        IN_PROGRESS = 'in_progress', 'در حال پیشرفت'
        COMPLETED = 'completed', 'تکمیل شده'
        CERTIFIED = 'certified', 'گواهی دریافت کرده'
        EXPIRED = 'expired', 'منقضی شده'
    
    # ارتباط با کاربر و چارچوب
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='iam_competencies',
        verbose_name="کاربر"
    )
    framework = models.ForeignKey(
        IAMCompetencyFramework,
        on_delete=models.CASCADE,
        related_name='competencies',
        verbose_name="چارچوب شایستگی"
    )
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='iam_competencies',
        null=True, blank=True,
        verbose_name="سازمان"
    )
    
    # وضعیت
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.NOT_STARTED,
        verbose_name="وضعیت"
    )
    
    # ارزیابی اولیه
    initial_assessment_score = models.FloatField(
        default=0,
        verbose_name="امتیاز ارزیابی اولیه"
    )
    initial_assessment_date = models.DateTimeField(
        null=True, blank=True,
        verbose_name="تاریخ ارزیابی اولیه"
    )
    initial_assessment_report = models.FileField(
        upload_to='viam/assessments/initial/',
        null=True, blank=True,
        verbose_name="گزارش ارزیابی اولیه"
    )
    
    # آموزش
    training_progress = models.FloatField(
        default=0,
        verbose_name="پیشرفت آموزش (%)"
    )
    training_completed_date = models.DateTimeField(
        null=True, blank=True,
        verbose_name="تاریخ تکمیل آموزش"
    )
    training_certificate = models.FileField(
        upload_to='viam/training/certificates/',
        null=True, blank=True,
        verbose_name="گواهی آموزش"
    )
    
    # تمرین و پروژه
    practical_exercises = models.JSONField(
        default=list,
        verbose_name="تمرین‌های عملی",
        help_text="لیست تمرین‌های انجام شده"
    )
    case_studies = models.JSONField(
        default=list,
        verbose_name="مطالعات موردی",
        help_text="لیست پرونده‌های واقعی بررسی شده"
    )
    projects_completed = models.JSONField(
        default=list,
        verbose_name="پروژه‌های تکمیل شده",
        help_text="لیست پروژه‌های انجام شده"
    )
    
    # ارزیابی نهایی
    final_score = models.FloatField(
        default=0,
        verbose_name="امتیاز نهایی"
    )
    final_assessment_date = models.DateTimeField(
        null=True, blank=True,
        verbose_name="تاریخ ارزیابی نهایی"
    )
    final_assessment_report = models.FileField(
        upload_to='viam/assessments/final/',
        null=True, blank=True,
        verbose_name="گزارش ارزیابی نهایی"
    )
    
    # گواهی
    certificate_number = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="شماره گواهی"
    )
    certificate_issued_date = models.DateTimeField(
        null=True, blank=True,
        verbose_name="تاریخ صدور گواهی"
    )
    certificate_expiry_date = models.DateTimeField(
        null=True, blank=True,
        verbose_name="تاریخ انقضای گواهی"
    )
    certificate_file = models.FileField(
        upload_to='viam/certificates/issued/',
        null=True, blank=True,
        verbose_name="فایل گواهی"
    )
    
    # بازخورد
    feedback = models.TextField(blank=True, verbose_name="بازخورد")
    evaluator = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='evaluated_competencies',
        verbose_name="ارزیاب"
    )
    
    # سیستمی
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "شایستگی IAM"
        verbose_name_plural = "شایستگی‌های IAM"
        unique_together = ['user', 'framework']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.framework}"


class IAMTrainingProgram(models.Model):
    """برنامه آموزشی IAM"""
    
    class ProgramType(models.TextChoices):
        MANAGER = 'manager', 'مدیر IAM'
        CONSULTANT = 'consultant', 'مشاور IAM'
        AUDITOR = 'auditor', 'ممیز IAM'
    
    class Level(models.TextChoices):
        BEGINNER = 'beginner', 'مبتدی'
        PROFESSIONAL = 'professional', 'حرفه‌ای'
        EXPERT = 'expert', 'خبره'
    
    class Status(models.TextChoices):
        DRAFT = 'draft', 'پیش‌نویس'
        PUBLISHED = 'published', 'منتشر شده'
        COMPLETED = 'completed', 'تکمیل شده'
        ARCHIVED = 'archived', 'بایگانی شده'
    
    # اطلاعات پایه
    title = models.CharField(max_length=255, verbose_name="عنوان برنامه")
    program_type = models.CharField(
        max_length=20,
        choices=ProgramType.choices,
        verbose_name="نوع برنامه"
    )
    level = models.CharField(
        max_length=20,
        choices=Level.choices,
        verbose_name="سطح"
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        verbose_name="وضعیت"
    )
    
    # محتوای برنامه
    description = models.TextField(verbose_name="توضیحات برنامه")
    modules = models.JSONField(
        default=list,
        verbose_name="ماژول‌های آموزشی",
        help_text="لیست ماژول‌ها با عنوان، توضیحات و مدت زمان"
    )
    total_duration = models.IntegerField(
        default=0,
        verbose_name="مدت کل (ساعت)"
    )
    
    # پیش‌نیازها
    prerequisites = models.JSONField(
        default=list,
        verbose_name="پیش‌نیازها",
        help_text="لیست پیش‌نیازهای برنامه"
    )
    
    # گواهی
    certificate_template = models.FileField(
        upload_to='viam/training/certificates/templates/',
        null=True, blank=True,
        verbose_name="قالب گواهی"
    )
    
    # سیستمی
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='training_programs',
        verbose_name="ایجادکننده"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "برنامه آموزشی IAM"
        verbose_name_plural = "برنامه‌های آموزشی IAM"
        unique_together = ['program_type', 'level']
    
    def __str__(self):
        return f"{self.get_program_type_display()} - {self.get_level_display()}"


class IAMTrainingEnrollment(models.Model):
    """ثبت‌نام در برنامه آموزشی"""
    
    class Status(models.TextChoices):
        ENROLLED = 'enrolled', 'ثبت‌نام شده'
        IN_PROGRESS = 'in_progress', 'در حال پیشرفت'
        COMPLETED = 'completed', 'تکمیل شده'
        DROPPED = 'dropped', 'انصراف داده'
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='training_enrollments',
        verbose_name="کاربر"
    )
    program = models.ForeignKey(
        IAMTrainingProgram,
        on_delete=models.CASCADE,
        related_name='enrollments',
        verbose_name="برنامه آموزشی"
    )
    
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ENROLLED,
        verbose_name="وضعیت"
    )
    
    # پیشرفت
    progress_percentage = models.FloatField(
        default=0,
        verbose_name="درصد پیشرفت"
    )
    completed_modules = models.JSONField(
        default=list,
        verbose_name="ماژول‌های تکمیل شده"
    )
    
    # امتیازات
    quiz_scores = models.JSONField(
        default=dict,
        verbose_name="امتیازات آزمون‌ها"
    )
    final_exam_score = models.FloatField(
        null=True, blank=True,
        verbose_name="امتیاز آزمون نهایی"
    )
    
    # تاریخ‌ها
    enrollment_date = models.DateTimeField(auto_now_add=True)
    start_date = models.DateTimeField(null=True, blank=True, verbose_name="تاریخ شروع")
    completion_date = models.DateTimeField(null=True, blank=True, verbose_name="تاریخ تکمیل")
    
    # گواهی
    certificate_issued = models.BooleanField(
        default=False,
        verbose_name="گواهی صادر شده؟"
    )
    certificate_number = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="شماره گواهی"
    )
    
    # سیستمی
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "ثبت‌نام آموزشی"
        verbose_name_plural = "ثبت‌نام‌های آموزشی"
        unique_together = ['user', 'program']
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.program}"
