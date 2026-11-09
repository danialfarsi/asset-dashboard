"""
Serializers گام ۱ — ارزیابی آمادگی V2 (طبق PDF)
"""

from rest_framework import serializers
from intangible_assets.engine_06.readiness_models import (
    AssetFamily,
    ReadinessDimension,
    ReadinessCriterion,
    LikertScale,
    EvidenceFactor,
    DimensionWeight,
    PartWeight,
    ReadinessThreshold,
    RecommendationRule,
    RoutingRule,
    ReadinessCriterionResponse,
    CriterionEvidence,
    ReadinessAssessmentV2,
    CommitteeDecision,
)


# ============================================================
# Config Serializers (خواندن فقط — برای UI)
# ============================================================
class AssetFamilySerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetFamily
        fields = ["id", "code", "name_fa", "name_en", "description_fa", "order"]


class ReadinessDimensionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReadinessDimension
        fields = ["id", "code", "name_fa", "description_fa", "order"]


class LikertScaleSerializer(serializers.ModelSerializer):
    class Meta:
        model = LikertScale
        fields = ["id", "level", "label_fa", "meaning_fa", "base_score"]


class EvidenceFactorSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvidenceFactor
        fields = ["id", "code", "label_fa", "description_fa", "factor_required", "factor_optional"]


class ReadinessCriterionSerializer(serializers.ModelSerializer):
    dimension_code = serializers.CharField(source="dimension.code", read_only=True, default=None)
    family_code = serializers.CharField(source="family.code", read_only=True, default=None)
    business_type_code = serializers.CharField(source="business_type.type", read_only=True, default=None)

    class Meta:
        model = ReadinessCriterion
        fields = [
            "id", "code", "section",
            "dimension", "dimension_code",
            "family", "family_code",
            "business_type", "business_type_code",
            "text_fa", "text_internal_fa", "suggested_evidence",
            "is_required_evidence", "is_critical",
            "order",
        ]


class RecommendationRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecommendationRule
        fields = [
            "id", "order", "condition_type", "recommendation",
            "sub_state_fa", "message_template", "destination",
        ]


class RoutingRuleSerializer(serializers.ModelSerializer):
    weak_dimension_code = serializers.CharField(
        source="weak_dimension.code", read_only=True, default=None
    )

    class Meta:
        model = RoutingRule
        fields = [
            "id", "weak_dimension", "weak_dimension_code",
            "weak_condition", "suggested_action_fa",
            "destination", "order",
        ]


# ============================================================
# Response Serializer (هر گویه)
# ============================================================
class CriterionResponseSerializer(serializers.ModelSerializer):
    criterion_code = serializers.CharField(source="criterion.code", read_only=True)
    criterion_text = serializers.CharField(source="criterion.text_fa", read_only=True)
    criterion_section = serializers.CharField(source="criterion.section", read_only=True)
    criterion_is_critical = serializers.BooleanField(source="criterion.is_critical", read_only=True)
    criterion_is_required_evidence = serializers.BooleanField(
        source="criterion.is_required_evidence", read_only=True
    )

    evidence_files = serializers.SerializerMethodField()

    class Meta:
        model = ReadinessCriterionResponse
        fields = [
            "id", "assessment", "criterion",
            "criterion_code", "criterion_text",
            "criterion_section", "criterion_is_critical", "criterion_is_required_evidence",
            "likert_level", "evidence_level", "evidence_description",
            "is_blocker", "is_irrelevant", "irrelevant_reason",
            "score_base", "score_final",
            "evidence_files",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "score_base", "score_final",
            "created_at", "updated_at",
        ]

    def get_evidence_files(self, obj):
        files = obj.evidence_files.all()
        return CriterionEvidenceSerializer(files, many=True, context=self.context).data


class CriterionResponseInputSerializer(serializers.Serializer):
    """ورودی برای ثبت پاسخ یک گویه"""
    criterion_id = serializers.IntegerField()
    likert_level = serializers.IntegerField(required=False, allow_null=True, min_value=1, max_value=5)
    evidence_level = serializers.ChoiceField(
        choices=["0E", "1E", "2E", "3E"],
        required=False, allow_blank=True,
    )
    evidence_description = serializers.CharField(required=False, allow_blank=True)
    is_blocker = serializers.BooleanField(required=False, default=False)
    is_irrelevant = serializers.BooleanField(required=False, default=False)
    irrelevant_reason = serializers.CharField(required=False, allow_blank=True)


