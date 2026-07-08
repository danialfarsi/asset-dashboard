from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import valuation_views
from .views_screening import (
    OrganizationTypeViewSet, 
    ScreeningTemplateViewSet, 
    ScreenedAssetViewSet,
    AssetFileViewSet
)
from .views_asset_type_detection import DetectAssetTypeView
from .notification_views import NotificationViewSet

# ============ Router برای ViewSet ها ============
router = DefaultRouter()
router.register(r'screened-assets', ScreenedAssetViewSet, basename='screened-asset')
router.register(r'organization-types', OrganizationTypeViewSet, basename='organization-type')
router.register(r'screening-templates', ScreeningTemplateViewSet, basename='screening-template')
router.register(r'asset-files', AssetFileViewSet, basename='asset-file')

# Valuation routers
router.register(r'asset-types', valuation_views.AssetTypeViewSet, basename='asset-type')
router.register(r'valuation-dimensions', valuation_views.ValuationDimensionViewSet, basename='valuation-dimension')
router.register(r'valuation-questions', valuation_views.ValuationQuestionViewSet, basename='valuation-question')
router.register(r'asset-valuations', valuation_views.AssetValuationViewSet, basename='asset-valuation')

# 🔥 Notification router (قبل از urlpatterns)
router.register(r'notifications', NotificationViewSet, basename='notification')

# ============ URL Patterns ============
urlpatterns = [
    path('', include(router.urls)),
    
    # 🔥 API جدید برای تشخیص AssetType
    path('detect-asset-type/<str:asset_uid>/', DetectAssetTypeView.as_view(), name='detect_asset_type'),
]

from .valuation_case_views import ValuationCaseViewSet

# ثبت ValuationCase در router
router.register(r'valuation-cases', ValuationCaseViewSet, basename='valuation-case')
