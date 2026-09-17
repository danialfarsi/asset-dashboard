from rest_framework.routers import DefaultRouter
from .views import VIAMUploadedFileViewSet

router = DefaultRouter()
router.register(r'uploads', VIAMUploadedFileViewSet, basename='viam-upload')

urlpatterns = router.urls
