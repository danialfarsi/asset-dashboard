"""
Serializers موتور ۶ — تجاری‌سازی
"""

from rest_framework import serializers
from intangible_assets.engine_06.models import (
    Partner,
    CommercializationCase,
    ReadinessAssessment,
    BusinessModelSelection,
    PartnerShortlist,
    CommercializationContract,
    PaymentSchedule,
    RevenueRecord,
    CommercializationActivityLog,
)


# ============================================================
# ۰. Partner
# ============================================================
class PartnerSerializer(serializers.ModelSerializer):
    partner_type_display = serializers.CharField(source="get_partner_type_display", read_only=True)
    weighted_score = serializers.FloatField(read_only=True)
    is_blacklisted = serializers.BooleanField(read_only=True)

    class Meta:
        model = Partner
        fields = [
            "id", "name", "name_en", "partner_type", "partner_type_display",
            "country", "industry",
            "financial_capacity_score", "track_record_score",
            "strategic_alignment_score", "market_access_score", "reputation_score",
            "weighted_score",
            "has_conflict_of_interest", "has_contract_breach_history", "is_sanctioned",
            "is_blacklisted",
            "contact_person", "contact_email", "contact_phone",
            "notes", "is_active",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "weighted_score", "is_blacklisted"]


class PartnerLightSerializer(serializers.ModelSerializer):
    """نسخه سبک برای استفاده در Shortlist"""
    class Meta:
        model = Partner
        fields = ["id", "name", "partner_type", "country", "industry"]


