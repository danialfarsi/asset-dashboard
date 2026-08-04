import json
import os
from typing import Dict, List, Any
from django.conf import settings
from ..valuation_formulas import calculate_value


class SensitivityEngine:
    """موتور محاسبه تحلیل حساسیت"""
    
    def __init__(self, method_id: str, case_data: Dict):
        self.method_id = method_id
        self.case_data = case_data
        self.base_path = '/app/frontend/public/config/sensitivity'
        print(f'📁 Base path: {self.base_path}')
        print(f'📁 Case data keys: {list(case_data.keys())}')
    
    def recalculate_value(self, driver_id: str, new_value: float) -> float:
        """محاسبه مجدد ارزش با تغییر یک متغیر"""
        params = self.case_data.copy()
        params[driver_id] = new_value
        return calculate_value(self.method_id, params)
    
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
        drivers = self._load_drivers()
        scenarios = self._load_scenarios()
        
        original_base_value = float(self.case_data.get('original_base_value', 0))
        if original_base_value == 0:
            original_base_value = float(self.case_data.get('base_value', 0))
        
        print(f'📊 Original base value: {original_base_value}')
        
        if not drivers:
            drivers = [
                {'id': 'with_asset_growth', 'name_fa': 'نرخ رشد با دارایی', 'base': 0.08, 'low': 0.05, 'high': 0.12},
                {'id': 'without_asset_growth', 'name_fa': 'نرخ رشد بدون دارایی', 'base': 0.06, 'low': 0.03, 'high': 0.10},
                {'id': 'discount_rate', 'name_fa': 'نرخ تنزیل', 'base': 0.18, 'low': 0.16, 'high': 0.20},
            ]
        
        # استفاده از مقادیر سفارشی از case_data
        for driver in drivers:
            driver_id = driver['id']
            if driver_id in self.case_data:
                driver['current_value'] = self.case_data[driver_id]
                print(f'📌 Using custom {driver_id}: {driver["current_value"]}')
            else:
                driver['current_value'] = driver['base']
        
        # 🔥 محاسبه base_value جدید با درایورهای فعلی
        base_value = original_base_value
        for driver in drivers:
            current_val = driver.get('current_value', driver['base'])
            base_val = driver['base']
            factor = 1 + ((current_val - base_val) / base_val) * 0.5
            base_value = base_value * factor
        
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
        
        # تحلیل یک‌متغیره
        one_way_results = []
        for driver in drivers:
            driver_id = driver['id']
            low = driver['low']
            high = driver['high']
            
            results = []
            steps = 20
            for i in range(steps + 1):
                t = i / steps
                val = low + t * (high - low)
                params = self.case_data.copy()
                params[driver_id] = val
                result_value = calculate_value(self.method_id, params)
                results.append({'driver_value': val, 'result_value': result_value})
            
            min_result = min([r['result_value'] for r in results])
            max_result = max([r['result_value'] for r in results])
            impact = ((max_result - min_result) / original_base_value * 100) if original_base_value != 0 else 0
            
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
        
        tornado_ranking = sorted(one_way_results, key=lambda x: x['impact_percent'], reverse=True)
        
        # سناریوها
        scenario_results = {}
        for key, scenario in scenarios.items():
            value = self._apply_driver_changes(
                drivers, 
                base_value, 
                scenario.get('driver_changes', {})
            )
            scenario_results[key] = {
                **scenario,
                'value': value,
                'change_percent': ((value - base_value) / base_value * 100) if base_value != 0 else 0
            }
        
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
                'range_percent': ((high - low) / original_base_value * 100) if original_base_value != 0 else 0
            }
        }
    
    def _load_drivers(self) -> List[Dict]:
        path = os.path.join(self.base_path, f'drivers/{self.method_id}_drivers.json')
        try:
            with open(path, 'r') as f:
                data = json.load(f)
                return data.get('drivers', [])
        except:
            return []
    
    def _load_scenarios(self) -> Dict:
        path = os.path.join(self.base_path, f'scenarios/{self.method_id}_scenarios.json')
        try:
            with open(path, 'r') as f:
                data = json.load(f)
                return data.get('scenarios', {})
        except:
            return {}
