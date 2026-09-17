from rest_framework import serializers
from .models import VIAMUploadedFile


class VIAMUploadedFileSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    uploaded_by_name = serializers.SerializerMethodField()
    file_type_display = serializers.CharField(source='get_file_type_display', read_only=True)
    section_display = serializers.CharField(source='get_section_display', read_only=True)
    
    class Meta:
        model = VIAMUploadedFile
        fields = [
            'id', 'file', 'file_url', 'original_name',
            'file_type', 'file_type_display',
            'mime_type', 'file_size',
            'section', 'section_display',
            'title', 'description', 'tags',
            'organization', 'uploaded_by', 'uploaded_by_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'original_name', 'file_size', 'mime_type', 'file_type', 'organization', 'uploaded_by', 'created_at', 'updated_at']
    
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None
    
    def get_uploaded_by_name(self, obj):
        if obj.uploaded_by:
            name = f"{obj.uploaded_by.first_name} {obj.uploaded_by.last_name}".strip()
            return name or obj.uploaded_by.username
        return None
