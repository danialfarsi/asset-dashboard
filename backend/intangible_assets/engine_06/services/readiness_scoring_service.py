"""
سرویس محاسبه نمره گام ۱ — مطابق PDF

فرمول‌ها:
  S_i = نمره پایه × ضریب اعتبار شاهد
  D_d = میانگین S_i گویه‌های مربوط به آن بعد
  Core = Σ (وزن بعد × D_d) ÷ ۱۰۰
  Final = 0.8 × Core + 0.1 × میانگین گویه‌های خانواده + 0.1 × میانگین گویه‌های کسب‌وکار
"""

from decimal import Decimal
from intangible_assets.engine_06.readiness_models import (
    ReadinessDimension,
    ReadinessCriterion,
    LikertScale,
    EvidenceFactor,
    DimensionWeight,
    PartWeight,
    ReadinessCriterionResponse,
)


class ReadinessScoringService:
    """محاسبه نمرات گام ۱"""

    @staticmethod
    def compute_criterion_score(likert_level, evidence_level, is_required_evidence):
        """
        محاسبه نمره یک گویه:
        S_i = نمره پایه × ضریب اعتبار شاهد
        """
        if likert_level is None or not evidence_level:
            return 0.0

        likert = LikertScale.objects.filter(level=likert_level).first()
        if not likert:
            return 0.0

        base = float(likert.base_score)

        ev = EvidenceFactor.objects.filter(code=evidence_level).first()
        if not ev:
            return base

        factor = float(ev.factor_required if is_required_evidence else ev.factor_optional)
        return round(base * factor, 2)

    @staticmethod
    def compute_all(assessment):
        """
        محاسبه کامل نمرات:
        - هر گویه
        - هر بعد
        - هر بخش
        - نهایی
        """
        # ۱. محاسبه نمره هر گویه
        responses = assessment.responses.select_related("criterion", "criterion__dimension").all()

        for resp in responses:
            if resp.is_irrelevant:
                resp.score_base = 0
                resp.score_final = 0
                continue
            score = ReadinessScoringService.compute_criterion_score(
                resp.likert_level,
                resp.evidence_level,
                resp.criterion.is_required_evidence,
            )
            likert = LikertScale.objects.filter(level=resp.likert_level).first()
            resp.score_base = likert.base_score if likert else 0
            resp.score_final = Decimal(str(score))
            resp.save(update_fields=["score_base", "score_final"])

        # ۲. محاسبه نمره هر بعد (فقط گویه‌های هسته)
        dimension_scores = {}
        for dim in ReadinessDimension.objects.all():
            dim_responses = [
                r for r in responses
                if r.criterion.section == "core"
                and r.criterion.dimension_id == dim.id
                and not r.is_irrelevant
            ]
            if not dim_responses:
                dimension_scores[dim.code] = 0
                continue
            avg = sum(float(r.score_final) for r in dim_responses) / len(dim_responses)
            dimension_scores[dim.code] = round(avg, 2)

        # ۳. محاسبه Core
        core_score = ReadinessScoringService._compute_core(
            dimension_scores, assessment.business_type
        )

        # ۴. میانگین خانواده
        family_responses = [
            r for r in responses
            if r.criterion.section == "family" and not r.is_irrelevant
        ]
        family_avg = (
            sum(float(r.score_final) for r in family_responses) / len(family_responses)
            if family_responses else 0
        )

        # ۵. میانگین کسب‌وکار
        business_responses = [
            r for r in responses
            if r.criterion.section == "business" and not r.is_irrelevant
        ]
        business_avg = (
            sum(float(r.score_final) for r in business_responses) / len(business_responses)
            if business_responses else 0
        )

        # ۶. نمره نهایی
        part_weights = {pw.part: float(pw.weight) for pw in PartWeight.objects.all()}
        w_a = part_weights.get("A", 0.8)
        w_b = part_weights.get("B", 0.1)
        w_c = part_weights.get("C", 0.1)

        final_score = w_a * core_score + w_b * family_avg + w_c * business_avg

        return {
            "dimension_scores": dimension_scores,
            "core_score": round(core_score, 2),
            "family_avg_score": round(family_avg, 2),
            "business_avg_score": round(business_avg, 2),
            "final_score": round(final_score, 2),
        }

    @staticmethod
    def _compute_core(dimension_scores, business_type):
        """Core = Σ (وزن بعد × D_d) ÷ ۱۰۰"""
        if not business_type:
            # بدون BusinessType: میانگین ساده
            if not dimension_scores:
                return 0
            return sum(dimension_scores.values()) / len(dimension_scores)

        weights_qs = DimensionWeight.objects.filter(business_type=business_type)
        if not weights_qs.exists():
            return sum(dimension_scores.values()) / len(dimension_scores)

        total = 0
        total_weight = 0
        for w in weights_qs:
            code = w.dimension.code
            if code in dimension_scores:
                total += dimension_scores[code] * float(w.weight)
                total_weight += float(w.weight)

        if total_weight == 0:
            return 0
        return total / total_weight

    @staticmethod
    def compute_confidence(assessment):
        """
        سطح اطمینان = Σ(u × e) ÷ Σ(u)
        u = ۱ برای گویه الزامی، ۰.۴ برای غیرالزامی
        e = نمره شاهد: 0E=0، 1E=0.25، 2E=0.5، 3E=1.0
        """
        responses = assessment.responses.select_related("criterion").all()

        evidence_map = {"0E": 0.0, "1E": 0.25, "2E": 0.5, "3E": 1.0}

        numerator = 0
        denominator = 0
        for resp in responses:
            if resp.is_irrelevant:
                continue
            u = 1.0 if resp.criterion.is_required_evidence else 0.4
            e = evidence_map.get(resp.evidence_level, 0.0)
            numerator += u * e
            denominator += u

        if denominator == 0:
            return 0
        return round(numerator / denominator * 100, 0)

    @staticmethod
    def get_top_dimensions(dimension_scores, n=3):
        """۳ بعد برتر و ۳ بعد ضعیف‌تر"""
        if not dimension_scores:
            return [], []

        dims = ReadinessDimension.objects.all()
        dim_names = {d.code: d.name_fa for d in dims}

        items = [
            {"code": code, "name": dim_names.get(code, code), "score": score}
            for code, score in dimension_scores.items()
        ]

        sorted_desc = sorted(items, key=lambda x: x["score"], reverse=True)
        top_strengths = sorted_desc[:n]
        top_weaknesses = sorted_desc[-n:][::-1]

        return top_strengths, top_weaknesses

    @staticmethod
    def get_critical_issues(assessment):
        """گویه‌های بحرانی با سطح پایین (۱ یا ۲)"""
        responses = assessment.responses.select_related("criterion").all()

        issues = []
        for resp in responses:
            if not resp.criterion.is_critical or resp.is_irrelevant:
                continue
            if resp.likert_level is not None and resp.likert_level < 3:
                issues.append({
                    "code": resp.criterion.code,
                    "text": resp.criterion.text_fa[:100],
                    "level": resp.likert_level,
                    "evidence": resp.evidence_level,
                })
        return issues

    @staticmethod
    def has_blocker(assessment):
        """آیا گویه بحرانی با پرچم مانع قطعی وجود دارد؟"""
        return assessment.responses.filter(
            is_blocker=True,
            criterion__is_critical=True,
        ).exists()
