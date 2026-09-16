"""
سرویس InvestmentThresholds — خواندن آستانه‌های سرمایه‌گذاری
مسیر: engine_05/services/thresholds.py
"""
import csv
import os


def _load_thresholds():
    """بارگذاری همه thresholds از CSV"""
    path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        'config',
        'InvestmentThresholds.csv',
    )
    rows = []
    if os.path.exists(path):
        with open(path, encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for r in reader:
                rows.append(r)
    return rows


def get_threshold(business_type, threshold_type, default=None):
    """
    خواندن یه threshold خاص

    استفاده:
        get_threshold('manufacturing', 'min_approval_score')  → 3.5
        get_threshold('manufacturing', 'max_contingency_ratio')  → 0.20
        get_threshold('manufacturing', 'annual_budget')  → {'min': 0, 'max': 5e11}
    """
    rows = _load_thresholds()

    # فیلتر بر اساس نوع و کسب‌وکار
    matches = [
        r for r in rows
        if r.get('threshold_type') == threshold_type
        and r.get('business_type') == business_type
    ]

    if not matches:
        # اگه business_type پیدا نشد، اولین مورد هم‌نوع رو برگردون
        matches = [r for r in rows if r.get('threshold_type') == threshold_type]

    if not matches:
        return default

    row = matches[0]

    # بسته به نوع threshold، خروجی متفاوت
    if threshold_type in ('min_approval_score', 'critical_gap_threshold'):
        try:
            return float(row.get('min_value', default or 0))
        except (ValueError, TypeError):
            return default

    if threshold_type in ('max_contingency_ratio', 'variance_tolerance'):
        try:
            return float(row.get('max_value', default or 0))
        except (ValueError, TypeError):
            return default

    if threshold_type == 'annual_budget':
        try:
            return {
                'min': float(row.get('min_value', 0)),
                'max': float(row.get('max_value', 0)),
                'currency': row.get('currency', 'IRR'),
            }
        except (ValueError, TypeError):
            return default

    # پیش‌فرض: کل row
    return row


def get_all_thresholds(business_type):
    """همه thresholds یه کسب‌وکار"""
    rows = _load_thresholds()
    return [r for r in rows if r.get('business_type') == business_type]
