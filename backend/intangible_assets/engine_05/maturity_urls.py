"""
🎯 URLs بلوغ IAMS
مسیر: engine_05/maturity_urls.py
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .maturity_views import (
    MaturityComponentViewSet,
    MaturityQuestionViewSet,
    MaturityWeightProfileViewSet,
    MaturityAssessmentViewSet,
)

router = DefaultRouter()
router.register(r'components', MaturityComponentViewSet, basename='maturity-component')
router.register(r'questions', MaturityQuestionViewSet, basename='maturity-question')
router.register(r'profiles', MaturityWeightProfileViewSet, basename='maturity-profile')
router.register(r'assessments', MaturityAssessmentViewSet, basename='maturity-assessment')

urlpatterns = router.urls
