from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [
        ('intangible_assets', '0035_screeningtemplate_protection_archetype'),
    ]

    operations = [
        migrations.CreateModel(
            name='ProtectionProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('archetype', models.CharField(choices=[('PA-1', 'مالکیت فکری ثبتی'), ('PA-2', 'قراردادی'), ('PA-3', 'راز تجاری'), ('PA-4', 'دیجیتال/داده'), ('PA-5', 'رویه‌ای/فرهنگی'), ('N/A', 'قابل حفاظت نیست')], max_length=5)),
                ('status', models.CharField(choices=[('draft', 'پیش‌نویس'), ('in_progress', 'در حال بررسی'), ('completed', 'تکمیل شده'), ('approved', 'تأیید شده')], default='draft', max_length=20)),
                ('step1_result', models.JSONField(blank=True, default=dict)),
                ('step2_result', models.JSONField(blank=True, default=dict)),
                ('step3_result', models.JSONField(blank=True, default=dict)),
                ('step4_result', models.JSONField(blank=True, default=dict)),
                ('step5_result', models.JSONField(blank=True, default=dict)),
                ('protection_score', models.FloatField(default=0)),
                ('legal_score', models.FloatField(default=0)),
                ('technical_score', models.FloatField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('screening_template', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='protection_profile', to='intangible_assets.screeningtemplate')),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='accounts.user')),
            ],
            options={
                'verbose_name': 'پروفایل حفاظتی',
                'verbose_name_plural': 'پروفایل‌های حفاظتی',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='ProtectionStep1',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('analysis_result', models.JSONField(default=dict)),
                ('available_tools', models.JSONField(default=list)),
                ('recommended_tools', models.JSONField(default=list)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('protection_profile', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='step1', to='intangible_assets.protectionprofile')),
            ],
            options={
                'verbose_name': 'گام ۱ - تحلیل قابلیت حفاظت',
                'verbose_name_plural': 'گام ۱ - تحلیل قابلیت حفاظت',
            },
        ),
        migrations.CreateModel(
            name='ProtectionStep2',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('decision_tree', models.JSONField(default=dict)),
                ('selected_strategy', models.JSONField(default=dict)),
                ('legal_strategy', models.TextField(blank=True)),
                ('technical_strategy', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('protection_profile', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='step2', to='intangible_assets.protectionprofile')),
            ],
            options={
                'verbose_name': 'گام ۲ - طراحی استراتژی حفاظت',
                'verbose_name_plural': 'گام ۲ - طراحی استراتژی حفاظت',
            },
        ),
        migrations.CreateModel(
            name='ProtectionStep3',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('selected_legal_tools', models.JSONField(default=list)),
                ('legal_status', models.CharField(default='pending', max_length=20)),
                ('registration_number', models.CharField(blank=True, max_length=100)),
                ('registration_date', models.DateField(blank=True, null=True)),
                ('expiry_date', models.DateField(blank=True, null=True)),
                ('issuing_authority', models.CharField(blank=True, max_length=255)),
                ('legal_document', models.FileField(blank=True, null=True, upload_to='protection/legal/%Y/%m/%d/')),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('protection_profile', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='step3', to='intangible_assets.protectionprofile')),
            ],
            options={
                'verbose_name': 'گام ۳ - حفاظت حقوقی',
                'verbose_name_plural': 'گام ۳ - حفاظت حقوقی',
            },
        ),
        migrations.CreateModel(
            name='ProtectionStep4',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('selected_technical_tools', models.JSONField(default=list)),
                ('security_level', models.CharField(choices=[('low', 'پایین'), ('medium', 'متوسط'), ('high', 'بالا'), ('critical', 'بحرانی')], default='medium', max_length=20)),
                ('encryption_enabled', models.BooleanField(default=False)),
                ('access_control_enabled', models.BooleanField(default=False)),
                ('backup_enabled', models.BooleanField(default=False)),
                ('monitoring_enabled', models.BooleanField(default=False)),
                ('security_document', models.FileField(blank=True, null=True, upload_to='protection/technical/%Y/%m/%d/')),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('protection_profile', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='step4', to='intangible_assets.protectionprofile')),
            ],
            options={
                'verbose_name': 'گام ۴ - امنیت فنی',
                'verbose_name_plural': 'گام ۴ - امنیت فنی',
            },
        ),
        migrations.CreateModel(
            name='ProtectionStep5',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('protection_map', models.JSONField(default=dict)),
                ('is_completed', models.BooleanField(default=False)),
                ('is_approved', models.BooleanField(default=False)),
                ('approved_at', models.DateTimeField(blank=True, null=True)),
                ('final_report', models.FileField(blank=True, null=True, upload_to='protection/reports/%Y/%m/%d/')),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('approved_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='approved_protections', to='accounts.user')),
                ('protection_profile', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='step5', to='intangible_assets.protectionprofile')),
            ],
            options={
                'verbose_name': 'گام ۵ - نقشه حفاظت نهایی',
                'verbose_name_plural': 'گام ۵ - نقشه حفاظت نهایی',
            },
        ),
    ]
