from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('intangible_assets', '0036_add_protection_tables'),
    ]

    operations = [
        migrations.CreateModel(
            name='ProtectionTool',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255, verbose_name='نام ابزار')),
                ('code', models.CharField(max_length=20, unique=True, verbose_name='کد ابزار')),
                ('tool_type', models.CharField(choices=[('legal', 'حقوقی'), ('technical', 'فنی'), ('procedural', 'فرآیندی')], max_length=20, verbose_name='نوع ابزار')),
                ('archetype', models.CharField(choices=[('PA-1', 'مالکیت فکری ثبتی'), ('PA-2', 'قراردادی'), ('PA-3', 'راز تجاری'), ('PA-4', 'دیجیتال/داده'), ('PA-5', 'رویه‌ای/فرهنگی')], max_length=5, verbose_name='آرکی‌تایپ مرتبط')),
                ('description', models.TextField(blank=True, verbose_name='توضیحات')),
                ('icon', models.CharField(blank=True, max_length=50, verbose_name='آیکون')),
                ('weight', models.FloatField(default=1.0, verbose_name='وزن در امتیاز')),
                ('is_active', models.BooleanField(default=True, verbose_name='فعال')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'verbose_name': 'ابزار حفاظتی',
                'verbose_name_plural': 'ابزارهای حفاظتی',
                'ordering': ['archetype', 'tool_type', 'name'],
            },
        ),
    ]
