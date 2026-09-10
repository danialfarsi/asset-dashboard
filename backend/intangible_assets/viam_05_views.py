from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .viam_05_models import *
from .viam_05_serializers import *


class AssetOwnershipViewSet(viewsets.ModelViewSet):
    queryset = AssetOwnership.objects.all()
    serializer_class = AssetOwnershipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return AssetOwnership.objects.all()
        return AssetOwnership.objects.filter(organization=user.organization)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def transfer(self, request, pk=None):
        """انتقال مالکیت به شخص دیگر"""
        ownership = self.get_object()
        new_owner_id = request.data.get('new_owner_id')
        if not new_owner_id:
            return Response({'error': 'new_owner_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # بستن مالکیت قبلی
        ownership.is_active = False
        ownership.ownership_end_date = timezone.now().date()
        ownership.save()
        
        # ایجاد مالکیت جدید
        new_ownership = AssetOwnership.objects.create(
            asset=ownership.asset,
            asset_name=ownership.asset_name,
            organization=ownership.organization,
            organizational_owner_id=new_owner_id,
            legal_owner=ownership.legal_owner,
            custodian=ownership.custodian,
            iam_coordinator=ownership.iam_coordinator,
            created_by=request.user,
            notes=f"انتقال از {ownership.organizational_owner.get_full_name()}"
        )
        
        return Response(AssetOwnershipSerializer(new_ownership).data)


class RACICompleteViewSet(viewsets.ModelViewSet):
    queryset = RACIComplete.objects.all()
    serializer_class = RACICompleteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return RACIComplete.objects.all()
        return RACIComplete.objects.filter(organization=user.organization)

    @action(detail=True, methods=['post'])
    def preview(self, request, pk=None):
        """دریافت خلاصه RACI برای یک دارایی"""
        raci = self.get_object()
        return Response({
            'asset': raci.asset_name,
            'activity': raci.get_activity_display(),
            'responsibilities': {
                'super_admin': raci.get_super_admin_responsibility_display(),
                'org_admin': raci.get_org_admin_responsibility_display(),
                'org_user': raci.get_org_user_responsibility_display(),
            }
        })


class RoleAssignmentViewSet(viewsets.ModelViewSet):
    queryset = RoleAssignment.objects.all()
    serializer_class = RoleAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return RoleAssignment.objects.all()
        return RoleAssignment.objects.filter(organization=user.organization)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """تأیید انتصاب نقش"""
        assignment = self.get_object()
        if request.user.role in ['super_admin', 'org_admin']:
            assignment.is_active = True
            assignment.approved_by = request.user
            assignment.approved_date = timezone.now()
            assignment.save()
            return Response({
                'is_active': assignment.is_active,
                'approved_by': request.user.get_full_name(),
                'approved_date': assignment.approved_date
            })
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=True, methods=['post'])
    def revoke(self, request, pk=None):
        """لغو انتصاب نقش"""
        assignment = self.get_object()
        if request.user.role in ['super_admin', 'org_admin']:
            assignment.is_active = False
            assignment.expiry_date = timezone.now().date()
            assignment.save()
            return Response({'is_active': False, 'expiry_date': assignment.expiry_date})
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
