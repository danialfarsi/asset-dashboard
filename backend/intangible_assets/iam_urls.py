from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .iam_views import (
    IAMRoleViewSet, IAMUserProfileViewSet, 
    IAMCommitteeViewSet, IAMCommitteeMeetingViewSet,
    IAMResolutionViewSet
)

router = DefaultRouter()
router.register(r'iam-roles', IAMRoleViewSet, basename='iam-role')
router.register(r'iam-profiles', IAMUserProfileViewSet, basename='iam-profile')
router.register(r'iam-committees', IAMCommitteeViewSet, basename='iam-committee')
router.register(r'iam-meetings', IAMCommitteeMeetingViewSet, basename='iam-meeting')
router.register(r'iam-resolutions', IAMResolutionViewSet, basename='iam-resolution')

urlpatterns = [
    path('', include(router.urls)),
]
