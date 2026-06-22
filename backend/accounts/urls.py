from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LoginView, RefreshTokenView, LogoutView, MeView
from .views_department import DepartmentViewSet
from .views_organization import OrganizationViewSet
from .views_user import UserViewSet

router = DefaultRouter()
router.register('departments', DepartmentViewSet, basename='department')
router.register('organizations', OrganizationViewSet, basename='organization')
router.register('users', UserViewSet, basename='user')

urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    path("token/refresh/", RefreshTokenView.as_view(), name="token-refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", MeView.as_view(), name="me"),
    path("", include(router.urls)),
]
