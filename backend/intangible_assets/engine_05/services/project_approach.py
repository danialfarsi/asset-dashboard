"""
سرویس ProjectApproach — توصیه methodology بر اساس asset_type و project_type
مسیر: engine_05/services/project_approach.py
"""
import csv
import os


def _load_mappings():
    """بارگذاری همه mappingها"""
    path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        'config',
        'ProjectApproach_Mapping.csv',
    )
    rows = []
    if os.path.exists(path):
        with open(path, encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for r in reader:
                rows.append(r)
    return rows


def get_approach(asset_type_id, project_type='DEV'):
    """
    توصیه methodology و gate_count

    استفاده:
        get_approach(4, 'DEV')  → {'methodology': 'linear', 'gate_count': 1, ...}
        get_approach(4, 'INNO') → {'methodology': 'stage_gate', 'gate_count': 3, ...}
    """
    rows = _load_mappings()

    match = None
    for r in rows:
        if str(r.get('asset_type_id')) == str(asset_type_id) and r.get('project_type') == project_type:
            match = r
            break

    if not match:
        # fallback: اگه asset_type نبود
        return {
            'methodology': 'linear',
            'gate_count': 1,
            'risk_level': 'low',
            'uncertainty_level': 'low',
            'description': 'پیش‌فرض (بدون mapping)',
            'source': 'fallback',
        }

    return {
        'methodology': match.get('recommended_methodology', 'linear'),
        'gate_count': int(match.get('gate_count', 1)),
        'risk_level': match.get('risk_level', 'low'),
        'uncertainty_level': match.get('uncertainty_level', 'low'),
        'description': match.get('description', ''),
        'source': 'mapping',
    }


def suggest_for_project(project):
    """
    توصیه methodology برای یه PrioritizedProject
    """
    # asset_type_id
    asset_type_id = None
    if project.opportunity and project.opportunity.asset:
        asset_type = getattr(project.opportunity.asset, 'asset_type', None)
        if asset_type:
            asset_type_id = asset_type.id

    project_type = project.project_type or 'DEV'

    if not asset_type_id:
        # اگه asset_type نداریم (مثل ایده‌ها)، پیش‌فرض بر اساس project_type
        if project_type == 'INNO':
            return {
                'methodology': 'stage_gate',
                'gate_count': 3,
                'risk_level': 'high',
                'uncertainty_level': 'high',
                'description': 'ایده نوآوری — مرحله‌ای',
                'source': 'default_idea',
            }
        else:
            return {
                'methodology': 'linear',
                'gate_count': 1,
                'risk_level': 'low',
                'uncertainty_level': 'low',
                'description': 'پیش‌فرض DEV',
                'source': 'default_dev',
            }

    return get_approach(asset_type_id, project_type)
