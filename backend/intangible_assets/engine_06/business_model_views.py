"""
Views گام ۲ — انتخاب مدل تجاری‌سازی + Business Case
"""

from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from intangible_assets.engine_06.models import (
    CommercializationCase,
    BusinessModelSelection,
)
from intangible_assets.engine_06.config import ConfigLoader
from intangible_assets.engine_06.services.business_case_service import BusinessCaseService
from intangible_assets.engine_06.business_model_serializers import (
    ModelComparisonRequestSerializer,
    BusinessCaseInputSerializer,
)
from intangible_assets.engine_06.views import log_activity


def get_model_display():
    """از Config می‌خونه"""
    config = ConfigLoader.business_case_defaults()
    return config.get("model_display_names", {})


def get_asset_category(case):
    """استخراج دسته از asset_type — از Config می‌خونه"""
    if not case.asset:
        return "default"
    if case.asset.asset_type:
        at_code = (case.asset.asset_type.code or "").lower()
        config = ConfigLoader.asset_category_mapping()
        mapping = config.get("mapping", {})
        default = config.get("default", "default")
        return mapping.get(at_code, default)
    return "default"


class BusinessModelSelectionViewSet(viewsets.ModelViewSet):
    """مدل تجاری‌سازی — انتخاب و Business Case"""

    queryset = BusinessModelSelection.objects.select_related("case").all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        from intangible_assets.engine_06.serializers import BusinessModelSelectionSerializer
        return BusinessModelSelectionSerializer

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

    @action(detail=False, methods=["get"], url_path="recommendations")
    def recommendations(self, request):
        """پیشنهاد مدل‌ها بر اساس دسته دارایی"""
        case_id = request.query_params.get("case")
        if not case_id:
            raise ValidationError({"case": "case_id الزامی است"})

        try:
            case = CommercializationCase.objects.get(id=case_id)
        except CommercializationCase.DoesNotExist:
            raise ValidationError({"case": "پرونده یافت نشد"})

        category = get_asset_category(case)
        config = ConfigLoader.business_model_applicability()

        ranked = BusinessCaseService.recommend_models(category, config)

        # اضافه کردن display_name
        for item in ranked:
            item["model_display"] = get_model_display().get(item["model"], item["model"])

        system_rank_1 = ranked[0]["model"] if ranked else ""
        display = get_model_display()
        reason = ""
        if ranked:
            top = ranked[0]
            reason = f"مدل {display.get(top['model'], top['model'])} بالاترین امتیاز را دارد ({to_fa(top['score'])}/۱۰۰) — درآمد {top['attributes'].get('revenue_potential', '?')}، ریسک {top['attributes'].get('risk', '?')}"

        return Response({
            "case_id": case.id,
            "asset_category": category,
            "applicable_models": ranked,
            "system_rank_1": system_rank_1,
            "system_rank_1_display": get_model_display().get(system_rank_1, ""),
            "recommended_reason": reason,
        })

    @action(detail=False, methods=["post"], url_path="select")
    def select_model(self, request):
        """انتخاب مدل + ثبت Business Case کامل + محاسبه NPV/IRR"""
        ser = BusinessCaseInputSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        case_id = request.data.get("case_id")
        if not case_id:
            raise ValidationError({"case_id": "الزامی است"})

        try:
            case = CommercializationCase.objects.get(id=case_id)
        except CommercializationCase.DoesNotExist:
            raise ValidationError({"case_id": "پرونده یافت نشد"})

        data = ser.validated_data
        selected_model = data["selected_model"]

        # محاسبه پیشنهاد سیستم
        category = get_asset_category(case)
        config = ConfigLoader.business_model_applicability()
        ranked = BusinessCaseService.recommend_models(category, config)
        system_rank_1 = ranked[0]["model"] if ranked else ""

        # آیا مدل انتخابی = رتبه ۱؟
        requires_justification = (selected_model != system_rank_1)

        if requires_justification and not data.get("justification"):
            raise ValidationError({
                "justification": f"شما مدل «{get_model_display().get(selected_model)}» را انتخاب کردید که رتبه ۱ سیستم نیست. توجیه مکتوب الزامی است."
            })

        # محاسبه Business Case
        discount_rate = data["base"].get("discount_rate", 18)
        case_data = {
            "pessimistic": {"cash_flows": data["pessimistic"]["cash_flows"]},
            "base": {"cash_flows": data["base"]["cash_flows"]},
            "optimistic": {"cash_flows": data["optimistic"]["cash_flows"]},
        }

        computed = BusinessCaseService.compute_full(case_data, discount_rate)

        # ذخیره
        if hasattr(case, "business_model_selection"):
            bm = case.business_model_selection
        else:
            bm = BusinessModelSelection(case=case)

        bm.selected_model = selected_model
        bm.business_case_data = {
            "discount_rate": discount_rate,
            "scenarios": {
                "pessimistic": data["pessimistic"],
                "base": data["base"],
                "optimistic": data["optimistic"],
            },
            "computed": computed,
        }
        bm.npv_base = computed["base"]["npv"]
        bm.irr_base = computed["base"]["irr"]
        bm.payback_months = computed["base"]["payback_months"]
        bm.system_rank_1_model = system_rank_1
        bm.requires_justification = requires_justification
        bm.justification = data.get("justification", "")
        bm.created_by = request.user
        bm.save()

        log_activity(
            case, "business_model_selected", request.user,
            f"مدل «{get_model_display().get(selected_model)}» انتخاب شد — NPV: {to_fa(computed['base']['npv'])}, IRR: {to_fa(computed['base']['irr'])}%",
        )

        return Response({
            "id": bm.id,
            "selected_model": selected_model,
            "selected_model_display": get_model_display().get(selected_model),
            "computed": computed,
            "npv_base": float(bm.npv_base),
            "irr_base": float(bm.irr_base),
            "payback_months": bm.payback_months,
            "system_rank_1": system_rank_1,
            "requires_justification": requires_justification,
            "justification": bm.justification,
        })

    @action(detail=False, methods=["get"], url_path="defaults")
    def defaults(self, request):
        """مقادیر پیش‌فرض Business Case از Config"""
        config = ConfigLoader.business_case_defaults()
        return Response({
            "default_discount_rate": config.get("default_discount_rate", 18),
            "default_cash_flows": config.get("default_cash_flows", {}),
            "model_display_names": config.get("model_display_names", {}),
        })

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        """تصویب توسط کمیته"""
        bm = self.get_object()
        bm.approved_by_committee = True
        bm.approved_at = timezone.now()
        bm.save()
        return Response({
            "id": bm.id,
            "approved_by_committee": True,
            "approved_at": bm.approved_at.isoformat(),
        })


def to_fa(num):
    """تبدیل عدد به فارسی"""
    if num is None:
        return "—"
    s = f"{float(num):,.2f}".rstrip("0").rstrip(".")
    mapping = str.maketrans("0123456789.", "۰۱۲۳۴۵۶۷۸۹.")
    return s.translate(mapping)
