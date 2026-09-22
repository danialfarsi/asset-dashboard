"""
سرویس KPI پیشنهادی — خواندن از SuccessMetrics_Definitions.csv
مسیر: engine_05/services/success_metrics.py
"""
import csv
import os


# ─── KPIهای عمومی (fallback برای asset_type های بدون تعریف) ───
GENERIC_METRICS = [
    {
        'metric_id': 'GEN-1',
        'asset_type_id': None,
        'output_type': 'GENERIC',
        'name': 'roi',
        'description': 'بازگشت سرمایه',
        'unit': 'percent',
        'target': '15',
        'period': 'annual',
        'formula': '(gains - costs) / costs * 100',
    },
    {
        'metric_id': 'GEN-2',
        'asset_type_id': None,
        'output_type': 'GENERIC',
        'name': 'payback_period',
        'description': 'دوره بازگشت سرمایه',
        'unit': 'months',
        'target': '24',
        'period': 'one_time',
        'formula': 'total_investment / monthly_cashflow',
    },
    {
        'metric_id': 'GEN-3',
        'asset_type_id': None,
        'output_type': 'GENERIC',
        'name': 'adoption_rate',
        'description': 'نرخ پذیرش و استفاده',
        'unit': 'percent',
        'target': '70',
        'period': 'quarterly',
        'formula': 'active_users / target_users * 100',
    },
    {
        'metric_id': 'GEN-4',
        'asset_type_id': None,
        'output_type': 'GENERIC',
        'name': 'stakeholder_satisfaction',
        'description': 'رضایت ذی‌نفعان',
        'unit': 'percent',
        'target': '85',
        'period': 'quarterly',
        'formula': 'survey_avg_score',
    },
    {
        'metric_id': 'GEN-5',
        'asset_type_id': None,
        'output_type': 'GENERIC',
        'name': 'efficiency_gain',
        'description': 'بهبود کارایی',
        'unit': 'percent',
        'target': '20',
        'period': 'annual',
        'formula': '(old_time - new_time) / old_time * 100',
    },
]


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
    def reload(cls):
        """پاک کردن cache — برای بعد از تغییر CSV"""
        cls._cache = None

    @classmethod
    def get_metrics(cls, asset_type_id: int = None, output_type: str = None, fallback: bool = True):
        """
        دریافت KPIهای پیشنهادی بر اساس asset_type_id و (اختیاری) output_type

        Args:
            asset_type_id: شناسه نوع دارایی
            output_type: نوع خروجی (BRAND, CONTRACT, ...)
            fallback: اگه True و KPI اختصاصی نبود، KPIهای عمومی برگردون
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

        # ─── Fallback: اگه چیزی پیدا نشد، KPIهای عمومی برگردون ───
        if not result and fallback:
            result = [dict(m) for m in GENERIC_METRICS]
            # asset_type_id رو هم ست کن که فرانت بدونه
            for m in result:
                m['asset_type_id'] = asset_type_id
                m['_is_generic'] = True

        return result


success_metrics_service = SuccessMetricsService()
