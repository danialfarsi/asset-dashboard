from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import VIAMUploadedFile
from .serializers import VIAMUploadedFileSerializer


class VIAMUploadedFileViewSet(viewsets.ModelViewSet):
    """مدیریت فایل‌های آپلودشده VIAM"""
    queryset = VIAMUploadedFile.objects.all()
    serializer_class = VIAMUploadedFileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_queryset(self):
        user = self.request.user
        queryset = VIAMUploadedFile.objects.all()
        
        if user.role == 'super_admin':
            pass
        elif user.role in ['org_admin', 'org_user']:
            if user.organization:
                queryset = queryset.filter(organization=user.organization)
            else:
                queryset = queryset.none()
        
        # فیلترها
        section = self.request.query_params.get('section')
        if section:
            queryset = queryset.filter(section=section)
        
        file_type = self.request.query_params.get('file_type')
        if file_type:
            queryset = queryset.filter(file_type=file_type)
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(title__icontains=search) | queryset.filter(original_name__icontains=search)
        
        return queryset.select_related('organization', 'uploaded_by')
    
    def perform_create(self, serializer):
        file = self.request.FILES.get('file')
        if not file:
            return Response({'error': 'فایل الزامی است'}, status=400)
        
        # تشخیص نوع فایل
        name = file.name.lower()
        if name.endswith('.pdf'):
            file_type = 'pdf'
        elif name.endswith(('.doc', '.docx')):
            file_type = 'word'
        elif name.endswith(('.xls', '.xlsx', '.csv')):
            file_type = 'excel'
        elif name.endswith(('.ppt', '.pptx')):
            file_type = 'powerpoint'
        elif name.endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff')):
            file_type = 'image'
        elif name.endswith(('.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv')):
            file_type = 'video'
        elif name.endswith(('.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac')):
            file_type = 'audio'
        elif name.endswith(('.db', '.sqlite', '.sqlite3', '.mdb', '.accdb', '.sql', '.dbf')):
            file_type = 'database'
        elif name.endswith(('.zip', '.rar', '.7z', '.tar', '.gz')):
            file_type = 'archive'
        elif name.endswith(('.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.cpp', '.c', '.html', '.css', '.json', '.xml', '.yaml', '.yml')):
            file_type = 'code'
        else:
            file_type = 'other'
        
        serializer.save(
            uploaded_by=self.request.user,
            organization=self.request.user.organization,
            original_name=file.name,
            file_size=file.size,
            mime_type=file.content_type or '',
            file_type=file_type,
        )
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """آمار فایل‌ها"""
        queryset = self.get_queryset()
        
        return Response({
            'total': queryset.count(),
            'by_type': {
                'pdf': queryset.filter(file_type='pdf').count(),
                'word': queryset.filter(file_type='word').count(),
                'image': queryset.filter(file_type='image').count(),
                'video': queryset.filter(file_type='video').count(),
                'audio': queryset.filter(file_type='audio').count(),
            },
            'by_section': {
                'strategic_planning': queryset.filter(section='strategic_planning').count(),
                'culture': queryset.filter(section='culture').count(),
                'empowerment': queryset.filter(section='empowerment').count(),
                'performance': queryset.filter(section='performance').count(),
            },
        })
