from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .strategic_planning_views import *

router = DefaultRouter()
router.register(r'plans', StrategicPlanViewSet)
router.register(r'initiatives', StrategicInitiativeViewSet)
router.register(r'policies', IAMPolicyViewSet)
router.register(r'asset-mappings', StrategicAssetMappingViewSet)

urlpatterns = [path('', include(router.urls))]
