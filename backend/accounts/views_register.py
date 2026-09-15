"""
APIهای ثبتنام سازمان و کاربران
"""
import uuid
from django.utils import timezone
from django.db import transaction
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, Organization, Department


class RegisterOrganizationView(APIView):
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        data = request.data
        email = data.get("email", "").strip().lower()
        username = data.get("username", "").strip()
        password = data.get("password", "")
        first_name = data.get("first_name", "").strip()
        last_name = data.get("last_name", "").strip()
        org_name = data.get("organization_name", "").strip()
        org_code = data.get("organization_code", "").strip().upper()

        if not email or not username or not password:
            return Response({"error": "ایمیل، نام کاربری و رمز عبور الزامی است"}, status=status.HTTP_400_BAD_REQUEST)
        if not org_name:
            return Response({"error": "نام سازمان الزامی است"}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email=email).exists():
            return Response({"error": "این ایمیل قبلاً ثبت شده است"}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(username=username).exists():
            return Response({"error": "این نام کاربری قبلاً ثبت شده است"}, status=status.HTTP_400_BAD_REQUEST)

        if not org_code:
            year = timezone.now().year
            last_org = Organization.objects.order_by("-id").first()
            next_num = (last_org.id + 1) if last_org else 1
            org_code = f"ORG-{year}-{next_num:04d}"

        if Organization.objects.filter(code=org_code).exists():
            return Response({"error": f"کد سازمان {org_code} قبلاً استفاده شده است"}, status=status.HTTP_400_BAD_REQUEST)

        organization = Organization.objects.create(name=org_name, code=org_code, status="pending")

        user = User.objects.create_user(
            email=email, username=username, password=password,
            first_name=first_name, last_name=last_name,
            role="org_admin", organization=organization,
        )

        refresh = RefreshToken.for_user(user)

        return Response({
            "user": {
                "id": user.id, "email": user.email, "username": user.username,
                "first_name": user.first_name, "last_name": user.last_name,
                "role": user.role,
                "organization_id": organization.id,
                "organization_name": organization.name,
                "organization_code": organization.code,
                "organization_status": organization.status,
            },
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }, status=status.HTTP_201_CREATED)


class ApproveOrganizationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        user = request.user
        if user.role != "super_admin":
            return Response({"error": "فقط super_admin می‌تواند تأیید کند"}, status=status.HTTP_403_FORBIDDEN)

        try:
            organization = Organization.objects.get(id=pk)
        except Organization.DoesNotExist:
            return Response({"error": "سازمان یافت نشد"}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get("action", "approve")
        new_code = request.data.get("code", "").strip().upper()

        if action == "reject":
            organization.status = "rejected"
            organization.approved_by = user
            organization.approved_at = timezone.now()
            organization.save()
            return Response({"message": "سازمان رد شد", "status": "rejected"})

        if new_code and new_code != organization.code:
            if Organization.objects.filter(code=new_code).exists():
                return Response({"error": f"کد {new_code} قبلاً استفاده شده است"}, status=status.HTTP_400_BAD_REQUEST)
            organization.code = new_code

        organization.status = "active"
        organization.approved_by = user
        organization.approved_at = timezone.now()
        organization.save()

        Department.objects.filter(organization=organization).update(status="active")

        return Response({
            "message": "سازمان تأیید شد",
            "organization": {
                "id": organization.id, "name": organization.name,
                "code": organization.code, "status": organization.status,
                "approved_at": organization.approved_at,
            }
        })


class PendingOrganizationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != "super_admin":
            return Response({"error": "دسترسی ندارید"}, status=status.HTTP_403_FORBIDDEN)

        organizations = Organization.objects.filter(status="pending").order_by("-created_at")

        result = []
        for org in organizations:
            admin = User.objects.filter(organization=org, role="org_admin").first()
            departments = list(org.departments.values("id", "name", "code"))
            result.append({
                "id": org.id, "name": org.name, "code": org.code,
                "status": org.status, "created_at": org.created_at,
                "admin": {
                    "id": admin.id,
                    "name": f"{admin.first_name} {admin.last_name}".strip() or admin.username,
                    "email": admin.email,
                } if admin else None,
                "departments_count": len(departments),
                "departments": departments,
            })

        return Response({"organizations": result, "count": len(result)})


class GenerateInviteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        user = request.user

        try:
            department = Department.objects.get(id=pk)
        except Department.DoesNotExist:
            return Response({"error": "واحد یافت نشد"}, status=status.HTTP_404_NOT_FOUND)

        if user.role == 'org_admin':
            if department.organization_id != user.organization_id:
                return Response({"error": "دسترسی ندارید"}, status=status.HTTP_403_FORBIDDEN)
        elif user.role != 'super_admin':
            return Response({"error": "دسترسی ندارید"}, status=status.HTTP_403_FORBIDDEN)

        if department.invite_used:
            return Response({"error": "این دعوت قبلاً استفاده شده است"}, status=status.HTTP_400_BAD_REQUEST)

        if not department.invite_token:
            department.invite_token = uuid.uuid4().hex
            department.invite_created_at = timezone.now()
            department.save()

        invite_url = f"{request.scheme}://{request.get_host()}/invite/{department.invite_token}"

        return Response({
            "department_id": department.id,
            "department_name": department.name,
            "invite_token": department.invite_token,
            "invite_url": invite_url,
            "invite_used": department.invite_used,
            "created_at": department.invite_created_at,
        })


class InviteInfoView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, token):
        try:
            department = Department.objects.get(invite_token=token)
        except Department.DoesNotExist:
            return Response({"error": "دعوت نامعتبر است"}, status=status.HTTP_404_NOT_FOUND)

        if department.invite_used:
            return Response({"error": "این دعوت قبلاً استفاده شده است"}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "department_id": department.id,
            "department_name": department.name,
            "organization_id": department.organization.id,
            "organization_name": department.organization.name,
            "organization_code": department.organization.code,
        })


