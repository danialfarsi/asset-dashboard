"""
🎯 سرویس قواعد دروازه‌ای بلوغ IAMS
مسیر: engine_05/services/maturity_gate.py

قواعد:
    G-A: اگر مؤلفه ۱۱ (ریسک و انطباق) < 2.5 → سقف سطح 3
    G-B: اگر مؤلفه ۳ (همسویی استراتژیک) < 2.0 → سقف سطح 3
    G-C: اگر همه مؤلفه‌ها ≥ 3.0 نباشند → مسدود شدن سطح 4
    G-D: اگر ممیز مستقل بیرونی نباشد → مسدود شدن سطح 5
"""
from typing import Dict, List, Optional


class MaturityGateService:
    """قواعد دروازه‌ای (Gate Rules)"""
    
    GA_THRESHOLD = 2.5
    GB_THRESHOLD = 2.0
    GC_THRESHOLD = 3.0
    GD_THRESHOLD = 4.0
    
    def apply_gate_rules(
        self,
        component_scores: Dict[str, float],
        has_external_auditor: bool = False,
        calculated_level: int = 1,
    ) -> Dict:
        rules = {}
        violations = []
        max_allowed_level = 5
        capped_by = []
        
        # G-A
        comp_11_score = component_scores.get('11', 0)
        ga_triggered = comp_11_score < self.GA_THRESHOLD
        
        rules['G-A'] = {
            'name': 'ریسک و انطباق',
            'component': '11 - ریسک و انطباق',
            'current_score': comp_11_score,
            'threshold': self.GA_THRESHOLD,
            'triggered': ga_triggered,
            'effect': 'سقف سطح 3' if ga_triggered else 'اعمال نمی‌شود',
        }
        
        if ga_triggered:
            max_allowed_level = min(max_allowed_level, 3)
            capped_by.append('G-A')
            violations.append({
                'rule': 'G-A',
                'message': f'مؤلفه 11 (ریسک و انطباق) = {comp_11_score} < {self.GA_THRESHOLD}',
                'effect': 'سقف سطح 3 اعمال شد',
                'action': 'تقویت نظام مدیریت ریسک و انطباق',
            })
        
        # G-B
        comp_3_score = component_scores.get('3', 0)
        gb_triggered = comp_3_score < self.GB_THRESHOLD
        
        rules['G-B'] = {
            'name': 'همسویی استراتژیک',
            'component': '3 - همسویی استراتژیک',
            'current_score': comp_3_score,
            'threshold': self.GB_THRESHOLD,
            'triggered': gb_triggered,
            'effect': 'سقف سطح 3' if gb_triggered else 'اعمال نمی‌شود',
        }
        
        if gb_triggered:
            max_allowed_level = min(max_allowed_level, 3)
            capped_by.append('G-B')
            violations.append({
                'rule': 'G-B',
                'message': f'مؤلفه 3 (همسویی استراتژیک) = {comp_3_score} < {self.GB_THRESHOLD}',
                'effect': 'سقف سطح 3 اعمال شد',
                'action': 'تقویت همسویی استراتژیک و پیوند با اهداف',
            })
        
        # G-C
        count_above_3 = sum(1 for s in component_scores.values() if s >= self.GC_THRESHOLD)
        total_components = 16
        gc_triggered = count_above_3 < total_components
        
        rules['G-C'] = {
            'name': 'حداقل مؤلفه‌های سطح 3',
            'count_above_3': count_above_3,
            'total': total_components,
            'required': total_components,
            'triggered': gc_triggered,
            'effect': 'مسدود شدن سطح 4' if gc_triggered else 'اعمال نمی‌شود',
        }
        
        if gc_triggered:
            max_allowed_level = min(max_allowed_level, 3)
            if 'G-C' not in capped_by:
                capped_by.append('G-C')
            violations.append({
                'rule': 'G-C',
                'message': f'فقط {count_above_3} از {total_components} مؤلفه >= 3.0',
                'effect': 'ورود به سطح 4 مسدود شد',
                'action': f'ارتقای {total_components - count_above_3} مؤلفه باقی‌مانده به سطح 3',
            })
        
        # G-D
        gd_triggered = not has_external_auditor
        
        rules['G-D'] = {
            'name': 'ممیز مستقل بیرونی',
            'has_auditor': has_external_auditor,
            'triggered': gd_triggered,
            'effect': 'مسدود شدن سطح 5' if gd_triggered else 'اعمال نمی‌شود',
        }
        
        if gd_triggered:
            max_allowed_level = min(max_allowed_level, 4)
            capped_by.append('G-D')
            violations.append({
                'rule': 'G-D',
                'message': 'ممیز مستقل بیرونی وجود ندارد',
                'effect': 'ورود به سطح 5 مسدود شد',
                'action': 'انجام ممیزی مستقل توسط نهاد بیرونی معتبر',
            })
        
        final_level = min(calculated_level, max_allowed_level)
        
        return {
            'original_level': calculated_level,
            'final_level': final_level,
            'max_allowed_level': max_allowed_level,
            'capped_by': capped_by,
            'is_capped': final_level < calculated_level,
            'rules': rules,
            'violations': violations,
            'all_passed': len(violations) == 0,
        }
    
    def get_gate_summary(self, gate_result: Dict) -> str:
        if gate_result.get('all_passed'):
            return 'همه قواعد دروازه‌ای پاس شده‌اند'
        
        lines = [f"{len(gate_result.get('violations', []))} قاعده نقض شده:"]
        for v in gate_result.get('violations', []):
            lines.append(f"   - {v['rule']}: {v['message']}")
            lines.append(f"     => {v['effect']}")
        
        return ' | '.join(lines)


maturity_gate_service = MaturityGateService()
