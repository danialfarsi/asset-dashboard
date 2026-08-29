from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.db.models import Count, Avg
from django.utils import timezone
from datetime import timedelta
from .models import APIKey, ExternalUser, APIRequestLog, ScreenedAsset

class APIStatsView(APIView):
    """دریافت آمار APIها"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        now = timezone.now()
        last_24h = now - timedelta(days=1)
        last_7d = now - timedelta(days=7)
        last_30d = now - timedelta(days=30)
        
        stats = {
            'summary': {
                'total_requests': APIRequestLog.objects.count(),
                'total_users': ExternalUser.objects.count(),
                'total_assets': ScreenedAsset.objects.filter(source_type='external').count(),
                'active_keys': APIKey.objects.filter(is_active=True).count(),
                'avg_response_time': APIRequestLog.objects.filter(
                    status='success'
                ).aggregate(Avg('response_time'))['response_time__avg'] or 0,
            },
            'periods': {
                '24h': {
                    'requests': APIRequestLog.objects.filter(created_at__gte=last_24h).count(),
                    'users': ExternalUser.objects.filter(last_seen__gte=last_24h).count(),
                    'assets': ScreenedAsset.objects.filter(
                        source_type='external',
                        created_at__gte=last_24h
                    ).count(),
                },
                '7d': {
                    'requests': APIRequestLog.objects.filter(created_at__gte=last_7d).count(),
                    'users': ExternalUser.objects.filter(last_seen__gte=last_7d).count(),
                    'assets': ScreenedAsset.objects.filter(
                        source_type='external',
                        created_at__gte=last_7d
                    ).count(),
                },
                '30d': {
                    'requests': APIRequestLog.objects.filter(created_at__gte=last_30d).count(),
                    'users': ExternalUser.objects.filter(last_seen__gte=last_30d).count(),
                    'assets': ScreenedAsset.objects.filter(
                        source_type='external',
                        created_at__gte=last_30d
                    ).count(),
                },
            },
            'status_breakdown': {
                'success': APIRequestLog.objects.filter(status='success').count(),
                'failed': APIRequestLog.objects.filter(status='failed').count(),
                'error': APIRequestLog.objects.filter(status='error').count(),
            },
            'daily_stats': self._get_daily_stats(last_30d),
        }
        
        return Response(stats)
    
    def _get_daily_stats(self, start_date):
        """آمار روزانه"""
        logs = APIRequestLog.objects.filter(created_at__gte=start_date)
        daily = {}
        for log in logs:
            date = log.created_at.date()
            if date not in daily:
                daily[date] = {'total': 0, 'success': 0, 'failed': 0, 'error': 0}
            daily[date]['total'] += 1
            daily[date][log.status] += 1
        
        return sorted(
            [{'date': k, **v} for k, v in daily.items()],
            key=lambda x: x['date']
        )
