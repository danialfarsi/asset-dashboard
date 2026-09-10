from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .viam_07_views import *

router = DefaultRouter()
router.register(r'committees', IAMCommitteeViewSet, basename='viam-committees')
router.register(r'meetings', IAMCommitteeMeetingViewSet, basename='viam-meetings')
router.register(r'resolutions', IAMResolutionViewSet, basename='viam-resolutions')
router.register(r'decision-logs', IAMDecisionLogViewSet, basename='viam-decision-logs')

urlpatterns = [
    path('', include(router.urls)),
]
