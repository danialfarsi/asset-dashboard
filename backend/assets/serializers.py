from rest_framework import serializers
from .models import Asset, AssetCategory, AssetLocation


class AssetCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetCategory
        fields = ['id', 'name']


class AssetLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetLocation
        fields = ['id', 'name']


class AssetSerializer(serializers.ModelSerializer):
    category = AssetCategorySerializer(read_only=True)
    location = AssetLocationSerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=AssetCategory.objects.all(), source='category', write_only=True
    )
    location_id = serializers.PrimaryKeyRelatedField(
        queryset=AssetLocation.objects.all(), source='location', write_only=True,
        allow_null=True, required=False
    )

    class Meta:
        model = Asset
        fields = [
            'id', 'name', 'asset_code', 'status',
            'category', 'category_id',
            'location', 'location_id',
            'purchase_date', 'purchase_price', 'current_value',
            'created_at', 'updated_at',
        ]
