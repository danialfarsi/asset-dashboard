from rest_framework.routers import DefaultRouter
from .views import AssetViewSet, AssetCategoryViewSet, AssetLocationViewSet

router = DefaultRouter()
router.register('assets', AssetViewSet, basename='asset')
router.register('categories', AssetCategoryViewSet, basename='category')
router.register('locations', AssetLocationViewSet, basename='location')

urlpatterns = router.urls
