"""
بارگذاری Config های موتور ۶
"""

import json
import os
from functools import lru_cache

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")


class ConfigLoader:
    """بارگذار Config با cache"""

    @staticmethod
    @lru_cache(maxsize=32)
    def load(filename):
        """بارگذاری یک فایل JSON با cache"""
        path = os.path.join(FIXTURES_DIR, filename)
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    @classmethod
    def readiness_criteria(cls):
        return cls.load("readiness_criteria.json")

    @classmethod
    def business_model_applicability(cls):
        return cls.load("business_model_applicability.json")

    @classmethod
    def partner_evaluation_criteria(cls):
        return cls.load("partner_evaluation_criteria.json")

    @classmethod
    def contract_template_mapping(cls):
        return cls.load("contract_template_mapping.json")

    @classmethod
    def royalty_range_guidelines(cls):
        return cls.load("royalty_range_guidelines.json")

    @classmethod
    def approval_matrix(cls):
        return cls.load("approval_matrix.json")

    @classmethod
    def revenue_dispute_thresholds(cls):
        return cls.load("revenue_dispute_thresholds.json")

    @classmethod
    def health_indicator_thresholds(cls):
        return cls.load("health_indicator_thresholds.json")


    @classmethod
    def model_ranking_weights(cls):
        return cls.load("model_ranking_weights.json")

    @classmethod
    def asset_category_mapping(cls):
        return cls.load("asset_category_mapping.json")

    @classmethod
    def business_case_defaults(cls):
        return cls.load("business_case_defaults.json")

    @classmethod
    def reload_all(cls):
        """پاک کردن cache — برای زمانی که Config تغییر کرد"""
        cls.load.cache_clear()
