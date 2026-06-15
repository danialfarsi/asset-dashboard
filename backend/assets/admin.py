from django.contrib import admin
from .models import Asset, AssetCategory, AssetLocation

admin.site.register(Asset)
admin.site.register(AssetCategory)
admin.site.register(AssetLocation)
