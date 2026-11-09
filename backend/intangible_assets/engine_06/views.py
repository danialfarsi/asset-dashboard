"""
Views موتور ۶ — تجاری‌سازی
"""

from django.db.models import Q, Sum, Count, Avg
from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

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
from intangible_assets.engine_06.serializers import (
    PaymentScheduleSerializer,
    PartnerSerializer,
    CommercializationCaseSerializer,
    ReadinessAssessmentSerializer,
    ReadinessSubmitSerializer,
    ReadinessOverrideSerializer,
    BusinessModelSelectionSerializer,
    BusinessModelSelectSerializer,
    PartnerShortlistSerializer,
    PartnerSearchSerializer,
    CommercializationContractSerializer,
    ContractCreateSerializer,
    ContractChecklistUpdateSerializer,
    ContractSignSerializer,
    RevenueRecordSerializer,
    RevenueCreateSerializer,
    RevenueCollectSerializer,
    CommercializationActivityLogSerializer,
)


# ============================================================
# Helper
# ============================================================
def log_activity(case, action, user, description="", extra_data=None):
    """ثبت فعالیت در لاگ"""
    CommercializationActivityLog.objects.create(
        case=case,
        action=action,
        description=description,
        extra_data=extra_data or {},
        user=user,
    )


def get_user_org_filter(user):
    """فیلتر بر اساس سازمان کاربر"""
    if hasattr(user, "role") and user.role == "super_admin":
        return Q()
    if hasattr(user, "organization") and user.organization:
        return Q(organization=user.organization)
    return Q()


# ============================================================
# ۰. Partner ViewSet
# ============================================================
class PartnerViewSet(viewsets.ModelViewSet):
    """مدیریت پایگاه شرکا"""
    queryset = Partner.objects.all()
    serializer_class = PartnerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        # فیلتر جستجو
        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(name_en__icontains=q) | Q(industry__icontains=q))
        partner_type = self.request.query_params.get("partner_type")
        if partner_type:
            qs = qs.filter(partner_type=partner_type)
        country = self.request.query_params.get("country")
        if country:
            qs = qs.filter(country__icontains=country)
        only_active = self.request.query_params.get("active", "true").lower() == "true"
        if only_active:
            qs = qs.filter(is_active=True)
        return qs

    @action(detail=False, methods=["get"])
    def blacklisted(self, request):
        """لیست شرکای blacklisted"""
        qs = Partner.objects.filter(
            Q(has_conflict_of_interest=True) |
            Q(has_contract_breach_history=True) |
            Q(is_sanctioned=True)
        )
        return Response(PartnerSerializer(qs, many=True).data)


