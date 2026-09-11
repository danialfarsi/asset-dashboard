"""
Migration: تغییر ProtectionProfile از screening_template به asset

این migration:
1. فیلد screening_template رو حذف می‌کنه
2. فیلد asset رو اضافه می‌کنه (OneToOne)
"""
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('intangible_assets', '0049_add_valuation_type_to_screenedasset'),
    ]

    operations = [
        # ۱. حذف فیلد screening_template
        migrations.RemoveField(
            model_name='protectionprofile',
            name='screening_template',
        ),
        
        # ۲. اضافه کردن فیلد asset (OneToOne، بدون nullable چون جدول خالیه)
        migrations.AddField(
            model_name='protectionprofile',
            name='asset',
            field=models.OneToOneField(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='protection_profile',
                to='intangible_assets.screenedasset',
            ),
        ),
    ]
