from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('intangible_assets', '0012_add_evidence_files'),
    ]

    operations = [
        migrations.AddField(
            model_name='screeningtemplate',
            name='valuation_method',
            field=models.CharField(
                blank=True,
                choices=[
                    ('M-01', 'M-01 - Relief from Royalty'),
                    ('M-02', 'M-02 - Discounted Cash Flow'),
                    ('M-03', 'M-03 - Replacement Cost Method'),
                    ('M-04', 'M-04 - Weighted Weighted Method'),
                    ('M-05', 'M-05 - Multi-Period Excess Earnings'),
                    ('M-06', 'M-06 - Replacement Cost Method (Adjusted)'),
                    ('M-07', 'M-07 - Total Weighted Cost'),
                    ('M-08', 'M-08 - Cost to Market'),
                    ('M-09', 'M-09 - Market Multiple Method'),
                ],
                help_text='روش اصلی ارزش‌گذاری برای این دارایی',
                max_length=20,
                null=True,
            ),
        ),
    ]