# ============================================================
# ۱. CommercializationCase ViewSet (پرونده اصلی)
# ============================================================
class CommercializationCaseViewSet(viewsets.ModelViewSet):
    """پرونده‌های تجاری‌سازی — کانتینر ۵ گام"""
    queryset = CommercializationCase.objects.select_related(
        "asset", "asset__asset_type", "organization", "department", "owner"
    ).all()
    serializer_class = CommercializationCaseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user

        # فیلتر سازمان
        if not (hasattr(user, "role") and user.role == "super_admin"):
            if hasattr(user, "organization") and user.organization:
                qs = qs.filter(organization=user.organization)

        # فیلتر وضعیت
        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)

        # فیلتر گام
        step = self.request.query_params.get("step")
        if step:
            qs = qs.filter(current_step=step)

        # فیلتر فقط پرونده‌های من
        mine = self.request.query_params.get("mine")
        if mine == "true":
            qs = qs.filter(owner=user)

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        asset = serializer.validated_data.get("asset")

        # دروازه ورود ۱: آیا دارایی قبلاً پرونده داره؟
        if CommercializationCase.objects.filter(asset=asset).exists():
            raise ValidationError({"asset": "این دارایی قبلاً پرونده تجاری‌سازی دارد"})

        # دروازه ورود ۲: وضعیت دارایی باید confirmed باشد
        if hasattr(asset, "result") and asset.result != "confirmed":
            raise ValidationError({
                "asset": f"فقط دارایی‌های «قطعی» قابل تجاری‌سازی هستند. وضعیت فعلی: {asset.result}"
            })

        # دروازه ورود ۳: ارزش‌گذاری معتبر از موتور ۲
        try:
            from intangible_assets.valuation_models import ValuationCase
            has_valuation = ValuationCase.objects.filter(
                asset=asset,
            ).exclude(status="draft").exists()
            if not has_valuation:
                raise ValidationError({
                    "asset": "دارایی ارزش‌گذاری معتبر ندارد. ابتدا از موتور ۲ استفاده کنید."
                })
        except ImportError:
            # اگر مدل موجود نبود، نادیده بگیر
            pass

        # دروازه ورود ۴: حفاظت فعال از موتور ۳
        try:
            from intangible_assets.protection_models import ProtectionProfile
            has_protection = ProtectionProfile.objects.filter(
                asset=asset,
            ).exclude(status="draft").exists()
            if not has_protection:
                raise ValidationError({
                    "asset": "دارایی حفاظت فعال ندارد. ابتدا از موتور ۳ استفاده کنید."
                })
        except ImportError:
            pass

        case = serializer.save(
            created_by=user,
            owner=serializer.validated_data.get("owner", user),
            organization=getattr(user, "organization", None),
            department=getattr(user, "department", None),
            started_at=timezone.now(),
            status="step_1_readiness",
            current_step=1,
        )
        log_activity(case, "created", user, "پرونده تجاری‌سازی ایجاد شد")

    @action(detail=True, methods=["post"], url_path="start-readiness")
    def start_readiness(self, request, pk=None):
        """شروع گام ۱ — ساخت ارزیابی خالی"""
        case = self.get_object()
        if hasattr(case, "readiness_assessment"):
            return Response(
                {"detail": "ارزیابی آمادگی قبلاً ایجاد شده"},
                status=status.HTTP_400_BAD_REQUEST
            )
        ReadinessAssessment.objects.create(
            case=case,
            assessed_by=request.user,
        )
        log_activity(case, "readiness_submitted", request.user, "ارزیابی آمادگی شروع شد")
        return Response(ReadinessAssessmentSerializer(case.readiness_assessment).data)

    @action(detail=True, methods=["post"], url_path="advance")
    def advance_step(self, request, pk=None):
        """پیشبرد پرونده به گام بعدی"""
        case = self.get_object()
        next_step = case.current_step + 1
        if next_step > 5:
            return Response(
                {"detail": "پرونده در آخرین گام است"},
                status=status.HTTP_400_BAD_REQUEST
            )
        case.advance_to_step(next_step)
        log_activity(case, "step_advanced", request.user, f"پیشرفت به گام {next_step}")
        return Response(CommercializationCaseSerializer(case).data)

    @action(detail=True, methods=["post"], url_path="close")
    def close_case(self, request, pk=None):
        """بستن پرونده"""
        case = self.get_object()
        won = request.data.get("won", True)
        reason = request.data.get("reason", "")

        case.status = "closed_won" if won else "closed_lost"
        case.closed_at = timezone.now()
        case.closure_reason = reason
        case.save(update_fields=["status", "closed_at", "closure_reason", "updated_at"])

        log_activity(case, "case_closed", request.user, f"پرونده بسته شد — {'موفق' if won else 'ناموفق'}: {reason}")
        return Response(CommercializationCaseSerializer(case).data)

    @action(detail=True, methods=["get"])
    def timeline(self, request, pk=None):
        """تاریخچه فعالیت‌های پرونده"""
        case = self.get_object()
        logs = case.activity_logs.all()
        return Response(CommercializationActivityLogSerializer(logs, many=True).data)

    @action(detail=True, methods=["get"], url_path="export-report")
    def export_report(self, request, pk=None):
        """گزارش نهایی برای موتورهای ۲، ۶، ۹"""
        from django.db.models import Sum
        case = self.get_object()

        # خلاصه قرارداد
        contract_data = None
        revenue_data = {"total_expected": 0, "total_collected": 0, "collection_rate": 0}
        if hasattr(case, "contract"):
            c = case.contract
            contract_data = {
                "partner": c.partner.name if c.partner else None,
                "status": c.status,
                "signed_at": c.signed_at.isoformat() if c.signed_at else None,
                "terms": c.terms,
            }
            revenue_qs = c.revenue_records.all()
            total_calc = revenue_qs.aggregate(s=Sum("calculated_revenue"))["s"] or 0
            total_collected = revenue_qs.aggregate(s=Sum("collected_amount"))["s"] or 0
            revenue_data = {
                "total_expected": float(total_calc),
                "total_collected": float(total_collected),
                "collection_rate": (
                    float(total_collected) / float(total_calc) * 100
                    if total_calc else 0
                ),
            }

        # برای موتور ۲: ارزش تحقق‌یافته vs ارزش‌گذاری اولیه
        engine_02_feedback = {
            "asset_id": case.asset_id,
            "asset_name": case.asset.asset_name if case.asset else None,
            "realized_revenue": revenue_data["total_collected"],
            "initial_valuation": None,  # از موتور ۲ خوانده می‌شود
            "calibration_note": "درآمد واقعی برای کالیبراسیون ارزش‌گذاری",
        }

        # برای موتور ۶ (خودمان - governance)
        engine_06_governance = {
            "case_id": case.id,
            "status": case.status,
            "current_step": case.current_step,
            "started_at": case.started_at.isoformat() if case.started_at else None,
            "closed_at": case.closed_at.isoformat() if case.closed_at else None,
            "owner": case.owner.username if case.owner else None,
            "contract": contract_data,
            "revenue": revenue_data,
        }

        # برای موتور ۹: پیش‌بینی درآمد آینده
        engine_09_forecast = {
            "case_id": case.id,
            "actual_revenue": revenue_data["total_collected"],
            "collection_rate": revenue_data["collection_rate"],
            "historical_note": "برای بهبود مدل پیش‌بینی",
        }

        return Response({
            "case_summary": CommercializationCaseSerializer(case).data,
            "engine_02_feedback": engine_02_feedback,
            "engine_06_governance": engine_06_governance,
            "engine_09_forecast": engine_09_forecast,
            "exported_at": timezone.now().isoformat(),
        })


