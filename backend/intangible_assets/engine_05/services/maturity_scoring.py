"""
🎯 سرویس محاسبه نمره بلوغ IAMS
مسیر: engine_05/services/maturity_scoring.py

فرمول‌ها:
    Component Score (L_d,i) = میانگین نمرات پرسش‌های مؤلفه
    Domain Score (Score_D_d) = Σ (w_d,i × L_d,i)  [وزن‌دار]
    Total Score = Σ (W_d × Score_D_d)  [وزن‌دار]
    IAMS Index = (Score_total / 5) × 100
    Maturity Level = 1 تا 5 بر اساس Index
"""
from typing import Dict, List, Optional
from decimal import Decimal, ROUND_HALF_UP


class MaturityScoringService:
    """محاسبه نمرات بلوغ"""
    
    # آستانه‌های سطح بلوغ (بر اساس PDF)
    LEVEL_THRESHOLDS = [
        (0, 35, 1, 'سطح ۱: اولیه / بحرانی'),
        (35, 51, 2, 'سطح ۲: آغازین / موردی'),
        (51, 69, 3, 'سطح ۳: تعریف‌شده / استاندارد'),
        (69, 85, 4, 'سطح ۴: مدیریت‌شده / اندازه‌گیری‌شده'),
        (85, 101, 5, 'سطح ۵: بهینه / هوشمند'),
    ]
    
    @staticmethod
    def round1(value: float) -> float:
        """رند به ۱ رقم اعشار"""
        return float(Decimal(str(value)).quantize(Decimal('0.1'), rounding=ROUND_HALF_UP))
    
    @staticmethod
    def round2(value: float) -> float:
        """رند به ۲ رقم اعشار"""
        return float(Decimal(str(value)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
    
    def calculate_component_scores(self, assessment) -> Dict[str, float]:
        """
        محاسبه نمره هر مؤلفه (میانگین نمرات پرسش‌های آن)
        
        فرمول: L_d,i = میانگین نمرات پاسخ‌ها
        قاعده: پاسخ‌های بدون شاهد خودکار به ۲ تنزل می‌یابند
        
        Returns:
            {"1": 3.0, "2": 2.3, ...}
        """
        from ..maturity_models import MaturityResponse
        
        responses = MaturityResponse.objects.filter(
            assessment=assessment
        ).select_related('question', 'question__component')
        
        # گروه‌بندی بر اساس مؤلفه
        component_scores = {}
        
        for response in responses:
            q = response.question
            if q.question_type != 'measure' or not q.component:
                continue
            
            component_code = str(q.component.number)
            
            if component_code not in component_scores:
                component_scores[component_code] = []
            
            # 🆕 قاعده طلایی: اگه شاهد نداره، نمره=2
            score = response.score
            if score >= 3 and not response.has_evidence:
                score = 2
            
            component_scores[component_code].append(score)
        
        # میانگین هر مؤلفه
        result = {}
        for code, scores in component_scores.items():
            if scores:
                result[code] = self.round1(sum(scores) / len(scores))
        
        return result
    
    def calculate_domain_scores(self, assessment, component_scores: Dict[str, float]) -> Dict[str, float]:
        """
        محاسبه نمره هر بخش
        
        فرمول: Score_D_d = Σ (w_d,i × L_d,i)
        
        Args:
            component_scores: {"1": 3.0, "2": 2.3, ...}
        
        Returns:
            {"hardware": 2.80, "brainware": 2.52, ...}
        """
        from ..maturity_models import MaturityComponent
        
        # گروه‌بندی مؤلفه‌ها بر اساس بخش
        components = MaturityComponent.objects.all()
        
        domain_scores = {
            'hardware': [],
            'brainware': [],
            'orgware': [],
            'software': [],
        }
        
        # وزن‌های مؤلفه‌ها از پروفایل
        profile = assessment.weight_profile
        component_weights = profile.component_weights or {}
        
        for comp in components:
            code = str(comp.number)
            score = component_scores.get(code, 0)
            
            if score == 0:
                continue
            
            # وزن مؤلفه
            weight = float(component_weights.get(code, 0))
            
            domain_scores[comp.domain].append({
                'weight': weight,
                'score': score,
            })
        
        # محاسبه نمره هر بخش
        result = {}
        for domain, items in domain_scores.items():
            if not items:
                result[domain] = 0
                continue
            
            total_weight = sum(i['weight'] for i in items)
            if total_weight == 0:
                result[domain] = 0
                continue
            
            weighted_sum = sum(i['weight'] * i['score'] for i in items)
            result[domain] = self.round2(weighted_sum / total_weight)
        
        return result
    
    def calculate_total_score(self, assessment, domain_scores: Dict[str, float]) -> float:
        """
        محاسبه نمره کل بلوغ
        
        فرمول: Score_total = Σ (W_d × Score_D_d)
        
        Returns:
            Score_total (0-5)
        """
        profile = assessment.weight_profile
        
        weights = {
            'hardware': profile.weight_hardware,
            'brainware': profile.weight_brainware,
            'orgware': profile.weight_orgware,
            'software': profile.weight_software,
        }
        
        # نرمال‌سازی وزن‌ها (اگه جمع‌شون 1 نبود)
        total_weight = sum(weights.values())
        if total_weight == 0:
            return 0
        
        normalized_weights = {k: v / total_weight for k, v in weights.items()}
        
        score = sum(
            normalized_weights[domain] * domain_scores.get(domain, 0)
            for domain in ['hardware', 'brainware', 'orgware', 'software']
        )
        
        return self.round2(score)
    
    def calculate_index(self, score_total: float) -> float:
        """
        محاسبه شاخص IAMS (0-100)
        
        فرمول: IAMS Index = (Score_total / 5) × 100
        """
        return self.round1((score_total / 5) * 100)
    
    def determine_maturity_level(self, index: float) -> tuple:
        """
        تعیین سطح بلوغ بر اساس Index
        
        Returns:
            (level, level_name)
        """
        for low, high, level, name in self.LEVEL_THRESHOLDS:
            if low <= index < high:
                return level, name
        return 1, 'سطح ۱: اولیه / بحرانی'
    
    def calculate_radar_data(self, domain_scores: Dict[str, float]) -> List[Dict]:
        """
        داده راداری برای نمودار
        
        Returns:
            [{"domain": "سخت‌افزار", "score": 2.80, "percent": 56}, ...]
        """
        domain_names = {
            'hardware': 'سخت‌افزار',
            'brainware': 'مغزافزار',
            'orgware': 'سازمان‌افزار',
            'software': 'نرم‌افزار',
        }
        
        result = []
        for domain, name in domain_names.items():
            score = domain_scores.get(domain, 0)
            result.append({
                'domain': name,
                'domain_key': domain,
                'score': score,
                'percent': self.round1((score / 5) * 100),
            })
        
        return result
    
    def calculate_full_assessment(self, assessment) -> Dict:
        """
        محاسبه کامل ارزیابی
        
        Returns:
            {
                'component_scores': {...},
                'domain_scores': {...},
                'score_total': 2.55,
                'index': 51.0,
                'maturity_level': 2,
                'maturity_level_name': '...',
                'radar_data': [...],
            }
        """
        # ۱. نمره مؤلفه‌ها
        component_scores = self.calculate_component_scores(assessment)
        
        # ۲. نمره بخش‌ها
        domain_scores = self.calculate_domain_scores(assessment, component_scores)
        
        # ۳. نمره کل
        score_total = self.calculate_total_score(assessment, domain_scores)
        
        # ۴. Index
        index = self.calculate_index(score_total)
        
        # ۵. سطح بلوغ
        level, level_name = self.determine_maturity_level(index)
        
        # ۶. داده راداری
        radar_data = self.calculate_radar_data(domain_scores)
        
        return {
            'component_scores': component_scores,
            'domain_scores': domain_scores,
            'score_total': score_total,
            'index': index,
            'maturity_level': level,
            'maturity_level_name': level_name,
            'radar_data': radar_data,
        }


maturity_scoring_service = MaturityScoringService()
