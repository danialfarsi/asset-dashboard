"""
🎯 Middlewareهای اختصاصی
"""


class MediaFrameOptionsMiddleware:
    """
    حذف کامل X-Frame-Options برای فایل‌های media
    تا iframe پیش‌نمایش کار کنه
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # اگه مسیر media بود، X-Frame-Options رو کامل حذف کن
        if request.path.startswith('/media/'):
            # حذف از headers
            if 'X-Frame-Options' in response:
                del response['X-Frame-Options']
            if 'x-frame-options' in response:
                del response['x-frame-options']
            
            # Content-Security-Policy رو آپدیت کن
            response['Content-Security-Policy'] = (
                "frame-ancestors 'self' http://localhost:3000 http://localhost:8000"
            )
            # اجازه CORS
            response['Access-Control-Allow-Origin'] = '*'
        
        return response