class BulkSubmitSerializer(serializers.Serializer):
    """ثبت گروهی همه گویه‌ها + محاسبه"""
    responses = CriterionResponseInputSerializer(many=True)

    def validate(self, data):
        responses = data.get("responses", [])
        if not responses:
            raise serializers.ValidationError("پاسخ‌ها خالی است")

        # چک محدودیت نامربوط (حداکثر یکی در هر بعد)
        irrelevant_by_dim = {}
        for r in responses:
            if r.get("is_irrelevant"):
                # باید بعد رو از criterion بگیریم — این کار رو در view انجام می‌دیم
                pass
        return data


# ============================================================
# CriterionEvidence Serializer
# ============================================================
class CriterionEvidenceSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    uploaded_by_name = serializers.SerializerMethodField()
    criterion_code = serializers.CharField(source="response.criterion.code", read_only=True)

    class Meta:
        model = CriterionEvidence
        fields = [
            "id", "response", "criterion_code",
            "file", "file_url", "file_size", "mime_type",
            "external_link",
            "title", "description", "evidence_type",
            "is_independently_verified", "verified_by", "verified_at",
            "uploaded_by", "uploaded_by_name", "uploaded_at",
        ]
        read_only_fields = [
            "id", "file_url", "file_size", "mime_type",
            "uploaded_at", "uploaded_by_name",
        ]

    def get_file_url(self, obj):
        if not obj.file:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url

    def validate(self, data):
        """اعتبارسنجی: حداقل فایل یا لینک"""
        file = data.get("file")
        external_link = data.get("external_link", "").strip()

        if not file and not external_link:
            raise serializers.ValidationError(
                "حداقل یکی از «فایل» یا «لینک بیرونی» الزامی است"
            )
        return data

    def get_uploaded_by_name(self, obj):
        if obj.uploaded_by:
            return f"{obj.uploaded_by.first_name} {obj.uploaded_by.last_name}".strip() or obj.uploaded_by.username
        return None


# ============================================================
# Assessment Serializer (کامل)
# ============================================================
class ReadinessAssessmentV2Serializer(serializers.ModelSerializer):
    recommendation_display = serializers.CharField(
        source="get_recommendation_display", read_only=True
    )
    path_display = serializers.CharField(source="get_path_display", read_only=True)
    business_type_name = serializers.CharField(
        source="business_type.name", read_only=True, default=None
    )
    business_type_code = serializers.CharField(
        source="business_type.type", read_only=True, default=None
    )
    asset_family_code = serializers.CharField(
        source="asset_family.code", read_only=True, default=None
    )
    asset_family_name = serializers.CharField(
        source="asset_family.name_fa", read_only=True, default=None
    )
    assessed_by_name = serializers.SerializerMethodField()
    overridden_by_name = serializers.SerializerMethodField()

    responses_count = serializers.SerializerMethodField()
    responses_answered = serializers.SerializerMethodField()

    class Meta:
        model = ReadinessAssessmentV2
        fields = [
            "id", "case",
            "path", "path_display",
            "business_type", "business_type_name", "business_type_code",
            "asset_family", "asset_family_code", "asset_family_name",
            "dimension_scores",
            "core_score", "family_avg_score", "business_avg_score", "final_score",
            "confidence_level",
            "recommendation", "recommendation_display",
            "sub_state_fa", "triggered_rule",
            "routing_destination", "recommendation_message",
            "top_strengths", "top_weaknesses", "critical_issues",
            "is_blocked",
            "is_overridden", "override_reason", "overridden_by", "overridden_by_name", "overridden_at",
            "assessed_by", "assessed_by_name", "assessed_at", "expires_at",
            "responses_count", "responses_answered",
        ]
        read_only_fields = [
            "id", "assessed_at", "overridden_at",
            "core_score", "family_avg_score", "business_avg_score", "final_score",
            "confidence_level", "recommendation", "sub_state_fa",
            "triggered_rule", "routing_destination", "recommendation_message",
            "top_strengths", "top_weaknesses", "critical_issues", "is_blocked",
            "dimension_scores",
        ]

    def get_assessed_by_name(self, obj):
        if obj.assessed_by:
            return f"{obj.assessed_by.first_name} {obj.assessed_by.last_name}".strip() or obj.assessed_by.username
        return None

    def get_overridden_by_name(self, obj):
        if obj.overridden_by:
            return f"{obj.overridden_by.first_name} {obj.overridden_by.last_name}".strip() or obj.overridden_by.username
        return None

    def get_responses_count(self, obj):
        return obj.responses.count()

    def get_responses_answered(self, obj):
        return obj.responses.filter(likert_level__isnull=False).count()


