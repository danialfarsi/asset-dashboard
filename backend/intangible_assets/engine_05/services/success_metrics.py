"""
سرویس KPI پیشنهادی — خواندن از SuccessMetrics_Definitions.csv
مسیر: engine_05/services/success_metrics.py
"""
import csv
import os


class SuccessMetricsService:
    """خواندن KPIهای پیشنهادی از CSV"""

    _cache = None

    @classmethod
    def _csv_path(cls):
        return os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            'config',
            'SuccessMetrics_Definitions.csv',
        )

    @classmethod
    def _load(cls):
        """بارگذاری یک‌بار و کش"""
        if cls._cache is not None:
            return cls._cache

        rows = []
        with open(cls._csv_path(), encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for r in reader:
                rows.append(r)
        cls._cache = rows
        return rows

    @classmethod
    def get_metrics(cls, asset_type_id: int = None, output_type: str = None):
        """
        دریافت KPIهای پیشنهادی بر اساس asset_type_id و (اختیاری) output_type
        """
        rows = cls._load()

        if asset_type_id is not None:
            rows = [r for r in rows if str(r.get('asset_type_id')) == str(asset_type_id)]

        if output_type:
            rows = [r for r in rows if r.get('output_type') == output_type]

        # تبدیل به فرمت قابل استفاده در Frontend
        result = []
        for r in rows:
            result.append({
                'metric_id': r.get('metric_id'),
                'asset_type_id': r.get('asset_type_id'),
                'output_type': r.get('output_type'),
                'name': r.get('metric_name'),
                'description': r.get('metric_description'),
                'unit': r.get('unit'),
                'target': r.get('target_default'),
                'period': r.get('period'),
                'formula': r.get('formula'),
            })
        return result


success_metrics_service = SuccessMetricsService()
