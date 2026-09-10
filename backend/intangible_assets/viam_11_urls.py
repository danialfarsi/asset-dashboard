from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .viam_11_views import *

router = DefaultRouter()
router.register(r'connections', EngineConnectionViewSet, basename='viam-connections')
router.register(r'logs', EngineIntegrationLogViewSet, basename='viam-logs')

urlpatterns = [
    path('', include(router.urls)),
]
