"""
API پابلیک برای ثبت دارایی‌های RTO (بدون نیاز به لاگین)
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status

from .models import ScreeningTemplate, OrganizationType, ScreenedAsset
from .rto_models import RTOStudentInfo


class RTOScreeningPublicView(APIView):
    """
    GET: لیست قالب‌های RTO
    POST: ثبت دارایی جدید + اطلاعات دانشجو
    """
    permission_classes = [AllowAny]

    def get(self, request):
        rto = OrganizationType.objects.filter(display_name__icontains='پژوهش').first()
        if not rto:
            rto = OrganizationType.objects.filter(display_name__icontains='فناوری').first()
        if not rto:
            return Response({'error': 'نوع RTO تعریف نشده'}, status=status.HTTP_404_NOT_FOUND)

        templates = ScreeningTemplate.objects.filter(organization_type=rto, is_active=True)
        data = [{
            'id': t.id,
            'name': t.item_name,
            'asset_type_code': t.asset_type.code if t.asset_type else None,
            'asset_type_name': t.asset_type.name if t.asset_type else None,
            'valuation_method': t.valuation_method,
        } for t in templates]

        return Response({'rto_id': rto.id, 'count': len(data), 'templates': data})

    def post(self, request):
        template_id = request.data.get('template_id')
        asset_name = request.data.get('asset_name', '').strip()
        student_name = request.data.get('student_name', '').strip()
        student_family = request.data.get('student_family', '').strip()
        student_id = request.data.get('student_id', '').strip()
        student_phone = request.data.get('student_phone', '').strip()
        student_email = request.data.get('student_email', '').strip()

        # اعتبارسنجی
        errors = {}
        if not template_id:
            errors['template_id'] = 'قالب الزامی است'
        if not asset_name:
            errors['asset_name'] = 'نام دارایی الزامی است'
        if not student_name:
            errors['student_name'] = 'نام الزامی است'
        if not student_family:
            errors['student_family'] = 'نام خانوادگی الزامی است'
        if not student_id:
            errors['student_id'] = 'شماره دانشجویی الزامی است'
        if not student_phone:
            errors['student_phone'] = 'شماره تماس الزامی است'
        if not student_email:
            errors['student_email'] = 'ایمیل الزامی است'
        elif '@' not in student_email:
            errors['student_email'] = 'ایمیل معتبر نیست'

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            template = ScreeningTemplate.objects.get(id=template_id)
        except ScreeningTemplate.DoesNotExist:
            return Response({'error': 'قالب یافت نشد'}, status=status.HTTP_404_NOT_FOUND)

        # 🔥 گرفتن کاربر سیستمی RTO
        from django.contrib.auth import get_user_model
        User = get_user_model()
        system_user, _ = User.objects.get_or_create(
            email='rto-system@localhost',
            defaults={
                'username': 'rto-system',
                'first_name': 'RTO',
                'last_name': 'System',
                'role': 'org_user',
            }
        )

        # ۱. ساخت دارایی با created_by=rto-system
        asset = ScreenedAsset.objects.create(
            asset_name=asset_name,
            asset_type=template.asset_type,
            valuation_method=template.valuation_method,
            category='operational_knowledge',
            result='confirmed',
            description='',
            created_by=system_user,  # 🔥 کاربر سیستمی
        )

        # ۲. ذخیره اطلاعات دانشجو در جدول جداگانه
        student = RTOStudentInfo.objects.create(
            asset=asset,
            student_name=student_name,
            student_family=student_family,
            student_id=student_id,
            student_phone=student_phone,
            student_email=student_email,
        )

        return Response({
            'asset_id': asset.id,
            'student_info_id': student.id,
            'message': 'دارایی با موفقیت ثبت شد.',
            'valuation_url': f'/dashboard/intangible/valuation/{asset.id}',
        }, status=status.HTTP_201_CREATED)


class RTOStudentListView(APIView):
    """
    GET: لیست اطلاعات دانشجویان (فقط admin)
    """
    permission_classes = []  # بعداً می‌شه محدود به super_admin کرد

    def get(self, request):
        students = RTOStudentInfo.objects.select_related('asset').order_by('-created_at')
        data = [{
            'id': s.id,
            'asset_id': s.asset_id,
            'asset_name': s.asset.asset_name,
            'student_name': s.student_name,
            'student_family': s.student_family,
            'student_id': s.student_id,
            'student_phone': s.student_phone,
            'student_email': s.student_email,
            'created_at': s.created_at,
        } for s in students]
        return Response({'count': len(data), 'results': data})
