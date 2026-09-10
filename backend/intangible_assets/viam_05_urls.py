from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .viam_05_views import *

router = DefaultRouter()
router.register(r'ownership', AssetOwnershipViewSet, basename='viam-ownership')
router.register(r'raci', RACICompleteViewSet, basename='viam-raci')
router.register(r'roles', RoleAssignmentViewSet, basename='viam-roles')

urlpatterns = [
    path('', include(router.urls)),
]