class RegisterUserWithInviteView(APIView):
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        data = request.data
        invite_token = data.get("invite_token", "").strip()
        email = data.get("email", "").strip().lower()
        username = data.get("username", "").strip()
        password = data.get("password", "")
        first_name = data.get("first_name", "").strip()
        last_name = data.get("last_name", "").strip()

        if not invite_token:
            return Response({"error": "توکن دعوت الزامی است"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            department = Department.objects.get(invite_token=invite_token)
        except Department.DoesNotExist:
            return Response({"error": "دعوت نامعتبر است"}, status=status.HTTP_404_NOT_FOUND)

        if department.invite_used:
            return Response({"error": "این دعوت قبلاً استفاده شده است"}, status=status.HTTP_400_BAD_REQUEST)

        if not email or not username or not password:
            return Response({"error": "ایمیل، نام کاربری و رمز عبور الزامی است"}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({"error": "این ایمیل قبلاً ثبت شده است"}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({"error": "این نام کاربری قبلاً ثبت شده است"}, status=status.HTTP_400_BAD_REQUEST)

        # 🎯 organization_type رو از org_admin سازمان بگیر
        org_admin = User.objects.filter(
            organization=department.organization,
            role='org_admin'
        ).first()
        
        user = User.objects.create_user(
            email=email, username=username, password=password,
            first_name=first_name, last_name=last_name,
            role="org_user",
            organization=department.organization,
            department=department,
            organization_type=org_admin.organization_type if org_admin else None,
        )

        department.invite_used = True
        department.save()

        refresh = RefreshToken.for_user(user)

        return Response({
            "user": {
                "id": user.id, "email": user.email, "username": user.username,
                "first_name": user.first_name, "last_name": user.last_name,
                "role": user.role,
                "organization_id": user.organization.id,
                "organization_name": user.organization.name,
                "department_id": user.department.id,
                "department_name": user.department.name,
            },
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }, status=status.HTTP_201_CREATED)
