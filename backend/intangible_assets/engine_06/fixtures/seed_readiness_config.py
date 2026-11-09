"""
Seed همه Config های گام ۱ در DB — مطابق PDF
اجرا: python3 manage.py shell -c "from intangible_assets.engine_06.fixtures.seed_readiness_config import seed; seed()"
"""

import json
import os
from django.db import transaction

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
)
from intangible_assets.role_models import BusinessType


FIXTURES_DIR = os.path.dirname(__file__)


def _load(filename):
    with open(os.path.join(FIXTURES_DIR, filename), "r", encoding="utf-8") as f:
        return json.load(f)


@transaction.atomic
def seed():
    print("=" * 60)
    print("🌱 شروع Seed Config های گام ۱")
    print("=" * 60)

    # ۱. خانواده‌ها
    families_data = _load("asset_families.json")
    for f_data in families_data["families"]:
        AssetFamily.objects.update_or_create(
            code=f_data["code"],
            defaults={
                "name_fa": f_data["name_fa"],
                "name_en": f_data.get("name_en", ""),
                "order": f_data.get("order", 0),
            },
        )
    print(f"✅ {AssetFamily.objects.count()} خانواده")

    # ۲. ابعاد
    dims_data = _load("readiness_dimensions.json")
    for d_data in dims_data["dimensions"]:
        ReadinessDimension.objects.update_or_create(
            code=d_data["code"],
            defaults={
                "name_fa": d_data["name_fa"],
                "order": d_data.get("order", 0),
            },
        )
    print(f"✅ {ReadinessDimension.objects.count()} بعد")

    # ۳. لیکرت
    likert_data = _load("likert_scale.json")
    for l_data in likert_data["levels"]:
        LikertScale.objects.update_or_create(
            level=l_data["level"],
            defaults={
                "label_fa": l_data["label_fa"],
                "meaning_fa": l_data.get("meaning_fa", ""),
                "base_score": l_data["base_score"],
            },
        )
    print(f"✅ {LikertScale.objects.count()} سطح لیکرت")

    # ۴. ضرایب شاهد
    evid_data = _load("evidence_factors.json")
    for e_data in evid_data["levels"]:
        EvidenceFactor.objects.update_or_create(
            code=e_data["code"],
            defaults={
                "label_fa": e_data["label_fa"],
                "factor_required": e_data["factor_required"],
                "factor_optional": e_data["factor_optional"],
            },
        )
    print(f"✅ {EvidenceFactor.objects.count()} سطح شاهد")

    # ۵. وزن ابعاد
    weights_data = _load("dimension_weights.json")
    # چک BusinessType موجود
    if BusinessType.objects.count() == 0:
        print("⚠️ هیچ BusinessType در DB نیست — ابتدا از role_models استفاده کنید")
    else:
        count = 0
        for bt_code, dim_weights in weights_data["weights"].items():
            bt = BusinessType.objects.filter(type=bt_code).first()
            if not bt:
                print(f"⚠️ BusinessType {bt_code} یافت نشد — skip")
                continue
            for dim_code, weight in dim_weights.items():
                dim = ReadinessDimension.objects.filter(code=dim_code).first()
                if dim:
                    DimensionWeight.objects.update_or_create(
                        dimension=dim,
                        business_type=bt,
                        defaults={"weight": weight},
                    )
                    count += 1
        print(f"✅ {count} وزن بعد")

    # ۶. وزن بخش‌ها
    parts_data = _load("part_weights.json")
    for part_code, weight in parts_data["weights"].items():
        PartWeight.objects.update_or_create(
            part=part_code,
            defaults={"weight": weight},
        )
    print(f"✅ {PartWeight.objects.count()} بخش")

    # ۷. آستانه‌ها
    thresh_data = _load("readiness_thresholds.json")
    if BusinessType.objects.count() > 0:
        count = 0
        for bt_code, th_data in thresh_data["thresholds"].items():
            bt = BusinessType.objects.filter(type=bt_code).first()
            if not bt:
                continue
            ReadinessThreshold.objects.update_or_create(
                business_type=bt,
                defaults={
                    "go_min_score": th_data["go_min_score"],
                    "go_min_confidence": th_data["go_min_confidence"],
                    "no_go_max_score": th_data["no_go_max_score"],
                },
            )
            count += 1
        print(f"✅ {count} آستانه")

    # ۸. قواعد توصیه
    rules_data = _load("recommendation_rules.json")
    for r_data in rules_data["rules"]:
        RecommendationRule.objects.update_or_create(
            order=r_data["order"],
            defaults={
                "condition_type": r_data["condition_type"],
                "recommendation": r_data["recommendation"],
                "sub_state_fa": r_data["sub_state_fa"],
                "message_template": r_data["message_template"],
                "destination": r_data.get("destination", ""),
            },
        )
    print(f"✅ {RecommendationRule.objects.count()} قاعده توصیه")

    # ۹. قواعد ارجاع
    routing_data = _load("routing_rules.json")
    count = 0
    for i, rr_data in enumerate(routing_data["rules"], 1):
        weak_dim = None
        if rr_data.get("weak_dimension"):
            weak_dim = ReadinessDimension.objects.filter(code=rr_data["weak_dimension"]).first()
        RoutingRule.objects.update_or_create(
            order=i,
            defaults={
                "weak_dimension": weak_dim,
                "weak_condition": rr_data.get("weak_condition", ""),
                "suggested_action_fa": rr_data["suggested_action_fa"],
                "destination": rr_data["destination"],
            },
        )
        count += 1
    print(f"✅ {count} قاعده ارجاع")

    # ۱۰. گویه‌های هسته (۳۶)
    core_data = _load("core_criteria.json")
    for c_data in core_data["criteria"]:
        dim = ReadinessDimension.objects.filter(code=c_data["dimension"]).first()
        if not dim:
            print(f"⚠️ بعد {c_data['dimension']} یافت نشد — {c_data['code']}")
            continue
        ReadinessCriterion.objects.update_or_create(
            code=c_data["code"],
            defaults={
                "section": "core",
                "dimension": dim,
                "text_fa": c_data["text_fa"],
                "text_internal_fa": c_data.get("text_internal_fa", ""),
                "suggested_evidence": c_data.get("suggested_evidence", ""),
                "is_required_evidence": c_data.get("is_required_evidence", False),
                "is_critical": c_data.get("is_critical", False),
                "order": c_data.get("order", 0),
            },
        )
    print(f"✅ {ReadinessCriterion.objects.filter(section='core').count()} گویه هسته")

    # ۱۱. گویه‌های خانواده (۱۸)
    family_data = _load("family_criteria.json")
    for f_data in family_data["criteria"]:
        fam = AssetFamily.objects.filter(code=f_data["family"]).first()
        if not fam:
            print(f"⚠️ خانواده {f_data['family']} یافت نشد — {f_data['code']}")
            continue
        ReadinessCriterion.objects.update_or_create(
            code=f_data["code"],
            defaults={
                "section": "family",
                "family": fam,
                "text_fa": f_data["text_fa"],
                "suggested_evidence": f_data.get("suggested_evidence", ""),
                "is_required_evidence": f_data.get("is_required_evidence", False),
                "order": f_data.get("order", 0),
            },
        )
    print(f"✅ {ReadinessCriterion.objects.filter(section='family').count()} گویه خانواده")

    # ۱۲. گویه‌های کسب‌وکار (۱۶)
    biz_data = _load("business_criteria.json")
    for b_data in biz_data["criteria"]:
        bt = BusinessType.objects.filter(type=b_data["business_type"]).first()
        if not bt:
            print(f"⚠️ نوع کسب‌وکار {b_data['business_type']} یافت نشد — {b_data['code']}")
            continue
        ReadinessCriterion.objects.update_or_create(
            code=b_data["code"],
            defaults={
                "section": "business",
                "business_type": bt,
                "text_fa": b_data["text_fa"],
                "suggested_evidence": b_data.get("suggested_evidence", ""),
                "is_required_evidence": b_data.get("is_required_evidence", False),
                "order": b_data.get("order", 0),
            },
        )
    print(f"✅ {ReadinessCriterion.objects.filter(section='business').count()} گویه کسب‌وکار")

    # ۱۳. نگاشت خانواده‌ها بر اساس asset_type code
    seed_family_mapping()

    print("=" * 60)
    print("✅ Seed کامل شد")
    print(f"📊 مجموع گویه‌ها: {ReadinessCriterion.objects.count()}")
    print("=" * 60)


