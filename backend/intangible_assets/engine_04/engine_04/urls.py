from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register(r'projects', DevelopmentProjectViewSet, basename='engine-projects')
router.register(r'innovation', InnovationPipelineViewSet, basename='engine-innovation')
router.register(r'knowledge-conversion', KnowledgeConversionViewSet, basename='engine-knowledge-conversion')

urlpatterns = [
    path('', include(router.urls)),
]
