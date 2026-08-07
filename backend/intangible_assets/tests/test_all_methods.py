"""
تست کامل ۹ روش ارزش‌گذاری
"""

from django.test import TestCase
from django.contrib.auth import get_user_model

from intangible_assets.models import ScreenedAsset
from intangible_assets.valuation_models import ValuationCase, AssetType
from intangible_assets.valuation_step3_models import ValuationStep3
from intangible_assets.valuation_step4_models import ValuationStep4
from intangible_assets.valuation_formulas import (
    calculate_m01, calculate_m02, calculate_m03,
    calculate_m04, calculate_m05, calculate_m06,
    calculate_m07, calculate_m08, calculate_m09
)

User = get_user_model()


class TestAll9Methods(TestCase):
    """تست همه ۹ روش ارزش‌گذاری"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='test123456'
        )

        self.asset_type = AssetType.objects.create(
            name='نرم‌افزار',
            code='SW',
            description='نرم‌افزارهای اختصاصی'
        )

        self.base_step2_data = {
            'category': 'operational',
            'business_unit': 'واحد تست',
            'lifecycle_stage': 'growth',
            'currency': 'IRR',
            'inflation_basis': 'cost',
            'tax_rate': 0.25,
            'discount_rate': 0.18,
            'forecast_horizon': 5,
            'terminal_growth_rate': 0.05,
            'current_revenue': 500000000000,
            'useful_life': 5,
            'source_reliability': 'high',
            'quality_multiplier': 0.85,
        }

    def create_test_asset(self, name, uid, method):
        return ScreenedAsset.objects.create(
            asset_name=name,
            asset_uid=uid,
            asset_type=self.asset_type,
            category='operational',
            result='completed',
            discovery_date='2026-01-01',
            valuation_method=method,
            created_by=self.user,
            description=f'دارایی تست برای روش {method}'
        )

    def create_valuation_case(self, asset, step2_data):
        return ValuationCase.objects.create(
            asset=asset,
            category=step2_data.get('category', 'operational'),
            business_unit=step2_data.get('business_unit', 'واحد تست'),
            lifecycle_stage=step2_data.get('lifecycle_stage', 'growth'),
            currency=step2_data.get('currency', 'IRR'),
            inflation_basis=step2_data.get('inflation_basis', 'cost'),
            tax_rate=step2_data.get('tax_rate', 0.25),
            discount_rate=step2_data.get('discount_rate', 0.18),
            forecast_horizon=step2_data.get('forecast_horizon', 5),
            terminal_growth_rate=step2_data.get('terminal_growth_rate', 0.05),
            current_revenue=step2_data.get('current_revenue', 500000000000),
            useful_life=step2_data.get('useful_life', 5),
            source_reliability=step2_data.get('source_reliability', 'high'),
            status='draft',
            created_by=self.user,
        )

    def create_step3(self, case, method_id, inputs):
        return ValuationStep3.objects.create(
            valuation_case=case,
            method_id=method_id,
            method_inputs=inputs,
            validation_status='VALIDATED'
        )

    def calculate_step4(self, case, method_id, inputs):
        method_map = {
            'M-01': calculate_m01,
            'M-02': calculate_m02,
            'M-03': calculate_m03,
            'M-04': calculate_m04,
            'M-05': calculate_m05,
            'M-06': calculate_m06,
            'M-07': calculate_m07,
            'M-08': calculate_m08,
            'M-09': calculate_m09,
        }
        calculate_func = method_map.get(method_id)
        if not calculate_func:
            return None
        final_value = calculate_func(inputs)
        return ValuationStep4.objects.create(
            valuation_case=case,
            method_id=method_id,
            final_value=final_value,
            confidence_level=0.85,
            qc_score=85,
            calculation_details={'summary': inputs},
            step4_status='CALCULATED'
        )

    def test_m01(self):
        print("\n🧪 تست M-01: RfR")
        asset = self.create_test_asset('دارایی تست M-01', 'IA-TEST-M01-000001', 'M-01')
        case = self.create_valuation_case(asset, self.base_step2_data)
        inputs = {
            'royalty_rate': 4, 'revenue_attribution': 80, 'revenue_growth_rate': 8,
            'quality_multiplier': 0.92, 'tax_rate': 0.25, 'discount_rate': 0.18,
            'terminal_growth_rate': 0.05, 'forecast_horizon': 5, 'current_revenue': 500000000000,
        }
        self.create_step3(case, 'M-01', inputs)
        step4 = self.calculate_step4(case, 'M-01', inputs)
        print(f"  ✅ M-01 Final Value: {step4.final_value:,.0f} IRR")
        self.assertIsNotNone(step4)
        self.assertGreater(step4.final_value, 0)

    def test_m02(self):
        print("\n🧪 تست M-02: MEEM")
        asset = self.create_test_asset('دارایی تست M-02', 'IA-TEST-M02-000001', 'M-02')
        case = self.create_valuation_case(asset, self.base_step2_data)
        inputs = {
            'ebit_attributable': 20000000000,
            'contributory_assets': [{'asset_type': 'cash', 'asset_value': 10000000000, 'return_rate': 8}],
            'customer_attrition_rate': 10, 'quality_multiplier': 0.89,
            'tax_rate': 0.25, 'discount_rate': 0.18, 'terminal_growth_rate': 0.05,
            'forecast_horizon': 5,
        }
        self.create_step3(case, 'M-02', inputs)
        step4 = self.calculate_step4(case, 'M-02', inputs)
        print(f"  ✅ M-02 Final Value: {step4.final_value:,.0f} IRR")
        self.assertIsNotNone(step4)
        self.assertGreater(step4.final_value, 0)

    def test_m03(self):
        print("\n🧪 تست M-03: DCF")
        asset = self.create_test_asset('دارایی تست M-03', 'IA-TEST-M03-000001', 'M-03')
        case = self.create_valuation_case(asset, self.base_step2_data)
        inputs = {
            'fcf_schedule': [{'year': 1, 'fcf': 80000000}, {'year': 2, 'fcf': 90000000}, {'year': 3, 'fcf': 100000000}, {'year': 4, 'fcf': 110000000}, {'year': 5, 'fcf': 120000000}],
            'intangible_share_percent': 70, 'quality_multiplier': 0.85,
            'tax_rate': 0.25, 'discount_rate': 0.18, 'terminal_growth_rate': 0.05,
            'forecast_horizon': 5,
        }
        self.create_step3(case, 'M-03', inputs)
        step4 = self.calculate_step4(case, 'M-03', inputs)
        print(f"  ✅ M-03 Final Value: {step4.final_value:,.0f} IRR")
        self.assertIsNotNone(step4)
        self.assertGreater(step4.final_value, 0)

    def test_m04(self):
        print("\n🧪 تست M-04: WWM")
        asset = self.create_test_asset('دارایی تست M-04', 'IA-TEST-M04-000001', 'M-04')
        case = self.create_valuation_case(asset, self.base_step2_data)
        inputs = {
            'with_asset_fcf': [{'year': 1, 'amount': 80000000}, {'year': 2, 'amount': 90000000}, {'year': 3, 'amount': 100000000}, {'year': 4, 'amount': 110000000}, {'year': 5, 'amount': 120000000}],
            'without_asset_fcf': [{'year': 1, 'amount': 40000000}, {'year': 2, 'amount': 45000000}, {'year': 3, 'amount': 50000000}, {'year': 4, 'amount': 55000000}, {'year': 5, 'amount': 60000000}],
            'ramp_up_period': 6, 'revenue_attribution': 80, 'revenue_growth_rate': 8,
            'quality_multiplier': 0.85, 'tax_rate': 0.25, 'discount_rate': 0.18,
            'forecast_horizon': 5,
        }
        self.create_step3(case, 'M-04', inputs)
        step4 = self.calculate_step4(case, 'M-04', inputs)
        print(f"  ✅ M-04 Final Value: {step4.final_value:,.0f} IRR")
        self.assertIsNotNone(step4)
        self.assertGreater(step4.final_value, 0)

    def test_m05(self):
        print("\n🧪 تست M-05: RCM")
        asset = self.create_test_asset('دارایی تست M-05', 'IA-TEST-M05-000001', 'M-05')
        case = self.create_valuation_case(asset, self.base_step2_data)
        inputs = {
            'labor_breakdown': [{'role': 'برنامه نویس', 'person_months': 100, 'monthly_rate': 12000000}, {'role': 'مدیر پروژه', 'person_months': 23, 'monthly_rate': 435355}],
            'material_infra_cost': 100000000,
            'overhead_pct': 12, 'developer_profit_pct': 12,
            'functional_obs_pct': 0, 'economic_obs_pct': 7,
            'quality_multiplier': 0.85, 'tax_rate': 0.25, 'discount_rate': 0.18,
            'forecast_horizon': 5,
        }
        self.create_step3(case, 'M-05', inputs)
        step4 = self.calculate_step4(case, 'M-05', inputs)
        print(f"  ✅ M-05 Final Value: {step4.final_value:,.0f} IRR")
        self.assertIsNotNone(step4)
        self.assertGreater(step4.final_value, 0)

    def test_m06(self):
        print("\n🧪 تست M-06: RPCM")
        asset = self.create_test_asset('دارایی تست M-06', 'IA-TEST-M06-000001', 'M-06')
        case = self.create_valuation_case(asset, self.base_step2_data)
        inputs = {
            'labor_breakdown': [{'role': 'برنامه نویس', 'person_days': 100, 'daily_rate': 1200000}, {'role': 'مدیر پروژه', 'person_days': 50, 'daily_rate': 2000000}],
            'direct_reproduction_cost': 50000000,
            'coordination_overhead': 20, 'relevance_obsolescence': 0,
            'age_factor': 0.2, 'quality_multiplier': 0.90,
            'tax_rate': 0.25, 'discount_rate': 0.18,
            'forecast_horizon': 5,
        }
        self.create_step3(case, 'M-06', inputs)
        step4 = self.calculate_step4(case, 'M-06', inputs)
        print(f"  ✅ M-06 Final Value: {step4.final_value:,.0f} IRR")
        self.assertIsNotNone(step4)
        self.assertGreater(step4.final_value, 0)

    def test_m07(self):
        print("\n🧪 تست M-07: TWC")
        asset = self.create_test_asset('دارایی تست M-07', 'IA-TEST-M07-000001', 'M-07')
        case = self.create_valuation_case(asset, self.base_step2_data)
        inputs = {
            'team_members': [
                {'role': 'senior_developer', 'headcount': 2, 'recruit_cost': 20000000, 'train_cost': 10000000, 'salary': 80000000},
                {'role': 'developer', 'headcount': 5, 'recruit_cost': 15000000, 'train_cost': 8000000, 'salary': 60000000},
                {'role': 'project_manager', 'headcount': 1, 'recruit_cost': 25000000, 'train_cost': 12000000, 'salary': 100000000},
            ],
            'ramp_up_duration': 6, 'productivity_loss': 30, 'turnover_rate': 8,
            'quality_multiplier': 0.85, 'tax_rate': 0.25, 'discount_rate': 0.18,
            'forecast_horizon': 5,
        }
        self.create_step3(case, 'M-07', inputs)
        step4 = self.calculate_step4(case, 'M-07', inputs)
        print(f"  ✅ M-07 Final Value: {step4.final_value:,.0f} IRR")
        self.assertIsNotNone(step4)
        self.assertGreater(step4.final_value, 0)

    def test_m08(self):
        print("\n🧪 تست M-08: CTM")
        asset = self.create_test_asset('دارایی تست M-08', 'IA-TEST-M08-000001', 'M-08')
        case = self.create_valuation_case(asset, self.base_step2_data)
        inputs = {
            'comparable_deals': [
                {'deal_id': 'Deal-001', 'transaction_price': 110000000, 'deal_weight_percent': 0.33, 'adjustments': {'size': 0.06, 'time': 0.02, 'geographic': -0.01, 'other': -0.01}},
                {'deal_id': 'Deal-002', 'transaction_price': 120000000, 'deal_weight_percent': 0.34, 'adjustments': {'size': 0.05, 'time': 0.01, 'geographic': 0.00, 'other': -0.01}},
                {'deal_id': 'Deal-003', 'transaction_price': 130000000, 'deal_weight_percent': 0.33, 'adjustments': {'size': 0.07, 'time': 0.03, 'geographic': -0.02, 'other': -0.01}},
            ],
            'quality_multiplier': 0.83, 'tax_rate': 0.25, 'discount_rate': 0.18,
            'forecast_horizon': 5, 'market_comparability_context': 'High',
            'industry_classification': 'Software', 'source_reliability': 'High',
        }
        self.create_step3(case, 'M-08', inputs)
        step4 = self.calculate_step4(case, 'M-08', inputs)
        print(f"  ✅ M-08 Final Value: {step4.final_value:,.0f} IRR")
        self.assertIsNotNone(step4)
        self.assertGreater(step4.final_value, 0)

    def test_m09(self):
        print("\n🧪 تست M-09: MMM")
        asset = self.create_test_asset('دارایی تست M-09', 'IA-TEST-M09-000001', 'M-09')
        case = self.create_valuation_case(asset, self.base_step2_data)
        inputs = {
            'base_metric': 'revenue', 'base_metric_value': 100000000000,
            'market_multiple': 2.5, 'control_premium_percent': 10,
            'marketability_discount_percent': 20, 'intangible_share_percent': 40,
            'quality_multiplier': 0.86, 'tax_rate': 0.25, 'discount_rate': 0.18,
            'forecast_horizon': 5, 'multiple_source': 'industry_report',
            'industry_classification': 'Software', 'market_comparability_context': 'High',
            'source_reliability': 'High',
        }
        self.create_step3(case, 'M-09', inputs)
        step4 = self.calculate_step4(case, 'M-09', inputs)
        print(f"  ✅ M-09 Final Value: {step4.final_value:,.0f} IRR")
        self.assertIsNotNone(step4)
        self.assertGreater(step4.final_value, 0)

    def test_all_methods(self):
        """اجرای همه تست‌ها"""
        print("\n" + "="*60)
        print("🚀 اجرای تست همه ۹ روش ارزش‌گذاری")
        print("="*60)
        
        self.test_m01()
        self.test_m02()
        self.test_m03()
        self.test_m04()
        self.test_m05()
        self.test_m06()
        self.test_m07()
        self.test_m08()
        self.test_m09()
        
        print("\n" + "="*60)
        print("✅ همه ۹ روش با موفقیت تست شدند!")
        print("="*60)
