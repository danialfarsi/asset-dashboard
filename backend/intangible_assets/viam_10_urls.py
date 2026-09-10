from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .viam_10_views import *

router = DefaultRouter()
router.register(r'maturity', MaturityLevelViewSet, basename='viam-maturity')
router.register(r'audits', AuditPlanViewSet, basename='viam-audits')
router.register(r'findings', AuditFindingViewSet, basename='viam-findings')
router.register(r'kpis', PerformanceKPIViewSet, basename='viam-kpis')
router.register(r'improvements', ImprovementPlanViewSet, basename='viam-improvements')

urlpatterns = [
    path('', include(router.urls)),
]
