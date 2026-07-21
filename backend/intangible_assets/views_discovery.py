from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import ScreeningTemplate
from .discovery_analyzer import DiscoveryAnalyzer

class SuggestTemplateView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        asset_name = request.data.get('asset_name')
        answers = request.data.get('answers', {})
        organization_type = request.data.get('organization_type')
        
        if not asset_name:
            return Response(
                {'error': 'نام دارایی الزامی است'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not answers:
            return Response(
                {'error': 'پاسخ‌ها الزامی هستند'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        analyzer = DiscoveryAnalyzer(
            answers=answers,
            asset_name=asset_name,
            organization_type=organization_type
        )
        
        result = analyzer.analyze()
        
        if not result:
            return Response(
                {'message': 'هیچ قالب مشابهی پیدا نشد'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        response_data = self.format_response(result)
        return Response(response_data, status=status.HTTP_200_OK)
    
    def format_response(self, result):
        best = result['best_template']
        errors = result['errors']
        alternative = result['alternative']
        summary = result['summary']
        
        total_score = 0
        max_score = 0
        if best and best.discovery_scores:
            for category in ['non_physicality', 'identifiability', 'controllability', 'value_creation']:
                if category in best.discovery_scores:
                    total_score += best.discovery_scores[category].get('score', 0)
                    max_score += best.discovery_scores[category].get('max', 0)
        
        match_percentage = round((total_score / max_score) * 100, 1) if max_score > 0 else 0
        
        formatted_errors = []
        for error_group in errors:
            formatted_errors.append({
                'category': error_group['category'],
                'title': error_group['title'],
                'errors': [
                    {
                        'key': e['key'],
                        'description': e['description'],
                        'expected': e['expected'],
                        'user_value': e['user_value'],
                        'is_critical': e['is_critical']
                    }
                    for e in error_group['errors']
                ]
            })
        
        # ⭐⭐ اینجا asset_type_id رو اضافه میکنیم! ⭐⭐
        response = {
            'best_template': {
                'id': best.id,
                'name': best.item_name,
                'organization_type': best.organization_type.display_name,
                'category': best.category,
                'valuation_method': best.valuation_method,
                'total_score': total_score,
                'max_score': max_score,
                'match_percentage': match_percentage,
                'asset_type_id': best.asset_type_id  # ← این خط اضافه شد
            },
            'errors': formatted_errors,
            'summary': summary
        }
        
        if alternative:
            alt_total = 0
            alt_max = 0
            if alternative.discovery_scores:
                for category in ['non_physicality', 'identifiability', 'controllability', 'value_creation']:
                    if category in alternative.discovery_scores:
                        alt_total += alternative.discovery_scores[category].get('score', 0)
                        alt_max += alternative.discovery_scores[category].get('max', 0)
            
            alt_percentage = round((alt_total / alt_max) * 100, 1) if alt_max > 0 else 0
            
            response['alternative'] = {
                'id': alternative.id,
                'name': alternative.item_name,
                'organization_type': alternative.organization_type.display_name,
                'category': alternative.category,
                'valuation_method': alternative.valuation_method,
                'match_percentage': alt_percentage,
                'asset_type_id': alternative.asset_type_id  # ← این خط اضافه شد
            }
        
        return response
