"""
Views گام ۱ — ارزیابی آمادگی V2
"""

from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from intangible_assets.engine_06.readiness_models import (
    AssetFamily,
    ReadinessDimension,
    ReadinessCriterion,
    LikertScale,
    EvidenceFactor,
    RecommendationRule,
    RoutingRule,
    ReadinessCriterionResponse,
    CriterionEvidence,
    ReadinessAssessmentV2,
    CommitteeDecision,
)
from intangible_assets.engine_06.readiness_serializers import (
    AssetFamilySerializer,
    ReadinessDimensionSerializer,
    LikertScaleSerializer,
    EvidenceFactorSerializer,
    ReadinessCriterionSerializer,
    RecommendationRuleSerializer,
    RoutingRuleSerializer,
    CriterionResponseSerializer,
    BulkSubmitSerializer,
    ReadinessAssessmentV2Serializer,
    ReadinessAssessmentFullSerializer,
    ReadinessAssessmentCreateSerializer,
    CommitteeDecisionSerializer,
    CommitteeDecisionInputSerializer,
    CriterionEvidenceSerializer,
)
from intangible_assets.engine_06.services.readiness_orchestrator import (
    ReadinessOrchestrator,
)
from intangible_assets.engine_06.views import log_activity


# ============================================================
# Config ViewSets (فقط خواندنی)
# ============================================================
class AssetFamilyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AssetFamily.objects.all()
    serializer_class = AssetFamilySerializer
    permission_classes = [permissions.IsAuthenticated]


class ReadinessDimensionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ReadinessDimension.objects.all()
    serializer_class = ReadinessDimensionSerializer
    permission_classes = [permissions.IsAuthenticated]


class LikertScaleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LikertScale.objects.all()
    serializer_class = LikertScaleSerializer
    permission_classes = [permissions.IsAuthenticated]


class EvidenceFactorViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = EvidenceFactor.objects.all()
    serializer_class = EvidenceFactorSerializer
    permission_classes = [permissions.IsAuthenticated]


class ReadinessCriterionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ReadinessCriterion.objects.select_related(
        "dimension", "family", "business_type"
    ).all()
    serializer_class = ReadinessCriterionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        section = self.request.query_params.get("section")
        if section:
            qs = qs.filter(section=section)
        return qs


