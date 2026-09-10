
from django.urls import path, include
from .external_discovery_views import ExternalDiscoveryView
from .views_claim_assets import ClaimExternalAssetsView
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
from .valuation_sensitivity_views import SensitivityAnalysisViewSet
from .valuation_qc_views import QualityControlViewSet
from .graph_views import GraphViewSet
from .views_api_stats import APIStatsView
from .views_external_users import ExternalUsersView

# ⬇️⬇️⬇️ جدید: Dashboard Portfolio ⬇️⬇️⬇️
from .views_dashboard import DashboardPortfolioView

# STEP 4 - Protection
from .protection_views import ProtectionViewSet

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

# STEP 4 routers (Existing - Valuation Step4)
router.register(r'valuation-step4', ValuationStep4ViewSet, basename='valuation-step4')

# STEP 4 - Protection (NEW)
router.register(r'protection', ProtectionViewSet, basename='protection')

# Notification routers
router.register(r'notifications', NotificationViewSet, basename='notifications')

# Discovery routers
router.register(r'discovery', DiscoveryAssessmentViewSet, basename='discovery')
router.register(r'discovery-assets', DiscoveryAssetViewSet, basename='discovery-asset')
router.register(r'valuation-qc', QualityControlViewSet, basename='valuation-qc')

# Sensitivity routers (STEP 6)
router.register(r'sensitivity', SensitivityAnalysisViewSet, basename='sensitivity')

# Graph routers
router.register(r'graph', GraphViewSet, basename='graph')

urlpatterns = [
    path('external/discovery/', ExternalDiscoveryView.as_view(), name='external-discovery'),
    path('claim-external-assets/', ClaimExternalAssetsView.as_view(), name='claim-external-assets'),
    path('', include(router.urls)),
    path('detect-asset-type/<str:asset_uid>/', DetectAssetTypeView.as_view(), name='detect_asset_type'),
    path('suggest-template/', SuggestTemplateView.as_view(), name='suggest-template'),
    path('api-stats/', APIStatsView.as_view(), name='api-stats'),
    path('external-users/', ExternalUsersView.as_view(), name='external-users'),

    # ⬇️⬇️⬇️ جدید: Dashboard Portfolio ⬇️⬇️⬇️
    path('dashboard/portfolio/', DashboardPortfolioView.as_view(), name='dashboard-portfolio'),
]


# VIAM-01
from .iam_urls import urlpatterns as viam_urls
urlpatterns += [
    path('viam/', include(viam_urls)),
]

# Strategic Planning
from .strategic_planning_urls import urlpatterns as strategic_urls
urlpatterns += [
    path('strategic/', include(strategic_urls)),]


# VIAM-03: Awareness & Culture
from .viam_03_urls import urlpatterns as viam_03_urls
urlpatterns += [
    path('viam/awareness/', include(viam_03_urls)),]


# VIAM-04: Competency & Professional Development
from .viam.viam_04_urls import urlpatterns as viam_04_urls
urlpatterns += [
    path('viam/competency/', include(viam_04_urls)),
]

# VIAM-07: Committee & Decision Management
from .viam.viam_07_urls import urlpatterns as viam_07_urls
urlpatterns += [
    path('viam/committee/', include(viam_07_urls)),
]

# VIAM-08: Knowledge Extraction & Institutionalization
from .viam_08_urls import urlpatterns as viam_08_urls
urlpatterns += [
    path('viam/knowledge/', include(viam_08_urls)),
]

# VIAM-09: Risk, Protection & Compliance
from .viam_09_urls import urlpatterns as viam_09_urls
urlpatterns += [
    path('viam/risk/', include(viam_09_urls)),
]

# VIAM-10: Performance, Audit & Maturity
from .viam_10_urls import urlpatterns as viam_10_urls
urlpatterns += [
    path('viam/performance/', include(viam_10_urls)),
]

# VIAM-06: Workflow & Case Management
from .viam_06_urls import urlpatterns as viam_06_urls
urlpatterns += [
    path('viam/workflow/', include(viam_06_urls)),
]

# VIAM-05: Ownership, Roles & RACI
from .viam_05_urls import urlpatterns as viam_05_urls
urlpatterns += [
    path('viam/ownership/', include(viam_05_urls)),
]

# VIAM-11: Integration Hub - Connection to Meta Engines
from .viam_11_urls import urlpatterns as viam_11_urls
urlpatterns += [
    path('viam/integration/', include(viam_11_urls)),
]

# Engine 04: Development & Innovation
from .engine_04.urls import urlpatterns as engine_04_urls
urlpatterns += [
    path('engine/development/', include(engine_04_urls)),
]

# Business Types, Reports, Dashboards, KPIs
from .role_models import BusinessType
from .reporting_models import Report, Dashboard, KPI
from rest_framework import serializers, viewsets
from rest_framework.routers import DefaultRouter

# ========== Serializers ==========
class BusinessTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessType
        fields = '__all__'

class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = '__all__'

class DashboardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dashboard
        fields = '__all__'

class KPISerializer(serializers.ModelSerializer):
    class Meta:
        model = KPI
        fields = '__all__'

# ========== Views ==========
class BusinessTypeViewSet(viewsets.ModelViewSet):
    queryset = BusinessType.objects.all()
    serializer_class = BusinessTypeSerializer

class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer

class DashboardViewSet(viewsets.ModelViewSet):
    queryset = Dashboard.objects.all()
    serializer_class = DashboardSerializer

class KPIViewSet(viewsets.ModelViewSet):
    queryset = KPI.objects.all()
    serializer_class = KPISerializer

# ========== Router ==========
router = DefaultRouter()
router.register(r'business-types', BusinessTypeViewSet, basename='business-types')
router.register(r'reports', ReportViewSet, basename='reports')
router.register(r'dashboards', DashboardViewSet, basename='dashboards')
router.register(r'kpis', KPIViewSet, basename='kpis')

urlpatterns += router.urls
