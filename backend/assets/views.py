from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets
from .models import Asset, AssetCategory, AssetLocation
from .serializers import AssetSerializer, AssetCategorySerializer, AssetLocationSerializer


class AssetViewSet(viewsets.ModelViewSet):
    queryset = Asset.objects.select_related('category', 'location').all()
    serializer_class = AssetSerializer


class AssetCategoryViewSet(viewsets.ModelViewSet):
    queryset = AssetCategory.objects.all()
    serializer_class = AssetCategorySerializer


class AssetLocationViewSet(viewsets.ModelViewSet):
    queryset = AssetLocation.objects.all()
    serializer_class = AssetLocationSerializer
