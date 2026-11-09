"""
سرویس ارکستراتور — اجرای کامل گام ۱
"""

from django.utils import timezone
from datetime import timedelta

from intangible_assets.engine_06.readiness_models import (
    ReadinessAssessmentV2,
    ReadinessCriterion,
    ReadinessCriterionResponse,
)
from intangible_assets.engine_06.services.readiness_scoring_service import (
    ReadinessScoringService,
)
from intangible_assets.engine_06.services.readiness_recommendation_service import (
    ReadinessRecommendationService,
)


class ReadinessOrchestrator:
    """هماهنگ‌کننده کل فرآیند ارزیابی"""

    @staticmethod
    def initialize_assessment(case, business_type=None, path="external"):
        """ایجاد ارزیابی خالی + گویه‌های مربوطه"""
        from intangible_assets.engine_06.readiness_models import AssetFamilyMap

        # تشخیص خانواده از asset_type
        asset_family = None
        if case.asset and case.asset.asset_type:
            mapping = AssetFamilyMap.objects.filter(
                asset_type=case.asset.asset_type
            ).first()
            if mapping:
                asset_family = mapping.primary_family

        # ایجاد ارزیابی
        assessment, created = ReadinessAssessmentV2.objects.get_or_create(
            case=case,
            defaults={
                "path": path,
                "business_type": business_type,
                "asset_family": asset_family,
                "assessed_at": timezone.now(),
                "expires_at": timezone.now() + timedelta(days=180),
            },
        )

        if not created:
            return assessment

        # ساخت پاسخ‌های خالی
        responses = []

        # ۳۶ گویه هسته (همیشه)
        core_criteria = ReadinessCriterion.objects.filter(section="core")
        for c in core_criteria:
            responses.append(ReadinessCriterionResponse(
                assessment=assessment,
                criterion=c,
            ))

        # ۱۸ گویه خانواده (فقط خانواده دارایی)
        if asset_family:
            family_criteria = ReadinessCriterion.objects.filter(
                section="family", family=asset_family
            )
            for c in family_criteria:
                responses.append(ReadinessCriterionResponse(
                    assessment=assessment,
                    criterion=c,
                ))

        # ۱۶ گویه کسب‌وکار (فقط نوع کسب‌وکار)
        if business_type:
            biz_criteria = ReadinessCriterion.objects.filter(
                section="business", business_type=business_type
            )
            for c in biz_criteria:
                responses.append(ReadinessCriterionResponse(
                    assessment=assessment,
                    criterion=c,
                ))

        ReadinessCriterionResponse.objects.bulk_create(responses)
        return assessment

    @staticmethod
    def submit_and_compute(assessment, user=None):
        """
        محاسبه کامل + توصیه:
        1. Scoring (نمرات)
        2. Confidence (اطمینان)
        3. Recommendation (توصیه)
        """
        # ۱. محاسبه نمرات
        scores = ReadinessScoringService.compute_all(assessment)

        assessment.dimension_scores = scores["dimension_scores"]
        assessment.core_score = scores["core_score"]
        assessment.family_avg_score = scores["family_avg_score"]
        assessment.business_avg_score = scores["business_avg_score"]
        assessment.final_score = scores["final_score"]

        # ۲. اطمینان
        confidence = ReadinessScoringService.compute_confidence(assessment)
        assessment.confidence_level = int(confidence)

        # ۳. بعدهای برتر/ضعیف‌تر
        top_strengths, top_weaknesses = ReadinessScoringService.get_top_dimensions(
            scores["dimension_scores"]
        )
        assessment.top_strengths = top_strengths
        assessment.top_weaknesses = top_weaknesses

        # ۴. گویه‌های بحرانی
        critical_issues = ReadinessScoringService.get_critical_issues(assessment)
        assessment.critical_issues = critical_issues
        assessment.is_blocked = ReadinessScoringService.has_blocker(assessment)

        # ۵. توصیه (با ذخیره موقت در DB برای دسترسی به فیلدها)
        assessment.save()

        rec = ReadinessRecommendationService.compute(assessment)
        assessment.recommendation = rec["recommendation"]
        assessment.sub_state_fa = rec["sub_state_fa"]
        assessment.recommendation_message = rec["message"]
        assessment.routing_destination = rec.get("destination", "")

        if rec.get("rule_id"):
            from intangible_assets.engine_06.readiness_models import RecommendationRule
            assessment.triggered_rule = RecommendationRule.objects.filter(
                id=rec["rule_id"]
            ).first()

        # ۶. اگر Override نشده، توصیه خودکار را ثبت کن
        if not assessment.is_overridden:
            assessment.recommendation = rec["recommendation"]

        if user:
            assessment.assessed_by = user
        assessment.assessed_at = timezone.now()
        assessment.save()

        return assessment
