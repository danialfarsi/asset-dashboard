"""
سرویس شاخص سلامت قرارداد + توصیه تمدید
"""

from django.utils import timezone
from django.db.models import Sum

from intangible_assets.engine_06.config import ConfigLoader
from intangible_assets.engine_06.models import RevenueRecord, PaymentSchedule


class HealthService:
    """محاسبه شاخص سلامت قرارداد و توصیه تمدید"""

    @staticmethod
    def compute_health(contract):
        """
        محاسبه شاخص‌های سلامت قرارداد:
        - نرخ وصول
        - درآمد محقق‌شده نسبت به پیش‌بینی
        - ایفای تعهدات
        - تأخیر در پرداخت
        """
        config = ConfigLoader.health_indicator_thresholds()
        indicators_cfg = config["indicators"]

        # ۱. نرخ وصول
        revenues = RevenueRecord.objects.filter(contract=contract)
        total_expected = revenues.aggregate(s=Sum("calculated_revenue"))["s"] or 0
        total_collected = revenues.aggregate(s=Sum("collected_amount"))["s"] or 0
        collection_rate = (float(total_collected) / float(total_expected) * 100) if total_expected else 0

        # ۲. درآمد نسبت به پیش‌بینی Business Case
        from intangible_assets.engine_06.models import BusinessModelSelection
        bm = BusinessModelSelection.objects.filter(case=contract.case).first()
        forecast_revenue = 0
        if bm and bm.business_case_data:
            # فرض: business_case_data شامل کلید base_scenario.revenue هست
            base_scenario = (bm.business_case_data or {}).get("base_scenario") or {}
            forecast_revenue = float(base_scenario.get("revenue", 0))
        revenue_vs_forecast = (float(total_collected) / forecast_revenue * 100) if forecast_revenue else 100

        # ۳. ایفای تعهدات (نسبت پرداخت‌های به‌موقع)
        payments = PaymentSchedule.objects.filter(contract=contract)
        total_payments = payments.count()
        paid_on_time = payments.filter(status="paid").count()
        compliance_rate = (paid_on_time / total_payments * 100) if total_payments else 100

        # ۴. میانگین تأخیر (روز) برای پرداخت‌های معوق
        overdue = payments.filter(status="overdue")
        avg_delay_days = 0
        if overdue.exists():
            today = timezone.now().date()
            delays = [(today - p.due_date).days for p in overdue if p.due_date]
            avg_delay_days = sum(delays) / len(delays) if delays else 0

        # ارزیابی وضعیت هر شاخص
        def status_of(value, cfg):
            if cfg.get("inverted"):
                if value <= cfg["green"]:
                    return "green"
                if value <= cfg["yellow"]:
                    return "yellow"
                return "red"
            else:
                if value >= cfg["green"]:
                    return "green"
                if value >= cfg["yellow"]:
                    return "yellow"
                return "red"

        result = {
            "collection_rate": {
                "value": round(collection_rate, 2),
                "status": status_of(collection_rate, indicators_cfg["collection_rate"]),
                "label_fa": indicators_cfg["collection_rate"]["name_fa"],
            },
            "revenue_vs_forecast": {
                "value": round(revenue_vs_forecast, 2),
                "status": status_of(revenue_vs_forecast, indicators_cfg["revenue_vs_forecast"]),
                "label_fa": indicators_cfg["revenue_vs_forecast"]["name_fa"],
            },
            "contract_compliance": {
                "value": round(compliance_rate, 2),
                "status": status_of(compliance_rate, indicators_cfg["contract_compliance"]),
                "label_fa": indicators_cfg["contract_compliance"]["name_fa"],
            },
            "payment_delays": {
                "value": round(avg_delay_days, 1),
                "status": status_of(avg_delay_days, indicators_cfg["payment_delays"]),
                "label_fa": indicators_cfg["payment_delays"]["name_fa"],
            },
        }

        # شاخص کلی = میانگین وزنی (وزن یکسان)
        status_scores = {"green": 100, "yellow": 60, "red": 20}
        overall_score = sum(
            status_scores[r["status"]] for r in result.values()
        ) / len(result)

        result["overall_health_score"] = round(overall_score, 2)
        result["overall_status"] = (
            "green" if overall_score >= 80
            else "yellow" if overall_score >= 50
            else "red"
        )
        return result

    @staticmethod
    def renewal_recommendation(contract):
        """
        توصیه تمدید/بازمذاکره/عدم تمدید بر اساس سلامت قرارداد
        """
        config = ConfigLoader.health_indicator_thresholds()
        recommendations_cfg = config["renewal_recommendations"]

        health = HealthService.compute_health(contract)
        score = health["overall_health_score"]

        # مرتب‌سازی بر اساس min_health_score (نزولی)
        sorted_recs = sorted(
            recommendations_cfg.items(),
            key=lambda x: x[1]["min_health_score"],
            reverse=True,
        )

        for key, cfg in sorted_recs:
            if score >= cfg["min_health_score"]:
                return {
                    "recommendation": key,
                    "label_fa": cfg["label_fa"],
                    "health_score": score,
                    "reason_fa": f"امتیاز سلامت قرارداد {score:.0f} از ۱۰۰",
                    "health_detail": health,
                }

        return {
            "recommendation": "do_not_renew",
            "label_fa": "عدم تمدید",
            "health_score": score,
            "reason_fa": "امتیاز سلامت قرارداد بسیار پایین",
            "health_detail": health,
        }
