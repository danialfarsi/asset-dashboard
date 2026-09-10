from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .reporting_views import *

router = DefaultRouter()
router.register(r'business-types', BusinessTypeViewSet, basename='business-types')
router.register(r'reports', ReportViewSet, basename='reports')
router.register(r'dashboards', DashboardViewSet, basename='dashboards')
router.register(r'kpis', KPIViewSet, basename='kpis')

urlpatterns = [
    path('', include(router.urls)),
]
