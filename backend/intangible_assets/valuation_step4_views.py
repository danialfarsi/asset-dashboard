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
            
            if method_id == 'M-02':
                result = self.calculate_m02(inputs)
            elif method_id == 'M-04':
                result = self.calculate_m04(inputs)
            elif method_id == 'M-01':
                result = self.calculate_m01(inputs)
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
    # M-01: Relief-from-Royalty (RfR) Method
    # ============================================
    def calculate_m01(self, inputs):
        print('🔥 calculate_m01 called!')
        
        royalty_rate = inputs.get('royalty_rate', 4) / 100
        revenue_attribution = inputs.get('revenue_attribution', 80) / 100
        revenue_growth_rate = inputs.get('revenue_growth_rate', 8) / 100
        quality_multiplier = inputs.get('quality_multiplier', 0.92)
        tax_rate = inputs.get('tax_rate', 25) / 100
        discount_rate = inputs.get('discount_rate', 18) / 100
        terminal_growth_rate = inputs.get('terminal_growth_rate', 5) / 100
        forecast_horizon = inputs.get('forecast_horizon', 5)
        current_revenue = inputs.get('current_revenue', 500000000000)
        
        effective_rate = royalty_rate * revenue_attribution
        yearly_data = []
        revenue = current_revenue
        total_pv = 0
        
        for year in range(1, forecast_horizon + 1):
            revenue = revenue * (1 + revenue_growth_rate)
            gross_royalty = revenue * effective_rate
            after_tax = gross_royalty * (1 - tax_rate)
            pv_factor = 1 / ((1 + discount_rate) ** year)
            pv = after_tax * pv_factor
            total_pv += pv
            yearly_data.append({
                'year': year,
                'revenue': round(revenue),
                'gross_royalty': round(gross_royalty),
                'after_tax': round(after_tax),
                'pv_factor': round(pv_factor, 4),
                'pv': round(pv)
            })
        
        last_after_tax = yearly_data[-1]['after_tax']
        terminal_value = (last_after_tax * (1 + terminal_growth_rate)) / (discount_rate - terminal_growth_rate)
        pv_terminal = terminal_value / ((1 + discount_rate) ** forecast_horizon)
        value_before_quality = total_pv + pv_terminal
        final_value = value_before_quality * quality_multiplier
        
        waterfall = []
        cumulative = 0
        cumulative += total_pv
        waterfall.append({
            'step': 1,
            'title': f'جمع ارزش فعلی دوره صریح ({forecast_horizon} سال)',
            'amount': round(total_pv),
            'cumulative': round(cumulative),
            'is_final': False,
            'type': 'increase'
        })
        cumulative += pv_terminal
        waterfall.append({
            'step': 2,
            'title': 'ارزش پایانی تنزیل‌شده',
            'amount': round(pv_terminal),
            'cumulative': round(cumulative),
            'is_final': False,
            'type': 'increase'
        })
        cumulative = value_before_quality
        waterfall.append({
            'step': 3,
            'title': f'ارزش قبل از ضریب کیفیت',
            'amount': round(value_before_quality),
            'cumulative': round(cumulative),
            'is_final': False,
            'type': 'increase'
        })
        cumulative = final_value
        waterfall.append({
            'step': 4,
            'title': f'× ضریب کیفیت ({quality_multiplier:.2f})',
            'amount': round(final_value - value_before_quality),
            'cumulative': round(cumulative),
            'is_final': False,
            'type': 'increase'
        })
        waterfall.append({
            'step': 5,
            'title': 'ارزش نهایی',
            'amount': 0,
            'cumulative': round(cumulative),
            'is_final': True,
            'type': 'final'
        })
        
        return {
            'final_value': round(final_value),
            'confidence_level': 0.82,
            'qc_score': 82,
            'details': {
                'waterfall': waterfall,
                'yearly_data': yearly_data,
                'summary': {
                    'royalty_rate': royalty_rate * 100,
                    'revenue_attribution': revenue_attribution * 100,
                    'effective_rate': effective_rate * 100,
                    'revenue_growth_rate': revenue_growth_rate * 100,
                    'tax_rate': tax_rate * 100,
                    'discount_rate': discount_rate * 100,
                    'terminal_growth_rate': terminal_growth_rate * 100,
                    'forecast_horizon': forecast_horizon,
                    'quality_multiplier': quality_multiplier,
                    'current_revenue': current_revenue,
                    'total_pv': round(total_pv),
                    'terminal_value': round(terminal_value),
                    'pv_terminal': round(pv_terminal),
                    'value_before_quality': round(value_before_quality),
                    'final_value': round(final_value),
                }
            }
        }

    # ============================================
    # M-02: MEEM (Multi-Period Excess Earnings)
    # ============================================
    def calculate_m02(self, inputs):
        print('🔥 calculate_m02 called!')
        
        ebit_attributable = inputs.get('ebit_attributable', 20000000000)
        contributory_assets = inputs.get('contributory_assets', [])
        attrition_rate = inputs.get('customer_attrition_rate', 10) / 100
        forecast_horizon = inputs.get('forecast_horizon', 5)
        tax_rate = inputs.get('tax_rate', 25) / 100
        discount_rate = inputs.get('discount_rate', 18) / 100
        terminal_growth_rate = inputs.get('terminal_growth_rate', 5) / 100
        quality_multiplier = inputs.get('quality_multiplier', 0.89)
        
        total_cac_charge = 0
        asset_details = []
        for asset in contributory_assets:
            asset_value = asset.get('asset_value', 0)
            return_rate = asset.get('return_rate', 0) / 100
            annual_charge = asset_value * return_rate
            total_cac_charge += annual_charge
            asset_details.append({
                'type': asset.get('asset_type', ''),
                'value': asset_value,
                'return_rate': return_rate,
                'annual_charge': annual_charge
            })
        
        excess_earnings_before_tax = ebit_attributable - total_cac_charge
        yearly_data = []
        total_pv = 0
        
        for year in range(1, forecast_horizon + 1):
            survival_rate = (1 - attrition_rate) ** (year - 1)
            excess_after_tax = excess_earnings_before_tax * survival_rate * (1 - tax_rate)
            pv_factor = 1 / ((1 + discount_rate) ** year)
            pv = excess_after_tax * pv_factor
            total_pv += pv
            
            yearly_data.append({
                'year': year,
                'survival_rate': round(survival_rate, 4),
                'excess_earnings_after_tax': round(excess_after_tax),
                'pv': round(pv)
            })
        
        last_after_tax = yearly_data[-1]['excess_earnings_after_tax']
        terminal_value = (last_after_tax * (1 + terminal_growth_rate)) / (discount_rate - terminal_growth_rate)
        pv_terminal = terminal_value / ((1 + discount_rate) ** forecast_horizon)
        value_before_quality = total_pv + pv_terminal
        final_value = value_before_quality * quality_multiplier
        
        waterfall = []
        cumulative = 0
        cumulative += total_pv
        waterfall.append({
            'step': 1,
            'title': f'جمع ارزش فعلی دوره صریح ({forecast_horizon} سال)',
            'amount': round(total_pv),
            'cumulative': round(cumulative),
            'is_final': False,
            'type': 'increase'
        })
        cumulative += pv_terminal
        waterfall.append({
            'step': 2,
            'title': 'ارزش پایانی تنزیل‌شده',
            'amount': round(pv_terminal),
            'cumulative': round(cumulative),
            'is_final': False,
            'type': 'increase'
        })
        cumulative = value_before_quality
        waterfall.append({
            'step': 3,
            'title': f'ارزش قبل از ضریب کیفیت',
            'amount': round(value_before_quality),
            'cumulative': round(cumulative),
            'is_final': False,
            'type': 'increase'
        })
        cumulative = final_value
        waterfall.append({
            'step': 4,
            'title': f'× ضریب کیفیت ({quality_multiplier:.2f})',
            'amount': round(final_value - value_before_quality),
            'cumulative': round(cumulative),
            'is_final': False,
            'type': 'increase'
        })
        waterfall.append({
            'step': 5,
            'title': 'ارزش نهایی',
            'amount': 0,
            'cumulative': round(cumulative),
            'is_final': True,
            'type': 'final'
        })
        
        return {
            'final_value': round(final_value),
            'confidence_level': 0.82,
            'qc_score': 82,
            'details': {
                'waterfall': waterfall,
                'yearly_data': yearly_data,
                'contributory_assets': asset_details,
                'summary': {
                    'ebit_attributable': ebit_attributable,
                    'attrition_rate': attrition_rate,
                    'discount_rate': discount_rate,
                    'tax_rate': tax_rate,
                    'terminal_growth_rate': terminal_growth_rate,
                    'forecast_horizon': forecast_horizon,
                    'quality_multiplier': quality_multiplier,
                    'total_cac_charge': round(total_cac_charge),
                    'excess_earnings_before_tax': round(excess_earnings_before_tax),
                    'total_pv': round(total_pv),
                    'terminal_value': round(terminal_value),
                    'pv_terminal': round(pv_terminal),
                    'value_before_quality': round(value_before_quality),
                    'final_value': round(final_value),
                }
            }
        }

    # ============================================
    # M-04: With-and-Without Method
    # ============================================
    def calculate_m04(self, inputs):
        print('🔥 calculate_m04 called!')
        
        with_asset_fcf = inputs.get('with_asset_fcf', [])
        without_asset_fcf = inputs.get('without_asset_fcf', [])
        
        max_rows = max(len(with_asset_fcf), len(without_asset_fcf), 1)
        
        while len(with_asset_fcf) < max_rows:
            with_asset_fcf.append({
                'id': len(with_asset_fcf) + 1,
                'year': len(with_asset_fcf) + 1,
                'amount': 0
            })
        
        while len(without_asset_fcf) < max_rows:
            without_asset_fcf.append({
                'id': len(without_asset_fcf) + 1,
                'year': len(without_asset_fcf) + 1,
                'amount': 0
            })
        
        tax_rate = inputs.get('tax_rate', 25) / 100
        discount_rate = inputs.get('discount_rate', 18) / 100
        forecast_horizon = inputs.get('forecast_horizon', max_rows)
        
        actual_horizon = min(max_rows, forecast_horizon)
        
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
        
        fcf_data = []
        for i in range(actual_horizon):
            fcf_data.append({
                'year': i + 1,
                'withFCF': with_asset_fcf[i]['amount'],
                'withoutFCF': without_asset_fcf[i]['amount'],
            })
        
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
