"""
🎯 SYS_ALERT
سیستم هشدار خودکار برای پروژه‌ها

انواع هشدار:
1. SPI_LOW — شاخص زمان پایین (< 0.85)
2. CPI_LOW — شاخص هزینه پایین (< 0.80)
3. BUDGET_OVERRUN — مصرف بودجه > 80٪
4. STALLED — بیش از ۳۰ روز بدون گزارش
5. MILESTONE_DUE — milestone نزدیک (۷ روز)
6. CRITICAL_GATE — تصمیم گیت = kill

مسیر: engine_05/services/alerts.py
"""
from datetime import timedelta
from django.utils import timezone


# آستانه‌های هشدار
ALERT_THRESHOLDS = {
    'spi_low': 0.85,
    'spi_critical': 0.70,
    'cpi_low': 0.80,
    'cpi_critical': 0.65,
    'budget_overrun': 80.0,        # درصد
    'budget_critical': 95.0,
    'stalled_days': 30,
    'milestone_due_days': 7,
}


def get_project_alerts(project):
    """
    همه هشدارهای یه پروژه

    Returns:
        {
            'project_id': int,
            'project_title': str,
            'count': int,
            'critical_count': int,
            'has_critical': bool,
            'alerts': [
                {
                    'type': 'spi_low',
                    'severity': 'high'|'medium'|'low',
                    'message': str,
                    'value': any,
                    'threshold': any,
                },
                ...
            ]
        }
    """
    from ..models import ProgressReport

    alerts = []

    # آخرین گزارش پیشرفت
    latest_report = ProgressReport.objects.filter(
        project=project
    ).order_by('-report_date', '-created_at').first()

    # ═══════════════════════════════════════════════════════
    # ۱. SPI / CPI
    # ═══════════════════════════════════════════════════════
    if latest_report:
        spi = float(latest_report.spi or 1.0)
        cpi = float(latest_report.cpi or 1.0)

        # SPI
        if spi < ALERT_THRESHOLDS['spi_critical']:
            alerts.append({
                'type': 'spi_low',
                'severity': 'high',
                'message': f'SPI بحرانی: {spi:.2f} (کمتر از {ALERT_THRESHOLDS["spi_critical"]})',
                'value': spi,
                'threshold': ALERT_THRESHOLDS['spi_critical'],
            })
        elif spi < ALERT_THRESHOLDS['spi_low']:
            alerts.append({
                'type': 'spi_low',
                'severity': 'medium',
                'message': f'SPI پایین: {spi:.2f} (کمتر از {ALERT_THRESHOLDS["spi_low"]})',
                'value': spi,
                'threshold': ALERT_THRESHOLDS['spi_low'],
            })

        # CPI
        if cpi < ALERT_THRESHOLDS['cpi_critical']:
            alerts.append({
                'type': 'cpi_low',
                'severity': 'high',
                'message': f'CPI بحرانی: {cpi:.2f} (کمتر از {ALERT_THRESHOLDS["cpi_critical"]})',
                'value': cpi,
                'threshold': ALERT_THRESHOLDS['cpi_critical'],
            })
        elif cpi < ALERT_THRESHOLDS['cpi_low']:
            alerts.append({
                'type': 'cpi_low',
                'severity': 'medium',
                'message': f'CPI پایین: {cpi:.2f} (کمتر از {ALERT_THRESHOLDS["cpi_low"]})',
                'value': cpi,
                'threshold': ALERT_THRESHOLDS['cpi_low'],
            })

        # ═══════════════════════════════════════════════════
        # ۲. مصرف بودجه
        # ═══════════════════════════════════════════════════
        budget_consumed = float(latest_report.budget_consumed_pct or 0)
        physical_progress = float(latest_report.physical_progress_pct or 0)

        if budget_consumed >= ALERT_THRESHOLDS['budget_critical']:
            alerts.append({
                'type': 'budget_overrun',
                'severity': 'high',
                'message': f'مصرف بودجه بحرانی: {budget_consumed:.0f}٪',
                'value': budget_consumed,
                'threshold': ALERT_THRESHOLDS['budget_critical'],
            })
        elif budget_consumed >= ALERT_THRESHOLDS['budget_overrun']:
            alerts.append({
                'type': 'budget_overrun',
                'severity': 'medium',
                'message': f'مصرف بودجه بالا: {budget_consumed:.0f}٪',
                'value': budget_consumed,
                'threshold': ALERT_THRESHOLDS['budget_overrun'],
            })

        # ═══════════════════════════════════════════════════
        # ۳. عدم تعادل بودجه/پیشرفت
        # ═══════════════════════════════════════════════════
        if budget_consumed > 0 and physical_progress > 0:
            ratio = budget_consumed / physical_progress
            if ratio > 2.0:
                alerts.append({
                    'type': 'budget_progress_mismatch',
                    'severity': 'high',
                    'message': f'عدم تعادل: مصرف بودجه {budget_consumed:.0f}٪ در برابر پیشرفت {physical_progress:.0f}٪',
                    'value': ratio,
                    'threshold': 2.0,
                })
            elif ratio > 1.5:
                alerts.append({
                    'type': 'budget_progress_mismatch',
                    'severity': 'medium',
                    'message': f'نسبت مصرف/پیشرفت بالا: {ratio:.1f}x',
                    'value': ratio,
                    'threshold': 1.5,
                })

        # ═══════════════════════════════════════════════════
        # ۴. تصمیم گیت
        # ═══════════════════════════════════════════════════
        if latest_report.gate_decision == 'kill':
            alerts.append({
                'type': 'critical_gate',
                'severity': 'high',
                'message': f'تصمیم گیت: توقف و ابطال',
                'value': 'kill',
                'threshold': None,
            })
        elif latest_report.gate_decision == 'recycle':
            alerts.append({
                'type': 'gate_recycle',
                'severity': 'medium',
                'message': f'تصمیم گیت: نیاز به اصلاح فاز',
                'value': 'recycle',
                'threshold': None,
            })

        # ═══════════════════════════════════════════════════
        # ۵. توقف (Stalled)
        # ═══════════════════════════════════════════════════
        days_since = (timezone.now().date() - latest_report.report_date).days
        if days_since > ALERT_THRESHOLDS['stalled_days']:
            alerts.append({
                'type': 'stalled',
                'severity': 'medium' if days_since < 60 else 'high',
                'message': f'{days_since} روز از آخرین گزارش گذشته',
                'value': days_since,
                'threshold': ALERT_THRESHOLDS['stalled_days'],
            })

    else:
        # پروژه هیچ گزارشی نداره
        if project.approval_status == 'approved':
            approved_at = project.approved_at
            if approved_at:
                days_since_approval = (timezone.now() - approved_at).days
                if days_since_approval > 14:
                    alerts.append({
                        'type': 'no_report',
                        'severity': 'medium',
                        'message': f'{days_since_approval} روز از تأیید گذشته و هنوز گزارشی ثبت نشده',
                        'value': days_since_approval,
                        'threshold': 14,
                    })

    # ═══════════════════════════════════════════════════════
    # ۶. Milestone due (اگه Gantt داره)
    # ═══════════════════════════════════════════════════════
    try:
        gantt = project.gantt_schedule
        if gantt and gantt.milestones:
            today = timezone.now().date()
            for ms in gantt.milestones:
                if ms.get('status') == 'completed':
                    continue
                ms_date_str = ms.get('date')
                if not ms_date_str:
                    continue
                try:
                    from datetime import datetime
                    ms_date = datetime.strptime(ms_date_str, '%Y-%m-%d').date()
                    days_left = (ms_date - today).days

                    if days_left < 0:
                        alerts.append({
                            'type': 'milestone_overdue',
                            'severity': 'high',
                            'message': f'Milestone "{ms.get("title")}" گذشته ({abs(days_left)} روز)',
                            'value': ms.get('title'),
                            'threshold': 0,
                        })
                    elif days_left <= ALERT_THRESHOLDS['milestone_due_days']:
                        alerts.append({
                            'type': 'milestone_due',
                            'severity': 'medium',
                            'message': f'Milestone "{ms.get("title")}" تا {days_left} روز دیگر',
                            'value': ms.get('title'),
                            'threshold': ALERT_THRESHOLDS['milestone_due_days'],
                        })
                except (ValueError, TypeError):
                    continue
    except Exception:
        pass

    # مرتب‌سازی: high اول
    severity_order = {'high': 0, 'medium': 1, 'low': 2}
    alerts.sort(key=lambda a: severity_order.get(a['severity'], 3))

    critical_count = sum(1 for a in alerts if a['severity'] == 'high')

    return {
        'project_id': project.id,
        'project_title': project.title,
        'count': len(alerts),
        'critical_count': critical_count,
        'has_critical': critical_count > 0,
        'alerts': alerts,
    }


def get_all_alerts(projects):
    """
    هشدارهای همه پروژه‌ها

    Args:
        projects: queryset از PrioritizedProject

    Returns:
        {
            'total_projects': int,
            'projects_with_alerts': int,
            'total_alerts': int,
            'critical_count': int,
            'by_project': [ {...}, ... ]
        }
    """
    by_project = []
    total_alerts = 0
    total_critical = 0
    projects_with_alerts = 0

    for project in projects:
        result = get_project_alerts(project)
        if result['count'] > 0:
            by_project.append(result)
            total_alerts += result['count']
            total_critical += result['critical_count']
            projects_with_alerts += 1

    # مرتب‌سازی بر اساس critical_count
    by_project.sort(key=lambda p: -p['critical_count'])

    return {
        'total_projects': projects.count(),
        'projects_with_alerts': projects_with_alerts,
        'total_alerts': total_alerts,
        'critical_count': total_critical,
        'by_project': by_project,
    }
