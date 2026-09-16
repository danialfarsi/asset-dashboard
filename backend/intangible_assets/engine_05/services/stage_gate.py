"""
🎯 SYS_STAGE_GATE
منطق Stage-Gate برای تصمیم‌گیری خودکار Go/No-Go

بر اساس SPI (Schedule Performance Index) و CPI (Cost Performance Index):
- SPI >= 0.95 و CPI >= 0.90 → GO (ادامه)
- SPI < 0.70 یا CPI < 0.65 → KILL (توقف)
- SPI < 0.85 یا CPI < 0.80 → RECYCLE (بازنگری)
- در غیر این صورت → HOLD (نگه‌داری)

مسیر: engine_05/services/stage_gate.py
"""
from typing import Dict, Optional


# آستانه‌های تصمیم‌گیری
THRESHOLDS = {
    'go': {'spi_min': 0.95, 'cpi_min': 0.90},
    'recycle': {'spi_min': 0.85, 'cpi_min': 0.80},
    'kill': {'spi_min': 0.70, 'cpi_min': 0.65},
}


def auto_gate_decision(
    spi: float,
    cpi: float,
    physical_progress: float = 0,
    budget_consumed: float = 0,
    current_gate: str = 'na',
) -> Dict:
    """
    تصمیم‌گیری خودکار Gate

    Args:
        spi: Schedule Performance Index (0.1 - 3.0)
        cpi: Cost Performance Index (0.1 - 3.0)
        physical_progress: پیشرفت فیزیکی (0-100)
        budget_consumed: مصرف بودجه (0-100)
        current_gate: تصمیم فعلی (اگه دستی تعیین شده)

    Returns:
        {
            'decision': 'go' | 'recycle' | 'hold' | 'kill' | 'na',
            'reason': 'توضیح فارسی',
            'confidence': 0.0 - 1.0,
            'alerts': ['لیست هشدارها']
        }
    """
    # مقادیر پیش‌فرض امن
    spi = float(spi or 1.0)
    cpi = float(cpi or 1.0)
    physical_progress = float(physical_progress or 0)
    budget_consumed = float(budget_consumed or 0)

    alerts = []
    confidence = 1.0

    # ═══════════════════════════════════════════════════════
    # تصمیم‌گیری
    # ═══════════════════════════════════════════════════════

    # ۱. KILL — توقف پروژه
    if spi < THRESHOLDS['kill']['spi_min'] or cpi < THRESHOLDS['kill']['cpi_min']:
        reasons = []
        if spi < THRESHOLDS['kill']['spi_min']:
            reasons.append(f'SPI={spi:.2f} خیلی پایین')
        if cpi < THRESHOLDS['kill']['cpi_min']:
            reasons.append(f'CPI={cpi:.2f} خیلی پایین')

        return {
            'decision': 'kill',
            'reason': '🚨 توقف فوری: ' + ' و '.join(reasons),
            'confidence': 0.95,
            'alerts': [
                f'SPI بحرانی: {spi:.2f} < {THRESHOLDS["kill"]["spi_min"]}',
                f'CPI بحرانی: {cpi:.2f} < {THRESHOLDS["kill"]["cpi_min"]}',
            ],
        }

    # ۲. RECYCLE — بازنگری
    if spi < THRESHOLDS['recycle']['spi_min'] or cpi < THRESHOLDS['recycle']['cpi_min']:
        reasons = []
        if spi < THRESHOLDS['recycle']['spi_min']:
            reasons.append(f'SPI={spi:.2f}')
            alerts.append(f'SPI پایین: {spi:.2f} < {THRESHOLDS["recycle"]["spi_min"]}')
        if cpi < THRESHOLDS['recycle']['cpi_min']:
            reasons.append(f'CPI={cpi:.2f}')
            alerts.append(f'CPI پایین: {cpi:.2f} < {THRESHOLDS["recycle"]["cpi_min"]}')

        return {
            'decision': 'recycle',
            'reason': '⚠️ بازنگری لازم: ' + ' و '.join(reasons),
            'confidence': 0.85,
            'alerts': alerts,
        }

    # ۳. GO — ادامه
    if spi >= THRESHOLDS['go']['spi_min'] and cpi >= THRESHOLDS['go']['cpi_min']:
        # چک اضافی: پیشرفت منطقی باشه
        if physical_progress < 5:
            return {
                'decision': 'hold',
                'reason': '⏸ پیشرفت خیلی کم — نیاز به زمان بیشتر',
                'confidence': 0.70,
                'alerts': ['پیشرفت فیزیکی کمتر از ۵٪'],
            }

        return {
            'decision': 'go',
            'reason': f'✅ عملکرد مطلوب (SPI={spi:.2f}, CPI={cpi:.2f})',
            'confidence': 0.95,
            'alerts': [],
        }

    # ۴. HOLD — نگه‌داری (حالت میانی)
    return {
        'decision': 'hold',
        'reason': f'⏸ نگه‌داری (SPI={spi:.2f}, CPI={cpi:.2f}) — نیاز به پایش بیشتر',
        'confidence': 0.60,
        'alerts': [],
    }


def should_alert(spi: float, cpi: float) -> Dict:
    """
    چک نیاز به هشدار (SYS_ALERT)
    """
    spi = float(spi or 1.0)
    cpi = float(cpi or 1.0)

    alerts = []
    if spi < 0.85:
        alerts.append({
            'type': 'spi_low',
            'severity': 'high' if spi < 0.70 else 'medium',
            'message': f'شاخص زمان (SPI) پایین: {spi:.2f}',
        })
    if cpi < 0.80:
        alerts.append({
            'type': 'cpi_low',
            'severity': 'high' if cpi < 0.65 else 'medium',
            'message': f'شاخص هزینه (CPI) پایین: {cpi:.2f}',
        })

    return {
        'has_alerts': len(alerts) > 0,
        'count': len(alerts),
        'alerts': alerts,
    }
