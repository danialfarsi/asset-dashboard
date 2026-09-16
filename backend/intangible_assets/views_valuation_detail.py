from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import ScreenedAsset, ValuationQuestion
from .valuation_models import AssetValuation


class ValuationDetailView(APIView):
    """
    GET /api/intangible/valuation/{asset_id}/detail/
    اطلاعات کامل صفحه valuation (بهینه)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, asset_id):
        user = request.user
        
        # ۱. دارایی
        try:
            asset = ScreenedAsset.objects.select_related(
                'asset_type', 'organization', 'department'
            ).get(id=asset_id)
        except ScreenedAsset.DoesNotExist:
            return Response({'error': 'دارایی یافت نشد'}, status=404)
        
        # چک دسترسی
        if user.role == 'org_admin' and asset.organization_id != user.organization_id:
            return Response({'error': 'دسترسی ندارید'}, status=403)
        if user.role == 'org_user':
            if asset.department_id != user.department_id and asset.created_by_id != user.id:
                return Response({'error': 'دسترسی ندارید'}, status=403)
        
        asset_data = {
            'id': asset.id,
            'asset_name': asset.asset_name,
            'asset_uid': asset.asset_uid,
            'category': asset.category,
            'valuation_method': asset.valuation_method,
            'asset_type': {
                'id': asset.asset_type.id,
                'code': asset.asset_type.code,
                'name': asset.asset_type.name,
            } if asset.asset_type else None,
        }
        
        # ۲. تعیین asset_type
        asset_type_id = asset.asset_type_id
        
        # اگه asset_type نداره، تلاش برای تشخیص
        if not asset_type_id and asset.asset_uid:
            # TODO: تشخیص خودکار (ممکنه کند باشه)
            pass
        
        # ۳. سوالات بر اساس asset_type
        questions_data = []
        if asset_type_id:
            questions = ValuationQuestion.objects.filter(
                asset_type_id=asset_type_id
            ).select_related('dimension').prefetch_related('score_guides')
            
            for q in questions:
                questions_data.append({
                    'id': q.id,
                    'code': q.code,
                    'question_text': q.question_text,
                    'hint': getattr(q, 'hint', '') or '',
                    'dimension_name': q.dimension.name if q.dimension else '',
                    'score_guides': [{
                        'id': sg.id,
                        'score': sg.score,
                        'condition': sg.condition,
                        'evidence_required': getattr(sg, 'evidence_required', '') or '',
                    } for sg in q.score_guides.all().order_by('score')],
                })
        
        # ۴. آخرین valuation
        valuation = AssetValuation.objects.filter(
            asset=asset
        ).order_by('-evaluated_at').first()
        
        valuation_data = None
        answers_data = []
        
        if valuation:
            valuation_data = {
                'id': valuation.id,
                'status': valuation.status,
                'final_score': float(valuation.final_score) if valuation.final_score else 0,
            }
            
            # پاسخ‌ها
            for answer in valuation.answers.all():
                answers_data.append({
                    'question_id': answer.question_id,
                    'score': answer.score,
                })
        
        return Response({
            'asset': asset_data,
            'asset_type_id': asset_type_id,
            'questions': questions_data,
            'valuation': valuation_data,
            'answers': answers_data,
        })
