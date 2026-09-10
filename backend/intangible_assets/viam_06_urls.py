from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .viam_06_views import *

router = DefaultRouter()
router.register(r'workflows', AssetWorkflowViewSet, basename='viam-workflows')
router.register(r'cases', AssetCaseViewSet, basename='viam-cases')

urlpatterns = [
    path('', include(router.urls)),
]