def seed_family_mapping():
    """نگاشت AssetType code → AssetFamily"""
    from intangible_assets.models import AssetType
    from intangible_assets.engine_06.readiness_models import AssetFamilyMap

    # نگاشت پیشنهادی بر اساس PDF + ساختار موجود
    MAPPING = {
        # 1F — دانش فنی و اسرار تجاری
        "TS": "1F",     # Trade Secrets
        "PRC": "1F",    # فرمول قیمت‌گذاری
        "SOP": "5F",    # SOP → 5F (تداخل با 1F)
        "DYN": "5F",
        "SIM": "2F",
        "RND": "1F",
        "BMC": "5F",
        "ADS": "2F",

        # 2F — داده، مدل، نرم‌افزار
        "SRC": "2F",
        "SIM2": "2F",
        "DMS": "2F",
        "ERP": "2F",
        "CRM": "2F",
        "BI": "2F",
        "KMS": "2F",
        "CMS": "2F",
        "AIML": "2F",
        "DIG": "2F",
        "DASH": "2F",

        # 3F — حقوق ثبت‌شده و مجوزها
        "PAT": "3F",
        "LIC": "3F",
        "CON": "3F",
        "CSR": "3F",
        "SOC": "3F",
        "ENV": "3F",

        # 4F — برند، شبکه و روابط بازار
        "BRD": "4F",
        "PORT": "4F",
        "NET": "4F",
        "NETW": "4F",
        "TRUST": "4F",
        "GOV": "4F",
        "COU": "4F",
        "STB": "4F",
        "REP": "4F",

        # 5F — دانش عملیاتی مدون
        "SDM": "5F",
        "STD": "5F",
        "CHK": "5F",
        "LL": "5F",
        "LMS": "5F",
        "WIKI": "5F",
        "DOC": "5F",
        "VID": "5F",
        "TEA": "5F",

        # 6F — سرمایه انسانی
        "SKILL": "6F",
        "EXP_TECH": "6F",
        "TACIT": "6F",
        "KPI": "6F",
        "SCN": "6F",
    }

    count = 0
    not_found = []
    for code, family_code in MAPPING.items():
        at = AssetType.objects.filter(code=code).first()
        if not at:
            not_found.append(code)
            continue
        fam = AssetFamily.objects.filter(code=family_code).first()
        if not fam:
            continue
        AssetFamilyMap.objects.update_or_create(
            asset_type=at,
            defaults={"primary_family": fam},
        )
        count += 1

    print(f"✅ {count} نگاشت خانواده")
    if not_found:
        print(f"⚠️ {len(not_found)} asset_type پیدا نشد: {not_found[:10]}")


if __name__ == "__main__":
    seed()
