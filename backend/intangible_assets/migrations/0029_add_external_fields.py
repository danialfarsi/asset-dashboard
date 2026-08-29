from django.db import migrations, models
import uuid

class Migration(migrations.Migration):
    dependencies = [
        ('intangible_assets', '0028_add_graph_dimensions'),
    ]

    operations = [
        migrations.AddField(
            model_name='screenedasset',
            name='source_type',
            field=models.CharField(choices=[('internal', 'داخلی'), ('external', 'خارجی')], default='internal', max_length=20, verbose_name='نوع منبع'),
        ),
        migrations.AddField(
            model_name='screenedasset',
            name='external_user_id',
            field=models.UUIDField(null=True, blank=True, verbose_name='شناسه کاربر خارجی'),
        ),
        migrations.AddField(
            model_name='screenedasset',
            name='session_id',
            field=models.CharField(max_length=255, null=True, blank=True, verbose_name='شناسه جلسه'),
        ),
        migrations.AddField(
            model_name='screenedasset',
            name='source_app',
            field=models.CharField(max_length=100, null=True, blank=True, verbose_name='اپلیکیشن مبدا'),
        ),
        migrations.AddField(
            model_name='discoveryassessment',
            name='is_external',
            field=models.BooleanField(default=False, verbose_name='ارزیابی خارجی'),
        ),
        migrations.AddField(
            model_name='discoveryassessment',
            name='external_session_id',
            field=models.CharField(max_length=255, null=True, blank=True, verbose_name='شناسه جلسه خارجی'),
        ),
    ]
