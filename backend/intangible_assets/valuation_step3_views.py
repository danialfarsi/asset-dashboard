from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .valuation_step3_models import ValuationStep3, ValuationStep3Evidence
from .valuation_step3_serializers import (
    ValuationStep3Serializer, ValuationStep3CreateSerializer,
    ValuationStep3EvidenceSerializer
)


class ValuationStep3ViewSet(viewsets.ModelViewSet):
    queryset = ValuationStep3.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ValuationStep3CreateSerializer
        return ValuationStep3Serializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = ValuationStep3.objects.all()
        
        if user.role == 'super_admin':
            return queryset
        elif user.role == 'org_admin':
            return queryset.filter(valuation_case__asset__created_by__organization=user.organization)
        else:
            return queryset.filter(valuation_case__created_by=user)
    
    @action(detail=True, methods=['post'])
    def validate_step(self, request, pk=None):
        """اعتبارسنجی داده‌های STEP 3"""
        step3 = self.get_object()
        method_id = step3.method_id
        inputs = step3.method_inputs
        
        errors = []
        warnings = []
        
        # اعتبارسنجی بر اساس روش
        if method_id == 'M-01':  # RfR
            if not inputs.get('royalty_rate'):
                errors.append('نرخ حق‌امتیاز (royalty_rate) الزامی است')
            if not inputs.get('revenue_attribution'):
                errors.append('سهم درآمد منتسب (revenue_attribution) الزامی است')
            if not inputs.get('revenue_growth_rate'):
                errors.append('نرخ رشد درآمد (revenue_growth_rate) الزامی است')
        
        elif method_id == 'M-03':  # DCF
            if not inputs.get('free_cash_flows'):
                errors.append('جریان نقدی آزاد (free_cash_flows) الزامی است')
        
        elif method_id == 'M-05':  # RCM
            if not inputs.get('labor_breakdown') or len(inputs.get('labor_breakdown', [])) == 0:
                errors.append('جدول نیروی کار (labor_breakdown) حداقل ۱ ردیف الزامی است')
        
        elif method_id == 'M-08':  # CTM
            if not inputs.get('comparable_deals') or len(inputs.get('comparable_deals', [])) < 3:
                errors.append('حداقل ۳ معامله مشابه (comparable_deals) الزامی است')
        
        # ذخیره نتایج اعتبارسنجی
        step3.validation_errors = len(errors)
        step3.validation_warnings = len(warnings)
        step3.validation_status = 'VALIDATED' if len(errors) == 0 else 'DRAFT'
        step3.save()
        
        return Response({
            'status': step3.validation_status,
            'errors': errors,
            'warnings': warnings,
            'error_count': len(errors),
            'warning_count': len(warnings),
            'is_valid': len(errors) == 0
        })
    
    @action(detail=True, methods=['post'])
    def upload_evidence(self, request, pk=None):
        """آپلود شواهد STEP 3"""
        step3 = self.get_object()
        
        file = request.FILES.get('file')
        evidence_type = request.data.get('evidence_type')
        method_id = request.data.get('method_id')
        
        if not file:
            return Response(
                {'error': 'فایل الزامی است'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        evidence = ValuationStep3Evidence.objects.create(
            step3=step3,
            file=file,
            file_name=file.name,
            evidence_type=evidence_type,
            method_id=method_id or step3.method_id
        )
        
        serializer = ValuationStep3EvidenceSerializer(evidence)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def get_fields(self, request, pk=None):
        """دریافت فیلدهای اختصاصی روش"""
        step3 = self.get_object()
        method_id = step3.method_id
        
        # تعریف فیلدهای هر روش
        fields_config = {
            'M-01': {  # RfR
                'required': ['royalty_rate', 'revenue_attribution', 'revenue_growth_rate'],
                'optional': ['quality_multiplier'],
                'from_step2': ['forecast_horizon', 'discount_rate', 'tax_rate', 'terminal_growth_rate'],
                'evidence': ['benchmark_report', 'revenue_file']
            },
            'M-02': {  # MEEM
                'required': ['ebit_attributable', 'cac_table', 'attrition_rate'],
                'from_step2': ['discount_rate', 'tax_rate', 'terminal_growth_rate']
            },
            'M-03': {  # DCF
                'required': ['free_cash_flows'],
                'optional': ['capex_table', 'working_capital_table'],
                'from_step2': ['discount_rate', 'tax_rate', 'terminal_growth_rate']
            },
            'M-04': {  # WWM
                'required': ['with_asset_fcf', 'without_asset_fcf', 'ramp_up_period'],
                'from_step2': ['discount_rate', 'tax_rate']
            },
            'M-05': {  # RCM
                'required': ['labor_breakdown'],
                'optional': ['material_infra_cost', 'overhead_pct', 'developer_profit_pct'],
                'auto': ['functional_obs_pct', 'economic_obs_pct'],
                'evidence': ['cost_estimation', 'salary_benchmark']
            },
            'M-06': {  # RPCM
                'required': ['labor_breakdown', 'direct_reproduction_cost'],
                'optional': ['coordination_overhead', 'relevance_obsolescence', 'age_factor'],
                'auto': ['relevance_obsolescence']
            },
            'M-07': {  # TWC
                'required': ['team_composition', 'ramp_up_duration'],
                'optional': ['productivity_loss_pct']
            },
            'M-08': {  # CTM
                'required': ['comparable_deals'],
                'optional': ['time_adjustment_pct', 'geo_adjustment_pct', 'quality_adjustment_pct'],
                'evidence': ['deal_details', 'market_source']
            },
            'M-09': {  # MMM
                'required': ['base_metric_value', 'market_multiple'],
                'optional': ['control_premium', 'marketability_discount', 'intangible_share']
            }
        }
        
        return Response(fields_config.get(method_id, {}))
