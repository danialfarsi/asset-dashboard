"""
اسکریپت کامل درج ۲۶ دارایی نامشهود برای ملی مس
"""
import os
import random
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from decimal import Decimal
from accounts.models import Organization, User
from intangible_assets.models import ScreenedAsset, ScreeningTemplate
from intangible_assets.valuation_models import ValuationCase, AssetValuation
from intangible_assets.valuation_step3_models import ValuationStep3
from intangible_assets.valuation_step4_models import ValuationStep4
from intangible_assets.valuation_qc_models import QualityControlResult
from intangible_assets.valuation_sensitivity_models import SensitivityAnalysis
from intangible_assets.asset_codes import generate_asset_uid

ASSETS = [
    (1,  'برنامه مدیریت استراتژیک',       'برنامه', 'درآمدی',        8064, 25, 'M-05', 'DCF'),
    (2,  'سند چشم‌انداز 1408',             'سند',    'هزینه‌ای',       3456, 34, 'M-06', 'NAV'),
    (3,  'نقشه استراتژی',                 'نقشه',   'هزینه‌ای',       1728, 25, 'M-05', 'NAV'),
    (4,  'برنامه مدیریت بازار',            'برنامه', 'درآمدی',        6080, 11, 'M-02', 'DCF'),
    (5,  'استراتژی بازاریابی',             'سند',    'درآمدی',        2592, 11, 'M-02', 'DCF'),
    (6,  'نقشه مدیریت بازار',              'نقشه',   'بازار',         1280, 11, 'M-02', 'NAV'),
    (7,  'برنامه مدیریت برند',             'برنامه', 'درآمدی',        6080, 9,  'M-01', 'DCF'),
    (8,  'راهبرد برندینگ',                 'سند',    'ارزش ویژه',     2560, 9,  'M-01', 'NAV'),
    (9,  'نقشه مدیریت برند',               'نقشه',   'بازار',         1280, 9,  'M-01', 'NAV'),
    (10, 'برنامه مهندسی و تامین مالی',     'برنامه', 'درآمدی',        1792, 16, 'M-05', 'DCF'),
    (11, 'خط‌مشی مهندسی و تامین مالی',      'سند',    'هزینه‌ای',       576,  16, 'M-05', 'NAV'),
    (12, 'نقشه جریان نقدی',                'نقشه',   'درآمدی',        416,  16, 'M-05', 'DCF'),
    (13, 'برنامه مدیریت سرمایه سازمانی',   'برنامه', 'درآمدی',        1728, 16, 'M-05', 'DCF'),
    (14, 'استراتژی سرمایه‌گذاری',          'سند',    'گزینه‌های واقعی', 416,  16, 'M-05', 'NAV'),
    (15, 'نقشه سرمایه‌گذاری',              'نقشه',   'درآمدی',        416,  16, 'M-05', 'DCF'),
    (16, 'برنامه مدیریت حقوقی',            'برنامه', 'ارزش ویژه',     5956, 15, 'M-04', 'NAV'),
    (17, 'سند استراتژی حقوقی',             'سند',    'ارزش ویژه',     2753, 15, 'M-04', 'NAV'),
    (18, 'برنامه مدیریت ریسک حقوقی',       'برنامه', 'درآمدی',        4008, 15, 'M-04', 'DCF'),
    (19, 'سند تحول امور حقوقی',            'سند',    'ارزش ویژه',     2913, 15, 'M-04', 'NAV'),
    (20, 'برنامه مدیریت ریسک قیمت کالا',   'برنامه', 'درآمدی',        5784, 31, 'M-05', 'DCF'),
    (21, 'سند استراتژی قیمت‌گذاری',         'سند',    'درآمدی',        2600, 19, 'M-04', 'DCF'),
    (22, 'برنامه مدیریت ریسک ارزی',        'برنامه', 'درآمدی',        5253, 19, 'M-04', 'DCF'),
    (23, 'سند استراتژی تهاتر',             'سند',    'درآمدی',        2522, 4,  'M-04', 'DCF'),
    (24, 'برنامه مدیریت ریسک و بیمه',      'برنامه', 'هزینه‌ای',       5942, 4,  'M-04', 'NAV'),
    (25, 'سند خط‌مشی بیمه',                'سند',    'هزینه‌ای',       2802, 4,  'M-04', 'NAV'),
    (26, 'برنامه مدیریت اختلافات و دعاوی', 'برنامه', 'ارزش ویژه',     3867, 15, 'M-04', 'NAV'),
]

HOURS = {
    1:  (358, 343, 314, 314, 533, 448, 4, 105, 2, 269, 2, 358),
    2:  (154, 147, 134, 134, 229, 192, 4, 45,  2, 115, 2, 154),
    3:  (77,  74,  67,  67,  117, 96,  4, 22,  2, 58,  2, 77),
    4:  (270, 259, 236, 236, 405, 338, 4, 79,  2, 203, 2, 270),
    5:  (115, 110, 101, 101, 171, 144, 4, 34,  2, 86,  2, 115),
    6:  (57,  55,  50,  50,  76,  71,  4, 17,  2, 43,  2, 57),
    7:  (270, 259, 236, 236, 405, 338, 4, 79,  2, 203, 2, 270),
    8:  (114, 109, 100, 100, 171, 142, 4, 33,  2, 85,  2, 114),
    9:  (57,  55,  50,  50,  76,  71,  4, 17,  2, 43,  2, 57),
    10: (80,  76,  70,  70,  118, 100, 4, 23,  2, 60,  2, 80),
    11: (26,  25,  22,  22,  43,  32,  4, 7,   2, 19,  2, 26),
    12: (18,  18,  16,  16,  35,  23,  4, 5,   2, 14,  2, 18),
    13: (77,  74,  67,  67,  117, 96,  4, 22,  2, 58,  2, 77),
    14: (18,  18,  16,  16,  35,  23,  4, 5,   2, 14,  2, 18),
    15: (18,  18,  16,  16,  35,  23,  4, 5,   2, 14,  2, 18),
    16: (286, 274, 250, 250, 180, 120, 4, 84,  2, 215, 2, 286),
    17: (124, 116, 105, 105, 182, 154, 4, 36,  2, 92,  2, 124),
    18: (256, 244, 220, 200, 150, 90,  4, 32,  2, 88,  2, 108),
    19: (130, 122, 110, 100, 175, 150, 4, 44,  2, 96,  2, 130),
    20: (280, 270, 250, 250, 180, 120, 4, 80,  2, 210, 2, 252),
    21: (120, 110, 100, 100, 180, 150, 4, 30,  2, 90,  2, 120),
    22: (252, 242, 225, 225, 162, 108, 4, 72,  2, 189, 2, 252),
    23: (120, 110, 110, 100, 150, 140, 4, 30,  2, 72,  2, 122),
    24: (286, 274, 220, 250, 184, 120, 4, 90,  2, 215, 2, 286),
    25: (136, 100, 110, 98,  160, 140, 4, 50,  2, 72,  2, 122),
    26: (220, 245, 220, 200, 150, 90,  4, 32,  2, 88,  2, 108),
}

HOURLY_RATE_MANAGER = 5_000_000
HOURLY_RATE_EXPERT = 3_000_000
HOURLY_RATE_SUPPORT = 2_000_000

METHOD_NAMES = {
    'M-01': 'Relief from Royalty', 'M-02': 'MEEM', 'M-03': 'DCF',
    'M-04': 'With-and-Without', 'M-05': 'Replacement Cost',
    'M-06': 'Reproduction Cost', 'M-07': 'Trained Workforce Cost',
    'M-08': 'Comparable Transactions', 'M-09': 'Market Multiples',
}

def build_calculation_details(row_idx, name, total_mr, formula, v_type):
    pm, doc, tech, train, pm_ctrl, support, cons_count, cons_h, sr_count, sr_h, exp_count, exp_h = HOURS[row_idx]
    cost_pm = pm * HOURLY_RATE_MANAGER
    cost_doc = doc * HOURLY_RATE_EXPERT
    cost_tech = tech * HOURLY_RATE_EXPERT
    cost_train = train * HOURLY_RATE_EXPERT
    cost_pm_ctrl = pm_ctrl * HOURLY_RATE_SUPPORT
    cost_support = support * HOURLY_RATE_SUPPORT
    cost_cons = cons_count * cons_h * HOURLY_RATE_EXPERT
    cost_sr = sr_count * sr_h * HOURLY_RATE_EXPERT
    cost_exp = exp_count * exp_h * HOURLY_RATE_EXPERT
    total_labor = cost_pm + cost_doc + cost_tech + cost_train + cost_pm_ctrl + cost_support + cost_cons + cost_sr + cost_exp
    final_value = Decimal(total_mr) * 1_000_000
    material_cost = max(0, int(final_value) - total_labor)
    total_hours_sum = pm + doc + tech + train + pm_ctrl + support + (cons_count * cons_h) + (sr_count * sr_h) + (exp_count * exp_h)
    summary = {
        'labor_cost': int(total_labor), 'material_cost': material_cost,
        'overhead_pct': 0.0, 'profit_pct': 0.0,
        'final_value': int(final_value), 'token_value': int(total_mr) / 1000,
        'method': formula, 'method_name': METHOD_NAMES.get(formula, formula),
    }
    roles = {
        'project_manager': {'name': 'مدیر پروژه', 'hours': pm, 'rate': HOURLY_RATE_MANAGER, 'cost': cost_pm},
        'documentation_manager': {'name': 'مدیر تیم مستندسازی', 'hours': doc, 'rate': HOURLY_RATE_EXPERT, 'cost': cost_doc},
        'tech_manager': {'name': 'مدیر تیم فناوری', 'hours': tech, 'rate': HOURLY_RATE_EXPERT, 'cost': cost_tech},
        'training_manager': {'name': 'مدیر تیم آموزش و جریان‌سازی', 'hours': train, 'rate': HOURLY_RATE_EXPERT, 'cost': cost_train},
        'pm_control': {'name': 'رییس مدیریت و کنترل پروژه', 'hours': pm_ctrl, 'rate': HOURLY_RATE_SUPPORT, 'cost': cost_pm_ctrl},
        'support_manager': {'name': 'رییس پشتیبانی', 'hours': support, 'rate': HOURLY_RATE_SUPPORT, 'cost': cost_support},
        'consultants': {'name': 'مشاوران', 'count': cons_count, 'hours_each': cons_h, 'total_hours': cons_count * cons_h, 'rate': HOURLY_RATE_EXPERT, 'cost': cost_cons},
        'senior_experts': {'name': 'کارشناسان ارشد', 'count': sr_count, 'hours_each': sr_h, 'total_hours': sr_count * sr_h, 'rate': HOURLY_RATE_EXPERT, 'cost': cost_sr},
        'experts': {'name': 'کارشناسان', 'count': exp_count, 'hours_each': exp_h, 'total_hours': exp_count * exp_h, 'rate': HOURLY_RATE_EXPERT, 'cost': cost_exp},
    }
    cum = 0
    waterfall = []
    steps = [
        ('هزینه مدیر پروژه', cost_pm), ('هزینه مدیر تیم مستندسازی', cost_doc),
        ('هزینه مدیر تیم فناوری', cost_tech), ('هزینه مدیر تیم آموزش', cost_train),
        ('هزینه رییس کنترل پروژه', cost_pm_ctrl), ('هزینه رییس پشتیبانی', cost_support),
        ('هزینه مشاوران', cost_cons), ('هزینه کارشناسان ارشد', cost_sr),
        ('هزینه کارشناسان', cost_exp), ('هزینه مواد/زیرساخت', material_cost),
    ]
    for i, (title, amount) in enumerate(steps, 1):
        cum += amount
        waterfall.append({'step': i, 'type': 'increase', 'title': title, 'amount': amount, 'is_final': False, 'cumulative': cum})
    waterfall.append({'step': 11, 'type': 'final', 'title': 'ارزش نهایی', 'amount': int(final_value), 'is_final': True, 'cumulative': int(final_value)})
    return {'summary': summary, 'inputs': {'roles': roles, 'total_hours': total_hours_sum, 'hourly_rates': {'manager': HOURLY_RATE_MANAGER, 'expert': HOURLY_RATE_EXPERT, 'support': HOURLY_RATE_SUPPORT}}, 'waterfall': waterfall}

def build_method_inputs(row_idx, name, formula, v_type):
    hours = HOURS[row_idx]
    base = {'method_id': formula, 'asset_name': name, 'valuation_type': v_type,
            'labor_hours_total': hours[0] + hours[1] + hours[2] + hours[3] + hours[4] + hours[5] + (hours[6]*hours[7]) + (hours[8]*hours[9]) + (hours[10]*hours[11])}
    if formula == 'M-01':
        base.update({'royalty_rate': 4, 'revenue_attribution': 80, 'revenue_growth_rate': 8, 'quality_multiplier': 0.92, 'tax_rate': 25, 'discount_rate': 18, 'terminal_growth_rate': 5, 'forecast_horizon': 5, 'current_revenue': 500_000_000_000})
    elif formula == 'M-02':
        base.update({'ebit_margin': 25, 'cac_charge_rate': 8, 'tax_rate': 25, 'discount_rate': 18, 'forecast_horizon': 5, 'terminal_growth_rate': 5, 'current_revenue': 500_000_000_000})
    elif formula == 'M-03':
        base.update({'fcf_data': [100_000_000, 120_000_000, 140_000_000, 160_000_000, 180_000_000], 'discount_rate': 18, 'terminal_growth_rate': 5, 'forecast_horizon': 5})
    elif formula == 'M-04':
        base.update({'with_asset_value': 800_000_000, 'without_asset_value': 300_000_000, 'quality_multiplier': 0.90, 'tax_rate': 25, 'discount_rate': 18, 'forecast_horizon': 5})
    elif formula == 'M-05':
        base.update({'labor_cost': 1_000_000_000, 'material_cost': 200_000_000, 'overhead_pct': 20, 'profit_pct': 15, 'quality_multiplier': 0.91, 'tax_rate': 25})
    elif formula == 'M-06':
        base.update({'reproduction_cost': 800_000_000, 'depreciation_pct': 10, 'quality_multiplier': 0.90})
    elif formula == 'M-07':
        base.update({'training_cost': 500_000_000, 'recruitment_cost': 200_000_000, 'lost_productivity': 100_000_000, 'quality_multiplier': 0.92})
    return base

try:
    org = Organization.objects.get(code='NICICO')
    print(f"🏢 سازمان: {org.name} (id={org.id})")
except Organization.DoesNotExist:
    print("❌ سازمان NICICO یافت نشد!")
    exit(1)

try:
    user = User.objects.get(email='ali_behlouli@nicico.com')
    print(f"👤 کاربر: {user.first_name} {user.last_name} ({user.email})")
except User.DoesNotExist:
    print("❌ کاربر علی بهلولی یافت نشد!")
    exit(1)

print("="*80)
created_count = 0
for row in ASSETS:
    idx, name, atype, method, total_mr, template_id, formula, v_type = row
    existing = ScreenedAsset.objects.filter(asset_name=name, created_by=user).first()
    if existing:
        asset = existing
        print(f"⚠️  [{idx:2d}] {name[:40]:40s} از قبل موجود")
        created = False
    else:
        try:
            template = ScreeningTemplate.objects.get(id=template_id)
        except ScreeningTemplate.DoesNotExist:
            template = None
        template_category = template.category if template else 'operational_knowledge'
        template_asset_type_id = template.asset_type_id if template else None
        auto_uid = generate_asset_uid(template_category, template.item_name if template else '')
        asset = ScreenedAsset.objects.create(
            asset_uid=auto_uid, asset_name=name, category=template_category,
            result='confirmed',
            description=f'{atype} - روش: {method} - فرمول: {formula} - قالب: {template.item_name if template else "نامشخص"}',
            valuation_method=formula, valuation_type=v_type,
            asset_type_id=template_asset_type_id, created_by=user,
        )
        created = True
        created_count += 1
        print(f"✅ [{idx:2d}] {name[:40]:40s} → {auto_uid} | {formula} | {v_type}")
    eval_score = random.randint(75, 95)
    AssetValuation.objects.update_or_create(
        asset=asset,
        defaults={'evaluated_by': user, 'status': 'completed', 'final_score': eval_score,
                  'strategic_score': eval_score * 0.95, 'technical_score': eval_score * 0.9,
                  'operational_score': eval_score * 0.85, 'market_score': eval_score * 0.8, 'risk_score': eval_score * 0.88}
    )
    case, _ = ValuationCase.objects.get_or_create(
        asset=asset,
        defaults={'category': 'operational', 'business_unit': 'ملی مس', 'lifecycle_stage': 'growth',
                  'currency': 'IRR', 'inflation_basis': 'cost', 'tax_rate': 0.25, 'discount_rate': 0.18,
                  'forecast_horizon': 5, 'terminal_growth_rate': 0.05, 'current_revenue': 500_000_000_000,
                  'useful_life': 5, 'source_reliability': 'high', 'overlap_risk_level': 'medium',
                  'overlap_type': 'revenue', 'review_status': 'pending', 'status': 'draft',
                  'final_score': eval_score, 'valuation_method': formula, 'created_by': user}
    )
    ValuationStep3.objects.update_or_create(
        valuation_case=case,
        defaults={'method_id': formula, 'method_inputs': build_method_inputs(idx, name, formula, v_type),
                  'validation_status': 'VALIDATED', 'validation_errors': 0, 'validation_warnings': 1}
    )
    step4, _ = ValuationStep4.objects.update_or_create(
        valuation_case=case,
        defaults={'method_id': formula, 'final_value': Decimal(total_mr) * 1_000_000,
                  'token_value': Decimal(total_mr) / 1000, 'confidence_level': Decimal('0.9100'),
                  'qc_score': 91, 'calculation_details': build_calculation_details(idx, name, total_mr, formula, v_type),
                  'step4_status': 'CALCULATED'}
    )
    QualityControlResult.objects.update_or_create(
        valuation_case=case,
        defaults={'method_id': formula, 'completeness_score': 92, 'total_rules': 25,
                  'passed': 23, 'warnings': 2, 'errors': 0, 'blocking_issues': 0,
                  'decision': 'APPROVE', 'reviewer_comment': 'تأیید شده توسط کارشناس کنترل کیفیت',
                  'qc_data': {'passed_rules': list(range(1, 24)), 'warnings': [24, 25]}}
    )
    base_val = float(Decimal(total_mr) * 1_000_000)
    SensitivityAnalysis.objects.update_or_create(
        valuation_case=case, method_id=formula,
        defaults={'step4': step4, 'base_value': Decimal(total_mr) * 1_000_000,
                  'tornado_data': {'drivers': [{'name': 'نرخ تنزیل', 'impact': base_val * 0.15}, {'name': 'نرخ رشد', 'impact': base_val * 0.12}, {'name': 'حاشیه سود', 'impact': base_val * 0.10}]},
                  'scenario_results': {'pessimistic': base_val * 0.75, 'base': base_val, 'optimistic': base_val * 1.25},
                  'critical_drivers': ['نرخ تنزیل', 'نرخ رشد'],
                  'min_value': Decimal(str(int(base_val * 0.7))), 'max_value': Decimal(str(int(base_val * 1.3))),
                  'std_deviation': base_val * 0.15, 'confidence_interval_low': Decimal(str(int(base_val * 0.85))),
                  'confidence_interval_high': Decimal(str(int(base_val * 1.15))), 'confidence_level': 0.95,
                  'status': 'calculated', 'created_by': user}
    )

print("\\n" + "="*80)
print(f"🎉 {created_count} دارایی جدید ساخته شد!")
print("="*80)
dcf_count = ScreenedAsset.objects.filter(created_by=user, valuation_type='DCF').count()
nav_count = ScreenedAsset.objects.filter(created_by=user, valuation_type='NAV').count()
print(f"\\n📊 خلاصه علی بهلولی:")
print(f"   - DCF: {dcf_count} دارایی")
print(f"   - NAV: {nav_count} دارایی")
print(f"   - مجموع: {dcf_count + nav_count} دارایی")
