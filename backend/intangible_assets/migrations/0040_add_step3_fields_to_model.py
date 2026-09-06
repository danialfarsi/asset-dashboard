from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('intangible_assets', '0039_add_missing_fields_to_step3'),
    ]

    operations = [
        migrations.AddField(
            model_name='protectionstep3',
            name='jurisdiction',
            field=models.CharField(blank=True, max_length=50, verbose_name='حوزه قضایی'),
        ),
        migrations.AddField(
            model_name='protectionstep3',
            name='estimated_cost',
            field=models.CharField(blank=True, max_length=50, verbose_name='هزینه تخمینی'),
        ),
        migrations.AddField(
            model_name='protectionstep3',
            name='registration_classes',
            field=models.JSONField(blank=True, default=list, verbose_name='کلاس‌های ثبت'),
        ),
    ]
