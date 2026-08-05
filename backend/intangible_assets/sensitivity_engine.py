import json
import os
from typing import Dict, List, Any
from django.conf import settings


class SensitivityEngine:
    """موتور محاسبه تحلیل حساسیت"""
    
    def __init__(self, method_id: str, case_data: Dict):
        self.method_id = method_id
        self.case_data = case_data
        self.base_path = '/app/frontend/public/config/sensitivity'
        print(f'📁 Base path: {self.base_path}')
        print(f'📁 Case data keys: {list(case_data.keys())}')
    
    def _calculate_with_formula(self, params: Dict) -> float:
        """محاسبه ارزش با استفاده از فرمول واقعی روش"""
        try:
            from ..valuation_formulas import calculate_value
            
            # 🔥 حذف base_value و original_base_value از params
            clean_params = {}
            for k, v in params.items():
                if k not in ['base_value', 'original_base_value']:
                    clean_params[k] = v
            
            # 🔥 نگاشت برای M-01
            if self.method_id == 'M-01':
                if 'terminal_growth' in clean_params:
                    clean_params['terminal_growth_rate'] = clean_params['terminal_growth']
                if 'revenue_growth' in clean_params:
                    clean_params['revenue_growth_rate'] = clean_params['revenue_growth']
            
            # 🔥 نگاشت برای M-05 (RCM)
            if self.method_id == 'M-05':
                # دریافت مقادیر از clean_params
                labor_factor = clean_params.get('labor_cost', 100) / 100
                material_factor = clean_params.get('material_cost', 100) / 100
                
                # دریافت مقادیر اصلی از case_data
                original_labor = self.case_data.get('labor_breakdown', [])
                original_material = self.case_data.get('material_infra_cost', 0)
                
                print(f'📊 M-05 Mapping:')
                print(f'  labor_factor: {labor_factor}')
                print(f'  material_factor: {material_factor}')
                print(f'  original_labor: {original_labor}')
                print(f'  original_material: {original_material}')
                
                # اعمال ضریب به labor_breakdown
                if original_labor:
                    new_labor = []
                    for item in original_labor:
                        new_item = item.copy()
                        new_item['person_months'] = item.get('person_months', 0) * labor_factor
                        new_item['monthly_rate'] = item.get('monthly_rate', 0)
                        new_labor.append(new_item)
                    clean_params['labor_breakdown'] = new_labor
                else:
                    clean_params['labor_breakdown'] = self.case_data.get('labor_breakdown', [])
                
                # اعمال ضریب به material_infra_cost
                clean_params['material_infra_cost'] = original_material * material_factor
                
                # حذف labor_cost و material_cost از clean_params
                clean_params.pop('labor_cost', None)
                clean_params.pop('material_cost', None)
                
                # تبدیل obsolescence_pct به functional_obs_pct و economic_obs_pct
                if 'obsolescence_pct' in clean_params:
                    total_obs = clean_params['obsolescence_pct'] / 100
                    clean_params['functional_obs_pct'] = total_obs * 0.5
                    clean_params['economic_obs_pct'] = total_obs * 0.5
                    clean_params.pop('obsolescence_pct', None)
                
                # اطمینان از وجود developer_profit_pct
                if 'developer_profit_pct' not in clean_params:
                    clean_params['developer_profit_pct'] = self.case_data.get('developer_profit_pct', 15)
            
            # اطمینان از وجود forecast_horizon
            if 'forecast_horizon' not in clean_params:
                clean_params['forecast_horizon'] = self.case_data.get('forecast_horizon', 5)
            
            # اطمینان از وجود current_revenue
            if 'current_revenue' not in clean_params:
                clean_params['current_revenue'] = self.case_data.get('current_revenue', 10000000000)
            
            # اطمینان از وجود سایر پارامترهای کلیدی
            if 'revenue_attribution' not in clean_params:
                clean_params['revenue_attribution'] = self.case_data.get('revenue_attribution', 0.80)
            
            if 'quality_multiplier' not in clean_params:
                clean_params['quality_multiplier'] = self.case_data.get('quality_multiplier', 0.92)
            
            if 'tax_rate' not in clean_params:
                clean_params['tax_rate'] = self.case_data.get('tax_rate', 0.25)
            
            print(f'📊 Clean params keys: {list(clean_params.keys())}')
            result = calculate_value(self.method_id, clean_params)
            print(f'📊 Result: {result}')
            return result
        except Exception as e:
            print(f'❌ Error calculating with formula: {e}')
            import traceback
            traceback.print_exc()
            return params.get('base_value', 0)
    
    def recalculate_value(self, driver_id: str, new_value: float) -> float:
        """محاسبه مجدد ارزش با تغییر یک متغیر"""
        params = self.case_data.copy()
        params[driver_id] = new_value
        return self._calculate_with_formula(params)
    
    def _apply_driver_changes(self, driver_list: List[Dict], base_value: float, changes: Dict) -> float:
        """اعمال تغییرات درایورها روی base_value"""
        result = base_value
        for driver_id, change in changes.items():
            driver = next((d for d in driver_list if d['id'] == driver_id), None)
            if driver:
                if change.get('type') == 'relative':
                    new_val = driver['base'] * (1 + change.get('value', 0))
                else:
                    new_val = driver['base'] + change.get('value', 0)
                factor = 1 + ((new_val - driver['base']) / driver['base']) * 0.5
                result = result * factor
                print(f'   🔄 {driver_id}: {driver["base"]} → {new_val} (factor: {factor})')
        return result
    
    def run_analysis(self) -> Dict:
        """اجرای تحلیل حساسیت با استفاده از فرمول‌های واقعی"""
        
        # بارگذاری Config
        drivers = self._load_drivers()
        scenarios = self._load_scenarios()
        
        print(f'📊 Drivers loaded: {len(drivers)}')
        print(f'📊 Scenarios loaded: {len(scenarios)}')
        
        original_base_value = float(self.case_data.get('original_base_value', 0))
        if original_base_value == 0:
            original_base_value = float(self.case_data.get('base_value', 0))
        
        base_value = original_base_value
        print(f'📊 Base value: {base_value}')
        
        # اگر درایور وجود نداشت، با یک نمونه تست کنیم
        if not drivers:
            drivers = [
                {'id': 'test_driver', 'name_fa': 'درایور تست', 'base': 0.5, 'low': 0.3, 'high': 0.7, 'enabled': True}
            ]
            print('⚠️ از درایورهای نمونه استفاده شد')
        
        # استفاده از مقادیر سفارشی از case_data
        for driver in drivers:
            driver_id = driver['id']
            if driver_id in self.case_data:
                driver['current_value'] = self.case_data[driver_id]
                print(f'📌 Using custom {driver_id}: {driver["current_value"]}')
            else:
                driver['current_value'] = driver['base']
        
        # 🔥 محاسبه base_value جدید با درایورهای فعلی
        new_base_value = original_base_value
        for driver in drivers:
            current_val = driver.get('current_value', driver['base'])
            base_val = driver['base']
            factor = 1 + ((current_val - base_val) / base_val) * 0.5
            new_base_value = new_base_value * factor
        
        base_value = new_base_value
        print(f'📊 New base value: {base_value}')
        
        # 🔥 محاسبه optimistic و pessimistic با درایورهای فعلی
        optimistic_value = base_value
        pessimistic_value = base_value
        
        if scenarios:
            if 'optimistic' in scenarios:
                opt_changes = scenarios['optimistic'].get('driver_changes', {})
                optimistic_value = self._apply_driver_changes(drivers, base_value, opt_changes)
                print(f'📊 Optimistic value: {optimistic_value}')
            
            if 'pessimistic' in scenarios:
                pes_changes = scenarios['pessimistic'].get('driver_changes', {})
                pessimistic_value = self._apply_driver_changes(drivers, base_value, pes_changes)
                print(f'📊 Pessimistic value: {pessimistic_value}')
        
        # تحلیل یک‌متغیره با فرمول‌های واقعی
        one_way_results = []
        for driver in drivers:
            if not driver.get('enabled', True):
                continue
            
            driver_id = driver['id']
            low = driver['low']
            high = driver['high']
            
            results = []
            steps = 20
            
            for i in range(steps + 1):
                t = i / steps
                driver_value = low + t * (high - low)
                
                # 🔥 استفاده از recalculate_value
                result_value = self.recalculate_value(driver_id, driver_value)
                
                results.append({
                    'driver_value': driver_value,
                    'result_value': result_value
                })
            
            min_result = min([r['result_value'] for r in results])
            max_result = max([r['result_value'] for r in results])
            
            # 🔥 اصلاح: محاسبه impact بر اساس min_result (نه base_value)
            impact = ((max_result - min_result) / min_result * 100) if min_result != 0 else 0
            
            one_way_results.append({
                'driver_id': driver_id,
                'driver_name': driver.get('name_fa', driver_id),
                'base_value': driver['base'],
                'low_range': low,
                'high_range': high,
                'impact_percent': impact,
                'sensitivity_results': results,
                'low_result': min_result,
                'high_result': max_result
            })
        
        # رتبه‌بندی تورنادو
        tornado_ranking = sorted(one_way_results, key=lambda x: x['impact_percent'], reverse=True)
        
        # ============================================
        # محاسبه سناریوها با فرمول‌های واقعی
        # ============================================
        scenario_results = {}
        
        if scenarios:
            for key, scenario in scenarios.items():
                params = self.case_data.copy()
                for driver_id, change in scenario.get('driver_changes', {}).items():
                    driver = next((d for d in drivers if d['id'] == driver_id), None)
                    if driver:
                        if change.get('type') == 'relative':
                            new_val = driver['base'] * (1 + change.get('value', 0))
                        else:
                            new_val = driver['base'] + change.get('value', 0)
                        params[driver_id] = new_val
                
                value = self._calculate_with_formula(params)
                
                scenario_results[key] = {
                    **scenario,
                    'value': value,
                    'change_percent': ((value - base_value) / base_value * 100) if base_value != 0 else 0
                }
        else:
            # سناریوهای پیش‌فرض
            scenario_results = {
                'pessimistic': {
                    'id': 'pessimistic',
                    'label_fa': 'بدبینانه',
                    'color': '#EF4444',
                    'value': base_value * 0.7,
                    'change_percent': -30
                },
                'base': {
                    'id': 'base',
                    'label_fa': 'مبنا',
                    'color': '#3B82F6',
                    'value': base_value,
                    'change_percent': 0
                },
                'optimistic': {
                    'id': 'optimistic',
                    'label_fa': 'خوش‌بینانه',
                    'color': '#22C55E',
                    'value': base_value * 1.3,
                    'change_percent': 30
                }
            }
        
        # ============================================
        # بازه اطمینان
        # ============================================
        all_values = [base_value]
        for r in one_way_results:
            all_values.append(r['low_result'])
            all_values.append(r['high_result'])
        
        low = min(all_values)
        high = max(all_values)
        avg_impact = sum([r['impact_percent'] for r in one_way_results]) / len(one_way_results) if one_way_results else 0
        confidence = max(80, min(95, 100 - avg_impact * 0.3))
        
        return {
            'status': 'COMPLETED',
            'step6_status': 'COMPLETED',
            'sensitivity_dashboard': {
                'pessimistic_value': pessimistic_value,
                'base_value': base_value,
                'optimistic_value': optimistic_value,
                'pessimistic_change_percent': ((pessimistic_value - base_value) / base_value * 100) if base_value != 0 else 0,
                'optimistic_change_percent': ((optimistic_value - base_value) / base_value * 100) if base_value != 0 else 0
            },
            'key_drivers': one_way_results,
            'tornado_ranking': tornado_ranking,
            'scenarios': scenario_results,
            'confidence_band': {
                'low': low,
                'base': base_value,
                'high': high,
                'confidence_level_percent': round(confidence),
                'range_percent': ((high - low) / base_value * 100) if base_value != 0 else 0
            }
        }
    
    def _load_drivers(self) -> List[Dict]:
        """بارگذاری درایورها از Config"""
        path = os.path.join(self.base_path, f'drivers/{self.method_id}_drivers.json')
        print(f'🔍 Loading drivers from: {path}')
        try:
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get('drivers', [])
        except Exception as e:
            print(f'❌ Error loading drivers: {e}')
            return []
    
    def _load_scenarios(self) -> Dict:
        """بارگذاری سناریوها از Config"""
        path = os.path.join(self.base_path, f'scenarios/{self.method_id}_scenarios.json')
        print(f'🔍 Loading scenarios from: {path}')
        try:
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get('scenarios', {})
        except Exception as e:
            print(f'❌ Error loading scenarios: {e}')
            return {}