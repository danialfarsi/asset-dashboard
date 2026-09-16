from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.paginator import Paginator
from django.db.models import Q

from .valuation_models import AssetValuation


class CompletedValuationsView(APIView):
    """
    GET /api/intangible/valuation/completed-summaries/
    لیست ارزش‌گذاری‌های تکمیل‌شده با summary (بهینه)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # فیلتر بر اساس نقش
        base_query = AssetValuation.objects.filter(status='completed')
        
        if user.role == 'super_admin':
            pass
        elif user.role == 'org_admin':
            base_query = base_query.filter(asset__organization=user.organization)
        elif user.role == 'org_user':
            if user.department:
                base_query = base_query.filter(asset__department=user.department)
            else:
                base_query = base_query.filter(asset__created_by=user)
        else:
            base_query = base_query.none()
        
        # جستجو
        search = request.query_params.get('search', '').strip()
        if search:
            base_query = base_query.filter(
                Q(asset__asset_name__icontains=search) |
                Q(asset__asset_uid__icontains=search)
            )
        
        # مرتب‌سازی
        base_query = base_query.select_related(
            'asset', 'asset__asset_type', 'asset__organization'
        ).order_by('-evaluated_at')
        
        # صفحه‌بندی
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 12))
        
        paginator = Paginator(base_query, page_size)
        page_obj = paginator.get_page(page)
        
        # ساخت summary برای هر valuation
        organization_type = getattr(user, 'organization_type', 'manufacturing') or 'manufacturing'
        
        results = []
        for val in page_obj:
            try:
                # محاسبه dimension scores
                answers = val.answers.all().select_related('question', 'question__dimension')
                
                dim_scores = {}
                for answer in answers:
                    if answer.score is not None:
                        dim_name = answer.question.dimension.name
                        if dim_name not in dim_scores:
                            dim_scores[dim_name] = {'total': 0, 'count': 0}
                        dim_scores[dim_name]['total'] += answer.score
                        dim_scores[dim_name]['count'] += 1
                
                for dim in dim_scores:
                    if dim_scores[dim]['count'] > 0:
                        dim_scores[dim]['average'] = dim_scores[dim]['total'] / dim_scores[dim]['count']
                    else:
                        dim_scores[dim]['average'] = 0
                
                # weighted summary — از get_score_summary مدل استفاده کن
                try:
                    weighted_summary = val.get_score_summary(organization_type)
                except Exception as e:
                    print(f"get_score_summary error for val {val.id}: {e}")
                    weighted_summary = None
                
                # استخراج مقادیر از weighted_summary
                if weighted_summary:
                    weighted_avgs = weighted_summary.get('averages', {})
                    weighted_scores = weighted_summary.get('weighted_scores', {})
                    weighted_total = weighted_summary.get('final_score', val.final_score or 0)
                else:
                    weighted_avgs = {}
                    weighted_scores = {}
                    weighted_total = val.final_score or 0
                
                # تعداد سوالات
                total_questions = weighted_summary.get('total_questions', 23) if weighted_summary else 23
                answered_questions = weighted_summary.get('answered_questions', 0) if weighted_summary else answers.filter(score__isnull=False).count()
                
                results.append({
                    'id': val.id,
                    'asset': val.asset.asset_name if val.asset else '',
                    'asset_id': val.asset_id,
                    'asset_uid': val.asset.asset_uid if val.asset else '',
                    'status': val.status,
                    'final_score': float(val.final_score) if val.final_score else 0,
                    'weighted_score': float(weighted_total) if weighted_total else 0,
                    'strategic_score': float(weighted_avgs.get('strategic', 0)),
                    'technical_score': float(weighted_avgs.get('technical', 0)),
                    'operational_score': float(weighted_avgs.get('operational', 0)),
                    'market_score': float(weighted_avgs.get('market', 0)),
                    'risk_score': float(weighted_avgs.get('risk', 0)),
                    'total_questions': total_questions,
                    'answered_questions': answered_questions,
                })
            except Exception as e:
                print(f"Error processing valuation {val.id}: {e}")
                continue
        
        # مرتب‌سازی بر اساس weighted_score
        results.sort(key=lambda x: x.get('weighted_score', 0), reverse=True)
        
        # محاسبه rank
        start_rank = (page - 1) * page_size
        for i, item in enumerate(results):
            item['rank'] = start_rank + i + 1
        
        return Response({
            'count': paginator.count,
            'page': page,
            'total_pages': paginator.num_pages,
            'page_size': page_size,
            'results': results,
        })
