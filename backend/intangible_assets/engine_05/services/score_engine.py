"""
🎯 SYS_SCORE_ENGINE
سرویس امتیازدهی و رتبه‌بندی پروژه‌ها (MCDM)

طبق سند META-ENG4-SPEC-v1.0:
Priority Score = Σ (w_i × C_i)
"""

import csv
import os
from typing import Dict, List, Optional

from django.db import transaction
from django.utils import timezone
from .thresholds import get_threshold


class BelowThresholdError(Exception):
    """امتیاز پروژه زیر آستانه مجاز"""
    pass

from ..models import (
    DevelopmentOpportunity,
    InnovationIdea,
    PrioritizedProject,
)


CONFIG_DIR = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    'config'
)


class ScoreEngineService:
    """
    سرویس امتیازدهی و رتبه‌بندی
    """
    
    def __init__(self):
        self._criteria = None
    
    # ═══════════════════════════════════════════════════════
    # خواندن فایل پیکربندی
    # ═══════════════════════════════════════════════════════
    
    @property
    def criteria(self) -> Dict[str, Dict]:
        """خواندن Criteria_ProjectPrioritization.csv"""
        if self._criteria is None:
            self._criteria = {}
            filepath = os.path.join(CONFIG_DIR, 'Criteria_ProjectPrioritization.csv')
            
            if os.path.exists(filepath):
                with open(filepath, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        self._criteria[row['business_type']] = {
                            'c1': float(row['c1_strategic_weight']),
                            'c2': float(row['c2_roi_weight']),
                            'c3': float(row['c3_feasibility_weight']),
                            'c4': float(row['c4_goal_alignment_weight']),
                            'c5': float(row['c5_urgency_weight']),
                        }
        return self._criteria
    
    def get_weights(self, business_type: str = 'manufacturing') -> Dict[str, float]:
        """گرفتن اوزان بر اساس نوع کسب‌وکار"""
        return self.criteria.get(business_type, self.criteria.get('manufacturing', {
            'c1': 0.25, 'c2': 0.25, 'c3': 0.20, 'c4': 0.15, 'c5': 0.15
        }))
    
    # ═══════════════════════════════════════════════════════
    # محاسبه امتیاز MCDM
    # ═══════════════════════════════════════════════════════
    
    def calculate_opportunity_score(
        self,
        opportunity: DevelopmentOpportunity,
        business_type: str = 'manufacturing',
    ) -> Dict:
        """
        محاسبه امتیاز MCDM برای یه فرصت توسعه
        
        Returns: {c1, c2, c3, c4, c5, priority_score}
        """
        weights = self.get_weights(business_type)
        
        # C1 — ارزش استراتژیک (از امتیاز استراتژیک)
        c1 = min(5.0, max(1.0, opportunity.current_s or 3.0))
        
        # C2 — بازگشت سرمایه (از potential_value)
        # نرمال‌سازی: هر ۵ میلیارد = ۱ امتیاز
        c2 = min(5.0, max(1.0, float(opportunity.potential_value) / 1e9))
        
        # C3 — امکان‌پذیری (معکوس gap_score: gap کمتر = امکان‌پذیری بیشتر)
        c3 = max(1.0, 5.0 - (opportunity.gap_score * 2))
        
        # C4 — هم‌راستایی اهداف
        c4 = min(5.0, max(1.0, opportunity.current_m or 3.0))
        
        # C5 — فوریت (اگه بحرانی، ۵؛ وگرنه بر اساس gap)
        if opportunity.is_critical:
            c5 = 5.0
        else:
            c5 = min(5.0, max(1.0, opportunity.gap_score * 10))
        
        # امتیاز نهایی
        priority_score = (
            weights['c1'] * c1 +
            weights['c2'] * c2 +
            weights['c3'] * c3 +
            weights['c4'] * c4 +
            weights['c5'] * c5
        )
        
        return {
            'c1': round(c1, 2),
            'c2': round(c2, 2),
            'c3': round(c3, 2),
            'c4': round(c4, 2),
            'c5': round(c5, 2),
            'priority_score': round(priority_score, 2),
        }
    
    def calculate_idea_score(
        self,
        idea: InnovationIdea,
        business_type: str = 'manufacturing',
    ) -> Dict:
        """
        محاسبه امتیاز MCDM برای یه ایده نوآوری
        """
        weights = self.get_weights(business_type)
        
        # C1 — ارزش استراتژیک
        c1 = min(5.0, max(1.0, idea.strategic_alignment or 3.0))
        
        # C2 — بازگشت سرمایه (تخمینی از روی strategic_alignment)
        c2 = min(5.0, max(1.0, idea.strategic_alignment or 3.0))
        
        # C3 — امکان‌پذیری (ایده‌ها معمولاً پرریسک‌ترن)
        c3 = 3.0
        
        # C4 — هم‌راستایی اهداف
        c4 = min(5.0, max(1.0, idea.strategic_alignment or 3.0))
        
        # C5 — فوریت
        c5 = 3.0
        
        priority_score = (
            weights['c1'] * c1 +
            weights['c2'] * c2 +
            weights['c3'] * c3 +
            weights['c4'] * c4 +
            weights['c5'] * c5
        )
        
        return {
            'c1': round(c1, 2),
            'c2': round(c2, 2),
            'c3': round(c3, 2),
            'c4': round(c4, 2),
            'c5': round(c5, 2),
            'priority_score': round(priority_score, 2),
        }
    
    # ═══════════════════════════════════════════════════════
    # ساخت PrioritizedProject از Opportunity
    # ═══════════════════════════════════════════════════════
    
    @property
    def budget_ratios(self):
        """خواندن نسبت بودجه به ارزش از BudgetRatios.csv"""
        import csv
        import os
        path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            'config',
            'BudgetRatios.csv',
        )
        ratios = {}
        if os.path.exists(path):
            with open(path, encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for r in reader:
                    ratios[int(r['asset_type_id'])] = float(r['budget_ratio'])
        return ratios

    def calculate_estimated_budget(self, opportunity, priority_score=None):
        """
        محاسبه بودجه تخمینی — فرمول ترکیبی

        فرمول:
            base = annual_budget × 0.05
            complexity = BudgetRatios[asset_type_id]
            score_factor = priority_score / 5
            estimated = base × complexity × score_factor
            cap = potential_value × 0.6
        """
        # ۱. بودجه سالانه سازمان
        business_type = None
        if opportunity.organization:
            business_type = getattr(opportunity.organization, 'type', None)

        annual = get_threshold(business_type, 'annual_budget', default=None)
        if annual and isinstance(annual, dict):
            annual_max = annual.get('max', 0) or 5e11
        else:
            annual_max = 5e11

        base = annual_max * 0.05

        # ۲. پیچیدگی دارایی
        asset_type_id = None
        if opportunity.asset and hasattr(opportunity.asset, 'asset_type'):
            asset_type = opportunity.asset.asset_type
            if asset_type:
                asset_type_id = asset_type.id

        complexity = self.budget_ratios.get(asset_type_id, 0.25) if asset_type_id else 0.25

        # ۳. نسبت امتیاز
        if priority_score is None:
            priority_score = 3.0
        score_factor = max(0.5, min(2.0, priority_score / 5))

        # ۴. محاسبه
        estimated = base * complexity * score_factor

        # ۵. سقف
        potential = float(opportunity.potential_value or 0)
        if potential > 0:
            estimated = min(estimated, potential * 0.6)

        return estimated

    def calculate_estimated_budget_for_idea(self, idea, priority_score=None):
        """
        محاسبه بودجه تخمینی برای ایده نوآوری (INNO)

        فرمول:
            base = annual_budget × 0.08  (8% بودجه سالانه — بیشتر از DEV چون R&D)
            domain_factor بر اساس tech_domain
            score_factor = priority_score / 5
            estimated = base × domain_factor × score_factor
        """
        # ۱. بودجه سالانه سازمان
        business_type = None
        if idea.organization:
            business_type = getattr(idea.organization, 'type', None)

        annual = get_threshold(business_type, 'annual_budget', default=None)
        if annual and isinstance(annual, dict):
            annual_max = annual.get('max', 0) or 5e11
        else:
            annual_max = 5e11

        base = annual_max * 0.08

        # ۲. ضریب حوزه فناوری (بر اساس TechDomain choices واقعی)
        TECH_DOMAIN_FACTORS = {
            'software': 0.45,        # نرم‌افزار
            'hardware': 0.55,        # سخت‌افزار
            'chemical': 0.60,        # شیمیایی
            'mechanical': 0.50,      # مکانیکی
            'biotech': 0.70,         # بیوتک
            'process': 0.25,         # فرآیند
            'business_model': 0.20,  # مدل کسب‌وکار
            'other': 0.30,
        }

        tech_domain = getattr(idea, 'tech_domain', None) or 'other'
        domain_factor = TECH_DOMAIN_FACTORS.get(tech_domain, 0.30)

        # ۳. نسبت امتیاز
        if priority_score is None:
            priority_score = 3.0
        score_factor = max(0.5, min(2.0, priority_score / 5))

        # ۴. محاسبه
        estimated = base * domain_factor * score_factor

        # ۵. هم‌راستایی استراتژیک
        alignment = float(getattr(idea, 'strategic_alignment', 0) or 0)
        if alignment >= 4:
            estimated *= 1.2

        return estimated

    def create_project_from_opportunity(
        self,
        opportunity: DevelopmentOpportunity,
        business_type: str = 'manufacturing',
        user=None,
    ) -> Optional[PrioritizedProject]:
        """
        ساخت PrioritizedProject از DevelopmentOpportunity
        """
        # چک کن قبلاً وجود نداره
        existing = PrioritizedProject.objects.filter(
            opportunity=opportunity,
        ).first()
        
        # محاسبه امتیاز
        scores = self.calculate_opportunity_score(opportunity, business_type)
        
        # 🆕 چک آستانه min_approval_score
        min_score = get_threshold(business_type, 'min_approval_score', default=3.5)
        # اگه dict برگشت، از 'min' استفاده کن
        if isinstance(min_score, dict):
            min_score = min_score.get('min', 3.5)
        min_score = float(min_score) if min_score is not None else 3.5
        
        if scores['priority_score'] < min_score:
            # فرصت به backlog منتقل می‌شه
            if opportunity.status != 'backlog':
                opportunity.status = 'backlog'
                opportunity.save(update_fields=['status'])
            raise BelowThresholdError(
                f'امتیاز اولویت ({scores["priority_score"]}) کمتر از حداقل مورد نیاز ({min_score}) است. '
                f'فرصت به لیست backlog منتقل شد.'
            )
        
        # تعیین بودجه تخمینی (فرمول ترکیبی)
        estimated_budget = self.calculate_estimated_budget(
            opportunity,
            priority_score=scores['priority_score'],
        )
        
        if existing:
            # آپدیت
            existing.c1_strategic = scores['c1']
            existing.c2_roi = scores['c2']
            existing.c3_feasibility = scores['c3']
            existing.c4_goal_alignment = scores['c4']
            existing.c5_urgency = scores['c5']
            existing.priority_score = scores['priority_score']
            existing.estimated_budget = estimated_budget
            existing.save()
            return existing
        
        # ساخت جدید
        project = PrioritizedProject.objects.create(
            opportunity=opportunity,
            title=opportunity.asset_name,
            project_type='DEV',
            c1_strategic=scores['c1'],
            c2_roi=scores['c2'],
            c3_feasibility=scores['c3'],
            c4_goal_alignment=scores['c4'],
            c5_urgency=scores['c5'],
            priority_score=scores['priority_score'],
            estimated_budget=estimated_budget,
            approval_status='pending',
            organization=opportunity.organization,
            created_by=user,
        )
        
        return project
    
    @transaction.atomic
    def create_project_from_idea(
        self,
        idea: InnovationIdea,
        business_type: str = 'manufacturing',
        user=None,
    ) -> Optional[PrioritizedProject]:
        """
        ساخت PrioritizedProject از InnovationIdea
        """
        existing = PrioritizedProject.objects.filter(
            innovation_idea=idea,
        ).first()
        
        scores = self.calculate_idea_score(idea, business_type)
        
        if existing:
            existing.c1_strategic = scores['c1']
            existing.c2_roi = scores['c2']
            existing.c3_feasibility = scores['c3']
            existing.c4_goal_alignment = scores['c4']
            existing.c5_urgency = scores['c5']
            existing.priority_score = scores['priority_score']
            existing.estimated_budget = self.calculate_estimated_budget_for_idea(
                idea,
                priority_score=scores['priority_score'],
            )
            existing.save()
            return existing
        
        project = PrioritizedProject.objects.create(
            innovation_idea=idea,
            title=idea.title,
            project_type='INNO',
            c1_strategic=scores['c1'],
            c2_roi=scores['c2'],
            c3_feasibility=scores['c3'],
            c4_goal_alignment=scores['c4'],
            c5_urgency=scores['c5'],
            priority_score=scores['priority_score'],
            estimated_budget=self.calculate_estimated_budget_for_idea(
                idea,
                priority_score=scores['priority_score'],
            ),
            approval_status='pending',
            organization=idea.organization,
            created_by=user,
        )
        
        return project
    
    # ═══════════════════════════════════════════════════════
    # Bulk: ساخت پروژه از همه فرصت‌ها و ایده‌ها
    # ═══════════════════════════════════════════════════════
    
    def create_all_projects(
        self,
        organization=None,
        business_type: str = 'manufacturing',
        user=None,
    ) -> Dict:
        """
        ساخت PrioritizedProject از همه فرصت‌ها و ایده‌ها
        """
        # فرصت‌ها
        opportunities = DevelopmentOpportunity.objects.filter(
            status__in=['identified', 'scored'],
        )
        if organization:
            opportunities = opportunities.filter(organization=organization)
        
        # ایده‌ها
        ideas = InnovationIdea.objects.filter(
            status__in=['draft', 'submitted'],
        )
        if organization:
            ideas = ideas.filter(organization=organization)
        
        created = 0
        updated = 0
        errors = 0
        
        # ساخت از فرصت‌ها
        for opp in opportunities:
            try:
                existing = PrioritizedProject.objects.filter(opportunity=opp).first()
                project = self.create_project_from_opportunity(opp, business_type, user)
                if project:
                    if existing:
                        updated += 1
                    else:
                        created += 1
                    
                    # آپدیت status فرصت
                    if opp.status == 'identified':
                        opp.status = 'scored'
                        opp.save()
            except Exception as e:
                print(f"Error creating project from opp {opp.id}: {e}")
                errors += 1
        
        # ساخت از ایده‌ها
        for idea in ideas:
            try:
                existing = PrioritizedProject.objects.filter(innovation_idea=idea).first()
                project = self.create_project_from_idea(idea, business_type, user)
                if project:
                    if existing:
                        updated += 1
                    else:
                        created += 1
                    
                    # آپدیت status ایده
                    if idea.status == 'draft':
                        idea.status = 'scored'
                        idea.save()
            except Exception as e:
                print(f"Error creating project from idea {idea.id}: {e}")
                errors += 1
        
        # رتبه‌بندی مجدد
        self.recalculate_ranks()
        
        return {
            'opportunities_total': opportunities.count(),
            'ideas_total': ideas.count(),
            'created': created,
            'updated': updated,
            'errors': errors,
        }
    
    # ═══════════════════════════════════════════════════════
    # رتبه‌بندی مجدد
    # ═══════════════════════════════════════════════════════
    
    @transaction.atomic
    def recalculate_ranks(self, organization=None) -> int:
        """
        رتبه‌بندی همه پروژه‌ها + recalculate بودجه

        کارها:
        ۱. رتبه‌بندی بر اساس priority_score
        ۲. محاسبه مجدد estimated_budget (چون ممکنه potential_value عوض شده باشه)
        ۳. اگه پروژه approved بود، approved_budget هم sync بشه
        """
        queryset = PrioritizedProject.objects.all()
        if organization:
            queryset = queryset.filter(organization=organization)

        queryset = queryset.order_by('-priority_score')

        count = 0
        for idx, project in enumerate(queryset, 1):
            project.rank = idx

            # recalculate بودجه
            new_budget = None
            if project.opportunity:
                new_budget = self.calculate_estimated_budget(
                    project.opportunity,
                    priority_score=project.priority_score,
                )
            elif project.innovation_idea:
                new_budget = self.calculate_estimated_budget_for_idea(
                    project.innovation_idea,
                    priority_score=project.priority_score,
                )

            update_fields = ['rank']

            if new_budget is not None:
                old_budget = float(project.estimated_budget or 0)
                if abs(old_budget - float(new_budget)) > 1:
                    project.estimated_budget = new_budget
                    update_fields.append('estimated_budget')

                    # اگه approved هست، approved_budget هم sync بشه
                    if project.approval_status == 'approved':
                        project.approved_budget = new_budget
                        update_fields.append('approved_budget')

            project.save(update_fields=update_fields)
            count += 1

        return count


# Singleton
score_engine_service = ScoreEngineService()
