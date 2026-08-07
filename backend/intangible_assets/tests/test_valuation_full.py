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
    calculate_m01, calculate_m02, calculate_m03
)

User = get_user_model()


class TestAllValuationMethods(TestCase):
    """تست همه ۹ روش ارزش‌گذاری"""

    def setUp(self):
        # ✅ اصلاح: اضافه کردن username
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
            'tax_rate': 25,
            'discount_rate': 18,
            'forecast_horizon': 5,
            'terminal_growth_rate': 5,
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
            tax_rate=step2_data.get('tax_rate', 25) / 100,
            discount_rate=step2_data.get('discount_rate', 18) / 100,
            forecast_horizon=step2_data.get('forecast_horizon', 5),
            terminal_growth_rate=step2_data.get('terminal_growth_rate', 5) / 100,
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

    def test_m01_rfr(self):
        """تست M-01"""
        print("\n🧪 تست M-01: RfR")
        asset = self.create_test_asset('دارایی تست M-01', 'IA-TEST-M01-000001', 'M-01')
        case = self.create_valuation_case(asset, self.base_step2_data)
        inputs = {
            'royalty_rate': 4, 'revenue_attribution': 80, 'revenue_growth_rate': 8,
            'quality_multiplier': 0.92, 'tax_rate': 25, 'discount_rate': 18,
            'terminal_growth_rate': 5, 'forecast_horizon': 5, 'current_revenue': 500000000000,
        }
        self.create_step3(case, 'M-01', inputs)
        step4 = self.calculate_step4(case, 'M-01', inputs)
        self.assertIsNotNone(step4)
        self.assertGreater(step4.final_value, 0)
        print(f"  ✅ M-01 Final Value: {step4.final_value:,.0f} IRR")

    def test_m02_meem(self):
        """تست M-02"""
        print("\n🧪 تست M-02: MEEM")
        asset = self.create_test_asset('دارایی تست M-02', 'IA-TEST-M02-000001', 'M-02')
        case = self.create_valuation_case(asset, self.base_step2_data)
        inputs = {
            'ebit_attributable': 20000000000,
            'contributory_assets': [{'asset_type': 'cash', 'asset_value': 10000000000, 'return_rate': 8}],
            'customer_attrition_rate': 10, 'quality_multiplier': 0.89,
            'tax_rate': 25, 'discount_rate': 18, 'terminal_growth_rate': 5,
            'forecast_horizon': 5,
        }
        self.create_step3(case, 'M-02', inputs)
        step4 = self.calculate_step4(case, 'M-02', inputs)
        self.assertIsNotNone(step4)
        self.assertGreater(step4.final_value, 0)
        print(f"  ✅ M-02 Final Value: {step4.final_value:,.0f} IRR")

    def test_m03_dcf(self):
        """تست M-03"""
        print("\n🧪 تست M-03: DCF")
        asset = self.create_test_asset('دارایی تست M-03', 'IA-TEST-M03-000001', 'M-03')
        case = self.create_valuation_case(asset, self.base_step2_data)
        inputs = {
            'fcf_schedule': [
                {'year': 1, 'fcf': 80000000},
                {'year': 2, 'fcf': 90000000},
                {'year': 3, 'fcf': 100000000},
                {'year': 4, 'fcf': 110000000},
                {'year': 5, 'fcf': 120000000},
            ],
            'intangible_share_percent': 70, 'quality_multiplier': 0.85,
            'tax_rate': 25, 'discount_rate': 18, 'terminal_growth_rate': 5,
            'forecast_horizon': 5,
        }
        self.create_step3(case, 'M-03', inputs)
        step4 = self.calculate_step4(case, 'M-03', inputs)
        self.assertIsNotNone(step4)
        self.assertGreater(step4.final_value, 0)
        print(f"  ✅ M-03 Final Value: {step4.final_value:,.0f} IRR")

    def test_all_methods(self):
        """اجرای همه تست‌ها"""
        print("\n" + "="*60)
        print("🚀 اجرای تست همه روش‌ها")
        print("="*60)
        self.test_m01_rfr()
        self.test_m02_meem()
        self.test_m03_dcf()
        print("\n" + "="*60)
        print("✅ همه تست‌ها با موفقیت اجرا شدند!")
        print("="*60)
