from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .viam_04_views import *

router = DefaultRouter()
router.register(r'competency-frameworks', IAMCompetencyFrameworkViewSet, basename='viam-competency-frameworks')
router.register(r'competencies', IAMCompetencyViewSet, basename='viam-competencies')
router.register(r'training-programs', IAMTrainingProgramViewSet, basename='viam-training-programs')
router.register(r'enrollments', IAMTrainingEnrollmentViewSet, basename='viam-enrollments')

urlpatterns = [
    path('', include(router.urls)),
]
