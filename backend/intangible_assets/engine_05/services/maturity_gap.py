"""
🎯 سرویس تحلیل شکاف بلوغ IAMS
مسیر: engine_05/services/maturity_gap.py

فرمول اولویت:
    P_i = (L_target - L_i) × w_eff_i

    که:
        L_target = سطح هدف (معمولاً ۳.۰)
        L_i = نمره فعلی مؤلفه i
        w_eff_i = وزن اثرگذار مؤلفه i (سهم از ۱۰۰)
"""
from typing import Dict, List, Optional
from decimal import Decimal, ROUND_HALF_UP


class MaturityGapService:
    """تحلیل شکاف و اولویت‌بندی اقدامات"""
    
    TARGET_LEVEL = 3.0  # سطح هدف پیش‌فرض
    
    @staticmethod
    def round2(value: float) -> float:
        return float(Decimal(str(value)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
    
    @staticmethod
    def round3(value: float) -> float:
        return float(Decimal(str(value)).quantize(Decimal('0.001'), rounding=ROUND_HALF_UP))
    
    def get_effective_weights(self, profile, components) -> Dict[str, float]:
        """
        محاسبه وزن اثرگذار نهایی هر مؤلفه
        
        w_eff = (وزن بخش) × (وزن مؤلفه)
        
        Returns:
            {"1": 5.00, "2": 8.75, ...}
        """
        domain_weights = {
            'hardware': profile.weight_hardware,
            'brainware': profile.weight_brainware,
            'orgware': profile.weight_orgware,
            'software': profile.weight_software,
        }
        
        component_weights = profile.component_weights or {}
        
        result = {}
        for comp in components:
            code = str(comp.number)
            domain_w = domain_weights.get(comp.domain, 0)
            comp_w = float(component_weights.get(code, 0))
            
            # وزن اثرگذار = وزن بخش × وزن مؤلفه × ۱۰۰
            result[code] = self.round2(domain_w * comp_w * 100)
        
        return result
    
    def calculate_gap_priorities(
        self,
        assessment,
        component_scores: Dict[str, float],
        target_level: float = None,
    ) -> List[Dict]:
        """
        اولویت‌بندی اقدامات اصلاحی بر اساس شکاف وزنی
        
        Args:
            assessment: MaturityAssessment
            component_scores: {"1": 3.0, "2": 2.3, ...}
            target_level: سطح هدف (پیش‌فرض 3.0)
        
        Returns:
            لیست اولویت‌دار:
            [{
                'rank': 1,
                'component_code': '14',
                'component_name': 'هوشمندی تحلیلی',
                'current_score': 1.70,
                'target_score': 3.00,
                'gap': 1.30,
                'effective_weight': 7.50,
                'priority_index': 9.75,
                'index_gain': 2.60,
            }, ...]
        """
        from ..maturity_models import MaturityComponent
        
        target_level = target_level or self.TARGET_LEVEL
        
        components = MaturityComponent.objects.all()
        effective_weights = self.get_effective_weights(
            assessment.weight_profile,
            components
        )
        
        priorities = []
        
        for comp in components:
            code = str(comp.number)
            current = component_scores.get(code, 0)
            
            if current == 0:
                continue
            
            gap = max(0, target_level - current)
            if gap == 0:
                continue
            
            eff_weight = effective_weights.get(code, 0)
            priority_index = self.round2(gap * eff_weight)
            
            # مقدار افزایش Index ۱۰۰ به ازای رسیدن به هدف
            # index_gain = (gap / 5) × w_eff
            index_gain = self.round2((gap / 5) * eff_weight)
            
            priorities.append({
                'component_code': code,
                'component_number': comp.number,
                'component_name': comp.name,
                'component_domain': comp.domain,
                'domain_display': comp.get_domain_display(),
                'current_score': current,
                'target_score': target_level,
                'gap': self.round2(gap),
                'effective_weight': eff_weight,
                'priority_index': priority_index,
                'index_gain': index_gain,
            })
        
        # مرتب‌سازی بر اساس priority_index (نزولی)
        priorities.sort(key=lambda x: x['priority_index'], reverse=True)
        
        # اضافه کردن rank
        for i, p in enumerate(priorities, 1):
            p['rank'] = i
        
        return priorities
    
    def calculate_domain_gap(
        self,
        domain_scores: Dict[str, float],
        target: float = 3.0,
    ) -> List[Dict]:
        """
        شکاف هر بخش
        
        Returns:
            [{
                'domain': 'hardware',
                'domain_display': 'سخت‌افزار',
                'current_score': 2.80,
                'target_score': 3.00,
                'gap': 0.20,
            }, ...]
        """
        domain_names = {
            'hardware': 'سخت‌افزار (ساختار، حکمرانی، راهبری)',
            'brainware': 'مغزافزار (سرمایه انسانی، دانش، فرهنگ)',
            'orgware': 'سازمان‌افزار (فرآیند، مستندسازی، انطباق)',
            'software': 'نرم‌افزار (فناوری، داده، هوشمندی)',
        }
        
        result = []
        for domain, name in domain_names.items():
            current = domain_scores.get(domain, 0)
            gap = max(0, target - current)
            
            result.append({
                'domain': domain,
                'domain_display': name,
                'current_score': current,
                'target_score': target,
                'gap': self.round2(gap),
            })
        
        return result
    
    def get_roadmap_targets(self, current_index: float) -> Dict:
        """
        اهداف نقشه راه ۳ ساله
        
        بر اساس PDF:
            سال ۱: هدف ~7-10 امتیاز افزایش
            سال ۲: رسیدن به سطح ۳
            سال ۳: رسیدن به سطح ۴
        
        Returns:
            {
                'current_index': 51,
                'current_level': 2,
                'year_1': {'index': 60, 'level': 3},
                'year_2': {'index': 72, 'level': 4},
                'year_3': {'index': 85, 'level': 5},
            }
        """
        year_1_target = min(current_index + 9, 100)
        year_2_target = min(current_index + 21, 100)
        year_3_target = min(current_index + 34, 100)
        
        def level_for(idx):
            if idx >= 85: return 5
            if idx >= 69: return 4
            if idx >= 51: return 3
            if idx >= 35: return 2
            return 1
        
        return {
            'current_index': current_index,
            'current_level': level_for(current_index),
            'year_1': {
                'index': self.round2(year_1_target),
                'level': level_for(year_1_target),
                'description': 'تثبیت حکمرانی و مستندسازی',
            },
            'year_2': {
                'index': self.round2(year_2_target),
                'level': level_for(year_2_target),
                'description': 'اندازه‌گیری و اتصال به تصمیم',
            },
            'year_3': {
                'index': self.round2(year_3_target),
                'level': level_for(year_3_target),
                'description': 'هوشمندسازی و پیش‌دستانه',
            },
        }
    
    def calculate_full_gap_analysis(
        self,
        assessment,
        component_scores: Dict[str, float],
        domain_scores: Dict[str, float],
        index: float,
    ) -> Dict:
        """
        تحلیل شکاف کامل
        """
        priorities = self.calculate_gap_priorities(assessment, component_scores)
        domain_gaps = self.calculate_domain_gap(domain_scores)
        roadmap = self.get_roadmap_targets(index)
        
        return {
            'priorities': priorities,
            'top_5_actions': priorities[:5],
            'domain_gaps': domain_gaps,
            'roadmap': roadmap,
        }


maturity_gap_service = MaturityGapService()
