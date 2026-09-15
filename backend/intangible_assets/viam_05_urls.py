from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .viam_05_views import *
from .operational_model_api import OperationalModelViewSet

router = DefaultRouter()
router.register(r'ownership', AssetOwnershipViewSet, basename='viam-ownership')
router.register(r'raci', RACICompleteViewSet, basename='viam-raci')
router.register(r'roles', RoleAssignmentViewSet, basename='viam-roles')
router.register(r'raci-template', RACITemplateViewSet, basename='viam-raci-template')

urlpatterns = [
    path('', include(router.urls)),
]
