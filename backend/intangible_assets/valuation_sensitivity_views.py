from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .valuation_sensitivity_models import SensitivityAnalysis
from .valuation_sensitivity_serializers import (
    SensitivityAnalysisSerializer,
    SensitivityCalculateSerializer
)
from .services.sensitivity_engine import SensitivityEngine
from .valuation_step4_models import ValuationStep4
from .valuation_models import ValuationCase
from .valuation_step3_models import ValuationStep3


class SensitivityAnalysisViewSet(viewsets.ModelViewSet):
    serializer_class = SensitivityAnalysisSerializer
    permission_classes = [IsAuthenticated]
    queryset = SensitivityAnalysis.objects.all()
    
    def get_queryset(self):
        queryset = SensitivityAnalysis.objects.all()
        valuation_case = self.request.query_params.get('valuation_case')
        if valuation_case:
            queryset = queryset.filter(valuation_case_id=valuation_case)
        method_id = self.request.query_params.get('method_id')
        if method_id:
            queryset = queryset.filter(method_id=method_id)
        return queryset
    
    @action(detail=False, methods=['post'])
    def calculate(self, request):
        serializer = SensitivityCalculateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        valuation_case_id = data['valuation_case_id']
        method_id = data['method_id']
        custom_drivers = data.get('drivers', [])
        
        try:
            step4 = ValuationStep4.objects.get(
                valuation_case_id=valuation_case_id,
                method_id=method_id
            )
            
            valuation_case = ValuationCase.objects.get(id=valuation_case_id)
            
            # 🔥 دریافت STEP 3 برای پارامترهای اضافی
            step3 = ValuationStep3.objects.filter(valuation_case_id=valuation_case_id).first()
            inputs = step3.method_inputs if step3 else {}
            
            # 🔥 مقدار پایه اصلی
            original_base_value = float(step4.final_value)
            
            # 🔥 دریافت forecast_horizon از STEP 3
            forecast_horizon = inputs.get('forecast_horizon', 5)
            if isinstance(forecast_horizon, str):
                forecast_horizon = int(forecast_horizon)
            
            # 🔥 ساخت case_data با تمام پارامترها
            case_data = {
                'original_base_value': original_base_value,
                'base_value': original_base_value,
                'method_id': method_id,
                'discount_rate': float(valuation_case.discount_rate) if valuation_case.discount_rate else 0.18,
                'tax_rate': float(valuation_case.tax_rate) if valuation_case.tax_rate else 0.25,
                'terminal_growth': float(valuation_case.terminal_growth_rate) if valuation_case.terminal_growth_rate else 0.05,
                'current_revenue': float(valuation_case.current_revenue) if valuation_case.current_revenue else 1000000000,
                'forecast_horizon': forecast_horizon,
            }
            
            print(f'📊 Forecast horizon from STEP 3: {forecast_horizon}')
            
            # 🔥 اضافه کردن پارامترهای STEP 3 بر اساس method_id
            if inputs:
                # ============================================
                # پارامترهای M-01 (RfR)
                # ============================================
                if method_id == 'M-01':
                    if 'royalty_rate' in inputs:
                        case_data['royalty_rate'] = float(inputs.get('royalty_rate', 0.04))
                    if 'revenue_attribution' in inputs:
                        case_data['revenue_attribution'] = float(inputs.get('revenue_attribution', 0.80))
                    if 'revenue_growth_rate' in inputs:
                        case_data['revenue_growth_rate'] = float(inputs.get('revenue_growth_rate', 0.08))
                    if 'quality_multiplier' in inputs:
                        case_data['quality_multiplier'] = float(inputs.get('quality_multiplier', 0.92))
                
                # ============================================
                # پارامترهای M-04 (WWM)
                # ============================================
                if method_id == 'M-04':
                    if 'with_asset_growth' in inputs:
                        case_data['with_asset_growth'] = float(inputs.get('with_asset_growth', 0.08))
                    if 'without_asset_growth' in inputs:
                        case_data['without_asset_growth'] = float(inputs.get('without_asset_growth', 0.06))
                    if 'discount_rate' in inputs:
                        case_data['discount_rate'] = float(inputs.get('discount_rate', 0.18))
                    if 'tax_rate' in inputs:
                        case_data['tax_rate'] = float(inputs.get('tax_rate', 0.25))
                    if 'forecast_horizon' in inputs:
                        case_data['forecast_horizon'] = int(inputs.get('forecast_horizon', 5))
                
                # ============================================
                # پارامترهای M-05 (RCM)
                # ============================================
                if method_id == 'M-05':
                    if 'labor_breakdown' in inputs:
                        case_data['labor_breakdown'] = inputs.get('labor_breakdown', [])
                    if 'material_infra_cost' in inputs:
                        case_data['material_infra_cost'] = float(inputs.get('material_infra_cost', 0))
                    if 'overhead_pct' in inputs:
                        case_data['overhead_pct'] = float(inputs.get('overhead_pct', 12))
                    if 'developer_profit_pct' in inputs:
                        case_data['developer_profit_pct'] = float(inputs.get('developer_profit_pct', 12))
                    if 'functional_obs_pct' in inputs:
                        case_data['functional_obs_pct'] = float(inputs.get('functional_obs_pct', 0))
                    if 'economic_obs_pct' in inputs:
                        case_data['economic_obs_pct'] = float(inputs.get('economic_obs_pct', 7))
                    if 'quality_multiplier' in inputs:
                        case_data['quality_multiplier'] = float(inputs.get('quality_multiplier', 0.92))
                
                # ============================================
                # پارامترهای M-06 (RPCM)
                # ============================================
                if method_id == 'M-06':
                    if 'labor_breakdown' in inputs:
                        case_data['labor_breakdown'] = inputs.get('labor_breakdown', [])
                    if 'direct_reproduction_cost' in inputs:
                        case_data['direct_reproduction_cost'] = float(inputs.get('direct_reproduction_cost', 0))
                    if 'coordination_overhead' in inputs:
                        case_data['coordination_overhead'] = float(inputs.get('coordination_overhead', 20))
                    if 'relevance_obsolescence' in inputs:
                        case_data['relevance_obsolescence'] = float(inputs.get('relevance_obsolescence', 0))
                    if 'age_factor' in inputs:
                        case_data['age_factor'] = float(inputs.get('age_factor', 0))
                    if 'quality_multiplier' in inputs:
                        case_data['quality_multiplier'] = float(inputs.get('quality_multiplier', 0.92))
                    if 'tax_rate' in inputs:
                        case_data['tax_rate'] = float(inputs.get('tax_rate', 0.25))
                    if 'discount_rate' in inputs:
                        case_data['discount_rate'] = float(inputs.get('discount_rate', 0.18))
                
                # ============================================
                # پارامترهای M-09 (MMM)
                # ============================================
                if method_id == 'M-09':
                    if 'base_metric' in inputs:
                        case_data['base_metric'] = inputs.get('base_metric', 'revenue')
                    if 'base_metric_value' in inputs:
                        case_data['base_metric_value'] = float(inputs.get('base_metric_value', 100000000000))
                    if 'market_multiple' in inputs:
                        case_data['market_multiple'] = float(inputs.get('market_multiple', 2.5))
                    if 'control_premium_percent' in inputs:
                        case_data['control_premium_percent'] = float(inputs.get('control_premium_percent', 10))
                    if 'marketability_discount_percent' in inputs:
                        case_data['marketability_discount_percent'] = float(inputs.get('marketability_discount_percent', 20))
                    if 'intangible_share_percent' in inputs:
                        case_data['intangible_share_percent'] = float(inputs.get('intangible_share_percent', 40))
                    if 'quality_multiplier' in inputs:
                        case_data['quality_multiplier'] = float(inputs.get('quality_multiplier', 0.86))
                    if 'tax_rate' in inputs:
                        case_data['tax_rate'] = float(inputs.get('tax_rate', 0.25))
                    if 'discount_rate' in inputs:
                        case_data['discount_rate'] = float(inputs.get('discount_rate', 0.18))
            
            # اضافه کردن مقادیر سفارشی drivers به case_data
            for driver in custom_drivers:
                driver_id = driver.get('id')
                value = driver.get('value')
                if driver_id and value is not None:
                    case_data[driver_id] = float(value)
                    print(f'📌 Added custom driver {driver_id}: {value}')
            
            print(f'📊 Final case_data keys: {list(case_data.keys())}')
            
            engine = SensitivityEngine(method_id, case_data)
            result = engine.run_analysis()
            
            sensitivity, created = SensitivityAnalysis.objects.update_or_create(
                valuation_case_id=valuation_case_id,
                method_id=method_id,
                defaults={
                    'step4': step4,
                    'base_value': case_data['base_value'],
                    'tornado_data': result.get('tornado_ranking', []),
                    'scenario_results': result.get('scenarios', {}),
                    'critical_drivers': result.get('key_drivers', [])[:3],
                    'min_value': result.get('confidence_band', {}).get('low'),
                    'max_value': result.get('confidence_band', {}).get('high'),
                    'confidence_interval_low': result.get('confidence_band', {}).get('low'),
                    'confidence_interval_high': result.get('confidence_band', {}).get('high'),
                    'confidence_level': result.get('confidence_band', {}).get('confidence_level_percent', 80) / 100,
                    'status': 'calculated',
                    'created_by': request.user
                }
            )
            
            result['sensitivity_id'] = sensitivity.id
            return Response(result, status=status.HTTP_200_OK)
            
        except ValuationStep4.DoesNotExist:
            return Response(
                {'error': f'STEP 4 برای روش {method_id} یافت نشد'},
                status=status.HTTP_404_NOT_FOUND
            )
        except ValuationCase.DoesNotExist:
            return Response(
                {'error': 'مورد ارزش‌گذاری یافت نشد'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'خطا در محاسبه: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )