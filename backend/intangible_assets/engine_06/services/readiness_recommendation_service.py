"""
سرویس توصیه پیش‌فرض گام ۱ — ۶ قاعده به ترتیب
"""

from intangible_assets.engine_06.readiness_models import (
    RecommendationRule,
    ReadinessThreshold,
    ReadinessDimension,
    RoutingRule,
)


class ReadinessRecommendationService:
    """توصیه Go/Develop/No-Go بر اساس ۶ قاعده"""

    @staticmethod
    def compute(assessment):
        """
        اجرای ۶ قاعده به ترتیب و برگرداندن اولین تطبیق
        """
        from intangible_assets.engine_06.services.readiness_scoring_service import (
            ReadinessScoringService,
        )

        # ۱. آماده‌سازی داده‌ها
        final_score = float(assessment.final_score or 0)
        confidence = int(assessment.confidence_level or 0)
        has_blocker = ReadinessScoringService.has_blocker(assessment)
        critical_issues = ReadinessScoringService.get_critical_issues(assessment)

        threshold = None
        if assessment.business_type:
            threshold = ReadinessThreshold.objects.filter(
                business_type=assessment.business_type
            ).first()

        if not threshold:
            # پیش‌فرض: 70/60/50
            go_min_score, go_min_conf, no_go_max = 70, 60, 50
        else:
            go_min_score = threshold.go_min_score
            go_min_conf = threshold.go_min_confidence
            no_go_max = threshold.no_go_max_score

        # ۲. اطلاعات تکمیلی برای پیام
        top_strengths, top_weaknesses = ReadinessScoringService.get_top_dimensions(
            assessment.dimension_scores
        )

        missing_evidence = assessment.responses.filter(
            criterion__is_required_evidence=True,
            evidence_level__in=["0E", "1E"],
        ).count()

        # ۳. بررسی ۶ قاعده به ترتیب
        rules = RecommendationRule.objects.all().order_by("order")

        for rule in rules:
            triggered = False
            context = {
                "final_score": final_score,
                "confidence": confidence,
                "threshold": no_go_max,
                "min_conf": go_min_conf,
                "critical_list": ", ".join(f"{c['code']} (سطح {c['level']})" for c in critical_issues),
                "weak_dimensions": ", ".join(f"{d['name']} ({d['score']})" for d in top_weaknesses),
                "missing_evidence": f"{missing_evidence} گویه",
                "criterion_code": "",
                "blocker_reason": "",
            }

            if rule.condition_type == "blocker_exists":
                triggered = has_blocker
                if triggered:
                    blocker = assessment.responses.filter(is_blocker=True).first()
                    if blocker:
                        context["criterion_code"] = blocker.criterion.code
                        context["blocker_reason"] = blocker.evidence_description or "بدون توضیح"

            elif rule.condition_type == "below_no_go":
                triggered = final_score < no_go_max

            elif rule.condition_type == "critical_low_score":
                triggered = (
                    final_score >= go_min_score
                    and len(critical_issues) > 0
                )

            elif rule.condition_type == "confidence_low":
                triggered = (
                    final_score >= go_min_score
                    and confidence < go_min_conf
                )

            elif rule.condition_type == "between_thresholds":
                triggered = no_go_max <= final_score < go_min_score

            elif rule.condition_type == "all_pass":
                triggered = (
                    final_score >= go_min_score
                    and confidence >= go_min_conf
                    and not has_blocker
                    and len(critical_issues) == 0
                )

            if triggered:
                message = rule.message_template.format(**context)
                result = {
                    "recommendation": rule.recommendation,
                    "sub_state_fa": rule.sub_state_fa,
                    "message": message,
                    "rule_order": rule.order,
                    "rule_id": rule.id,
                    "destination": rule.destination,
                }
                # اگر Develop است، مقصد ارجاع را محاسبه کن
                if rule.recommendation == "develop":
                    routing = ReadinessRecommendationService._compute_routing(
                        top_weaknesses, confidence < go_min_conf
                    )
                    result["routing"] = routing
                return result

        # پیش‌فرض (نباید رخ دهد)
        return {
            "recommendation": "develop",
            "sub_state_fa": "بررسی دستی",
            "message": "هیچ قاعده‌ای تطبیق نکرد — بررسی دستی لازم است",
            "rule_order": 0,
            "destination": "",
        }

    @staticmethod
    def _compute_routing(top_weaknesses, low_confidence):
        """مسیر ارجاع برای حالت Develop"""
        if low_confidence:
            rule = RoutingRule.objects.filter(weak_dimension__isnull=True).first()
            if rule:
                return {
                    "action": rule.suggested_action_fa,
                    "destination": rule.destination,
                }

        if not top_weaknesses:
            return {"action": "بررسی دستی", "destination": ""}

        worst = top_weaknesses[0]
        rule = RoutingRule.objects.filter(weak_dimension__code=worst["code"]).first()
        if rule:
            return {
                "action": rule.suggested_action_fa,
                "destination": rule.destination,
            }
        return {"action": "بررسی دستی", "destination": ""}
