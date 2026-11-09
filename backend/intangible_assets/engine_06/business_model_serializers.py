"""
Serializers گام ۲ — انتخاب مدل تجاری‌سازی
"""

from rest_framework import serializers
from intangible_assets.engine_06.models import BusinessModelSelection


class ModelComparisonRequestSerializer(serializers.Serializer):
    """درخواست مقایسه مدل‌ها"""
    case_id = serializers.IntegerField()
    asset_category = serializers.CharField(required=False, allow_blank=True)


class BusinessCaseScenarioSerializer(serializers.Serializer):
    """یک سناریو در Business Case"""
    cash_flows = serializers.ListField(
        child=serializers.DictField(),
        help_text='[{"year": 0, "amount": -1000000}, {"year": 1, "amount": 500000}, ...]'
    )
    discount_rate = serializers.FloatField(required=False, default=18)


class BusinessCaseInputSerializer(serializers.Serializer):
    """ورودی کامل Business Case — ۳ سناریو"""
    pessimistic = BusinessCaseScenarioSerializer()
    base = BusinessCaseScenarioSerializer()
    optimistic = BusinessCaseScenarioSerializer()
    selected_model = serializers.ChoiceField(choices=[
        ("exclusive_license", "لایسنس انحصاری"),
        ("non_exclusive_license", "لایسنس غیرانحصاری"),
        ("full_sale", "فروش کامل"),
        ("joint_venture", "سرمایه‌گذاری مشترک"),
        ("spin_off", "اسپین‌آف"),
        ("franchise", "فرنچایز"),
        ("knowledge_services", "خدمات دانشی"),
    ])
    justification = serializers.CharField(required=False, allow_blank=True)
    system_rank_1_model = serializers.CharField(required=False, allow_blank=True)


class ModelRankingSerializer(serializers.Serializer):
    """نتایج رتبه‌بندی مدل"""
    model = serializers.CharField()
    model_display = serializers.CharField()
    rank = serializers.IntegerField()
    score = serializers.FloatField()
    attributes = serializers.DictField()


class ComparisonResultSerializer(serializers.Serializer):
    """نتیجه مقایسه"""
    applicable_models = ModelRankingSerializer(many=True)
    system_rank_1 = serializers.CharField()
    recommended_reason = serializers.CharField()


class BusinessCaseResultSerializer(serializers.Serializer):
    """نتیجه محاسبه Business Case"""
    npv_base = serializers.FloatField()
    irr_base = serializers.FloatField()
    payback_months = serializers.IntegerField()
    scenarios = serializers.DictField()
