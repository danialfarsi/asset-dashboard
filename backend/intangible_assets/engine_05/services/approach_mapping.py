"""
سرویس ProjectApproach_Mapping — توصیه متدولوژی
مسیر: engine_05/services/approach_mapping.py
"""
import csv
import os


class ApproachMappingService:
    """توصیه متدولوژی و تعداد گیت بر اساس asset_type + project_type"""

    _cache = None

    @classmethod
    def _csv_path(cls):
        return os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            'config',
            'ProjectApproach_Mapping.csv',
        )

    @classmethod
    def _load(cls):
        if cls._cache is not None:
            return cls._cache
        rows = []
        if os.path.exists(cls._csv_path()):
            with open(cls._csv_path(), encoding='utf-8') as f:
                reader = csv.DictReader(f)
                rows = list(reader)
        cls._cache = rows
        return rows

    @classmethod
    def suggest(cls, asset_type_id: int, project_type: str = 'DEV'):
        """
        توصیه متدولوژی

        Returns:
            {
                'recommended_methodology': 'linear' | 'stage_gate',
                'gate_count': int,
                'risk_level': str,
                'uncertainty_level': str,
                'description': str,
            } or None
        """
        if not asset_type_id:
            return None

        rows = cls._load()

        for r in rows:
            if (str(r.get('asset_type_id')) == str(asset_type_id)
                    and r.get('project_type') == project_type):
                return {
                    'recommended_methodology': r.get('recommended_methodology', 'linear'),
                    'gate_count': int(r.get('gate_count', 1)),
                    'risk_level': r.get('risk_level', 'low'),
                    'uncertainty_level': r.get('uncertainty_level', 'low'),
                    'description': r.get('description', ''),
                }

        # fallback پیش‌فرض
        if project_type == 'INNO':
            return {
                'recommended_methodology': 'stage_gate',
                'gate_count': 3,
                'risk_level': 'high',
                'uncertainty_level': 'high',
                'description': 'پیش‌فرض نوآوری',
            }
        return {
            'recommended_methodology': 'linear',
            'gate_count': 1,
            'risk_level': 'low',
            'uncertainty_level': 'low',
            'description': 'پیش‌فرض توسعه',
        }


approach_mapping_service = ApproachMappingService()