class ReadinessAssessmentCreateSerializer(serializers.Serializer):
    """ایجاد ارزیابی خالی"""
    case_id = serializers.IntegerField()
    business_type_id = serializers.IntegerField(required=False, allow_null=True)
    path = serializers.ChoiceField(
        choices=["external", "internal"], default="external"
    )


class ReadinessAssessmentFullSerializer(ReadinessAssessmentV2Serializer):
    """ارزیابی با همه پاسخ‌ها"""
    responses = CriterionResponseSerializer(many=True, read_only=True)

    class Meta(ReadinessAssessmentV2Serializer.Meta):
        fields = ReadinessAssessmentV2Serializer.Meta.fields + ["responses"]


# ============================================================
# Committee Decision Serializer
# ============================================================
class CommitteeDecisionSerializer(serializers.ModelSerializer):
    decision_type_display = serializers.CharField(
        source="get_decision_type_display", read_only=True
    )
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = CommitteeDecision
        fields = [
            "id", "assessment",
            "system_recommendation", "committee_decision", "decision_type",
            "decision_type_display",
            "reason", "risk_acceptance", "risk_owner",
            "conditional_actions", "signed_by",
            "votes_for", "votes_against", "required_majority",
            "created_at", "created_by", "created_by_name",
        ]
        read_only_fields = ["id", "created_at"]

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None


class CommitteeDecisionInputSerializer(serializers.Serializer):
    """ورودی تصمیم کمیته"""
    committee_decision = serializers.ChoiceField(choices=["go", "develop", "no_go"])
    decision_type = serializers.ChoiceField(choices=["confirm", "upgrade", "downgrade"])
    reason = serializers.CharField(required=True, allow_blank=False)
    risk_acceptance = serializers.CharField(required=False, allow_blank=True)
    risk_owner = serializers.CharField(required=False, allow_blank=True)
    conditional_actions = serializers.ListField(
        child=serializers.DictField(), required=False, default=list
    )
    signed_by = serializers.ListField(
        child=serializers.DictField(), required=False, default=list
    )
    votes_for = serializers.IntegerField(required=False, default=0, min_value=0)
    votes_against = serializers.IntegerField(required=False, default=0, min_value=0)
    required_majority = serializers.ChoiceField(
        choices=["simple", "two_thirds"], default="simple"
    )

    def validate(self, data):
        decision_type = data["decision_type"]
        system_rec = self.context.get("system_recommendation")
        committee_rec = data["committee_decision"]

        # اعتبارسنجی: نوع تصمیم باید با توصیه‌ها هم‌خوان باشد
        if decision_type == "confirm" and system_rec != committee_rec:
            raise serializers.ValidationError({
                "decision_type": "برای تأیید، تصمیم کمیته باید برابر توصیه سیستم باشد"
            })
        if decision_type == "upgrade":
            # ترتیب: no_go < develop < go
            order = {"no_go": 0, "develop": 1, "go": 2}
            if order.get(committee_rec, 0) <= order.get(system_rec, 0):
                raise serializers.ValidationError({
                    "decision_type": "برای ارتقا، تصمیم باید بالاتر از توصیه سیستم باشد"
                })
            # برای ارتقا، پذیرش ریسک الزامی
            if not data.get("risk_acceptance"):
                raise serializers.ValidationError({
                    "risk_acceptance": "برای ارتقا، پذیرش ریسک الزامی است"
                })
            # برای ارتقا از No-Go، حد نصاب دو سوم
            if system_rec == "no_go":
                if data.get("required_majority") != "two_thirds":
                    raise serializers.ValidationError({
                        "required_majority": "برای ارتقا از No-Go، حد نصاب دو سوم الزامی است"
                    })
        if decision_type == "downgrade":
            order = {"no_go": 0, "develop": 1, "go": 2}
            if order.get(committee_rec, 0) >= order.get(system_rec, 0):
                raise serializers.ValidationError({
                    "decision_type": "برای تنزل، تصمیم باید پایین‌تر از توصیه سیستم باشد"
                })
        return data