# ============================================================
# ۲. ReadinessAssessment ViewSet (گام ۱)
# ============================================================
class ReadinessAssessmentViewSet(viewsets.ModelViewSet):
    """ارزیابی آمادگی تجاری‌سازی"""
    queryset = ReadinessAssessment.objects.select_related("case", "assessed_by").all()
    serializer_class = ReadinessAssessmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        case_id = self.request.query_params.get("case")
        if case_id:
            qs = qs.filter(case_id=case_id)
        user = self.request.user
        if not (hasattr(user, "role") and user.role == "super_admin"):
            if hasattr(user, "organization") and user.organization:
                qs = qs.filter(case__organization=user.organization)
        return qs

    @action(detail=True, methods=["post"], url_path="submit-scores")
    def submit_scores(self, request, pk=None):
        """ثبت امتیاز معیارها — محاسبه وزن‌دار + جریمه شاهد + recommendation"""
        from intangible_assets.engine_06.config import ConfigLoader

        assessment = self.get_object()
        ser = ReadinessSubmitSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        criteria_scores = ser.validated_data["criteria_scores"]

        if not criteria_scores:
            return Response(
                {"detail": "امتیاز معیارها خالی است"},
                status=status.HTTP_400_BAD_REQUEST
            )

        config = ConfigLoader.readiness_criteria()
        criteria_defs = {c["id"]: c for c in config["criteria"]}
        scoring_cfg = config["scoring"]
        thresholds = config["thresholds"]
        evidence_penalty = scoring_cfg.get("evidence_penalty", 15)

        # محاسبه وزن‌دار
        total_weighted = 0
        total_weight = 0
        missing_required_evidence = []

        for cid, data in criteria_scores.items():
            if cid not in criteria_defs:
                continue
            crit = criteria_defs[cid]
            score = float(data.get("score", 0))
            weight = crit["weight"]
            evidence = data.get("evidence", "").strip()

            # جریمه در صورت نبود شاهد برای معیارهای الزامی
            if crit.get("required_evidence") and not evidence:
                score = max(0, score - evidence_penalty)
                missing_required_evidence.append(crit["name_fa"])

            total_weighted += score * weight
            total_weight += weight

        weighted_score = (total_weighted / total_weight) if total_weight else 0

        # سطح اطمینان: هرچه شاهد کمتر، اطمینان کمتر
        total_criteria = len(criteria_defs)
        missing_count = len(missing_required_evidence)
        confidence = max(0, 100 - (missing_count / max(1, total_criteria)) * 40)

        # توصیه خودکار بر اساس آستانه‌ها
        if weighted_score >= thresholds["go"]:
            auto_rec = "go"
        elif weighted_score >= thresholds["develop_further"]:
            auto_rec = "develop_further"
        else:
            auto_rec = "no_go"

        assessment.criteria_scores = criteria_scores
        assessment.total_score = round(weighted_score, 2)
        assessment.confidence_level = int(confidence)
        assessment.auto_recommendation = auto_rec
        assessment.recommendation = auto_rec
        assessment.assessed_by = request.user
        assessment.assessed_at = timezone.now()
        assessment.save()

        log_activity(
            assessment.case, "readiness_submitted", request.user,
            f"ارزیابی ثبت شد — امتیاز وزنی {weighted_score:.1f}، اطمینان {confidence:.0f}%، توصیه {auto_rec}",
            {
                "total_score": weighted_score,
                "confidence": confidence,
                "recommendation": auto_rec,
                "missing_evidence": missing_required_evidence,
            },
        )
        return Response(ReadinessAssessmentSerializer(assessment).data)

    @action(detail=True, methods=["post"], url_path="override")
    def override(self, request, pk=None):
        """Override توصیه خودکار توسط کمیته"""
        assessment = self.get_object()
        ser = ReadinessOverrideSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        assessment.recommendation = ser.validated_data["new_recommendation"]
        assessment.override_reason = ser.validated_data["override_reason"]
        assessment.is_overridden = True
        assessment.overridden_by = request.user
        assessment.overridden_at = timezone.now()
        assessment.save()

        log_activity(
            assessment.case, "readiness_overridden", request.user,
            f"توصیه تغییر یافت از {assessment.auto_recommendation} به {assessment.recommendation}",
            {"reason": assessment.override_reason},
        )
        return Response(ReadinessAssessmentSerializer(assessment).data)


