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
from .valuation_case_views import ValuationCaseViewSet
from .valuation_step3_views import ValuationStep3ViewSet
from .valuation_step4_views import ValuationStep4ViewSet
from .notification_views import NotificationViewSet
from .discovery_views import DiscoveryAssessmentViewSet, DiscoveryAssetViewSet
from .views_discovery import SuggestTemplateView

router = DefaultRouter()

# Screening routers
router.register(r'screened-assets', ScreenedAssetViewSet, basename='screened-asset')
router.register(r'organization-types', OrganizationTypeViewSet, basename='organization-type')
router.register(r'screening-templates', ScreeningTemplateViewSet, basename='screening-template')
router.register(r'asset-files', AssetFileViewSet, basename='asset-file')

# Valuation routers
router.register(r'asset-types', valuation_views.AssetTypeViewSet, basename='asset-type')
router.register(r'valuation-dimensions', valuation_views.ValuationDimensionViewSet, basename='valuation-dimension')
router.register(r'valuation-questions', valuation_views.ValuationQuestionViewSet, basename='valuation-question')
router.register(r'asset-valuations', valuation_views.AssetValuationViewSet, basename='asset-valuation')

# Valuation Case routers
router.register(r'valuation-cases', ValuationCaseViewSet, basename='valuation-cases')

# STEP 3 routers
router.register(r'valuation-step3', ValuationStep3ViewSet, basename='valuation-step3')

# STEP 4 routers
router.register(r'valuation-step4', ValuationStep4ViewSet, basename='valuation-step4')

# Notification routers
router.register(r'notifications', NotificationViewSet, basename='notifications')

# Discovery routers (موتور شناسایی)
router.register(r'discovery', DiscoveryAssessmentViewSet, basename='discovery')
router.register(r'discovery-assets', DiscoveryAssetViewSet, basename='discovery-asset')

urlpatterns = [
    path('', include(router.urls)),
    path('detect-asset-type/<str:asset_uid>/', DetectAssetTypeView.as_view(), name='detect_asset_type'),
    path('suggest-template/', SuggestTemplateView.as_view(), name='suggest-template'),  # <-- مسیر کوتاه‌تر
]
