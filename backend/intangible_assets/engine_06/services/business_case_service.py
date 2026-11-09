"""
سرویس محاسبه Business Case — NPV / IRR / Payback
"""


class BusinessCaseService:
    """محاسبات مالی Business Case"""

    @staticmethod
    def compute_npv(cash_flows, discount_rate):
        """
        NPV = Σ [CF_t / (1+r)^t]
        cash_flows: [{year: 1, amount: 1000000}, ...]
        discount_rate: درصد (مثلاً 18)
        """
        r = discount_rate / 100
        npv = 0
        for cf in cash_flows:
            year = cf.get("year", 0)
            amount = float(cf.get("amount", 0))
            if year > 0:
                npv += amount / ((1 + r) ** year)
            else:
                npv += amount  # سال صفر (سرمایه‌گذاری اولیه)
        return round(npv, 2)

    @staticmethod
    def compute_irr(cash_flows, max_iterations=100, tolerance=0.0001):
        """
        IRR — با Newton-Raphson
        """
        amounts = []
        for cf in cash_flows:
            year = cf.get("year", 0)
            amount = float(cf.get("amount", 0))
            if year == 0:
                amounts.append((0, amount))
            else:
                amounts.append((year, amount))

        if not amounts:
            return 0

        # تخمین اولیه
        rate = 0.1

        for _ in range(max_iterations):
            npv = 0
            npv_derivative = 0

            for year, amount in amounts:
                if year == 0:
                    npv += amount
                else:
                    npv += amount / ((1 + rate) ** year)
                    npv_derivative -= year * amount / ((1 + rate) ** (year + 1))

            if abs(npv_derivative) < 1e-10:
                break

            new_rate = rate - npv / npv_derivative

            if abs(new_rate - rate) < tolerance:
                return round(new_rate * 100, 2)

            rate = new_rate

            # محدود کردن به بازه منطقی
            if rate < -0.99:
                rate = -0.99
            elif rate > 10:
                rate = 10

        return round(rate * 100, 2)

    @staticmethod
    def compute_payback(cash_flows, initial_investment=0):
        """
        دوره بازگشت — به ماه
        """
        # مرتب‌سازی بر اساس سال
        sorted_cf = sorted(cash_flows, key=lambda x: x.get("year", 0))

        cumulative = 0
        for i, cf in enumerate(sorted_cf):
            year = cf.get("year", 0)
            amount = float(cf.get("amount", 0))

            if year == 0:
                # سال صفر = سرمایه‌گذاری اولیه (منفی)
                cumulative += amount
                continue

            prev_cumulative = cumulative
            cumulative += amount

            if cumulative >= 0 and prev_cumulative < 0:
                # نقطه سربه‌سر بین سال قبل و این سال
                # نسبت = چقدر از این سال لازمه
                if amount != 0:
                    fraction = -prev_cumulative / amount
                    months = int((year - 1) * 12 + fraction * 12)
                    return max(0, months)

        return 999  # بازنگشته

    @staticmethod
    def compute_scenario(scenario_data, discount_rate=18):
        """
        محاسبه یک سناریو کامل
        scenario_data: {cash_flows: [{year, amount}], ...}
        """
        cash_flows = scenario_data.get("cash_flows", [])
        if not cash_flows:
            return {"npv": 0, "irr": 0, "payback_months": 999}

        npv = BusinessCaseService.compute_npv(cash_flows, discount_rate)
        irr = BusinessCaseService.compute_irr(cash_flows)
        payback = BusinessCaseService.compute_payback(cash_flows)

        return {
            "npv": npv,
            "irr": irr,
            "payback_months": payback,
        }

    @staticmethod
    def compute_full(business_case_data, discount_rate=18):
        """
        محاسبه کامل همه سناریوها
        business_case_data: {
            pessimistic: {cash_flows: [...]},
            base: {cash_flows: [...]},
            optimistic: {cash_flows: [...]}
        }
        """
        result = {}
        for scenario in ["pessimistic", "base", "optimistic"]:
            scenario_data = business_case_data.get(scenario, {})
            result[scenario] = BusinessCaseService.compute_scenario(
                scenario_data, discount_rate
            )
        return result

    @staticmethod
    def rank_models(applicable_models, model_attributes, case_category=None):
        """
        رتبه‌بندی مدل‌ها — همه چیز از Config
        """
        from intangible_assets.engine_06.config import ConfigLoader

        if not applicable_models:
            return []

        config = ConfigLoader.model_ranking_weights()
        weights = config.get("weights", {})
        scores = config.get("scores", {})
        horizon_cfg = config.get("horizon", {})

        REVENUE_SCORE = scores.get("revenue_potential", {})
        RISK_SCORE = scores.get("risk", {})
        COMPLEXITY_SCORE = scores.get("complexity", {})

        max_horizon = horizon_cfg.get("max_months", 60)
        min_horizon = horizon_cfg.get("min_months", 6)

        w_revenue = weights.get("revenue", 0.4)
        w_risk = weights.get("risk", 0.2)
        w_complexity = weights.get("complexity", 0.2)
        w_horizon = weights.get("horizon", 0.2)

        ranked = []
        for model_code in applicable_models:
            attrs = model_attributes.get(model_code, {})
            if not attrs:
                continue

            rev = REVENUE_SCORE.get(attrs.get("revenue_potential", "medium"), 50)
            risk = RISK_SCORE.get(attrs.get("risk", "medium"), 50)
            complexity = COMPLEXITY_SCORE.get(attrs.get("complexity", "medium"), 50)
            horizon = attrs.get("time_horizon_months", 24)

            # نرمال‌سازی افق زمانی (هرچه کوتاه‌تر بهتر)
            if max_horizon > min_horizon:
                horizon_score = max(0, min(100, 100 - ((horizon - min_horizon) / (max_horizon - min_horizon)) * 100))
            else:
                horizon_score = 50

            total = (
                rev * w_revenue
                + risk * w_risk
                + complexity * w_complexity
                + horizon_score * w_horizon
            )

            ranked.append({
                "model": model_code,
                "score": round(total, 2),
                "attributes": attrs,
            })

        ranked.sort(key=lambda x: x["score"], reverse=True)
        for i, item in enumerate(ranked, 1):
            item["rank"] = i

        return ranked

    @staticmethod
    def recommend_models(asset_category, config):
        """
        پیشنهاد مدل‌ها بر اساس دسته دارایی
        asset_category: مثل 'software', 'brand', 'patent'
        """
        applicable = config.get("asset_category_to_models", {}).get(
            asset_category, config.get("asset_category_to_models", {}).get("default", [])
        )
        attributes = config.get("model_attributes", {})
        return BusinessCaseService.rank_models(applicable, attributes, asset_category)
