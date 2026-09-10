from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .viam_08_views import *

router = DefaultRouter()
router.register(r'knowledge-extractions', KnowledgeExtractionViewSet, basename='viam-knowledge')
router.register(r'lessons-learned', LessonsLearnedViewSet, basename='viam-lessons')
router.register(r'transfers', KnowledgeTransferViewSet, basename='viam-transfers')

urlpatterns = [
    path('', include(router.urls)),
]