# ============================================================
# Readiness Assessment ViewSet (اصلی)
# ============================================================
class ReadinessAssessmentV2ViewSet(viewsets.ModelViewSet):
    """ارزیابی آمادگی گام ۱ — نسخه V2"""

    queryset = ReadinessAssessmentV2.objects.select_related(
        "case", "business_type", "asset_family", "assessed_by", "triggered_rule"
    ).prefetch_related("responses")
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ReadinessAssessmentFullSerializer
        return ReadinessAssessmentV2Serializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        case_id = self.request.query_params.get("case")
        if case_id:
            qs = qs.filter(case_id=case_id)
        if not (hasattr(user, "role") and user.role == "super_admin"):
            if hasattr(user, "organization") and user.organization:
                qs = qs.filter(case__organization=user.organization)
        return qs

    @action(detail=False, methods=["post"], url_path="initialize")
    def initialize(self, request):
        """ایجاد ارزیابی خالی + گویه‌های مربوطه"""
        from intangible_assets.engine_06.models import CommercializationCase
        from intangible_assets.role_models import BusinessType

        ser = ReadinessAssessmentCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        try:
            case = CommercializationCase.objects.get(id=ser.validated_data["case_id"])
        except CommercializationCase.DoesNotExist:
            raise ValidationError({"case_id": "پرونده یافت نشد"})

        # چک تکراری
        if hasattr(case, "readiness_v2"):
            return Response(
                ReadinessAssessmentFullSerializer(case.readiness_v2).data,
                status=status.HTTP_200_OK,
            )

        business_type = None
        bt_id = ser.validated_data.get("business_type_id")
        if bt_id:
            business_type = BusinessType.objects.filter(id=bt_id).first()

        # اگه business_type_id نیومد، از سازمان کاربر استنتاج کن
        if not business_type:
            org_type = None
            # از سازمان کاربر
            if hasattr(request.user, "organization") and request.user.organization:
                org_type = getattr(request.user.organization, "organization_type", None)
            # از organization_case (اگه سازمان پرونده متفاوته)
            elif case.organization:
                org_type = getattr(case.organization, "organization_type", None)

            if org_type:
                business_type = BusinessType.objects.filter(type=org_type).first()

        # اگه هنوز None — پیش‌فرض "manufacturing"
        if not business_type:
            business_type = BusinessType.objects.filter(type="manufacturing").first()

        assessment = ReadinessOrchestrator.initialize_assessment(
            case=case,
            business_type=business_type,
            path=ser.validated_data.get("path", "external"),
        )

        log_activity(case, "readiness_submitted", request.user, "ارزیابی آمادگی V2 شروع شد")
        return Response(
            ReadinessAssessmentFullSerializer(assessment).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"], url_path="bulk-submit")
    def bulk_submit(self, request, pk=None):
        """ثبت گروهی پاسخ‌ها + محاسبه کامل"""
        assessment = self.get_object()
        ser = BulkSubmitSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        responses_data = ser.validated_data["responses"]

        # اعتبارسنجی: حداکثر یک نامربوط در هر بعد
        irrelevant_by_dim = {}
        for r_data in responses_data:
            if not r_data.get("is_irrelevant"):
                continue
            criterion = ReadinessCriterion.objects.filter(
                id=r_data["criterion_id"]
            ).first()
            if not criterion or criterion.section != "core":
                continue
            dim_code = criterion.dimension.code if criterion.dimension else "?"
            irrelevant_by_dim[dim_code] = irrelevant_by_dim.get(dim_code, 0) + 1
            if irrelevant_by_dim[dim_code] > 1:
                raise ValidationError({
                    "responses": f"در بعد {dim_code} بیش از یک گویه نامربوط مجاز نیست"
                })

        # ثبت پاسخ‌ها
        updated = 0
        for r_data in responses_data:
            criterion_id = r_data["criterion_id"]
            resp = assessment.responses.filter(criterion_id=criterion_id).first()
            if not resp:
                continue

            if r_data.get("is_irrelevant"):
                if not r_data.get("irrelevant_reason"):
                    raise ValidationError({
                        "responses": f"دلیل نامربوط برای گویه {criterion_id} الزامی است"
                    })
                resp.is_irrelevant = True
                resp.irrelevant_reason = r_data["irrelevant_reason"]
                resp.likert_level = None
                resp.evidence_level = ""
            else:
                resp.is_irrelevant = False
                resp.irrelevant_reason = ""
                resp.likert_level = r_data.get("likert_level")
                resp.evidence_level = r_data.get("evidence_level", "")

            resp.evidence_description = r_data.get("evidence_description", "")
            resp.is_blocker = r_data.get("is_blocker", False)

            # اعتبارسنجی: مانع فقط روی گویه‌های بحرانی
            if resp.is_blocker and not resp.criterion.is_critical:
                raise ValidationError({
                    "responses": f"پرچم مانع قطعی فقط برای گویه‌های بحرانی مجاز است (کد {resp.criterion.code})"
                })

            resp.save()
            updated += 1

        # محاسبه کامل
        assessment = ReadinessOrchestrator.submit_and_compute(
            assessment, user=request.user
        )

        log_activity(
            assessment.case, "readiness_submitted", request.user,
            f"ارزیابی ثبت شد — امتیاز {assessment.final_score}، توصیه {assessment.recommendation}",
            {
                "final_score": float(assessment.final_score),
                "recommendation": assessment.recommendation,
                "confidence": assessment.confidence_level,
            },
        )

        return Response(ReadinessAssessmentFullSerializer(assessment).data)

    @action(detail=True, methods=["post"], url_path="committee-decision")
    def committee_decision(self, request, pk=None):
        """ثبت تصمیم کمیته (Override)"""
        assessment = self.get_object()

        ser = CommitteeDecisionInputSerializer(
            data=request.data,
            context={"system_recommendation": assessment.recommendation},
        )
        ser.is_valid(raise_exception=True)

        decision = CommitteeDecision.objects.create(
            assessment=assessment,
            system_recommendation=assessment.recommendation,
            committee_decision=ser.validated_data["committee_decision"],
            decision_type=ser.validated_data["decision_type"],
            reason=ser.validated_data["reason"],
            risk_acceptance=ser.validated_data.get("risk_acceptance", ""),
            risk_owner=ser.validated_data.get("risk_owner", ""),
            conditional_actions=ser.validated_data.get("conditional_actions", []),
            signed_by=ser.validated_data.get("signed_by", []),
            votes_for=ser.validated_data.get("votes_for", 0),
            votes_against=ser.validated_data.get("votes_against", 0),
            required_majority=ser.validated_data.get("required_majority", "simple"),
            created_by=request.user,
        )

        # اگر تصمیم متفاوت از توصیه سیستمی است، assessment رو آپدیت کن
        if ser.validated_data["decision_type"] != "confirm":
            assessment.is_overridden = True
            assessment.override_reason = ser.validated_data["reason"]
            assessment.overridden_by = request.user
            assessment.overridden_at = timezone.now()
            assessment.recommendation = ser.validated_data["committee_decision"]
            assessment.save()

        log_activity(
            assessment.case, "readiness_overridden", request.user,
            f"تصمیم کمیته: {ser.validated_data['committee_decision']} ({ser.validated_data['decision_type']})",
            {"reason": ser.validated_data["reason"]},
        )

        return Response({
            "decision": CommitteeDecisionSerializer(decision).data,
            "assessment": ReadinessAssessmentFullSerializer(assessment).data,
        })

    @action(detail=True, methods=["get"])
    def summary(self, request, pk=None):
        """خلاصه کوچک برای نمایش"""
        assessment = self.get_object()
        return Response({
            "id": assessment.id,
            "final_score": float(assessment.final_score),
            "confidence": assessment.confidence_level,
            "recommendation": assessment.recommendation,
            "sub_state": assessment.sub_state_fa,
            "is_blocked": assessment.is_blocked,
            "top_strengths": assessment.top_strengths,
            "top_weaknesses": assessment.top_weaknesses,
            "critical_issues": assessment.critical_issues,
            "routing_destination": assessment.routing_destination,
            "message": assessment.recommendation_message,
        })

    @action(detail=True, methods=["get"], url_path="committee-decisions")
    def committee_decisions(self, request, pk=None):
        """تاریخچه تصمیمات کمیته"""
        assessment = self.get_object()
        decisions = assessment.committee_decisions.all()
        return Response(CommitteeDecisionSerializer(decisions, many=True).data)


# ============================================================
# CriterionEvidence ViewSet (آپلود فایل شاهد)
# ============================================================
class CriterionEvidenceViewSet(viewsets.ModelViewSet):
    """آپلود و مدیریت فایل‌های شاهد"""

    queryset = CriterionEvidence.objects.select_related(
        "response", "response__criterion", "uploaded_by"
    ).all()
    serializer_class = CriterionEvidenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        qs = super().get_queryset()
        response_id = self.request.query_params.get("response")
        if response_id:
            qs = qs.filter(response_id=response_id)
        return qs

    def perform_create(self, serializer):
        # اعتبارسنجی حجم فایل (حداکثر ۲۰ مگابایت)
        file = self.request.FILES.get("file")
        if file and file.size > 20 * 1024 * 1024:
            raise ValidationError({"file": "حجم فایل نمی‌تواند بیشتر از ۲۰ مگابایت باشد"})

        # اگه فقط لینک داده شده (بدون فایل)، مطمئن شو لینک معتبره
        external_link = self.request.data.get("external_link", "").strip()
        if not file and not external_link:
            raise ValidationError(
                "حداقل یکی از «فایل» یا «لینک بیرونی» الزامی است"
            )

        serializer.save(
            uploaded_by=self.request.user,
            file_size=file.size if file else 0,
            mime_type=file.content_type if file else "",
        )

    @action(detail=True, methods=["post"], url_path="verify")
    def verify(self, request, pk=None):
        """علامت‌گذاری فایل به عنوان تأیید مستقل"""
        evidence = self.get_object()
        evidence.is_independently_verified = True
        evidence.verified_by = request.user.get_full_name() or request.user.username
        evidence.verified_at = timezone.now()
        evidence.save()
        return Response(CriterionEvidenceSerializer(evidence, context={"request": request}).data)


# ============================================================
# Recommendation & Routing Rules (خواندنی)
# ============================================================
class RecommendationRuleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = RecommendationRule.objects.all().order_by("order")
    serializer_class = RecommendationRuleSerializer
    permission_classes = [permissions.IsAuthenticated]


class RoutingRuleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = RoutingRule.objects.all().order_by("order")
    serializer_class = RoutingRuleSerializer
    permission_classes = [permissions.IsAuthenticated]
