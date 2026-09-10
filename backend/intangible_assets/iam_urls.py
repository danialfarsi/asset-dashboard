from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .viam_views import *

router = DefaultRouter()
router.register(r'establishment-requests', EstablishmentRequestViewSet, basename='establishmentrequest')
router.register(r'charters', IAMCharterViewSet, basename='iamcharter')
router.register(r'representatives', IAMRepresentativeViewSet, basename='iamrepresentative')
router.register(r'raci', RACIMatrixViewSet, basename='racimatrix')
router.register(r'operational-models', OperationalModelViewSet, basename='operationalmodel')
router.register(r'pilots', VIAMPilotViewSet, basename='viampilot')

urlpatterns = [
    path('', include(router.urls)),
]
