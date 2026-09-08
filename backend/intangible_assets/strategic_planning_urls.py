from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .strategic_planning_views import (
    StrategicPlanViewSet, StrategicPriorityViewSet,
    RiskAssessmentViewSet, StrategicKPIViewSet
)

router = DefaultRouter()
router.register(r'strategic-plans', StrategicPlanViewSet, basename='strategic-plan')
router.register(r'strategic-priorities', StrategicPriorityViewSet, basename='strategic-priority')
router.register(r'strategic-risks', RiskAssessmentViewSet, basename='strategic-risk')
router.register(r'strategic-kpis', StrategicKPIViewSet, basename='strategic-kpi')

urlpatterns = [
    path('', include(router.urls)),
]
