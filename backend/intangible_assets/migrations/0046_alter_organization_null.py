from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('intangible_assets', '0045_viam_03_final'),
    ]

    operations = [
        migrations.AlterField(
            model_name='awarenesscampaign',
            name='organization',
            field=models.ForeignKey(blank=True, null=True, on_delete=models.deletion.CASCADE, related_name='viam_campaigns', to='accounts.organization', verbose_name='سازمان'),
        ),
        migrations.AlterField(
            model_name='executiveawareness',
            name='organization',
            field=models.ForeignKey(blank=True, null=True, on_delete=models.deletion.CASCADE, related_name='executive_awareness', to='accounts.organization', verbose_name='سازمان'),
        ),
        migrations.AlterField(
            model_name='generalemployeeculture',
            name='organization',
            field=models.ForeignKey(blank=True, null=True, on_delete=models.deletion.CASCADE, related_name='employee_culture', to='accounts.organization', verbose_name='سازمان'),
        ),
        migrations.AlterField(
            model_name='middlemanagementawareness',
            name='organization',
            field=models.ForeignKey(blank=True, null=True, on_delete=models.deletion.CASCADE, related_name='middle_awareness', to='accounts.organization', verbose_name='سازمان'),
        ),
    ]
