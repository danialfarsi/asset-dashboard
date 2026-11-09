"""
URLs موتور ۶ — تجاری‌سازی
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from intangible_assets.engine_06.business_model_views import BusinessModelSelectionViewSet
from intangible_assets.engine_06.views import (
    PartnerViewSet,
    CommercializationCaseViewSet,
    ReadinessAssessmentViewSet,
    PartnerShortlistViewSet,
    CommercializationContractViewSet,
    PaymentScheduleViewSet,
    RevenueRecordViewSet,
    CommercializationDashboardView,
)

router = DefaultRouter()
router.register("partners", PartnerViewSet, basename="partner")
router.register("cases", CommercializationCaseViewSet, basename="case")
router.register("readiness", ReadinessAssessmentViewSet, basename="readiness")
router.register("business-models", BusinessModelSelectionViewSet, basename="business-model")
router.register("shortlists", PartnerShortlistViewSet, basename="shortlist")
router.register("contracts", CommercializationContractViewSet, basename="contract")
router.register("payment-schedules", PaymentScheduleViewSet, basename="payment-schedule")
router.register("revenue", RevenueRecordViewSet, basename="revenue")
router.register("dashboard", CommercializationDashboardView, basename="dashboard")

urlpatterns = [
    path("", include(router.urls)),
    path("readiness-v2/", include("intangible_assets.engine_06.readiness_urls")),
]
