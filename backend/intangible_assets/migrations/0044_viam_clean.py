# Generated migration for VIAM models - Clean version without old IAM models
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [
        ('intangible_assets', '0043_add_protection_approval_fields'),
        ('accounts', '0001_initial'),
    ]

    operations = [
        # ========== VIAM-01 Models ==========
        
        migrations.CreateModel(
            name='EstablishmentRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255, verbose_name='عنوان')),
                ('description', models.TextField(verbose_name='توضیحات')),
                ('justification', models.TextField(verbose_name='دلایل توجیهی')),
                ('status', models.CharField(choices=[('draft', 'پیش‌نویس'), ('submitted', 'ارسال شده'), ('approved', 'تأیید شده'), ('rejected', 'رد شده')], default='draft', max_length=20, verbose_name='وضعیت')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='establishment_requests', to='accounts.user')),
            ],
            options={
                'verbose_name': 'درخواست تأسیس',
                'verbose_name_plural': 'درخواست‌های تأسیس',
            },
        ),
        
        migrations.CreateModel(
            name='IAMCharter',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(default='منشور IAM', max_length=255, verbose_name='عنوان')),
                ('version', models.CharField(default='1.0', max_length=20, verbose_name='نسخه')),
                ('status', models.CharField(choices=[('draft', 'پیش‌نویس'), ('approved', 'تأیید شده'), ('active', 'فعال')], default='draft', max_length=20, verbose_name='وضعیت')),
                ('vision', models.TextField(blank=True, verbose_name='چشم‌انداز')),
                ('mission', models.TextField(blank=True, verbose_name='رسالت')),
                ('values', models.JSONField(default=list, verbose_name='ارزش‌ها')),
                ('objectives', models.JSONField(default=list, verbose_name='اهداف')),
                ('scope', models.TextField(blank=True, verbose_name='حوزه فعالیت')),
                ('governance_structure', models.JSONField(default=dict, verbose_name='ساختار حکمرانی')),
                ('meeting_frequency', models.CharField(default='ماهانه', max_length=50, verbose_name='دوره جلسات')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='charters', to='accounts.user')),
            ],
            options={
                'verbose_name': 'منشور IAM',
                'verbose_name_plural': 'منشورهای IAM',
            },
        ),
        
        migrations.CreateModel(
            name='IAMRepresentative',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('department', models.CharField(max_length=255, verbose_name='واحد سازمانی')),
                ('role', models.CharField(choices=[('unit_manager', 'مدیر واحد'), ('deputy', 'معاون'), ('expert', 'کارشناس')], default='unit_manager', max_length=20, verbose_name='نقش')),
                ('is_active', models.BooleanField(default=True, verbose_name='فعال')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='iam_reps', to='accounts.user')),
            ],
            options={
                'verbose_name': 'نماینده IAM',
                'verbose_name_plural': 'نمایندگان IAM',
            },
        ),
        
        migrations.CreateModel(
            name='RACIMatrix',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('activity', models.CharField(choices=[('discovery', 'کشف'), ('valuation', 'ارزش‌گذاری'), ('protection', 'حفاظت'), ('development', 'توسعه'), ('commercialization', 'تجاری‌سازی'), ('monitoring', 'پایش')], max_length=20, verbose_name='فعالیت')),
                ('role', models.CharField(choices=[('org_admin', 'مدیر شرکت'), ('unit_manager', 'مدیر واحد'), ('legal', 'حقوقی'), ('it', 'فناوری'), ('finance', 'مالی'), ('hr', 'منابع انسانی')], max_length=20, verbose_name='نقش')),
                ('responsibility', models.CharField(choices=[('R', 'مسئول اجرا'), ('A', 'پاسخگوی نهایی'), ('C', 'مشورت‌شونده'), ('I', 'مطلع‌شونده')], max_length=1, verbose_name='وظیفه')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'verbose_name': 'ماتریس RACI',
                'verbose_name_plural': 'ماتریس‌های RACI',
                'unique_together': {('activity', 'role')},
            },
        ),
        
        migrations.CreateModel(
            name='OperationalModel',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255, verbose_name='نام')),
                ('status', models.CharField(choices=[('draft', 'پیش‌نویس'), ('approved', 'تأیید شده'), ('active', 'فعال')], default='draft', max_length=20, verbose_name='وضعیت')),
                ('processes', models.JSONField(default=list, verbose_name='فرآیندها')),
                ('workflows', models.JSONField(default=list, verbose_name='گردش‌کارها')),
                ('kpis', models.JSONField(default=list, verbose_name='KPIها')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='op_models', to='accounts.user')),
            ],
            options={
                'verbose_name': 'مدل عملیاتی',
                'verbose_name_plural': 'مدل‌های عملیاتی',
            },
        ),
        
        migrations.CreateModel(
            name='VIAMPilot',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255, verbose_name='نام')),
                ('status', models.CharField(choices=[('planned', 'برنامه‌ریزی'), ('in_progress', 'در حال اجرا'), ('completed', 'تکمیل شده')], default='planned', max_length=20, verbose_name='وضعیت')),
                ('scope', models.TextField(verbose_name='حوزه اجرا')),
                ('departments', models.JSONField(default=list, verbose_name='واحدهای مشمول')),
                ('asset_count_target', models.IntegerField(default=30, verbose_name='تعداد دارایی هدف')),
                ('start_date', models.DateField(blank=True, null=True, verbose_name='تاریخ شروع')),
                ('end_date', models.DateField(blank=True, null=True, verbose_name='تاریخ پایان')),
                ('assets_discovered', models.IntegerField(default=0, verbose_name='دارایی‌های کشف شده')),
                ('assets_registered', models.IntegerField(default=0, verbose_name='دارایی‌های ثبت شده')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='pilots', to='accounts.user')),
            ],
            options={
                'verbose_name': 'پایلوت VIAM',
                'verbose_name_plural': 'پایلوت‌های VIAM',
            },
        ),
        
        # ========== VIAM-02: Strategic Planning ==========
        
        migrations.CreateModel(
            name='StrategicPlan',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255, verbose_name='عنوان')),
                ('status', models.CharField(choices=[('draft', 'پیش‌نویس'), ('approved', 'تأیید'), ('active', 'فعال')], default='draft', max_length=20, verbose_name='وضعیت')),
                ('vision', models.TextField(blank=True, verbose_name='چشم‌انداز')),
                ('mission', models.TextField(blank=True, verbose_name='رسالت')),
                ('strategic_goals', models.JSONField(default=list, verbose_name='اهداف استراتژیک')),
                ('start_date', models.DateField(blank=True, null=True, verbose_name='تاریخ شروع')),
                ('end_date', models.DateField(blank=True, null=True, verbose_name='تاریخ پایان')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='accounts.user')),
            ],
            options={
                'verbose_name': 'برنامه استراتژیک',
                'verbose_name_plural': 'برنامه‌های استراتژیک',
            },
        ),
        
        migrations.CreateModel(
            name='StrategicInitiative',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255, verbose_name='عنوان')),
                ('description', models.TextField(verbose_name='توضیحات')),
                ('priority', models.CharField(choices=[('high', 'بالا'), ('medium', 'متوسط'), ('low', 'پایین')], default='medium', max_length=20, verbose_name='اولویت')),
                ('status', models.CharField(choices=[('planned', 'برنامه'), ('in_progress', 'در حال اجرا'), ('completed', 'تکمیل')], default='planned', max_length=20, verbose_name='وضعیت')),
                ('progress_percent', models.IntegerField(default=0, verbose_name='درصد پیشرفت')),
                ('start_date', models.DateField(blank=True, null=True, verbose_name='تاریخ شروع')),
                ('end_date', models.DateField(blank=True, null=True, verbose_name='تاریخ پایان')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('owner', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='accounts.user')),
                ('strategic_plan', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='initiatives', to='intangible_assets.strategicplan')),
            ],
            options={
                'verbose_name': 'ابتکار استراتژیک',
                'verbose_name_plural': 'ابتکارات استراتژیک',
            },
        ),
        
        migrations.CreateModel(
            name='IAMPolicy',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255, verbose_name='عنوان')),
                ('policy_type', models.CharField(choices=[('general', 'عمومی'), ('discovery', 'کشف'), ('protection', 'حفاظت'), ('valuation', 'ارزش‌گذاری'), ('commercialization', 'تجاری‌سازی')], max_length=20, verbose_name='نوع')),
                ('status', models.CharField(choices=[('draft', 'پیش‌نویس'), ('approved', 'تأیید'), ('active', 'فعال')], default='draft', max_length=20, verbose_name='وضعیت')),
                ('content', models.TextField(verbose_name='محتوا')),
                ('effective_date', models.DateField(blank=True, null=True, verbose_name='تاریخ اجرا')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='accounts.user')),
            ],
            options={
                'verbose_name': 'خط‌مشی IAM',
                'verbose_name_plural': 'خط‌مشی‌های IAM',
            },
        ),
        
        migrations.CreateModel(
            name='StrategicAssetMapping',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('strategic_importance', models.IntegerField(default=3, verbose_name='اهمیت استراتژیک')),
                ('notes', models.TextField(blank=True, verbose_name='یادداشت')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('asset_screened', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='intangible_assets.screenedasset')),
                ('asset_template', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='intangible_assets.screeningtemplate')),
                ('strategic_plan', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='mappings', to='intangible_assets.strategicplan')),
            ],
            options={
                'verbose_name': 'نقشه دارایی استراتژیک',
                'verbose_name_plural': 'نقشه‌های دارایی استراتژیک',
            },
        ),
    ]
