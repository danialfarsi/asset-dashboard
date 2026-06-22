from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status


class LoginView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            access = response.data.get('access')
            refresh = response.data.get('refresh')
            response.set_cookie(
                'access_token',
                access,
                httponly=False,
                samesite='Lax',
                secure=False,
                max_age=60 * 5,
            )
            response.set_cookie(
                'refresh_token',
                refresh,
                httponly=True,
                samesite='Lax',
                secure=False,
                max_age=60 * 60 * 24,
            )
        return response


class RefreshTokenView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            access = response.data.get('access')
            response.set_cookie(
                'access_token',
                access,
                httponly=False,
                samesite='Lax',
                secure=False,
                max_age=60 * 5,
            )
        return response


class LogoutView(APIView):
    def post(self, request):
        response = Response({"detail": "Logged out."}, status=status.HTTP_205_RESET_CONTENT)
        response.delete_cookie('access_token')
        response.delete_cookie('refresh_token')
        return response


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
            "organization_id": user.organization_id if hasattr(user, 'organization_id') else None,
            "organization_name": user.organization.name if user.organization else None,
            "department_id": user.department_id if hasattr(user, 'department_id') else None,
            "department_name": user.department.name if user.department else None,
            "is_active": user.is_active,
        })
