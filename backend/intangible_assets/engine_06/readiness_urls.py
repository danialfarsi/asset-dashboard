"""
URLs گام ۱ — ارزیابی آمادگی V2
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from intangible_assets.engine_06.readiness_views import (
    AssetFamilyViewSet,
    ReadinessDimensionViewSet,
    LikertScaleViewSet,
    EvidenceFactorViewSet,
    ReadinessCriterionViewSet,
    ReadinessAssessmentV2ViewSet,
    RecommendationRuleViewSet,
    RoutingRuleViewSet,
    CriterionEvidenceViewSet,
)

router = DefaultRouter()
router.register("families", AssetFamilyViewSet, basename="asset-family")
router.register("dimensions", ReadinessDimensionViewSet, basename="readiness-dimension")
router.register("likert-scale", LikertScaleViewSet, basename="likert-scale")
router.register("evidence-factors", EvidenceFactorViewSet, basename="evidence-factor")
router.register("criteria", ReadinessCriterionViewSet, basename="readiness-criterion")
router.register("assessments", ReadinessAssessmentV2ViewSet, basename="readiness-assessment")
router.register("evidence", CriterionEvidenceViewSet, basename="criterion-evidence")
router.register("recommendation-rules", RecommendationRuleViewSet, basename="recommendation-rule")
router.register("routing-rules", RoutingRuleViewSet, basename="routing-rule")

urlpatterns = [
    path("", include(router.urls)),
]