# ============================================================
# ۱. CommercializationCase
# ============================================================
class CommercializationCaseSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    asset_name = serializers.CharField(source="asset.asset_name", read_only=True)
    asset_uid = serializers.CharField(source="asset.asset_uid", read_only=True)
    asset_type_name = serializers.CharField(source="asset.asset_type.name", read_only=True, default=None)
    organization_name = serializers.CharField(source="organization.name", read_only=True, default=None)
    department_name = serializers.CharField(source="department.name", read_only=True, default=None)
    owner_name = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()

    # خلاصه وضعیت
    has_readiness = serializers.SerializerMethodField()
    has_business_model = serializers.SerializerMethodField()
    has_shortlist = serializers.SerializerMethodField()
    has_contract = serializers.SerializerMethodField()
    has_revenue = serializers.SerializerMethodField()

    class Meta:
        model = CommercializationCase
        fields = [
            "id", "asset", "asset_name", "asset_uid", "asset_type_name",
            "organization", "organization_name", "department", "department_name",
            "status", "status_display", "current_step",
            "started_at", "closed_at", "closure_reason",
            "owner", "owner_name", "created_by", "created_by_name",
            "has_readiness", "has_business_model", "has_shortlist", "has_contract", "has_revenue",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_owner_name(self, obj):
        if obj.owner:
            return f"{obj.owner.first_name} {obj.owner.last_name}".strip() or obj.owner.username
        return None

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None

    def get_has_readiness(self, obj):
        return hasattr(obj, "readiness_assessment")

    def get_has_business_model(self, obj):
        return hasattr(obj, "business_model_selection")

    def get_has_shortlist(self, obj):
        return hasattr(obj, "partner_shortlist")

    def get_has_contract(self, obj):
        return hasattr(obj, "contract")

    def get_has_revenue(self, obj):
        if hasattr(obj, "contract"):
            return obj.contract.revenue_records.exists()
        return False


# ============================================================
# ۲. ReadinessAssessment
# ============================================================
class ReadinessAssessmentSerializer(serializers.ModelSerializer):
    recommendation_display = serializers.CharField(source="get_recommendation_display", read_only=True)
    assessed_by_name = serializers.SerializerMethodField()
    overridden_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ReadinessAssessment
        fields = [
            "id", "case",
            "criteria_scores", "total_score", "confidence_level",
            "recommendation", "recommendation_display", "auto_recommendation",
            "is_overridden", "override_reason", "overridden_by", "overridden_by_name", "overridden_at",
            "assessed_by", "assessed_by_name", "assessed_at",
        ]
        read_only_fields = ["id", "total_score", "auto_recommendation", "assessed_at"]

    def get_assessed_by_name(self, obj):
        if obj.assessed_by:
            return f"{obj.assessed_by.first_name} {obj.assessed_by.last_name}".strip() or obj.assessed_by.username
        return None

    def get_overridden_by_name(self, obj):
        if obj.overridden_by:
            return f"{obj.overridden_by.first_name} {obj.overridden_by.last_name}".strip() or obj.overridden_by.username
        return None


class ReadinessSubmitSerializer(serializers.Serializer):
    """Serializer برای ثبت امتیاز معیارها"""
    criteria_scores = serializers.DictField(
        child=serializers.DictField(),
        help_text='مثال: {"criterion_1": {"score": 80, "evidence": "سند..."}, ...}'
    )


class ReadinessOverrideSerializer(serializers.Serializer):
    """Serializer برای Override توصیه"""
    override_reason = serializers.CharField(required=True, allow_blank=False)
    new_recommendation = serializers.ChoiceField(
        choices=["go", "no_go", "develop_further"], required=True
    )


# ============================================================
# ۳. BusinessModelSelection
# ============================================================
class BusinessModelSelectionSerializer(serializers.ModelSerializer):
    selected_model_display = serializers.CharField(source="get_selected_model_display", read_only=True)

    class Meta:
        model = BusinessModelSelection
        fields = [
            "id", "case",
            "selected_model", "selected_model_display",
            "business_case_data",
            "npv_base", "irr_base", "payback_months",
            "system_rank_1_model", "requires_justification", "justification",
            "approved_by_committee", "approved_at",
            "created_by", "created_at",
        ]
        read_only_fields = [
            "id", "system_rank_1_model", "requires_justification",
            "created_at", "approved_at",
        ]


class BusinessModelSelectSerializer(serializers.Serializer):
    """Serializer برای انتخاب مدل + ثبت Business Case"""
    selected_model = serializers.ChoiceField(
        choices=[
            "exclusive_license", "non_exclusive_license", "full_sale",
            "joint_venture", "spin_off", "franchise", "knowledge_services",
        ]
    )
    business_case_data = serializers.DictField(required=True)
    npv_base = serializers.DecimalField(max_digits=20, decimal_places=2, default=0)
    irr_base = serializers.DecimalField(max_digits=6, decimal_places=2, default=0)
    payback_months = serializers.IntegerField(default=0)
    justification = serializers.CharField(required=False, allow_blank=True)


# ============================================================
# ۴. PartnerShortlist
# ============================================================
class PartnerShortlistSerializer(serializers.ModelSerializer):
    class Meta:
        model = PartnerShortlist
        fields = [
            "id", "case", "partners_data", "rejected_partners",
            "approved_by_committee", "approved_at",
            "created_by", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "approved_at"]


class PartnerSearchSerializer(serializers.Serializer):
    """Serializer برای جستجوی شرکا"""
    partner_type = serializers.CharField(required=False, allow_blank=True)
    country = serializers.CharField(required=False, allow_blank=True)
    industry = serializers.CharField(required=False, allow_blank=True)
    min_score = serializers.FloatField(required=False, default=0)


# ============================================================
# ۵. CommercializationContract
# ============================================================
class CommercializationContractSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    partner_name = serializers.CharField(source="partner.name", read_only=True)
    partner_detail = PartnerLightSerializer(source="partner", read_only=True)

    class Meta:
        model = CommercializationContract
        fields = [
            "id", "case",
            "partner", "partner_name", "partner_detail",
            "status", "status_display",
            "terms", "legal_checklist", "legal_checklist_complete",
            "negotiation_log",
            "signed_at", "signed_by_name",
            "clm_reference",
            "warnings", "needs_exception_approval", "exception_approved_by",
            "created_by", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "warnings"]


class ContractCreateSerializer(serializers.Serializer):
    """Serializer برای ایجاد قرارداد"""
    partner_id = serializers.IntegerField()
    terms = serializers.DictField(required=True, help_text="شرایط کلیدی قرارداد")
    template_id = serializers.CharField(required=False, allow_blank=True)


class ContractChecklistUpdateSerializer(serializers.Serializer):
    """Serializer برای به‌روزرسانی چک‌لیست حقوقی"""
    legal_checklist = serializers.DictField(required=True)


class ContractSignSerializer(serializers.Serializer):
    """Serializer برای امضای قرارداد"""
    signed_by_name = serializers.CharField(required=True)
    clm_reference = serializers.CharField(required=False, allow_blank=True)


# ============================================================
# ۵.۵ PaymentSchedule
# ============================================================
class PaymentScheduleSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = PaymentSchedule
        fields = [
            "id", "contract", "title", "due_date",
            "amount_expected", "amount_paid",
            "status", "status_display",
            "reminder_sent_at", "paid_at", "notes",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


# ============================================================
# ۶. RevenueRecord
# ============================================================
class RevenueRecordSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    contract_partner_name = serializers.CharField(source="contract.partner.name", read_only=True)

    class Meta:
        model = RevenueRecord
        fields = [
            "id", "contract", "contract_partner_name",
            "period_label", "period_start", "period_end",
            "reported_revenue", "calculated_revenue", "variance", "variance_percent",
            "has_significant_variance",
            "collected_amount", "collected_at", "bank_reference",
            "status", "status_display",
            "extra_data",
            "created_by", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "variance", "variance_percent", "has_significant_variance",
            "created_at", "updated_at", "collected_at",
        ]


class RevenueCreateSerializer(serializers.Serializer):
    """Serializer برای ثبت درآمد دوره"""
    period_label = serializers.CharField()
    period_start = serializers.DateField()
    period_end = serializers.DateField()
    reported_revenue = serializers.DecimalField(max_digits=20, decimal_places=2, default=0)
    extra_data = serializers.DictField(required=False, default=dict)


class RevenueCollectSerializer(serializers.Serializer):
    """Serializer برای ثبت وصول"""
    collected_amount = serializers.DecimalField(max_digits=20, decimal_places=2)
    bank_reference = serializers.CharField(required=False, allow_blank=True)


# ============================================================
# ۷. Activity Log
# ============================================================
class CommercializationActivityLogSerializer(serializers.ModelSerializer):
    action_display = serializers.CharField(source="get_action_display", read_only=True)
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = CommercializationActivityLog
        fields = [
            "id", "case", "action", "action_display",
            "description", "extra_data",
            "user", "user_name", "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_user_name(self, obj):
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username
        return None


# ============================================================
# ۸. Dashboard (خلاصه)
# ============================================================
class CaseDashboardSummarySerializer(serializers.Serializer):
    """خلاصه داشبورد موتور ۶"""
    total_cases = serializers.IntegerField()
    by_status = serializers.DictField()
    by_step = serializers.DictField()
    total_contracts_signed = serializers.IntegerField()
    total_revenue_collected = serializers.DecimalField(max_digits=20, decimal_places=2)
    total_revenue_expected = serializers.DecimalField(max_digits=20, decimal_places=2)
    disputes_count = serializers.IntegerField()
    avg_time_in_pipeline_days = serializers.FloatField()
