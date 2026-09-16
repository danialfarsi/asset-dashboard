"""
🎯 SYS_GAP_ANALYTICS
سرویس تحلیل شکاف و شناسایی فرصت توسعه

طبق سند META-ENG4-SPEC-v1.0:
- خواندن داده‌های موتور ۲ (ارزیابی کیفی)
- مقایسه با بنچمارک‌ها
- محاسبه Gap Score
- تولید DevelopmentOpportunity
"""

import csv
import os
from typing import Dict, List, Optional, Tuple
from decimal import Decimal

from django.conf import settings
from django.utils import timezone
from django.db.models import Q

from ..models import DevelopmentOpportunity, InnovationIdea
from ...models import ScreenedAsset
from ...valuation_models import AssetValuation


# مسیر فایل‌های پیکربندی
CONFIG_DIR = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    'config'
)


class GapAnalyticsService:
    """
    سرویس تحلیل شکاف
    """
    
    def __init__(self):
        self._benchmarks = None
        self._thresholds = None
    
    # ═══════════════════════════════════════════════════════
    # خواندن فایل‌های پیکربندی
    # ═══════════════════════════════════════════════════════
    
    @property
    def benchmarks(self) -> Dict[Tuple[int, str], Dict]:
        """خواندن GapAnalysis_Benchmarks.csv"""
        if self._benchmarks is None:
            self._benchmarks = {}
            filepath = os.path.join(CONFIG_DIR, 'GapAnalysis_Benchmarks.csv')
            
            if os.path.exists(filepath):
                with open(filepath, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        key = (int(row['asset_type_id']), row['business_type'])
                        self._benchmarks[key] = {
                            'target_maturity': float(row['target_maturity_score']),
                            'target_s': float(row['target_s']),
                            'target_t': float(row['target_t']),
                            'target_o': float(row['target_o']),
                            'target_m': float(row['target_m']),
                            'target_r': float(row['target_r']),
                            'gap_threshold_critical': float(row['gap_threshold_critical']),
                            'action_route_default': row['action_route_default'],
                            'weights': {
                                's': float(row['weights_s']),
                                't': float(row['weights_t']),
                                'o': float(row['weights_o']),
                                'm': float(row['weights_m']),
                                'r': float(row['weights_r']),
                            },
                        }
        return self._benchmarks
    
    @property
    def thresholds(self) -> Dict[str, Dict]:
        """خواندن InvestmentThresholds.csv"""
        if self._thresholds is None:
            self._thresholds = {}
            filepath = os.path.join(CONFIG_DIR, 'InvestmentThresholds.csv')
            
            if os.path.exists(filepath):
                with open(filepath, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        key = f"{row['threshold_type']}_{row['business_type']}"
                        self._thresholds[key] = {
                            'min_value': float(row['min_value']),
                            'max_value': float(row['max_value']),
                            'action': row['action'],
                        }
        return self._thresholds
    
    # ═══════════════════════════════════════════════════════
    # متد اصلی: تحلیل شکاف یک دارایی
    # ═══════════════════════════════════════════════════════
    
    def analyze_asset(self, asset: ScreenedAsset, business_type: str) -> Optional[Dict]:
        """
        تحلیل شکاف یک دارایی
        
        Returns:
            Dict با اطلاعات شکاف یا None اگه benchmark نبود
        """
        # چک asset_type
        if not asset.asset_type_id:
            return None
        
        # پیدا کردن benchmark
        benchmark = self.benchmarks.get((asset.asset_type_id, business_type))
        if not benchmark:
            # fallback: هر business_type دیگه
            for (at_id, bt), bm in self.benchmarks.items():
                if at_id == asset.asset_type_id:
                    benchmark = bm
                    break
        
        if not benchmark:
            return None
        
        # گرفتن امتیازات فعلی از موتور ۲ (آخرین valuation completed)
        current_scores = self._get_current_scores(asset)
        if not current_scores:
            return None
        
        # محاسبه شکاف
        gaps = {
            's': max(0, benchmark['target_s'] - current_scores['s']),
            't': max(0, benchmark['target_t'] - current_scores['t']),
            'o': max(0, benchmark['target_o'] - current_scores['o']),
            'm': max(0, benchmark['target_m'] - current_scores['m']),
            'r': max(0, benchmark['target_r'] - current_scores['r']),
        }
        
        # امتیاز شکاف کل
        weights = benchmark['weights']
        total_gap = sum(weights[k] * gaps[k] for k in gaps)
        
        # آیا بحرانی هست؟
        is_critical = total_gap >= benchmark['gap_threshold_critical']
        
        # تعیین نوع شکاف غالب
        gap_types_map = {
            's': 'strategic',
            't': 'technical',
            'o': 'operational',
            'm': 'market',
            'r': 'risk',
        }
        dominant_gap = max(gaps.items(), key=lambda x: x[1] * weights[x[0]])[0]
        gap_type = gap_types_map.get(dominant_gap, 'mixed')
        
        # تعیین ماژول
        target_module = benchmark['action_route_default']
        
        # اگه بحرانی بود و پیش‌فرض DEV بود، ممکنه INNO بشه
        if is_critical and target_module == 'DEV':
            # اگه شکاف فنی یا ریسک بحرانی هست، INNO
            if dominant_gap in ['t', 'r'] and gaps[dominant_gap] > 1.5:
                target_module = 'INNO'
        
        return {
            'current_scores': current_scores,
            'target_scores': {
                's': benchmark['target_s'],
                't': benchmark['target_t'],
                'o': benchmark['target_o'],
                'm': benchmark['target_m'],
                'r': benchmark['target_r'],
            },
            'gaps': gaps,
            'total_gap': round(total_gap, 2),
            'is_critical': is_critical,
            'gap_type': gap_type,
            'target_module': target_module,
        }
    
    # ═══════════════════════════════════════════════════════
    # گرفتن امتیازات فعلی از موتور ۲
    # ═══════════════════════════════════════════════════════
    
    def _get_current_scores(self, asset: ScreenedAsset) -> Optional[Dict]:
        """گرفتن امتیازات ۵ بعدی از آخرین valuation"""
        valuation = AssetValuation.objects.filter(
            asset=asset,
            status='completed'
        ).order_by('-evaluated_at').first()
        
        if not valuation:
            return None
        
        # گرفتن organization_type از created_by
        org_type = 'manufacturing'
        if asset.created_by and hasattr(asset.created_by, 'organization_type'):
            org_type = asset.created_by.organization_type or 'manufacturing'
        
        try:
            summary = valuation.get_score_summary(org_type)
            averages = summary.get('averages', {})
            
            return {
                's': float(averages.get('strategic', 0)),
                't': float(averages.get('technical', 0)),
                'o': float(averages.get('operational', 0)),
                'm': float(averages.get('market', 0)),
                'r': float(averages.get('risk', 0)),
            }
        except Exception as e:
            print(f"Error getting scores for asset {asset.id}: {e}")
            return None
    
    # ═══════════════════════════════════════════════════════
    # ایجاد DevelopmentOpportunity از تحلیل
    # ═══════════════════════════════════════════════════════
    
    def create_opportunity_from_asset(
        self,
        asset: ScreenedAsset,
        business_type: str = 'manufacturing',
        user=None,
    ) -> Optional[DevelopmentOpportunity]:
        """
        ایجاد DevelopmentOpportunity از یه دارایی
        """
        # 🎯 چک کن قبلاً وجود نداره (با هر status)
        existing = DevelopmentOpportunity.objects.filter(
            asset=asset,
        ).order_by('-created_at').first()
        
        if existing:
            # آپدیت
            analysis = self.analyze_asset(asset, business_type)
            if analysis:
                self._update_opportunity(existing, asset, analysis)
                return existing
            return existing
        
        # تحلیل
        analysis = self.analyze_asset(asset, business_type)
        if not analysis:
            return None
        
        # 🎯 اگه gap صفر بود، فرصت جدید نساز
        if analysis['total_gap'] < 0.05:
            return None
        
        # محاسبه ارزش بالقوه (تقریبی)
        potential_value = self._estimate_potential_value(asset, analysis)
        
        # ساخت opportunity
        opp = DevelopmentOpportunity.objects.create(
            asset=asset,
            asset_name=asset.asset_name,
            organization=asset.organization,
            gap_type=analysis['gap_type'],
            current_s=analysis['current_scores']['s'],
            current_t=analysis['current_scores']['t'],
            current_o=analysis['current_scores']['o'],
            current_m=analysis['current_scores']['m'],
            current_r=analysis['current_scores']['r'],
            target_s=analysis['target_scores']['s'],
            target_t=analysis['target_scores']['t'],
            target_o=analysis['target_scores']['o'],
            target_m=analysis['target_scores']['m'],
            target_r=analysis['target_scores']['r'],
            gap_score=analysis['total_gap'],
            is_critical=analysis['is_critical'],
            potential_value=potential_value,
            target_module=analysis['target_module'],
            status='identified',
            description=self._build_description(asset, analysis),
            recommendation=self._build_recommendation(analysis),
            created_by=user,
        )
        
        return opp
    
    def _update_opportunity(
        self,
        opp: DevelopmentOpportunity,
        asset: ScreenedAsset,
        analysis: Dict,
    ):
        """آپدیت یه opportunity موجود"""
        opp.current_s = analysis['current_scores']['s']
        opp.current_t = analysis['current_scores']['t']
        opp.current_o = analysis['current_scores']['o']
        opp.current_m = analysis['current_scores']['m']
        opp.current_r = analysis['current_scores']['r']
        opp.gap_score = analysis['total_gap']
        opp.is_critical = analysis['is_critical']
        opp.save()
    
    # ═══════════════════════════════════════════════════════
    # متدهای کمکی
    # ═══════════════════════════════════════════════════════
    
    def _estimate_potential_value(self, asset: ScreenedAsset, analysis: Dict) -> Decimal:
        """
        تخمین ارزش بالقوه بر اساس شکاف
        """
        # TODO: می‌تونیم از ارزش‌گذاری فعلی استفاده کنیم
        # فعلاً یه تخمین ساده
        base_value = Decimal('1000000000')  # ۱ میلیارد
        
        # ضریب شکاف
        gap_multiplier = Decimal(str(1 + analysis['total_gap']))
        
        # اگه بحرانی، ضریب بیشتر
        if analysis['is_critical']:
            gap_multiplier *= Decimal('1.5')
        
        return base_value * gap_multiplier
    
    def _build_description(self, asset: ScreenedAsset, analysis: Dict) -> str:
        """ساخت توضیحات"""
        gaps = analysis['gaps']
        descriptions = []
        
        gap_labels = {
            's': 'استراتژیک',
            't': 'فنی',
            'o': 'عملیاتی',
            'm': 'بازار',
            'r': 'ریسک',
        }
        
        for key, gap_value in gaps.items():
            if gap_value > 0.3:
                descriptions.append(f"شکاف {gap_labels[key]}: {gap_value:.2f}")
        
        return " | ".join(descriptions) if descriptions else "شکاف جزئی"
    
    def _build_recommendation(self, analysis: Dict) -> str:
        """ساخت توصیه"""
        if analysis['is_critical']:
            return "🚨 شکاف بحرانی — نیازمند اقدام فوری"
        
        if analysis['target_module'] == 'INNO':
            return "💡 پیشنهاد: پروژه R&D و خلق دارایی جدید"
        
        return "🔧 پیشنهاد: پروژه توسعه و ارتقای دارایی موجود"
    
    # ═══════════════════════════════════════════════════════
    # متد bulk: تحلیل همه دارایی‌ها
    # ═══════════════════════════════════════════════════════
    
    def analyze_all_assets(
        self,
        organization=None,
        business_type: str = 'manufacturing',
        user=None,
    ) -> Dict:
        """
        تحلیل شکاف همه دارایی‌ها
        """
        # فیلتر دارایی‌ها
        assets = ScreenedAsset.objects.filter(
            result='confirmed',
        )
        
        if organization:
            assets = assets.filter(organization=organization)
        
        # 🎯 فقط دارایی‌هایی که ارزیابی کیفی completed دارن
        from ...valuation_models import AssetValuation
        completed_asset_ids = AssetValuation.objects.filter(
            status='completed'
        ).values_list('asset_id', flat=True)
        
        assets = assets.filter(id__in=completed_asset_ids)
        
        created = 0
        updated = 0
        skipped = 0
        errors = 0
        
        for asset in assets:
            try:
                existing = DevelopmentOpportunity.objects.filter(
                    asset=asset,
                ).first()
                
                opp = self.create_opportunity_from_asset(
                    asset=asset,
                    business_type=business_type,
                    user=user,
                )
                
                if opp:
                    if existing:
                        updated += 1
                    else:
                        created += 1
                else:
                    skipped += 1
            except Exception as e:
                print(f"Error analyzing asset {asset.id}: {e}")
                errors += 1
        
        return {
            'total_assets': assets.count(),
            'created': created,
            'updated': updated,
            'skipped': skipped,
            'errors': errors,
        }


# Singleton
gap_analytics_service = GapAnalyticsService()
