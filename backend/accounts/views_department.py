from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Department
from .serializers import DepartmentSerializer


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        
        if user.role == 'super_admin':
            return queryset
        elif user.role == 'org_admin':
            return queryset.filter(organization=user.organization)
        else:
            return queryset.filter(id=user.department_id) if user.department else queryset.none()

    def perform_create(self, serializer):
        """هنگام ساخت، organization رو خودکار ست کن"""
        user = self.request.user
        
        # فقط org_admin و super_admin می‌تونن واحد بسازن
        if user.role not in ['org_admin', 'super_admin']:
            raise permissions.PermissionDenied('فقط مدیرعامل می‌تواند واحد بسازد')
        
        # org_admin: organization خودکار
        if user.role == 'org_admin':
            if not user.organization:
                raise permissions.PermissionDenied('کاربر به سازمانی متصل نیست')
            serializer.save(
                organization=user.organization,
                status='pending',
            )
        # super_admin: از request
        else:
            org_id = self.request.data.get('organization_id')
            if org_id:
                from .models import Organization
                try:
                    org = Organization.objects.get(id=org_id)
                    serializer.save(organization=org, status='pending')
                except Organization.DoesNotExist:
                    raise permissions.PermissionDenied('سازمان یافت نشد')
            else:
                serializer.save(status='pending')

    def perform_destroy(self, instance):
        """چک کن کاربر مجاز به حذف هست"""
        user = self.request.user
        
        if user.role == 'super_admin':
            instance.delete()
            return
        
        if user.role == 'org_admin':
            if instance.organization_id != user.organization_id:
                raise permissions.PermissionDenied('دسترسی ندارید')
            if instance.invite_used:
                raise permissions.PermissionDenied('این واحد مدیر دارد و قابل حذف نیست')
            instance.delete()
            return
        
        raise permissions.PermissionDenied('دسترسی ندارید')

    @action(detail=False, methods=['get'])
    def my(self, request):
        """لیست واحدهای سازمان کاربر با اطلاعات مدیر"""
        from .models import User
        user = request.user
        
        if not user.organization:
            return Response({'departments': [], 'count': 0})
        
        depts = Department.objects.filter(
            organization=user.organization
        ).order_by('id')
        
        result = []
        for dept in depts:
            manager = User.objects.filter(
                department=dept,
                role='org_user'
            ).first()
            
            result.append({
                'id': dept.id,
                'name': dept.name,
                'code': dept.code,
                'status': dept.status,
                'status_display': dept.get_status_display(),
                'invite_token': dept.invite_token,
                'invite_used': dept.invite_used,
                'invite_created_at': dept.invite_created_at,
                'manager': {
                    'id': manager.id,
                    'name': f"{manager.first_name} {manager.last_name}".strip() or manager.username,
                    'email': manager.email,
                    'username': manager.username,
                } if manager else None,
            })
        
        return Response({
            'departments': result,
            'count': len(result),
        })

    @action(detail=False, methods=['get'])
    def my(self, request):
        """لیست واحدهای سازمان کاربر با اطلاعات مدیر"""
        from .models import User
        user = request.user
        
        if not user.organization:
            return Response({'departments': [], 'count': 0})
        
        depts = Department.objects.filter(
            organization=user.organization
        ).order_by('id')
        
        result = []
        for dept in depts:
            # مدیر این واحد (اگه ثبت‌نام کرده)
            manager = User.objects.filter(
                department=dept,
                role='org_user'
            ).first()
            
            result.append({
                'id': dept.id,
                'name': dept.name,
                'code': dept.code,
                'status': dept.status,
                'status_display': dept.get_status_display(),
                'invite_token': dept.invite_token,
                'invite_used': dept.invite_used,
                'invite_created_at': dept.invite_created_at,
                'manager': {
                    'id': manager.id,
                    'name': f"{manager.first_name} {manager.last_name}".strip() or manager.username,
                    'email': manager.email,
                    'username': manager.username,
                } if manager else None,
            })
        
        return Response({
            'departments': result,
            'count': len(result),
        })
