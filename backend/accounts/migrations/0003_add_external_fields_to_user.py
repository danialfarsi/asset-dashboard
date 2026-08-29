from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0002_user_organization_type'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='external_session_id',
            field=models.CharField(max_length=255, null=True, blank=True, verbose_name='شناسه جلسه خارجی'),
        ),
        migrations.AddField(
            model_name='user',
            name='external_user_id',
            field=models.UUIDField(null=True, blank=True, verbose_name='شناسه کاربر خارجی'),
        ),
    ]
