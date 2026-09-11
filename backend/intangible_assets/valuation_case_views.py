
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .valuation_models import ValuationCase, ValuationAssumption, ValuationEvidenceTag
from .valuation_case_serializers import (
    ValuationCaseSerializer, ValuationCaseCreateSerializer,
    ValuationAssumptionSerializer, ValuationEvidenceTagSerializer
)


class ValuationCaseViewSet(viewsets.ModelViewSet):
    queryset = ValuationCase.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ValuationCaseCreateSerializer
        return ValuationCaseSerializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = ValuationCase.objects.all()
        
        asset_id = self.request.query_params.get('asset')
        if asset_id:
            queryset = queryset.filter(asset_id=asset_id)
        
        if user.role == 'super_admin':
            return queryset
        elif user.role == 'org_admin':
            return queryset.filter(asset__created_by__organization=user.organization)
        else:
            return queryset.filter(created_by=user)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def add_assumption(self, request, pk=None):
        valuation_case = self.get_object()
        serializer = ValuationAssumptionSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(valuation_case=valuation_case)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def add_evidence_tag(self, request, pk=None):
        valuation_case = self.get_object()
        serializer = ValuationEvidenceTagSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(valuation_case=valuation_case)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # ============================================
    # 🔥 ۱. مدیریت فرضیات (Assumptions) - همگام‌سازی کامل
    # ============================================
    @action(detail=True, methods=['post'])
    def sync_assumptions(self, request, pk=None):
        valuation_case = self.get_object()
        assumptions_data = request.data.get('assumptions', [])
        
        # حذف همه فرضیات قبلی
        valuation_case.assumptions.all().delete()
        
        # ایجاد فرضیات جدید
        created = []
        for ass_data in assumptions_data:
            serializer = ValuationAssumptionSerializer(data=ass_data)
            if serializer.is_valid():
                serializer.save(valuation_case=valuation_case)
                created.append(serializer.data)
        
        return Response({
            'message': f'{len(created)} فرضیه همگام‌سازی شدند',
            'assumptions': created
        }, status=status.HTTP_200_OK)
    
    # ============================================
    # 🔥 ۲. مدیریت وابستگی‌ها (Linked Assets)
    # ============================================
    @action(detail=True, methods=['patch'])
    def update_linked_assets(self, request, pk=None):
        valuation_case = self.get_object()
        linked_assets = request.data.get('linked_assets', [])
        
        valuation_case.linked_assets.set(linked_assets)
        valuation_case.save()
        
        return Response({
            'message': 'وابستگی‌ها بروزرسانی شدند',
            'linked_assets': list(valuation_case.linked_assets.values_list('id', flat=True))
        }, status=status.HTTP_200_OK)
    
    # ============================================
    # 🔥 ۳. مدیریت تگ‌های شواهد (Evidence Tags)
    # ============================================
    @action(detail=True, methods=['post'])
    def sync_evidence_tags(self, request, pk=None):
        valuation_case = self.get_object()
        evidence_tags = request.data.get('evidence_tags', {})
        
        # حذف تگ‌های قبلی
        valuation_case.evidence_tags.all().delete()
        
        # ایجاد تگ‌های جدید
        created = []
        for file_field, tag in evidence_tags.items():
            if tag:
                tag_obj = ValuationEvidenceTag.objects.create(
                    valuation_case=valuation_case,
                    file_field=file_field,
                    tag=tag
                )
                created.append({
                    'file_field': tag_obj.file_field,
                    'tag': tag_obj.tag
                })
        
        return Response({
            'message': f'{len(created)} تگ شواهد همگام‌سازی شدند',
            'evidence_tags': created
        }, status=status.HTTP_200_OK)
    
    # ═══════════════════════════════════════════════════════════
    # 🆕 submit - از QC به عنوان منبع واحد استفاده می‌کند
    # ═══════════════════════════════════════════════════════════
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """
        🔥 ثبت نهایی پرونده - از QC به عنوان منبع واحد استفاده می‌کند
        چک‌های اجباری در QC انجام شده — اینجا فقط QC را بررسی می‌کنیم
        """
        valuation_case = self.get_object()
        
        # چک QC
        try:
            qc = valuation_case.qc_result
        except Exception:
            return Response({
                'error': 'QC اجرا نشده',
                'message': 'ابتدا باید QC در Step5 اجرا شود',
                'hint': 'به Step5 برگردید و چک‌لیست را تکمیل کنید',
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if qc.decision not in ['APPROVE', 'CONDITIONAL']:
            # لیست خطاهای QC رو استخراج کن
            missing = []
            try:
                qc_data = qc.qc_data or {}
                issues = qc_data.get('issues', [])
                for issue in issues:
                    missing.append({
                        'field': issue.get('field', ''),
                        'label': issue.get('label', ''),
                        'message': issue.get('message', ''),
                        'hint': issue.get('hint', ''),
                    })
            except Exception:
                pass
            
            return Response({
                'error': 'QC پرونده تأیید نشده',
                'message': f'وضعیت QC: {qc.decision}',
                'hint': 'ابتدا در Step5، مشکلات را رفع کنید',
                'qc_decision': qc.decision,
                'missing_items': missing,
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # ✅ QC تأیید کرده — ثبت کن
        valuation_case.status = 'completed'
        valuation_case.review_status = 'cleared'
        valuation_case.save()
        
        serializer = self.get_serializer(valuation_case)
        return Response({
            'success': True,
            'message': 'پرونده با موفقیت ثبت شد',
            'case': serializer.data,
        })
    
    @action(detail=False, methods=['get'])
    def validation_rules(self, request):
        return Response({
            'min_assumptions': 1,
            'min_source_reliability': 'medium',
            'required_docs': [
                'asset_description_doc',
                'ownership_doc',
                'financial_source_doc'
            ],
            'income_methods': ['M-01', 'M-02', 'M-03', 'M-04'],
            'required_for_income': ['external_benchmark_doc'],
            'source_reliability_options': [
                {'value': 'very_high', 'label': 'بسیار بالا'},
                {'value': 'high', 'label': 'بالا'},
                {'value': 'medium', 'label': 'متوسط'},
                {'value': 'low', 'label': 'پایین'},
                {'value': 'very_low', 'label': 'بسیار پایین'},
            ],
            'currency_options': [
                {'value': 'IRR', 'label': 'ریال'},
                {'value': 'USD', 'label': 'دلار'},
                {'value': 'EUR', 'label': 'یورو'},
            ],
        })
