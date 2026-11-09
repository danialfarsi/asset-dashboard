"""
API پابلیک برای RTO — ثبت‌نام دانشجو + افزودن دارایی + ارزیابی
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status

from .models import ScreeningTemplate, OrganizationType, ScreenedAsset
from .rto_models import RTOStudent, RTOStudentInfo
from .valuation_models import ValuationCase, AssetValuation, ValuationQuestion, ValuationAnswer


def get_student_from_token(request):
    token = request.headers.get('X-Student-Token') or request.query_params.get('token')
    if not token:
        return None
    return RTOStudent.objects.filter(access_token=token).first()


class RTOStudentAuthView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        required = ['student_name', 'student_family', 'student_id', 'student_phone', 'student_email']
        for field in required:
            if not data.get(field):
                return Response({field: 'این فیلد الزامی است'}, status=400)

        if RTOStudent.objects.filter(student_id=data['student_id']).exists():
            return Response({'student_id': 'این شماره دانشجویی قبلاً ثبت شده'}, status=400)
        
        if RTOStudent.objects.filter(student_email=data['student_email']).exists():
            return Response({'student_email': 'این ایمیل قبلاً ثبت شده'}, status=400)

        student = RTOStudent.objects.create(
            student_name=data['student_name'].strip(),
            student_family=data['student_family'].strip(),
            student_id=data['student_id'].strip(),
            student_phone=data['student_phone'].strip(),
            student_email=data['student_email'].strip(),
        )

        return Response({
            'message': 'ثبت‌نام با موفقیت انجام شد',
            'access_token': student.access_token,
            'student': {
                'id': student.id,
                'name': student.student_name,
                'family': student.student_family,
                'student_id': student.student_id,
                'phone': student.student_phone,
                'email': student.student_email,
            }
        }, status=201)

    def get(self, request):
        student = get_student_from_token(request)
        if not student:
            return Response({'error': 'توکن نامعتبر است'}, status=401)
        
        return Response({
            'id': student.id,
            'name': student.student_name,
            'family': student.student_family,
            'student_id': student.student_id,
            'phone': student.student_phone,
            'email': student.student_email,
        })


class RTOStudentDashboardView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        student = get_student_from_token(request)
        if not student:
            return Response({'error': 'توکن نامعتبر است'}, status=401)

        assets = RTOStudentInfo.objects.filter(student=student).select_related('asset')
        
        results = []
        for info in assets:
            asset = info.asset
            valuation = AssetValuation.objects.filter(asset=asset, status='completed').first()
            final_score = float(valuation.final_score or 0) if valuation else 0
            
            results.append({
                'asset_id': asset.id,
                'asset_name': asset.asset_name,
                'asset_type': asset.asset_type.name if asset.asset_type else None,
                'created_at': info.created_at,
                'final_score': final_score,
                'has_valuation': valuation is not None,
            })

        return Response({
            'student': {
                'name': student.student_name,
                'family': student.student_family,
                'student_id': student.student_id,
            },
            'assets': results,
            'count': len(results),
        })


class RTOScreeningPublicView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        rto = OrganizationType.objects.filter(display_name__icontains='پژوهش').first()
        if not rto:
            rto = OrganizationType.objects.filter(display_name__icontains='فناوری').first()
        if not rto:
            return Response({'error': 'نوع RTO تعریف نشده'}, status=404)

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
        student = get_student_from_token(request)
        if not student:
            return Response({'error': 'لطفاً ابتدا ثبت‌نام کنید'}, status=401)

        template_id = request.data.get('template_id')
        asset_name = request.data.get('asset_name', '').strip()

        if not template_id:
            return Response({'template_id': 'قالب الزامی است'}, status=400)
        if not asset_name:
            return Response({'asset_name': 'نام دارایی الزامی است'}, status=400)

        try:
            template = ScreeningTemplate.objects.get(id=template_id)
        except ScreeningTemplate.DoesNotExist:
            return Response({'error': 'قالب یافت نشد'}, status=404)

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

        asset = ScreenedAsset.objects.create(
            asset_name=asset_name,
            asset_type=template.asset_type,
            valuation_method=template.valuation_method,
            category='operational_knowledge',
            result='confirmed',
            description='',
            created_by=system_user,
        )

        RTOStudentInfo.objects.create(
            student=student,
            asset=asset,
        )

        return Response({
            'asset_id': asset.id,
            'message': 'دارایی با موفقیت ثبت شد.',
            'valuation_url': f'/public/rto-valuation/{asset.id}?token={student.access_token}',
        }, status=201)