# ============================================================
# ۳. BusinessModelSelection ViewSet (گام ۲)
# ============================================================
class BusinessModelSelectionViewSet(viewsets.ModelViewSet):
    """انتخاب مدل تجاری‌سازی + Business Case"""
    queryset = BusinessModelSelection.objects.select_related("case").all()
    serializer_class = BusinessModelSelectionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        case_id = self.request.query_params.get("case")
        if case_id:
            qs = qs.filter(case_id=case_id)
        user = self.request.user
        if not (hasattr(user, "role") and user.role == "super_admin"):
            if hasattr(user, "organization") and user.organization:
                qs = qs.filter(case__organization=user.organization)
        return qs

    @action(detail=False, methods=["post"], url_path="select")
    def select_model(self, request):
        """انتخاب مدل + ثبت Business Case"""
        ser = BusinessModelSelectSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        case_id = request.data.get("case_id")
        if not case_id:
            raise ValidationError({"case_id": "الزامی است"})

        try:
            case = CommercializationCase.objects.get(id=case_id)
        except CommercializationCase.DoesNotExist:
            raise ValidationError({"case_id": "پرونده یافت نشد"})

        if hasattr(case, "business_model_selection"):
            # به‌روزرسانی
            bm = case.business_model_selection
        else:
            bm = BusinessModelSelection(case=case)

        bm.selected_model = ser.validated_data["selected_model"]
        bm.business_case_data = ser.validated_data["business_case_data"]
        bm.npv_base = ser.validated_data.get("npv_base", 0)
        bm.irr_base = ser.validated_data.get("irr_base", 0)
        bm.payback_months = ser.validated_data.get("payback_months", 0)
        bm.justification = ser.validated_data.get("justification", "")
        bm.created_by = request.user
        bm.save()

        log_activity(
            case, "business_model_selected", request.user,
            f"مدل تجاری‌سازی انتخاب شد: {bm.get_selected_model_display()}",
        )
        return Response(BusinessModelSelectionSerializer(bm).data)

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        """تصویب توسط کمیته"""
        bm = self.get_object()
        bm.approved_by_committee = True
        bm.approved_at = timezone.now()
        bm.save()
        return Response(BusinessModelSelectionSerializer(bm).data)


