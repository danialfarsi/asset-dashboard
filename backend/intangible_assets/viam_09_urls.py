from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .viam_09_views import *

router = DefaultRouter()
router.register(r'risks', AssetRiskAssessmentViewSet, basename='viam-risks')
router.register(r'checklists', ComplianceChecklistViewSet, basename='viam-checklists')
router.register(r'capa', CAPAViewSet, basename='viam-capa')

urlpatterns = [
    path('', include(router.urls)),
]
