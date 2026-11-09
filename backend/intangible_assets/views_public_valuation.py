"""
API پابلیک برای ارزیابی دارایی‌های RTO (بدون لاگین)
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status

from .models import ScreenedAsset
from .valuation_models import ValuationCase, AssetValuation, ValuationQuestion, ValuationAnswer
from .rto_models import RTOStudentInfo


class PublicValuationQuestionsView(APIView):
    """GET: لیست سوالات ارزیابی برای یک دارایی"""
    permission_classes = [AllowAny]

    def get(self, request, asset_id):
        try:
            asset = ScreenedAsset.objects.get(id=asset_id)
        except ScreenedAsset.DoesNotExist:
            return Response({'error': 'دارایی یافت نشد'}, status=404)

        questions = ValuationQuestion.objects.filter(
            asset_type=asset.asset_type
        ).order_by('dimension__name', 'order')[:50]

        data = [{
            'id': q.id,
            'text': q.question_text,
            'dimension': q.dimension.name if q.dimension else 'general',
            'hint': q.hint or '',
        } for q in questions]

        return Response({
            'asset_id': asset_id,
            'asset_name': asset.asset_name,
            'total_questions': len(data),
            'questions': data,
        })


class PublicValuationSubmitView(APIView):
    """POST: ذخیره پاسخ‌های ارزیابی + آپلود شاهد"""
    permission_classes = [AllowAny]
    from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request, asset_id):
        try:
            asset = ScreenedAsset.objects.get(id=asset_id)
        except ScreenedAsset.DoesNotExist:
            return Response({'error': 'دارایی یافت نشد'}, status=404)

        # پذیرش responses یا از JSON یا از FormData (فرمت رشته)
        import json as json_module
        responses_raw = request.data.get('responses', '[]')
        if isinstance(responses_raw, str):
            try:
                responses = json_module.loads(responses_raw)
            except Exception:
                responses = []
        else:
            responses = responses_raw
        
        if not responses:
            return Response({'error': 'پاسخ‌ها خالی است'}, status=400)

        # 🔥 گرفتن کاربر سیستمی RTO (قبل از استفاده)
        from django.contrib.auth import get_user_model
        User = get_user_model()
        system_user = User.objects.filter(email='rto-system@localhost').first()
        if not system_user:
            system_user = User.objects.create_user(
                email='rto-system@localhost',
                username='rto-system',
                password='!system-secret-not-for-login-2026!',
                first_name='RTO',
                last_name='System',
                role='org_user',
            )

        # ایجاد/گرفتن ValuationCase
        case, _ = ValuationCase.objects.get_or_create(
            asset=asset,
            defaults={
                'category': 'operational',
                'business_unit': 'RTO Public',
                'status': 'in_progress',
                'valuation_method': asset.valuation_method or 'M-05',
                'created_by': system_user,
            }
        )
        case.status = 'completed'
        case.save()

        # ایجاد/گرفتن AssetValuation
        valuation, _ = AssetValuation.objects.get_or_create(
            asset=asset,
            defaults={
                'asset_type': asset.asset_type,
                'status': 'completed',
                'evaluated_by': system_user,
            }
        )
        valuation.status = 'completed'
        valuation.save()

        # ذخیره پاسخ‌ها
        created = 0
        for r in responses:
            qid = r.get('question_id')
            score = r.get('score', 0)
            if not qid:
                continue
            try:
                q = ValuationQuestion.objects.get(id=qid)
            except ValuationQuestion.DoesNotExist:
                continue

            answer, _ = ValuationAnswer.objects.update_or_create(
                valuation=valuation,
                question=q,
                defaults={
                    'question_code': q.code or str(q.id),
                    'selected_option': r.get('option', ''),
                    'score': score,
                    'evidence': r.get('evidence', ''),
                }
            )
            
            # 🔥 آپلود فایل شاهد (اگه بود)
            file_key = f'file_{qid}'
            if file_key in request.FILES:
                file = request.FILES[file_key]
                answer.evidence_document.save(file.name, file, save=True)
            
            created += 1

        return Response({
            'message': 'ارزیابی با موفقیت ذخیره شد',
            'saved_responses': created,
            'asset_id': asset_id,
        }, status=201)
