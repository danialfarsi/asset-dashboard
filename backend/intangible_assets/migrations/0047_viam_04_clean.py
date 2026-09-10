from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
        ('intangible_assets', '0046_alter_organization_null'),
    ]

    operations = [
        # IAMCompetencyFramework
        migrations.CreateModel(
            name='IAMCompetencyFramework',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255, verbose_name='عنوان')),
                ('role_type', models.CharField(choices=[('manager', 'مدیر IAM'), ('consultant', 'مشاور IAM'), ('auditor', 'ممیز IAM')], max_length=20, verbose_name='نوع نقش')),
                ('level', models.CharField(choices=[('level_1', 'سطح ۱ - مبتدی/متخصص'), ('level_2', 'سطح ۲ - حرفه‌ای'), ('level_3', 'سطح ۳ - خبره')], max_length=20, verbose_name='سطح')),
                ('status', models.CharField(choices=[('draft', 'پیش‌نویس'), ('active', 'فعال'), ('archived', 'بایگانی شده')], default='draft', max_length=20, verbose_name='وضعیت')),
                ('attitude', models.JSONField(default=list, help_text='باور به ارزش، محرمانگی، مسئولیت‌پذیری، نگاه سیستمی', verbose_name='شایستگی‌های نگرشی')),
                ('knowledge', models.JSONField(default=list, help_text='مفاهیم IP، برند، داده، فناوری، ارزش‌گذاری، حکمرانی', verbose_name='شایستگی‌های دانشی')),
                ('skills', models.JSONField(default=list, help_text='کشف، مصاحبه، مستندسازی، غربالگری، تحلیل، ارزش‌گذاری', verbose_name='شایستگی‌های مهارتی')),
                ('experience', models.JSONField(default=list, help_text='انجام پروژه واقعی، بررسی پرونده، مدیریت امداد، حضور در کمیته', verbose_name='شایستگی‌های تجربی')),
                ('requirements', models.JSONField(default=dict, help_text='آموزش، تمرین، پروژه، ارزیابی', verbose_name='الزامات احراز')),
                ('certificate_template', models.FileField(blank=True, null=True, upload_to='viam/certificates/templates/', verbose_name='قالب گواهی')),
                ('certificate_title', models.CharField(blank=True, max_length=255, verbose_name='عنوان گواهی')),
                ('description', models.TextField(blank=True, verbose_name='توضیحات')),
                ('expected_outcomes', models.JSONField(default=list, verbose_name='خروجی‌های مورد انتظار')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='competency_frameworks', to='accounts.user', verbose_name='ایجادکننده')),
            ],
            options={
                'verbose_name': 'چارچوب شایستگی IAM',
                'verbose_name_plural': 'چارچوب‌های شایستگی IAM',
                'ordering': ['role_type', 'level'],
                'unique_together': {('role_type', 'level')},
            },
        ),
        # IAMCompetency
        migrations.CreateModel(
            name='IAMCompetency',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(choices=[('not_started', 'شروع نشده'), ('in_progress', 'در حال پیشرفت'), ('completed', 'تکمیل شده'), ('certified', 'گواهی دریافت کرده'), ('expired', 'منقضی شده')], default='not_started', max_length=20, verbose_name='وضعیت')),
                ('initial_assessment_score', models.FloatField(default=0, verbose_name='امتیاز ارزیابی اولیه')),
                ('initial_assessment_date', models.DateTimeField(blank=True, null=True, verbose_name='تاریخ ارزیابی اولیه')),
                ('initial_assessment_report', models.FileField(blank=True, null=True, upload_to='viam/assessments/initial/', verbose_name='گزارش ارزیابی اولیه')),
                ('training_progress', models.FloatField(default=0, verbose_name='پیشرفت آموزش (%)')),
                ('training_completed_date', models.DateTimeField(blank=True, null=True, verbose_name='تاریخ تکمیل آموزش')),
                ('training_certificate', models.FileField(blank=True, null=True, upload_to='viam/training/certificates/', verbose_name='گواهی آموزش')),
                ('practical_exercises', models.JSONField(default=list, help_text='لیست تمرین‌های انجام شده', verbose_name='تمرین‌های عملی')),
                ('case_studies', models.JSONField(default=list, help_text='لیست پرونده‌های واقعی بررسی شده', verbose_name='مطالعات موردی')),
                ('projects_completed', models.JSONField(default=list, help_text='لیست پروژه‌های انجام شده', verbose_name='پروژه‌های تکمیل شده')),
                ('final_score', models.FloatField(default=0, verbose_name='امتیاز نهایی')),
                ('final_assessment_date', models.DateTimeField(blank=True, null=True, verbose_name='تاریخ ارزیابی نهایی')),
                ('final_assessment_report', models.FileField(blank=True, null=True, upload_to='viam/assessments/final/', verbose_name='گزارش ارزیابی نهایی')),
                ('certificate_number', models.CharField(blank=True, max_length=50, verbose_name='شماره گواهی')),
                ('certificate_issued_date', models.DateTimeField(blank=True, null=True, verbose_name='تاریخ صدور گواهی')),
                ('certificate_expiry_date', models.DateTimeField(blank=True, null=True, verbose_name='تاریخ انقضای گواهی')),
                ('certificate_file', models.FileField(blank=True, null=True, upload_to='viam/certificates/issued/', verbose_name='فایل گواهی')),
                ('feedback', models.TextField(blank=True, verbose_name='بازخورد')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('evaluator', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='evaluated_competencies', to='accounts.user', verbose_name='ارزیاب')),
                ('framework', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='competencies', to='intangible_assets.iamcompetencyframework', verbose_name='چارچوب شایستگی')),
                ('organization', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='iam_competencies', to='accounts.organization', verbose_name='سازمان')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='iam_competencies', to='accounts.user', verbose_name='کاربر')),
            ],
            options={
                'verbose_name': 'شایستگی IAM',
                'verbose_name_plural': 'شایستگی‌های IAM',
                'ordering': ['-created_at'],
                'unique_together': {('user', 'framework')},
            },
        ),
        # IAMTrainingProgram
        migrations.CreateModel(
            name='IAMTrainingProgram',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255, verbose_name='عنوان برنامه')),
                ('program_type', models.CharField(choices=[('manager', 'مدیر IAM'), ('consultant', 'مشاور IAM'), ('auditor', 'ممیز IAM')], max_length=20, verbose_name='نوع برنامه')),
                ('level', models.CharField(choices=[('beginner', 'مبتدی'), ('professional', 'حرفه‌ای'), ('expert', 'خبره')], max_length=20, verbose_name='سطح')),
                ('status', models.CharField(choices=[('draft', 'پیش‌نویس'), ('published', 'منتشر شده'), ('completed', 'تکمیل شده'), ('archived', 'بایگانی شده')], default='draft', max_length=20, verbose_name='وضعیت')),
                ('description', models.TextField(verbose_name='توضیحات برنامه')),
                ('modules', models.JSONField(default=list, help_text='لیست ماژول‌ها با عنوان، توضیحات و مدت زمان', verbose_name='ماژول‌های آموزشی')),
                ('total_duration', models.IntegerField(default=0, verbose_name='مدت کل (ساعت)')),
                ('prerequisites', models.JSONField(default=list, help_text='لیست پیش‌نیازهای برنامه', verbose_name='پیش‌نیازها')),
                ('certificate_template', models.FileField(blank=True, null=True, upload_to='viam/training/certificates/templates/', verbose_name='قالب گواهی')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='training_programs', to='accounts.user', verbose_name='ایجادکننده')),
            ],
            options={
                'verbose_name': 'برنامه آموزشی IAM',
                'verbose_name_plural': 'برنامه‌های آموزشی IAM',
                'unique_together': {('program_type', 'level')},
            },
        ),
        # IAMTrainingEnrollment
        migrations.CreateModel(
            name='IAMTrainingEnrollment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(choices=[('enrolled', 'ثبت‌نام شده'), ('in_progress', 'در حال پیشرفت'), ('completed', 'تکمیل شده'), ('dropped', 'انصراف داده')], default='enrolled', max_length=20, verbose_name='وضعیت')),
                ('progress_percentage', models.FloatField(default=0, verbose_name='درصد پیشرفت')),
                ('completed_modules', models.JSONField(default=list, verbose_name='ماژول‌های تکمیل شده')),
                ('quiz_scores', models.JSONField(default=dict, verbose_name='امتیازات آزمون‌ها')),
                ('final_exam_score', models.FloatField(blank=True, null=True, verbose_name='امتیاز آزمون نهایی')),
                ('enrollment_date', models.DateTimeField(auto_now_add=True)),
                ('start_date', models.DateTimeField(blank=True, null=True, verbose_name='تاریخ شروع')),
                ('completion_date', models.DateTimeField(blank=True, null=True, verbose_name='تاریخ تکمیل')),
                ('certificate_issued', models.BooleanField(default=False, verbose_name='گواهی صادر شده؟')),
                ('certificate_number', models.CharField(blank=True, max_length=50, verbose_name='شماره گواهی')),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('program', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='enrollments', to='intangible_assets.iamtrainingprogram', verbose_name='برنامه آموزشی')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='training_enrollments', to='accounts.user', verbose_name='کاربر')),
            ],
            options={
                'verbose_name': 'ثبت‌نام آموزشی',
                'verbose_name_plural': 'ثبت‌نام‌های آموزشی',
                'unique_together': {('user', 'program')},
            },
        ),
    ]
