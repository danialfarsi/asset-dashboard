from django.db import migrations
from django.core.management import call_command


def load_screening_templates(apps, schema_editor):
    try:
        call_command('loaddata', 'screening_templates.json', app_label='intangible_assets')
        print('✅ ScreeningTemplate ها بارگذاری شدند')
    except Exception as e:
        print(f'⚠️ خطا در بارگذاری: {e}')
        print('ℹ️ اگر فایل وجود ندارد، نادیده گرفته می‌شود')


def unload_screening_templates(apps, schema_editor):
    ScreeningTemplate = apps.get_model('intangible_assets', 'ScreeningTemplate')
    ScreeningTemplate.objects.all().delete()
    print('✅ ScreeningTemplate ها حذف شدند')


class Migration(migrations.Migration):
    dependencies = [
        ('intangible_assets', '0019_add_valuation_step4_models'),
    ]

    operations = [
        migrations.RunPython(load_screening_templates, unload_screening_templates),
    ]
