# Generated migration for adding asset_type to ScreeningTemplate
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    dependencies = [
        ('intangible_assets', '0007_valuationweight'),
    ]

    operations = [
        migrations.AddField(
            model_name='screeningtemplate',
            name='asset_type',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.SET_NULL,
                related_name='screening_templates',
                to='intangible_assets.assettype'
            ),
        ),
    ]