# ============================================================
# ۴. PartnerShortlist ViewSet (گام ۳)
# ============================================================
class PartnerShortlistViewSet(viewsets.ModelViewSet):
    """فهرست کوتاه شرکا"""
    queryset = PartnerShortlist.objects.select_related("case").all()
    serializer_class = PartnerShortlistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        case_id = self.request.query_params.get("case")
        if case_id:
            qs = qs.filter(case_id=case_id)
        return qs

    @action(detail=False, methods=["post"], url_path="search")
    def search_partners(self, request):
        """جستجو در پایگاه شرکا + امتیازدهی + فیلتر"""
        ser = PartnerSearchSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        qs = Partner.objects.filter(is_active=True)
        if ser.validated_data.get("partner_type"):
            qs = qs.filter(partner_type=ser.validated_data["partner_type"])
        if ser.validated_data.get("country"):
            qs = qs.filter(country__icontains=ser.validated_data["country"])
        if ser.validated_data.get("industry"):
            qs = qs.filter(industry__icontains=ser.validated_data["industry"])

        # فیلتر blacklisted
        valid = []
        rejected = []
        for p in qs:
            if p.is_blacklisted:
                reasons = []
                if p.has_conflict_of_interest:
                    reasons.append("تعارض منافع")
                if p.has_contract_breach_history:
                    reasons.append("سابقه نقض قرارداد")
                if p.is_sanctioned:
                    reasons.append("تحریم")
                rejected.append({"partner_id": p.id, "name": p.name, "reasons": reasons})
            elif p.weighted_score >= ser.validated_data.get("min_score", 0):
                valid.append({
                    "partner_id": p.id,
                    "name": p.name,
                    "partner_type": p.partner_type,
                    "weighted_score": p.weighted_score,
                    "country": p.country,
                })

        # مرتب‌سازی بر اساس امتیاز
        valid.sort(key=lambda x: x["weighted_score"], reverse=True)
        for rank, item in enumerate(valid, 1):
            item["rank"] = rank

        return Response({
            "candidates": valid,
            "rejected": rejected,
            "total_candidates": len(valid),
            "total_rejected": len(rejected),
        })

    @action(detail=False, methods=["post"], url_path="save")
    def save_shortlist(self, request):
        """ذخیره لیست کوتاه برای پرونده"""
        case_id = request.data.get("case_id")
        partners_data = request.data.get("partners_data", [])
        rejected = request.data.get("rejected", [])

        try:
            case = CommercializationCase.objects.get(id=case_id)
        except CommercializationCase.DoesNotExist:
            raise ValidationError({"case_id": "پرونده یافت نشد"})

        if hasattr(case, "partner_shortlist"):
            sl = case.partner_shortlist
        else:
            sl = PartnerShortlist(case=case)

        sl.partners_data = partners_data
        sl.rejected_partners = rejected
        sl.created_by = request.user
        sl.save()

        log_activity(
            case, "partners_shortlisted", request.user,
            f"{len(partners_data)} شریک در لیست کوتاه ثبت شد",
        )
        return Response(PartnerShortlistSerializer(sl).data)

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        """تصویب لیست توسط کمیته"""
        sl = self.get_object()
        sl.approved_by_committee = True
        sl.approved_at = timezone.now()
        sl.save()
        return Response(PartnerShortlistSerializer(sl).data)

    @action(detail=True, methods=["post"], url_path="sign-nda")
    def sign_nda(self, request, pk=None):
        """ثبت امضای NDA با شریک — دروازه اجباری"""
        sl = self.get_object()
        partner_id = request.data.get("partner_id")

        if not partner_id:
            return Response(
                {"detail": "partner_id الزامی است"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # بررسی وجود شریک در لیست
        partner_ids = [p.get("partner_id") for p in (sl.partners_data or [])]
        if partner_id not in partner_ids:
            return Response(
                {"detail": "این شریک در لیست کوتاه نیست"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ثبت NDA
        nda_list = sl.nda_signed_with or []
        if partner_id not in nda_list:
            nda_list.append(partner_id)
        sl.nda_signed_with = nda_list
        sl.nda_signed = True
        sl.nda_signed_at = timezone.now()
        sl.save()

        log_activity(
            sl.case, "other", request.user,
            f"NDA با شریک (id={partner_id}) امضا شد",
        )
        return Response(PartnerShortlistSerializer(sl).data)


# ============================================================
# ۵. CommercializationContract ViewSet (گام ۴)
# ============================================================
class CommercializationContractViewSet(viewsets.ModelViewSet):
    """قرارداد تجاری‌سازی"""
    queryset = CommercializationContract.objects.select_related("case", "partner").all()
    serializer_class = CommercializationContractSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        case_id = self.request.query_params.get("case")
        if case_id:
            qs = qs.filter(case_id=case_id)
        user = self.request.user
        if not (hasattr(user, "role") and user.role == "super_admin"):
            if hasattr(user, "organization") and user.organization:
                qs = qs.filter(case__organization=user.organization)
        return qs

    @action(detail=False, methods=["post"], url_path="create-draft")
    def create_draft(self, request):
        """ایجاد پیش‌نویس قرارداد"""
        ser = ContractCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        case_id = request.data.get("case_id")
        try:
            case = CommercializationCase.objects.get(id=case_id)
        except CommercializationCase.DoesNotExist:
            raise ValidationError({"case_id": "پرونده یافت نشد"})

        try:
            partner = Partner.objects.get(id=ser.validated_data["partner_id"])
        except Partner.DoesNotExist:
            raise ValidationError({"partner_id": "شریک یافت نشد"})

        if hasattr(case, "contract"):
            contract = case.contract
        else:
            contract = CommercializationContract(case=case)

        contract.partner = partner
        contract.terms = ser.validated_data["terms"]
        contract.status = "draft"
        contract.created_by = request.user

        # بررسی محدوده مجاز رویالتی
        warnings = []
        royalty = contract.terms.get("royalty_rate")
        if royalty is not None:
            try:
                royalty_val = float(royalty)
                if royalty_val > 25:
                    warnings.append(f"نرخ رویالتی {royalty_val}% از حد مجاز (25%) بیشتر است")
                    contract.needs_exception_approval = True
            except (ValueError, TypeError):
                pass

        contract.warnings = warnings
        contract.save()

        log_activity(
            case, "contract_drafted", request.user,
            f"پیش‌نویس قرارداد با {partner.name} ایجاد شد",
        )
        return Response(CommercializationContractSerializer(contract).data)

    @action(detail=True, methods=["post"], url_path="update-checklist")
    def update_checklist(self, request, pk=None):
        """به‌روزرسانی چک‌لیست ۱۴ بندی حقوقی"""
        contract = self.get_object()
        ser = ContractChecklistUpdateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        contract.legal_checklist = ser.validated_data["legal_checklist"]
        # چک کامل بودن (همه ۱۴ مورد true باشند)
        required_items = [
            "party_capacity", "asset_scope", "exclusivity", "territory",
            "duration", "financial_structure", "audit_right", "confidentiality",
            "improvements_ownership", "warranties", "termination", "dispute_resolution",
            "governing_law", "force_majeure",
        ]
        is_complete = all(contract.legal_checklist.get(k, False) for k in required_items)
        contract.legal_checklist_complete = is_complete
        contract.save()

        return Response(CommercializationContractSerializer(contract).data)

    @action(detail=True, methods=["post"], url_path="sign")
    def sign(self, request, pk=None):
        """امضای قرارداد"""
        contract = self.get_object()
        if not contract.legal_checklist_complete:
            return Response(
                {"detail": "چک‌لیست حقوقی کامل نشده — امکان امضا نیست"},
                status=status.HTTP_400_BAD_REQUEST
            )

        ser = ContractSignSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        contract.status = "signed"
        contract.signed_at = timezone.now()
        contract.signed_by_name = ser.validated_data["signed_by_name"]
        contract.clm_reference = ser.validated_data.get("clm_reference", "")
        contract.save()

        log_activity(
            contract.case, "contract_signed", request.user,
            f"قرارداد با {contract.partner.name} امضا شد",
        )
        return Response(CommercializationContractSerializer(contract).data)

    @action(detail=True, methods=["get"], url_path="health")
    def health(self, request, pk=None):
        """شاخص سلامت قرارداد"""
        from intangible_assets.engine_06.services.health_service import HealthService
        contract = self.get_object()
        return Response(HealthService.compute_health(contract))

    @action(detail=True, methods=["post"], url_path="generate-payment-schedule")
    def generate_payment_schedule(self, request, pk=None):
        """تولید خودکار تقویم پرداخت بر اساس شرایط قرارداد"""
        from datetime import date, timedelta
        from intangible_assets.engine_06.models import PaymentSchedule
        contract = self.get_object()

        terms = contract.terms or {}
        payment_structure = terms.get("payment_structure", "annual")
        total_amount = float(terms.get("total_amount", 0))
        duration_years = int(terms.get("duration_years", 1)) or 1
        start_date_str = terms.get("start_date")

        if start_date_str:
            try:
                start_date = date.fromisoformat(start_date_str)
            except (ValueError, TypeError):
                start_date = date.today()
        else:
            start_date = date.today()

        # حذف تقویم قبلی
        PaymentSchedule.objects.filter(contract=contract).delete()

        schedules = []
        if payment_structure == "lump_sum":
            schedules.append(PaymentSchedule(
                contract=contract,
                title="پرداخت یکجا",
                due_date=start_date + timedelta(days=30),
                amount_expected=total_amount,
            ))
        else:
            # پرداخت سالانه
            per_payment = total_amount / duration_years
            for i in range(duration_years):
                schedules.append(PaymentSchedule(
                    contract=contract,
                    title=f"قسط سال {i + 1}",
                    due_date=date(
                        start_date.year + i + 1,
                        start_date.month,
                        min(start_date.day, 28),
                    ),
                    amount_expected=per_payment,
                ))

        PaymentSchedule.objects.bulk_create(schedules)

        return Response({
            "detail": f"{len(schedules)} تعهد پرداخت ایجاد شد",
            "count": len(schedules),
        })

    @action(detail=True, methods=["get"], url_path="renewal-recommendation")
    def renewal_recommendation(self, request, pk=None):
        """توصیه تمدید/بازمذاکره/عدم تمدید"""
        from intangible_assets.engine_06.services.health_service import HealthService
        contract = self.get_object()
        return Response(HealthService.renewal_recommendation(contract))

    @action(detail=True, methods=["post"], url_path="reject-and-next")
    def reject_and_next(self, request, pk=None):
        """رد شریک فعلی و انتقال به شریک بعدی در Shortlist"""
        contract = self.get_object()
        case = contract.case

        # ۱. ثبت رد شریک فعلی
        if hasattr(case, "partner_shortlist"):
            shortlist = case.partner_shortlist
            partners_data = shortlist.partners_data or []

            # پیدا کردن شریک فعلی در لیست
            current_partner_id = contract.partner_id
            current_rank = None
            next_partner_data = None

            for p in partners_data:
                if p.get("partner_id") == current_partner_id:
                    current_rank = p.get("rank")
                    break

            # پیدا کردن شریک بعدی
            if current_rank is not None:
                for p in partners_data:
                    if p.get("rank") == current_rank + 1:
                        next_partner_data = p
                        break

            # اگه شریک بعدی پیدا شد، قرارداد جدید بساز
            if next_partner_data:
                from intangible_assets.engine_06.models import Partner
                try:
                    next_partner = Partner.objects.get(id=next_partner_data["partner_id"])
                except Partner.DoesNotExist:
                    next_partner = None

                if next_partner:
                    # ثبت رد شریک فعلی
                    contract.status = "terminated"
                    contract.save(update_fields=["status", "updated_at"])

                    # ایجاد قرارداد جدید
                    new_contract = CommercializationContract.objects.create(
                        case=case,
                        partner=next_partner,
                        terms=contract.terms,
                        status="draft",
                        created_by=request.user,
                    )

                    log_activity(
                        case, "contract_drafted", request.user,
                        f"انتقال خودکار به شریک بعدی: {next_partner.name} (رتبه {current_rank + 1})",
                    )
                    return Response({
                        "detail": f"انتقال به شریک بعدی: {next_partner.name}",
                        "new_contract": CommercializationContractSerializer(new_contract).data,
                    })

        # اگر شریک بعدی نبود
        contract.status = "terminated"
        contract.save(update_fields=["status", "updated_at"])
        log_activity(
            case, "contract_drafted", request.user,
            "هیچ شریک دیگری در Shortlist موجود نیست — بازگشت به گام ۳",
        )
        return Response({
            "detail": "هیچ شریک دیگری در Shortlist موجود نیست. بازگشت به گام ۳ نیاز است.",
            "action_required": "return_to_step_3",
        }, status=status.HTTP_200_OK)


# ============================================================
# ۵.۵ PaymentSchedule ViewSet
# ============================================================
class PaymentScheduleViewSet(viewsets.ModelViewSet):
    """تقویم پرداخت قرارداد"""
    queryset = PaymentSchedule.objects.select_related("contract").all()
    serializer_class = PaymentScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        contract_id = self.request.query_params.get("contract")
        if contract_id:
            qs = qs.filter(contract_id=contract_id)

        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)

        user = self.request.user
        if not (hasattr(user, "role") and user.role == "super_admin"):
            if hasattr(user, "organization") and user.organization:
                qs = qs.filter(contract__case__organization=user.organization)
        return qs

    @action(detail=False, methods=["get"], url_path="upcoming")
    def upcoming(self, request):
        """پرداخت‌های نزدیک به سررسید (۳۰ روز آینده)"""
        from datetime import timedelta
        today = timezone.now().date()
        upcoming = self.get_queryset().filter(
            due_date__lte=today + timedelta(days=30),
            due_date__gte=today,
            status__in=["pending", "due_soon"],
        )
        return Response(PaymentScheduleSerializer(upcoming, many=True).data)


# ============================================================
# ۶. RevenueRecord ViewSet (گام ۵)
# ============================================================
class RevenueRecordViewSet(viewsets.ModelViewSet):
    """ثبت درآمد و وصول"""
    queryset = RevenueRecord.objects.select_related("contract", "contract__partner").all()
    serializer_class = RevenueRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        contract_id = self.request.query_params.get("contract")
        if contract_id:
            qs = qs.filter(contract_id=contract_id)
        user = self.request.user
        if not (hasattr(user, "role") and user.role == "super_admin"):
            if hasattr(user, "organization") and user.organization:
                qs = qs.filter(contract__case__organization=user.organization)
        return qs

    @action(detail=False, methods=["post"], url_path="record")
    def record_revenue(self, request):
        """ثبت درآمد دوره + محاسبه مستقل سیستم"""
        ser = RevenueCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        contract_id = request.data.get("contract_id")
        try:
            contract = CommercializationContract.objects.get(id=contract_id)
        except CommercializationContract.DoesNotExist:
            raise ValidationError({"contract_id": "قرارداد یافت نشد"})

        reported = float(ser.validated_data["reported_revenue"])

        # محاسبه مستقل سیستم: royalty_rate × reported
        royalty_rate = float(contract.terms.get("royalty_rate", 0))
        calculated = reported * royalty_rate / 100

        # مغایرت
        variance = reported - calculated
        variance_pct = (variance / reported * 100) if reported else 0
        significant = abs(variance_pct) > 15  # آستانه ۱۵٪

        rec = RevenueRecord.objects.create(
            contract=contract,
            period_label=ser.validated_data["period_label"],
            period_start=ser.validated_data["period_start"],
            period_end=ser.validated_data["period_end"],
            reported_revenue=reported,
            calculated_revenue=calculated,
            variance=variance,
            variance_percent=round(variance_pct, 2),
            has_significant_variance=significant,
            status="disputed" if significant else "calculated",
            extra_data=ser.validated_data.get("extra_data", {}),
            created_by=request.user,
        )

        log_activity(
            contract.case, "revenue_recorded", request.user,
            f"درآمد دوره {rec.period_label} ثبت شد — اعلامی: {reported}, محاسبه‌شده: {calculated}",
        )

        return Response(RevenueRecordSerializer(rec).data)

    @action(detail=True, methods=["post"], url_path="collect")
    def collect(self, request, pk=None):
        """ثبت وصول درآمد"""
        rec = self.get_object()
        ser = RevenueCollectSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        rec.collected_amount = ser.validated_data["collected_amount"]
        rec.bank_reference = ser.validated_data.get("bank_reference", "")
        rec.collected_at = timezone.now()
        rec.status = "collected"
        rec.save()

        return Response(RevenueRecordSerializer(rec).data)


# ============================================================
# ۷. Dashboard
# ============================================================
class CommercializationDashboardView(viewsets.ViewSet):
    """داشبورد تجمیعی موتور ۶"""
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        user = request.user
        qs = CommercializationCase.objects.all()

        if not (hasattr(user, "role") and user.role == "super_admin"):
            if hasattr(user, "organization") and user.organization:
                qs = qs.filter(organization=user.organization)

        total = qs.count()
        by_status = dict(qs.values_list("status").annotate(c=Count("id")))
        by_step = dict(qs.values_list("current_step").annotate(c=Count("id")))

        # قراردادها
        contracts_signed = CommercializationContract.objects.filter(
            status__in=["signed", "active"]
        )
        if not (hasattr(user, "role") and user.role == "super_admin"):
            if hasattr(user, "organization") and user.organization:
                contracts_signed = contracts_signed.filter(case__organization=user.organization)

        # درآمدها
        revenue_qs = RevenueRecord.objects.all()
        if not (hasattr(user, "role") and user.role == "super_admin"):
            if hasattr(user, "organization") and user.organization:
                revenue_qs = revenue_qs.filter(contract__case__organization=user.organization)

        collected = revenue_qs.filter(status="collected").aggregate(
            s=Sum("collected_amount")
        )["s"] or 0
        reported = revenue_qs.aggregate(s=Sum("reported_revenue"))["s"] or 0
        disputes = revenue_qs.filter(status="disputed").count()

        return Response({
            "total_cases": total,
            "by_status": {k: v for k, v in by_status.items()},
            "by_step": {str(k): v for k, v in by_step.items()},
            "total_contracts_signed": contracts_signed.count(),
            "total_revenue_collected": collected,
            "total_revenue_reported": reported,
            "disputes_count": disputes,
        })
