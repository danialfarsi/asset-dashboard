from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [
        ('intangible_assets', '0040_add_step3_fields_to_model'),
    ]

    operations = [
        migrations.CreateModel(
            name='IAMRole',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, verbose_name='نام نقش')),
                ('role_type', models.CharField(choices=[('bod', 'هیئت مدیره / مدیرعامل (BOD)'), ('sc', 'کمیته راهبری IAM (SC)'), ('iam_group', 'مدیر IAM گروه (IAM)'), ('iam_unit', 'مدیر IAM واحد (CHM)'), ('asset_owner', 'مالک دارایی (OWN)'), ('asset_custodian', 'متولی دارایی (CUS)'), ('auditor', 'ممیز مستقل (AUD)'), ('plt', 'مدیر پلتفرم متا (PLT)')], max_length=20, unique=True, verbose_name='نوع نقش')),
                ('description', models.TextField(blank=True, verbose_name='توضیحات')),
                ('access_level', models.CharField(choices=[('group', 'دسترسی گروه'), ('unit', 'دسترسی واحد'), ('personal', 'دسترسی شخصی')], default='personal', max_length=20, verbose_name='سطح دسترسی')),
                ('permissions', models.JSONField(blank=True, default=list, verbose_name='مجوزها')),
                ('is_active', models.BooleanField(default=True, verbose_name='فعال')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'نقش IAM',
                'verbose_name_plural': 'نقش های IAM',
                'ordering': ['role_type'],
            },
        ),
        migrations.CreateModel(
            name='IAMUserProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('responsibility_area', models.CharField(blank=True, max_length=255, verbose_name='حوزه مسئولیت')),
                ('is_active', models.BooleanField(default=True, verbose_name='فعال')),
                ('appointed_at', models.DateTimeField(blank=True, null=True, verbose_name='تاریخ انتصاب')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('organization', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='iam_users', to='accounts.organization')),
                ('parent', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='children', to='intangible_assets.iamuserprofile', verbose_name='مدیر بالادستی')),
                ('role', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='users', to='intangible_assets.iamrole', verbose_name='نقش IAM')),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='iam_profile', to='accounts.user')),
            ],
            options={
                'verbose_name': 'پروفایل IAM',
                'verbose_name_plural': 'پروفایل های IAM',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='IAMCommittee',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255, verbose_name='نام کمیته')),
                ('description', models.TextField(blank=True, verbose_name='توضیحات')),
                ('is_active', models.BooleanField(default=True, verbose_name='فعال')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('chairperson', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='chaired_committees', to='accounts.user', verbose_name='رئیس کمیته')),
                ('secretary', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='secretary_committees', to='accounts.user', verbose_name='دبیر کمیته')),
            ],
            options={
                'verbose_name': 'کمیته IAM',
                'verbose_name_plural': 'کمیته های IAM',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='IAMCommitteeMembership',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('role', models.CharField(choices=[('chairperson', 'رئیس'), ('secretary', 'دبیر'), ('member', 'عضو'), ('observer', 'ناظر'), ('expert', 'کارشناس مشاور')], default='member', max_length=20, verbose_name='نقش در کمیته')),
                ('has_vote', models.BooleanField(default=True, verbose_name='حق رأی')),
                ('joined_at', models.DateTimeField(auto_now_add=True)),
                ('committee', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='intangible_assets.iamcommittee')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='accounts.user')),
            ],
            options={
                'unique_together': {('committee', 'user')},
            },
        ),
        migrations.AddField(
            model_name='iamcommittee',
            name='members',
            field=models.ManyToManyField(related_name='committees', through='intangible_assets.IAMCommitteeMembership', to='accounts.user'),
        ),
        migrations.CreateModel(
            name='IAMCommitteeMeeting',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255, verbose_name='عنوان جلسه')),
                ('date', models.DateTimeField(verbose_name='تاریخ و زمان جلسه')),
                ('duration', models.IntegerField(default=90, verbose_name='مدت جلسه (دقیقه)')),
                ('agenda', models.JSONField(blank=True, default=list, verbose_name='دستور جلسه')),
                ('minutes', models.TextField(blank=True, verbose_name='صورتجلسه')),
                ('resolutions', models.JSONField(blank=True, default=list, verbose_name='مصوبات')),
                ('status', models.CharField(choices=[('scheduled', 'برنامه ریزی شده'), ('in_progress', 'در حال برگزاری'), ('completed', 'برگزار شده'), ('cancelled', 'لغو شده')], default='scheduled', max_length=20, verbose_name='وضعیت')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('committee', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='meetings', to='intangible_assets.iamcommittee')),
            ],
            options={
                'verbose_name': 'جلسه کمیته IAM',
                'verbose_name_plural': 'جلسات کمیته IAM',
                'ordering': ['-date'],
            },
        ),
        migrations.CreateModel(
            name='IAMMeetingAttendance',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(choices=[('present', 'حاضر'), ('absent', 'غایب'), ('excused', 'با عذر موجه')], default='present', max_length=20, verbose_name='وضعیت حضور')),
                ('notes', models.TextField(blank=True, verbose_name='توضیحات')),
                ('meeting', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='intangible_assets.iamcommitteemeeting')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='accounts.user')),
            ],
            options={
                'unique_together': {('meeting', 'user')},
            },
        ),
        migrations.AddField(
            model_name='iamcommitteemeeting',
            name='attendees',
            field=models.ManyToManyField(related_name='meetings', through='intangible_assets.IAMMeetingAttendance', to='accounts.user'),
        ),
        migrations.CreateModel(
            name='IAMResolution',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255, verbose_name='عنوان مصوبه')),
                ('description', models.TextField(verbose_name='توضیحات مصوبه')),
                ('decision_type', models.CharField(choices=[('register', 'تایید ثبت دارایی راهبردی'), ('ownership', 'تعیین مالک یا حل تعارض مالکیت'), ('protection', 'تصویب ثبت حقوقی، NDA یا برنامه حفاظت'), ('valuation', 'تصویب ارزش گذاری رسمی'), ('development', 'تایید پروژه توسعه یا نوآوری'), ('commercialization', 'تایید مدل تجاری سازی یا لایسنس'), ('disposal', 'تایید ادغام، واگذاری یا توقف دارایی'), ('budget', 'تصویب بودجه و مسئول اقدام'), ('compliance', 'ارجاع عدم انطباق به واحد مسئول')], max_length=20, verbose_name='نوع تصمیم')),
                ('deadline', models.DateField(blank=True, null=True, verbose_name='مهلت اجرا')),
                ('budget', models.DecimalField(blank=True, decimal_places=2, max_digits=20, null=True, verbose_name='بودجه مصوب')),
                ('status', models.CharField(choices=[('pending', 'در انتظار'), ('in_progress', 'در حال اجرا'), ('completed', 'انجام شده'), ('overdue', 'تاخیر خورده'), ('cancelled', 'لغو شده')], default='pending', max_length=20, verbose_name='وضعیت')),
                ('evidence', models.FileField(blank=True, null=True, upload_to='iam/resolutions/%Y/%m/%d/', verbose_name='مدارک و شواهد')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('meeting', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='resolutions_list', to='intangible_assets.iamcommitteemeeting')),
                ('responsible', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='resolutions', to='accounts.user', verbose_name='مسئول اجرا')),
            ],
            options={
                'verbose_name': 'مصوبه IAM',
                'verbose_name_plural': 'مصوبات IAM',
                'ordering': ['-created_at'],
            },
        ),
    ]
