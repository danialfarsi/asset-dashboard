from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .viam_03_views import *

router = DefaultRouter()
router.register(r'campaigns', AwarenessCampaignViewSet, basename='viam-campaigns')
router.register(r'executive-awareness', ExecutiveAwarenessViewSet, basename='viam-executive')
router.register(r'middle-awareness', MiddleManagementAwarenessViewSet, basename='viam-middle')
router.register(r'employee-culture', GeneralEmployeeCultureViewSet, basename='viam-employee')
router.register(r'contents', AwarenessContentViewSet, basename='viam-contents')

urlpatterns = [
    path('', include(router.urls)),
]
