from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .protection_views import ProtectionViewSet

router = DefaultRouter()
router.register(r'protection', ProtectionViewSet, basename='protection')

urlpatterns = [
    path('', include(router.urls)),
]
