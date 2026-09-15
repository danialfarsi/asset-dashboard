from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LoginView, RefreshTokenView, LogoutView, MeView
from .views_department import DepartmentViewSet
from .views_organization import OrganizationViewSet
from .views_user import UserViewSet
from .views_register import (
    RegisterOrganizationView,
    ApproveOrganizationView,
    PendingOrganizationsView,
    GenerateInviteView,
    InviteInfoView,
    RegisterUserWithInviteView,
)

router = DefaultRouter()
router.register('departments', DepartmentViewSet, basename='department')
router.register('organizations', OrganizationViewSet, basename='organization')
router.register('users', UserViewSet, basename='user')

urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    path("token/refresh/", RefreshTokenView.as_view(), name="token-refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", MeView.as_view(), name="me"),

    # ثبت‌نام سازمان
    path("register-org/", RegisterOrganizationView.as_view(), name="register-org"),
    path("organizations/pending/", PendingOrganizationsView.as_view(), name="pending-orgs"),
    path("organizations/<int:pk>/approve/", ApproveOrganizationView.as_view(), name="approve-org"),

    # دعوت و ثبت‌نام کاربر
    path("departments/<int:pk>/generate-invite/", GenerateInviteView.as_view(), name="generate-invite"),
    path("invite/<str:token>/", InviteInfoView.as_view(), name="invite-info"),
    path("register-user/", RegisterUserWithInviteView.as_view(), name="register-user"),

    path("", include(router.urls)),
]
