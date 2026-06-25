from rest_framework.routers import DefaultRouter
from .views import (
    DiscoveryFormViewSet, ExpertInterviewViewSet, TacitKnowledgeFormViewSet,
    AssetListFormViewSet, ClassificationFormViewSet, HiddenAssetChecklistViewSet,
    PreliminaryEvaluationViewSet, IdentityAssessmentViewSet,
    OrganizationTypeViewSet, ScreeningTemplateViewSet, ScreenedAssetViewSet,
    AssetFileViewSet
)
from .valuation_views import (
    AssetTypeViewSet, ValuationDimensionViewSet,
    ValuationQuestionViewSet, AssetValuationViewSet
)

router = DefaultRouter()

# مرحله ۲: کشف و شناسایی
router.register('discovery-forms', DiscoveryFormViewSet, basename='discovery-form')
router.register('expert-interviews', ExpertInterviewViewSet, basename='expert-interview')
router.register('tacit-knowledge', TacitKnowledgeFormViewSet, basename='tacit-knowledge')
router.register('asset-lists', AssetListFormViewSet, basename='asset-list')
router.register('classifications', ClassificationFormViewSet, basename='classification')
router.register('hidden-checklists', HiddenAssetChecklistViewSet, basename='hidden-checklist')
router.register('preliminary-evaluations', PreliminaryEvaluationViewSet, basename='preliminary-evaluation')
router.register('identity-assessments', IdentityAssessmentViewSet, basename='identity-assessment')

# غربالگری
router.register('organization-types', OrganizationTypeViewSet, basename='organization-type')
router.register('screening-templates', ScreeningTemplateViewSet, basename='screening-template')
router.register('screened-assets', ScreenedAssetViewSet, basename='screened-asset')

# فایل‌های پیوست
router.register('asset-files', AssetFileViewSet, basename='asset-file')

# ============ مرحله ۳: ارزیابی ============
router.register('asset-types', AssetTypeViewSet, basename='asset-type')
router.register('valuation-dimensions', ValuationDimensionViewSet, basename='valuation-dimension')
router.register('valuation-questions', ValuationQuestionViewSet, basename='valuation-question')
router.register('asset-valuations', AssetValuationViewSet, basename='asset-valuation')

urlpatterns = router.urls
