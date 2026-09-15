"""
🎯 OrganizationDepartmentFilterMixin
فیلتر خودکار بر اساس نقش کاربر:
- super_admin: همه چیز
- org_admin: فقط سازمان خودش
- org_user: فقط واحد خودش
"""

from django.db.models import Q


class OrganizationDepartmentFilterMixin:
    """
    فیلتر خودکار برای ViewSetها.
    
    استفاده:
        class MyViewSet(OrganizationDepartmentFilterMixin, viewsets.ModelViewSet):
            queryset = MyModel.objects.all()
            # نیاز به فیلدهای organization و department در مدل
    """
    
    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        
        # فیلدهایی که باید فیلتر بشن
        # (چون بعضی مدلها اسمشون فرق داره، اینجا قابل تنظیمه)
        org_field = getattr(self, 'organization_field', 'organization')
        dept_field = getattr(self, 'department_field', 'department')
        
        if user.role == 'super_admin':
            return queryset
        
        if user.role == 'org_admin':
            # اگه سازمان داره
            if user.organization_id:
                return queryset.filter(**{f'{org_field}_id': user.organization_id})
            return queryset.none()
        
        if user.role == 'org_user':
            # اولویت: واحد
            if user.department_id:
                # دارایی‌های واحد خودش + دارایی‌های خودش
                return queryset.filter(
                    Q(**{f'{dept_field}_id': user.department_id}) |
                    Q(created_by=user)
                ).distinct()
            # اگه واحد نداره، فقط خودش
            return queryset.filter(created_by=user)
        
        return queryset.none()
