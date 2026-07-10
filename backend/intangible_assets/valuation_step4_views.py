from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .valuation_step4_models import ValuationStep4
from .valuation_step3_models import ValuationStep3
from .valuation_serializers import ValuationStep4Serializer


class ValuationStep4ViewSet(viewsets.ModelViewSet):
    queryset = ValuationStep4.objects.all()
    serializer_class = ValuationStep4Serializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        valuation_case = self.request.query_params.get('valuation_case')
        if valuation_case:
            queryset = queryset.filter(valuation_case_id=valuation_case)
        return queryset

    @action(detail=True, methods=['post'])
    def calculate(self, request, pk=None):
        try:
            step4 = self.get_object()
            valuation_case = step4.valuation_case
            
            step3 = ValuationStep3.objects.filter(valuation_case=valuation_case).first()
            if not step3:
                return Response(
                    {'error': 'STEP 3 داده وجود ندارد'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            inputs = step3.method_inputs or {}
            method_id = step3.method_id
            
            print(f'🔍 محاسبه برای روش: {method_id}')
            
            if method_id == 'M-04':
                result = self.calculate_m04(inputs)
            elif method_id == 'M-05':
                result = self.calculate_m05(inputs)
            elif method_id == 'M-06':
                result = self.calculate_m06(inputs)
            else:
                return Response(
                    {'error': f'روش {method_id} پشتیبانی نمیشود'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            step4.calculation_details = result['details']
            step4.final_value = result['final_value']
            step4.confidence_level = result['confidence_level']
            step4.qc_score = result['qc_score']
            step4.step4_status = 'CALCULATED'
            step4.save()
            
            serializer = self.get_serializer(step4)
            return Response(serializer.data)
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    # ============================================
    # 🔥 M-04: With-and-Without Method
    # ============================================
    def calculate_m04(self, inputs):
        print('🔥 calculate_m04 called!')
        
        # ============================================
        # 🔥 هماهنگ کردن تعداد ردیف‌ها
        # ============================================
        with_asset_fcf = inputs.get('with_asset_fcf', [])
        without_asset_fcf = inputs.get('without_asset_fcf', [])
        
        # پیدا کردن بیشترین تعداد ردیف
        max_rows = max(len(with_asset_fcf), len(without_asset_fcf), 1)
        
        # پر کردن with_asset_fcf با ۰ تا به max_rows برسه
        while len(with_asset_fcf) < max_rows:
            with_asset_fcf.append({
                'id': len(with_asset_fcf) + 1,
                'year': len(with_asset_fcf) + 1,
                'amount': 0
            })
        
        # پر کردن without_asset_fcf با ۰ تا به max_rows برسه
        while len(without_asset_fcf) < max_rows:
            without_asset_fcf.append({
                'id': len(without_asset_fcf) + 1,
                'year': len(without_asset_fcf) + 1,
                'amount': 0
            })
        
        tax_rate = inputs.get('tax_rate', 25) / 100
        discount_rate = inputs.get('discount_rate', 18) / 100
        forecast_horizon = inputs.get('forecast_horizon', max_rows)
        
        # تعداد واقعی سال‌ها = حداقل بین max_rows و forecast_horizon
        actual_horizon = min(max_rows, forecast_horizon)
        
        print(f'📊 with_asset_fcf: {len(with_asset_fcf)} ردیف (هماهنگ شد)')
        print(f'📊 without_asset_fcf: {len(without_asset_fcf)} ردیف (هماهنگ شد)')
        print(f'📊 actual_horizon: {actual_horizon} سال')
        print(f'📊 tax_rate: {tax_rate * 100}%')
        print(f'📊 discount_rate: {discount_rate * 100}%')
        
        # محاسبه تفاضل جریان نقدی (Δ)
        differential_data = []
        for i in range(actual_horizon):
            with_amount = with_asset_fcf[i]['amount']
            without_amount = without_asset_fcf[i]['amount']
            delta = with_amount - without_amount
            after_tax = delta * (1 - tax_rate)
            pv = after_tax / ((1 + discount_rate) ** (i + 1))
            
            differential_data.append({
                'year': i + 1,
                'withFCF': with_amount,
                'withoutFCF': without_amount,
                'delta': delta,
                'afterTax': round(after_tax, 2),
                'pv': round(pv, 2),
                'discountRate': discount_rate,
                'tax': tax_rate,
            })
        
        total_pv = sum(row['pv'] for row in differential_data)
        
        # FCF Data برای نمودار
        fcf_data = []
        for i in range(actual_horizon):
            fcf_data.append({
                'year': i + 1,
                'withFCF': with_asset_fcf[i]['amount'],
                'withoutFCF': without_asset_fcf[i]['amount'],
            })
        
        # Waterfall
        waterfall = []
        cumulative = 0
        
        total_with = sum(row['withFCF'] for row in differential_data)
        cumulative = total_with
        waterfall.append({
            'step': 1,
            'title': 'جریان نقدی با دارایی',
            'amount': total_with,
            'cumulative': cumulative,
            'is_final': False,
            'type': 'increase'
        })
        
        total_without = sum(row['withoutFCF'] for row in differential_data)
        cumulative -= total_without
        waterfall.append({
            'step': 2,
            'title': 'جریان نقدی بدون دارایی',
            'amount': -total_without,
            'cumulative': cumulative,
            'is_final': False,
            'type': 'decrease'
        })
        
        total_delta = total_with - total_without
        cumulative = total_delta
        waterfall.append({
            'step': 3,
            'title': 'تفاضل جریان نقدی (Δ)',
            'amount': total_delta,
            'cumulative': cumulative,
            'is_final': False,
            'type': 'increase'
        })
        
        after_tax_total = total_delta * (1 - tax_rate)
        cumulative = after_tax_total
        waterfall.append({
            'step': 4,
            'title': f'پس از مالیات ({int(tax_rate * 100)}%)',
            'amount': after_tax_total,
            'cumulative': cumulative,
            'is_final': False,
            'type': 'increase'
        })
        
        cumulative = total_pv
        waterfall.append({
            'step': 5,
            'title': f'ارزش نهایی (PV)',
            'amount': total_pv,
            'cumulative': cumulative,
            'is_final': False,
            'type': 'increase'
        })
        
        waterfall.append({
            'step': 6,
            'title': 'ارزش نهایی',
            'amount': 0,
            'cumulative': cumulative,
            'is_final': True,
            'type': 'final'
        })
        
        print(f'📊 total_pv: {total_pv}')
        
        return {
            'final_value': total_pv,
            'confidence_level': 0.82,
            'qc_score': 82,
            'details': {
                'waterfall': waterfall,
                'fcf_data': fcf_data,
                'differential_data': differential_data,
                'summary': {
                    'total_with': total_with,
                    'total_without': total_without,
                    'total_delta': total_delta,
                    'after_tax_total': after_tax_total,
                    'pv_total': total_pv,
                    'tax_rate': tax_rate,
                    'discount_rate': discount_rate,
                    'forecast_horizon': actual_horizon,
                    'final_value': total_pv,
                }
            }
        }

    # ============================================
    # M-05: Replacement Cost Method
    # ============================================
    def calculate_m05(self, inputs):
        labor_breakdown = inputs.get('labor_breakdown', [])
        material_cost = inputs.get('material_infra_cost', 0)
        overhead_pct = inputs.get('overhead_pct', 20) / 100
        profit_pct = inputs.get('developer_profit_pct', 15) / 100
        functional_obs = inputs.get('functional_obs_pct', 0) / 100
        economic_obs = inputs.get('economic_obs_pct', 0) / 100
        
        labor_cost = 0
        labor_details = []
        for item in labor_breakdown:
            person_months = item.get('person_months', 0)
            monthly_rate = item.get('monthly_rate', 0)
            labor_cost += person_months * monthly_rate
            labor_details.append({
                'role': item.get('role', ''),
                'person_months': person_months,
                'monthly_rate': monthly_rate,
            })
        
        waterfall = []
        cumulative = 0
        
        cumulative += labor_cost
        waterfall.append({
            'step': 1,
            'title': 'هزینه مستقیم نیروی کار',
            'amount': labor_cost,
            'cumulative': cumulative,
            'is_final': False,
            'type': 'increase'
        })
        
        cumulative += material_cost
        waterfall.append({
            'step': 2,
            'title': '+ هزینه مواد/زیرساخت',
            'amount': material_cost,
            'cumulative': cumulative,
            'is_final': False,
            'type': 'increase'
        })
        
        overhead_amount = cumulative * overhead_pct
        cumulative += overhead_amount
        waterfall.append({
            'step': 3,
            'title': '+ سربار (' + str(int(overhead_pct * 100)) + '%)',
            'amount': overhead_amount,
            'cumulative': cumulative,
            'is_final': False,
            'type': 'increase'
        })
        
        profit_amount = cumulative * profit_pct
        cumulative += profit_amount
        waterfall.append({
            'step': 4,
            'title': '+ سود توسعه دهنده (' + str(int(profit_pct * 100)) + '%)',
            'amount': profit_amount,
            'cumulative': cumulative,
            'is_final': False,
            'type': 'increase'
        })
        
        func_amount = cumulative * functional_obs
        cumulative -= func_amount
        waterfall.append({
            'step': 5,
            'title': '- منسوخی کارکردی (' + str(int(functional_obs * 100)) + '%)',
            'amount': -func_amount,
            'cumulative': cumulative,
            'is_final': False,
            'type': 'decrease'
        })
        
        econ_amount = cumulative * economic_obs
        cumulative -= econ_amount
        waterfall.append({
            'step': 6,
            'title': '- منسوخی اقتصادی (' + str(int(economic_obs * 100)) + '%)',
            'amount': -econ_amount,
            'cumulative': cumulative,
            'is_final': True,
            'type': 'final'
        })
        
        return {
            'final_value': cumulative,
            'confidence_level': 0.91,
            'qc_score': 91,
            'details': {
                'waterfall': waterfall,
                'labor_details': labor_details,
                'summary': {
                    'labor_cost': labor_cost,
                    'material_cost': material_cost,
                    'overhead_pct': overhead_pct * 100,
                    'profit_pct': profit_pct * 100,
                    'functional_obs': functional_obs * 100,
                    'economic_obs': economic_obs * 100,
                    'final_value': cumulative,
                }
            }
        }

    # ============================================
    # M-06: Reproduction Cost Method
    # ============================================
    def calculate_m06(self, inputs):
        labor_breakdown = inputs.get('labor_breakdown', [])
        direct_cost = inputs.get('direct_reproduction_cost', 0)
        overhead = inputs.get('coordination_overhead', 20) / 100
        obsolescence = inputs.get('relevance_obsolescence', 0) / 100
        age_factor = inputs.get('age_factor', 0)
        
        labor_cost = 0
        labor_details = []
        for item in labor_breakdown:
            person_days = item.get('person_days', 0)
            daily_rate = item.get('daily_rate', 0)
            labor_cost += person_days * daily_rate
            labor_details.append({
                'role': item.get('role', ''),
                'person_days': person_days,
                'daily_rate': daily_rate,
            })
        
        waterfall = []
        cumulative = 0
        
        cumulative += labor_cost
        waterfall.append({
            'step': 1,
            'title': 'هزینه مستقیم نیروی کار',
            'amount': labor_cost,
            'cumulative': cumulative,
            'is_final': False,
            'type': 'increase'
        })
        
        cumulative += direct_cost
        waterfall.append({
            'step': 2,
            'title': '+ هزینه مستقیم بازتولید',
            'amount': direct_cost,
            'cumulative': cumulative,
            'is_final': False,
            'type': 'increase'
        })
        
        overhead_amount = cumulative * overhead
        cumulative += overhead_amount
        waterfall.append({
            'step': 3,
            'title': '+ سربار هماهنگی (' + str(int(overhead * 100)) + '%)',
            'amount': overhead_amount,
            'cumulative': cumulative,
            'is_final': False,
            'type': 'increase'
        })
        
        obs_amount = cumulative * obsolescence
        cumulative -= obs_amount
        waterfall.append({
            'step': 4,
            'title': '- منسوخی مرتبط (' + str(int(obsolescence * 100)) + '%)',
            'amount': -obs_amount,
            'cumulative': cumulative,
            'is_final': False,
            'type': 'decrease'
        })
        
        age_amount = cumulative * age_factor
        cumulative -= age_amount
        waterfall.append({
            'step': 5,
            'title': '- عامل سن (' + str(int(age_factor * 100)) + '%)',
            'amount': -age_amount,
            'cumulative': cumulative,
            'is_final': False,
            'type': 'decrease'
        })
        
        waterfall.append({
            'step': 6,
            'title': 'ارزش نهایی',
            'amount': 0,
            'cumulative': cumulative,
            'is_final': True,
            'type': 'final'
        })
        
        return {
            'final_value': cumulative,
            'confidence_level': 0.90,
            'qc_score': 90,
            'details': {
                'waterfall': waterfall,
                'labor_details': labor_details,
                'summary': {
                    'labor_cost': labor_cost,
                    'direct_cost': direct_cost,
                    'overhead_pct': overhead * 100,
                    'obsolescence_pct': obsolescence * 100,
                    'age_factor': age_factor,
                    'final_value': cumulative,
                }
            }
        }
