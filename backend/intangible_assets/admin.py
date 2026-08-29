from django.contrib import admin
from .api_management_models import APIKey, ExternalUser, APIRequestLog
from .models import ScreenedAsset, ScreeningTemplate, OrganizationType

@admin.register(APIKey)
class APIKeyAdmin(admin.ModelAdmin):
    list_display = ['name', 'key', 'is_active', 'created_at', 'expires_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'key', 'description']
    readonly_fields = ['key', 'created_at']
    fieldsets = (
        ('اطلاعات کلید', {
            'fields': ('name', 'key', 'description', 'is_active')
        }),
        ('محدودیت‌ها', {
            'fields': ('expires_at', 'allowed_ips', 'rate_limit')
        }),
        ('تاریخچه', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        })
    )

@admin.register(ExternalUser)
class ExternalUserAdmin(admin.ModelAdmin):
    list_display = ['source', 'user_id', 'api_key', 'email', 'total_requests', 'last_seen', 'is_active']
    list_filter = ['is_active', 'source', 'first_seen']
    search_fields = ['source', 'user_id', 'session_id', 'ip_address', 'email']
    readonly_fields = ['user_id', 'first_seen', 'last_seen']
    fieldsets = (
        ('اطلاعات کاربر', {
            'fields': ('user_id', 'source', 'api_key', 'email', 'is_active')
        }),
        ('اطلاعات جلسه', {
            'fields': ('session_id', 'ip_address', 'user_agent')
        }),
        ('آمار', {
            'fields': ('total_requests', 'first_seen', 'last_seen')
        })
    )

@admin.register(APIRequestLog)
class APIRequestLogAdmin(admin.ModelAdmin):
    list_display = ['method', 'endpoint', 'response_status', 'status', 'response_time', 'created_at']
    list_filter = ['method', 'status', 'response_status', 'created_at']
    search_fields = ['endpoint', 'ip_address', 'user_agent']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'