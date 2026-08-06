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
            
            if method_id == 'M-01':
                result = self.calculate_m01(inputs)
            elif method_id == 'M-02':
                result = self.calculate_m02(inputs)
            elif method_id == 'M-03':
                result = self.calculate_m03(inputs)
            elif method_id == 'M-04':
                result = self.calculate_m04(inputs)
            elif method_id == 'M-05':
                result = self.calculate_m05(inputs)
            elif method_id == 'M-06':
                result = self.calculate_m06(inputs)
            elif method_id == 'M-07':
                result = self.calculate_m07(inputs)
            elif method_id == 'M-08':
                result = self.calculate_m08(inputs)
            elif method_id == 'M-09':
                result = self.calculate_m09(inputs)
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
    # M-03: DCF (Discounted Cash Flow)
    # ============================================
    def calculate_m03(self, inputs):
        print('🔥 calculate_m03 called!')
        
        # دریافت از STEP 3 - پشتیبانی از هر دو نام
        fcf_data = inputs.get('fcf_data', [])
        if not fcf_data:
            fcf_data = inputs.get('fcf_schedule', [])
        
        intangible_share = inputs.get('intangible_share_percent', inputs.get('intangible_share', 70)) / 100
        forecast_horizon = inputs.get('forecast_horizon', 5)
        tax_rate = inputs.get('tax_rate', 25) / 100
        discount_rate = inputs.get('discount_rate', 18) / 100
        terminal_growth_rate = inputs.get('terminal_growth_rate', 5) / 100
        quality_multiplier = inputs.get('quality_multiplier', 0.85)
        
        print(f'📊 M-03: forecast_horizon = {forecast_horizon}')
        print(f'📊 M-03: fcf_data = {fcf_data}')
        
        # اگر fcf_data خالی بود، خطا بده
        if not fcf_data:
            return {
                'final_value': 0,
                'confidence_level': 0.80,
                'qc_score': 80,
                'details': {
                    'summary': {
                        'error': 'داده‌های FCF در STEP 3 وجود ندارد',
                        'forecast_horizon': forecast_horizon
                    }
                }
            }
        
        # فقط به تعداد forecast_horizon سال محاسبه کن
        yearly_data = []
        total_pv = 0
        
        # محدود کردن به forecast_horizon
        fcf_data_limited = fcf_data[:forecast_horizon]
        
        for i, item in enumerate(fcf_data_limited):
            year = i + 1
            fcf = item.get('fcf', 0)
            pv_factor = 1 / ((1 + discount_rate) ** year)
            pv = fcf * pv_factor
            total_pv += pv
            
            yearly_data.append({
                'year': year,
                'fcf': round(fcf),
                'pv_factor': round(pv_factor, 4),
                'pv': round(pv)
            })
        
        # اگر تعداد FCF ها کمتر از forecast_horizon بود، با ۰ پر کن
        while len(yearly_data) < forecast_horizon:
            year = len(yearly_data) + 1
            pv_factor = 1 / ((1 + discount_rate) ** year)
            yearly_data.append({
                'year': year,
                'fcf': 0,
                'pv_factor': round(pv_factor, 4),
                'pv': 0
            })
        
        # ارزش پایانی
        last_fcf = yearly_data[-1]['fcf'] if yearly_data else 0
        if discount_rate > terminal_growth_rate:
            terminal_value = (last_fcf * (1 + terminal_growth_rate)) / (discount_rate - terminal_growth_rate)
        else:
            terminal_value = 0
        pv_terminal = terminal_value / ((1 + discount_rate) ** forecast_horizon)
        
        # ارزش کل شرکت
        enterprise_value = total_pv + pv_terminal
        
        # اعمال سهم دارایی نامشهود
        intangible_value = enterprise_value * intangible_share
        
        # اعمال ضریب کیفیت
        final_value = intangible_value * quality_multiplier
        
        # Waterfall
        waterfall = []
        cumulative = 0
        
        cumulative += total_pv
        waterfall.append({
            'step': 1,
            'title': f'جمع ارزش فعلی FCF ({forecast_horizon} سال)',
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
        
        cumulative = enterprise_value
        waterfall.append({
            'step': 3,
            'title': 'ارزش کل شرکت (EV)',
            'amount': round(enterprise_value),
            'cumulative': round(cumulative),
            'is_final': False,
            'type': 'increase'
        })
        
        cumulative = intangible_value
        waterfall.append({
            'step': 4,
            'title': f'× سهم دارایی نامشهود ({intangible_share * 100:.0f}%)',
            'amount': round(intangible_value - enterprise_value),
            'cumulative': round(cumulative),
            'is_final': False,
            'type': 'increase'
        })
        
        cumulative = final_value
        waterfall.append({
            'step': 5,
            'title': f'× ضریب کیفیت ({quality_multiplier:.2f})',
            'amount': round(final_value - intangible_value),
            'cumulative': round(cumulative),
            'is_final': False,
            'type': 'increase'
        })
        
        waterfall.append({
            'step': 6,
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
                    'discount_rate': discount_rate,
                    'tax_rate': tax_rate,
                    'terminal_growth_rate': terminal_growth_rate,
                    'forecast_horizon': forecast_horizon,
                    'quality_multiplier': quality_multiplier,
                    'intangible_share': intangible_share,
                    'total_pv': round(total_pv),
                    'terminal_value': round(terminal_value),
                    'pv_terminal': round(pv_terminal),
                    'enterprise_value': round(enterprise_value),
                    'intangible_value': round(intangible_value),
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
    # ============================================
    # M-07: TWC (Trained Workforce / Team Cost)
    # ============================================
    def calculate_m07(self, inputs):
        print('🔥 calculate_m07 called!')
        print(f'📥 Inputs: {inputs}')
        
        # دریافت از STEP 3
        team_members = inputs.get('team_members', [])
        ramp_up_duration = inputs.get('ramp_up_duration', 6)  # ماه
        productivity_loss = inputs.get('productivity_loss', 30) / 100
        turnover_rate = inputs.get('turnover_rate', 8) / 100
        quality_multiplier = inputs.get('quality_multiplier', 0.87)
        discount_rate = inputs.get('discount_rate', 18) / 100
        tax_rate = inputs.get('tax_rate', 25) / 100
        
        print(f'📊 team_members: {team_members}')
        print(f'📊 ramp_up_duration: {ramp_up_duration}')
        print(f'📊 productivity_loss: {productivity_loss}')
        print(f'📊 turnover_rate: {turnover_rate}')
        print(f'📊 quality_multiplier: {quality_multiplier}')
        
        # گام ۱: محاسبه هزینه‌ها
        recruit_total = 0
        train_total = 0
        salary_total = 0
        team_details = []
        
        for member in team_members:
            headcount = member.get('headcount', 0)
            recruit_cost = member.get('recruit_cost', 0)
            train_cost = member.get('train_cost', 0)
            salary = member.get('avg_salary', member.get('salary', 0))
            
            recruit_total += headcount * recruit_cost
            train_total += headcount * train_cost
            salary_total += headcount * salary
            
            team_details.append({
                'role': member.get('role', ''),
                'headcount': headcount,
                'recruit_cost': recruit_cost,
                'train_cost': train_cost,
                'salary': salary,
                'recruit_total': headcount * recruit_cost,
                'train_total': headcount * train_cost,
                'salary_total': headcount * salary
            })
        
        print(f'📊 recruit_total: {recruit_total}')
        print(f'📊 train_total: {train_total}')
        print(f'📊 salary_total: {salary_total}')
        
        # گام ۲: هزینه کاهش بهره‌وری
        productivity_loss_cost = salary_total * (ramp_up_duration / 12) * productivity_loss
        
        # گام ۳: هزینه جابجایی
        turnover_cost = (recruit_total + train_total) * turnover_rate
        
        # گام ۴: جمع هزینه کل بازسازی
        total_replacement_cost = recruit_total + train_total + productivity_loss_cost + turnover_cost
        
        # گام ۵: اعمال ضریب کیفیت
        final_value = total_replacement_cost * quality_multiplier
        
        print(f'📊 total_replacement_cost: {total_replacement_cost}')
        print(f'📊 final_value: {final_value}')
        
        # Waterfall
        waterfall = []
        cumulative = 0
        
        cumulative += recruit_total
        waterfall.append({
            'step': 1,
            'title': 'هزینه جذب کل',
            'amount': round(recruit_total),
            'cumulative': round(cumulative),
            'is_final': False,
            'type': 'increase'
        })
        
        cumulative += train_total
        waterfall.append({
            'step': 2,
            'title': 'هزینه آموزش کل',
            'amount': round(train_total),
            'cumulative': round(cumulative),
            'is_final': False,
            'type': 'increase'
        })
        
        cumulative += productivity_loss_cost
        waterfall.append({
            'step': 3,
            'title': f'کاهش بهره‌وری ({ramp_up_duration} ماه)',
            'amount': round(productivity_loss_cost),
            'cumulative': round(cumulative),
            'is_final': False,
            'type': 'increase'
        })
        
        cumulative += turnover_cost
        waterfall.append({
            'step': 4,
            'title': f'هزینه جابجایی ({turnover_rate * 100:.0f}%)',
            'amount': round(turnover_cost),
            'cumulative': round(cumulative),
            'is_final': False,
            'type': 'increase'
        })
        
        cumulative = total_replacement_cost
        waterfall.append({
            'step': 5,
            'title': 'هزینه کل بازسازی',
            'amount': round(total_replacement_cost),
            'cumulative': round(cumulative),
            'is_final': False,
            'type': 'increase'
        })
        
        cumulative = final_value
        waterfall.append({
            'step': 6,
            'title': f'× ضریب کیفیت ({quality_multiplier:.2f})',
            'amount': round(final_value - total_replacement_cost),
            'cumulative': round(cumulative),
            'is_final': False,
            'type': 'increase'
        })
        
        waterfall.append({
            'step': 7,
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
                'team_details': team_details,
                'summary': {
                    'recruit_total': round(recruit_total),
                    'train_total': round(train_total),
                    'productivity_loss_cost': round(productivity_loss_cost),
                    'turnover_cost': round(turnover_cost),
                    'total_replacement_cost': round(total_replacement_cost),
                    'quality_multiplier': quality_multiplier,
                    'ramp_up_duration': ramp_up_duration,
                    'productivity_loss': productivity_loss,
                    'turnover_rate': turnover_rate,
                    'final_value': round(final_value),
                }
            }
    }
        # ============================================
    # M-08: CTM (Comparable Transactions Method)
    # ============================================
    def calculate_m08(self, inputs):
        print('🔥 calculate_m08 called!')
        print(f'📥 Inputs keys: {list(inputs.keys())}')
        
        # ============================================
        # ۱. دریافت ورودی‌ها از STEP 3
        # ============================================
        
        # معاملات مشابه - می‌تواند از STEP 3 بیاید یا خالی باشد
        comparable_deals = inputs.get('comparable_deals', [])
        
        # پارامترهای پایه از STEP 2
        discount_rate = inputs.get('discount_rate', 18) / 100
        tax_rate = inputs.get('tax_rate', 25) / 100
        quality_multiplier = inputs.get('quality_multiplier', 0.83)
        source_reliability = inputs.get('source_reliability', 'High')
        
        # پارامترهای اختصاصی از STEP 3
        market_comparability_context = inputs.get('market_comparability_context', 'High')
        industry_classification = inputs.get('industry_classification', 'Software')
        
        # ============================================
        # ۲. اعتبارسنجی و تکمیل داده‌ها
        # ============================================
        
        # اگر معامله‌ای وجود نداشت، از داده‌های نمونه استفاده کن (برای تست)
        if not comparable_deals:
            comparable_deals = [
                {
                    'deal_id': 'Deal-001',
                    'transaction_price': 110000000,
                    'deal_weight_percent': 0.33,
                    'adjustments': {
                        'size': 0.06,
                        'time': 0.02,
                        'geographic': -0.01,
                        'other': -0.01
                    }
                },
                {
                    'deal_id': 'Deal-002',
                    'transaction_price': 120000000,
                    'deal_weight_percent': 0.34,
                    'adjustments': {
                        'size': 0.05,
                        'time': 0.01,
                        'geographic': 0.00,
                        'other': -0.01
                    }
                },
                {
                    'deal_id': 'Deal-003',
                    'transaction_price': 130000000,
                    'deal_weight_percent': 0.33,
                    'adjustments': {
                        'size': 0.07,
                        'time': 0.03,
                        'geographic': -0.02,
                        'other': -0.01
                    }
                }
            ]
        
        # ============================================
        # ۳. گام ۱: محاسبه قیمت تعدیل‌شده هر معامله
        # ============================================
        
        adjusted_prices = []
        total_adjustment_sum = 0
        
        for deal in comparable_deals:
            transaction_price = deal.get('transaction_price', 0)
            adjustments = deal.get('adjustments', {})
            deal_weight = deal.get('deal_weight_percent', 1.0 / len(comparable_deals))
            
            # محاسبه مجموع تعدیلات
            total_adjustment = sum(adjustments.values())
            total_adjustment_sum += total_adjustment
            
            # قیمت تعدیل‌شده
            adjusted_price = transaction_price * (1 + total_adjustment)
            
            adjusted_prices.append({
                'deal_id': deal.get('deal_id', f'Deal-{len(adjusted_prices)+1:03d}'),
                'transaction_price': transaction_price,
                'deal_weight_percent': deal_weight,
                'adjustments': adjustments,
                'total_adjustment': total_adjustment,
                'adjusted_price': round(adjusted_price)
            })
        
        # ============================================
        # ۴. گام ۲: محاسبه میانگین وزنی قیمت تعدیل‌شده
        # ============================================
        
        weighted_sum = 0
        total_weight = 0
        
        for item in adjusted_prices:
            weighted_sum += item['adjusted_price'] * item['deal_weight_percent']
            total_weight += item['deal_weight_percent']
        
        # نرمال‌سازی وزن‌ها (اگر مجموع وزن‌ها ۱ نبود)
        if total_weight != 1.0 and total_weight > 0:
            weighted_average_price = weighted_sum / total_weight
        else:
            weighted_average_price = weighted_sum
        
        weighted_average_price = round(weighted_average_price)
        
        # ============================================
        # ۵. گام ۳: محاسبه میانه قیمت تعدیل‌شده
        # ============================================
        
        sorted_prices = sorted([item['adjusted_price'] for item in adjusted_prices])
        n = len(sorted_prices)
        
        if n % 2 == 1:
            median_price = sorted_prices[n // 2]
        else:
            median_price = (sorted_prices[n // 2 - 1] + sorted_prices[n // 2]) / 2
        
        median_price = round(median_price)
        
        # ============================================
        # ۶. گام ۴: انتخاب قیمت مبنا
        # ============================================
        
        # سیستم به‌طور خودکار از میانگین وزنی به‌عنوان قیمت مبنا استفاده می‌کند
        base_price = weighted_average_price
        
        # ============================================
        # ۷. گام ۵: اعمال ضریب کیفیت
        # ============================================
        
        final_value = base_price * quality_multiplier
        final_value = round(final_value)
        
        # ============================================
        # ۸. محاسبات تکمیلی
        # ============================================
        
        min_price = min(sorted_prices) if sorted_prices else 0
        max_price = max(sorted_prices) if sorted_prices else 0
        price_range = max_price - min_price
        
        average_adjustment = total_adjustment_sum / len(adjusted_prices) if adjusted_prices else 0
        
        # ============================================
        # ۹. ساخت Waterfall
        # ============================================
        
        waterfall = []
        cumulative = 0
        
        # مرحله ۱: نمایش معاملات
        for idx, item in enumerate(adjusted_prices, 1):
            weighted_amount = round(item['adjusted_price'] * item['deal_weight_percent'])
            cumulative += weighted_amount
            waterfall.append({
                'step': idx,
                'title': f"معامله {item['deal_id']} (وزن: {int(item['deal_weight_percent'] * 100)}%)",
                'amount': weighted_amount,
                'cumulative': round(cumulative),
                'is_final': False,
                'type': 'increase'
            })
        
        # مرحله ۲: میانگین وزنی
        waterfall.append({
            'step': len(adjusted_prices) + 1,
            'title': 'میانگین وزنی قیمت تعدیل‌شده',
            'amount': weighted_average_price,
            'cumulative': weighted_average_price,
            'is_final': False,
            'type': 'increase'
        })
        
        # مرحله ۳: میانه (برای مرجع)
        waterfall.append({
            'step': len(adjusted_prices) + 2,
            'title': f'میانه قیمت تعدیل‌شده (برای مرجع)',
            'amount': median_price,
            'cumulative': median_price,
            'is_final': False,
            'type': 'increase'
        })
        
        # مرحله ۴: قیمت مبنا
        waterfall.append({
            'step': len(adjusted_prices) + 3,
            'title': 'قیمت مبنا (میانگین وزنی)',
            'amount': base_price,
            'cumulative': base_price,
            'is_final': False,
            'type': 'increase'
        })
        
        # مرحله ۵: ضریب کیفیت
        quality_adjustment = final_value - base_price
        waterfall.append({
            'step': len(adjusted_prices) + 4,
            'title': f'× ضریب کیفیت ({quality_multiplier:.2f})',
            'amount': quality_adjustment,
            'cumulative': final_value,
            'is_final': False,
            'type': 'increase' if quality_adjustment >= 0 else 'decrease'
        })
        
        # مرحله ۶: ارزش نهایی
        waterfall.append({
            'step': len(adjusted_prices) + 5,
            'title': 'ارزش نهایی',
            'amount': 0,
            'cumulative': final_value,
            'is_final': True,
            'type': 'final'
        })
        
        # ============================================
        # ۱۰. ساخت خروجی
        # ============================================
        
        return {
            'final_value': final_value,
            'confidence_level': 0.85,
            'qc_score': 85,
            'details': {
                'waterfall': waterfall,
                'adjusted_prices': adjusted_prices,
                'summary': {
                    'deal_count': len(adjusted_prices),
                    'weighted_average_price': weighted_average_price,
                    'median_price': median_price,
                    'min_price': min_price,
                    'max_price': max_price,
                    'price_range': price_range,
                    'average_adjustment_percent': round(average_adjustment, 4),
                    'base_price_selected': base_price,
                    'quality_multiplier': quality_multiplier,
                    'final_value': final_value,
                    'discount_rate': discount_rate,
                    'tax_rate': tax_rate,
                    'market_comparability_context': market_comparability_context,
                    'industry_classification': industry_classification,
                    'source_reliability': source_reliability,
                }
            }
        }    

    # ============================================
    # M-09: MMM (Market Multiples Method)
    # ============================================
    def calculate_m09(self, inputs):
        print('🔥 calculate_m09 called!')
        
        base_metric = inputs.get('base_metric', 'revenue')
        base_metric_value = inputs.get('base_metric_value', 100000000000)
        market_multiple = inputs.get('market_multiple', 2.5)
        control_premium_percent = inputs.get('control_premium_percent', 10) / 100
        marketability_discount_percent = inputs.get('marketability_discount_percent', 20) / 100
        intangible_share_percent = inputs.get('intangible_share_percent', 40) / 100
        quality_multiplier = inputs.get('quality_multiplier', 0.86)
        
        enterprise_value = base_metric_value * market_multiple
        control_premium_amount = enterprise_value * control_premium_percent
        enterprise_value_after_premium = enterprise_value + control_premium_amount
        marketability_discount_amount = enterprise_value_after_premium * marketability_discount_percent
        enterprise_value_after_discount = enterprise_value_after_premium - marketability_discount_amount
        intangible_value_before_quality = enterprise_value_after_discount * intangible_share_percent
        final_value = intangible_value_before_quality * quality_multiplier
        
        waterfall = []
        cumulative = 0
        cumulative += enterprise_value
        waterfall.append({
            'step': 1,
            'title': 'ارزش شرکت (EV)',
            'amount': round(enterprise_value),
            'cumulative': round(cumulative),
            'is_final': False,
            'type': 'increase'
        })
        cumulative += control_premium_amount
        waterfall.append({
            'step': 2,
            'title': f'+ صرف کنترل ({int(control_premium_percent * 100)}%)',
            'amount': round(control_premium_amount),
            'cumulative': round(cumulative),
            'is_final': False,
            'type': 'increase'
        })
        cumulative -= marketability_discount_amount
        waterfall.append({
            'step': 3,
            'title': f'- تخفیف بازارپذیری ({int(marketability_discount_percent * 100)}%)',
            'amount': -round(marketability_discount_amount),
            'cumulative': round(cumulative),
            'is_final': False,
            'type': 'decrease'
        })
        cumulative = enterprise_value_after_discount
        waterfall.append({
            'step': 4,
            'title': f'× سهم دارایی نامشهود ({int(intangible_share_percent * 100)}%)',
            'amount': round(intangible_value_before_quality - enterprise_value_after_discount),
            'cumulative': round(cumulative),
            'is_final': False,
            'type': 'increase'
        })
        cumulative = intangible_value_before_quality
        waterfall.append({
            'step': 5,
            'title': f'× ضریب کیفیت ({quality_multiplier:.2f})',
            'amount': round(final_value - intangible_value_before_quality),
            'cumulative': round(cumulative),
            'is_final': False,
            'type': 'increase'
        })
        cumulative = final_value
        waterfall.append({
            'step': 6,
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
                'summary': {
                    'base_metric': base_metric,
                    'base_metric_value': base_metric_value,
                    'market_multiple': market_multiple,
                    'control_premium_percent': control_premium_percent,
                    'marketability_discount_percent': marketability_discount_percent,
                    'intangible_share_percent': intangible_share_percent,
                    'quality_multiplier': quality_multiplier,
                    'enterprise_value': round(enterprise_value),
                    'enterprise_value_after_premium': round(enterprise_value_after_premium),
                    'enterprise_value_after_discount': round(enterprise_value_after_discount),
                    'intangible_value_before_quality': round(intangible_value_before_quality),
                    'final_value': round(final_value),
                }
            }
        }

