"""
فرمول‌های محاسبه ارزش برای روش‌های مختلف
همه روش‌ها به‌روزرسانی شده‌اند تا drivers رو درست دریافت کنن
"""


def calculate_m01(params):
    """
    M-01: Relief from Royalty (RfR)
    drivers: royalty_rate, revenue_growth_rate, discount_rate, terminal_growth_rate
    """
    royalty_rate = params.get('royalty_rate', 4) / 100
    revenue_attribution = params.get('revenue_attribution', 80) / 100
    revenue_growth_rate = params.get('revenue_growth_rate', 8) / 100
    quality_multiplier = params.get('quality_multiplier', 0.92)
    tax_rate = params.get('tax_rate', 25) / 100
    discount_rate = params.get('discount_rate', 18) / 100
    terminal_growth_rate = params.get('terminal_growth_rate', 5) / 100
    forecast_horizon = params.get('forecast_horizon', 5)
    current_revenue = params.get('current_revenue', 500000000000)
    
    effective_rate = royalty_rate * revenue_attribution
    revenue = current_revenue
    total_pv = 0
    
    for year in range(1, forecast_horizon + 1):
        revenue = revenue * (1 + revenue_growth_rate)
        gross_royalty = revenue * effective_rate
        after_tax = gross_royalty * (1 - tax_rate)
        pv = after_tax / ((1 + discount_rate) ** year)
        total_pv += pv
    
    last_after_tax = revenue * effective_rate * (1 - tax_rate)
    if discount_rate > terminal_growth_rate:
        terminal_value = (last_after_tax * (1 + terminal_growth_rate)) / (discount_rate - terminal_growth_rate)
    else:
        terminal_value = 0
    pv_terminal = terminal_value / ((1 + discount_rate) ** forecast_horizon)
    value_before_quality = total_pv + pv_terminal
    final_value = value_before_quality * quality_multiplier
    
    return final_value


def calculate_m02(params):
    """
    M-02: Multi-Period Excess Earnings (MEEM)
    drivers: ebit_attributable, attrition_rate, discount_rate, terminal_growth_rate
    """
    ebit_attributable = params.get('ebit_attributable', 20000000000)
    contributory_assets = params.get('contributory_assets', [])
    attrition_rate = params.get('customer_attrition_rate', 10) / 100
    forecast_horizon = params.get('forecast_horizon', 5)
    tax_rate = params.get('tax_rate', 25) / 100
    discount_rate = params.get('discount_rate', 18) / 100
    terminal_growth_rate = params.get('terminal_growth_rate', 5) / 100
    quality_multiplier = params.get('quality_multiplier', 0.89)
    
    total_cac_charge = 0
    for asset in contributory_assets:
        asset_value = asset.get('asset_value', 0)
        return_rate = asset.get('return_rate', 0) / 100
        total_cac_charge += asset_value * return_rate
    
    excess_earnings_before_tax = ebit_attributable - total_cac_charge
    total_pv = 0
    
    for year in range(1, forecast_horizon + 1):
        survival_rate = (1 - attrition_rate) ** (year - 1)
        excess_after_tax = excess_earnings_before_tax * survival_rate * (1 - tax_rate)
        pv = excess_after_tax / ((1 + discount_rate) ** year)
        total_pv += pv
    
    last_after_tax = excess_earnings_before_tax * (1 - attrition_rate) ** (forecast_horizon - 1) * (1 - tax_rate)
    if discount_rate > terminal_growth_rate:
        terminal_value = (last_after_tax * (1 + terminal_growth_rate)) / (discount_rate - terminal_growth_rate)
    else:
        terminal_value = 0
    pv_terminal = terminal_value / ((1 + discount_rate) ** forecast_horizon)
    value_before_quality = total_pv + pv_terminal
    final_value = value_before_quality * quality_multiplier
    
    return final_value


def calculate_m03(params):
    """
    M-03: Discounted Cash Flow (DCF)
    drivers: discount_rate, terminal_growth_rate, intangible_share
    """
    fcf_data = params.get('fcf_data', [])
    intangible_share = params.get('intangible_share', 70) / 100
    forecast_horizon = params.get('forecast_horizon', 5)
    discount_rate = params.get('discount_rate', 18) / 100
    terminal_growth_rate = params.get('terminal_growth_rate', 5) / 100
    quality_multiplier = params.get('quality_multiplier', 0.85)
    
    if not fcf_data:
        fcf_data = [
            {'year': 1, 'fcf': 80000000},
            {'year': 2, 'fcf': 90000000},
            {'year': 3, 'fcf': 100000000},
            {'year': 4, 'fcf': 110000000},
            {'year': 5, 'fcf': 120000000},
        ]
    
    total_pv = 0
    for item in fcf_data:
        year = item.get('year', 1)
        fcf = item.get('fcf', 0)
        pv = fcf / ((1 + discount_rate) ** year)
        total_pv += pv
    
    last_fcf = fcf_data[-1].get('fcf', 0)
    if discount_rate > terminal_growth_rate:
        terminal_value = (last_fcf * (1 + terminal_growth_rate)) / (discount_rate - terminal_growth_rate)
    else:
        terminal_value = 0
    pv_terminal = terminal_value / ((1 + discount_rate) ** forecast_horizon)
    
    enterprise_value = total_pv + pv_terminal
    intangible_value = enterprise_value * intangible_share
    final_value = intangible_value * quality_multiplier
    
    return final_value


def calculate_m04(params):
    """
    M-04: With-and-Without Method (WWM)
    drivers: with_asset_growth, without_asset_growth, discount_rate
    """
    with_asset_growth = params.get('with_asset_growth', 0.08)
    without_asset_growth = params.get('without_asset_growth', 0.06)
    discount_rate = params.get('discount_rate', 0.18)
    tax_rate = params.get('tax_rate', 0.25)
    base_value = params.get('base_value', 50000000000000)
    
    fcf_with = base_value * (1 + with_asset_growth) * (1 - tax_rate)
    fcf_without = base_value * (1 + without_asset_growth) * (1 - tax_rate)
    delta = fcf_with - fcf_without
    pv = delta / (1 + discount_rate)
    
    return pv


def calculate_m05(params):
    """
    M-05: Replacement Cost Method (RCM)
    drivers: labor_cost, material_cost, overhead_pct, profit_pct, functional_obs, economic_obs
    """
    labor_breakdown = params.get('labor_breakdown', [])
    material_cost = params.get('material_infra_cost', 0)
    overhead_pct = params.get('overhead_pct', 20) / 100
    profit_pct = params.get('developer_profit_pct', 15) / 100
    functional_obs = params.get('functional_obs_pct', 0) / 100
    economic_obs = params.get('economic_obs_pct', 0) / 100
    
    if not labor_breakdown:
        labor_breakdown = [
            {'person_months': 12, 'monthly_rate': 50000000},
            {'person_months': 24, 'monthly_rate': 30000000},
            {'person_months': 6, 'monthly_rate': 20000000},
        ]
    
    labor_cost = 0
    for item in labor_breakdown:
        person_months = item.get('person_months', 0)
        monthly_rate = item.get('monthly_rate', 0)
        labor_cost += person_months * monthly_rate
    
    value = labor_cost
    value += material_cost
    value += value * overhead_pct
    value += value * profit_pct
    value -= value * functional_obs
    value -= value * economic_obs
    
    return max(value, 0)


def calculate_m06(params):
    """
    M-06: Reproduction Cost Method (RPCM)
    drivers: labor_cost, direct_cost, overhead, obsolescence, age_factor
    """
    labor_breakdown = params.get('labor_breakdown', [])
    direct_cost = params.get('direct_reproduction_cost', 0)
    overhead = params.get('coordination_overhead', 20) / 100
    obsolescence = params.get('relevance_obsolescence', 0) / 100
    age_factor = params.get('age_factor', 0)
    
    if not labor_breakdown:
        labor_breakdown = [
            {'person_days': 30, 'daily_rate': 2000000},
            {'person_days': 60, 'daily_rate': 1500000},
            {'person_days': 20, 'daily_rate': 1000000},
        ]
    
    labor_cost = 0
    for item in labor_breakdown:
        person_days = item.get('person_days', 0)
        daily_rate = item.get('daily_rate', 0)
        labor_cost += person_days * daily_rate
    
    value = labor_cost
    value += direct_cost
    value += value * overhead
    value -= value * obsolescence
    value -= value * age_factor
    
    return max(value, 0)


def calculate_m07(params):
    """
    M-07: Trained Workforce Cost (TWC)
    drivers: recruit_total, train_total, salary_total, productivity_loss, ramp_up_duration
    """
    team_members = params.get('team_members', [])
    ramp_up_duration = params.get('ramp_up_duration', 6)
    productivity_loss = params.get('productivity_loss', 30) / 100
    turnover_rate = params.get('turnover_rate', 8) / 100
    quality_multiplier = params.get('quality_multiplier', 0.87)
    
    if not team_members:
        team_members = [
            {'headcount': 1, 'recruit_cost': 50000000, 'train_cost': 20000000, 'salary': 80000000},
            {'headcount': 5, 'recruit_cost': 30000000, 'train_cost': 15000000, 'salary': 50000000},
            {'headcount': 2, 'recruit_cost': 20000000, 'train_cost': 10000000, 'salary': 35000000},
        ]
    
    recruit_total = 0
    train_total = 0
    salary_total = 0
    
    for member in team_members:
        headcount = member.get('headcount', 0)
        recruit_cost = member.get('recruit_cost', 0)
        train_cost = member.get('train_cost', 0)
        salary = member.get('salary', 0)
        
        recruit_total += headcount * recruit_cost
        train_total += headcount * train_cost
        salary_total += headcount * salary
    
    productivity_loss_cost = salary_total * (ramp_up_duration / 12) * productivity_loss
    turnover_cost = (recruit_total + train_total) * turnover_rate
    total_replacement_cost = recruit_total + train_total + productivity_loss_cost + turnover_cost
    final_value = total_replacement_cost * quality_multiplier
    
    return final_value


def calculate_m08(params):
    """
    M-08: Comparable Transactions Method (CTM)
    drivers: transaction_multiple, comparable_value, control_premium, marketability_discount
    """
    transaction_multiple = params.get('transaction_multiple', 2.5)
    comparable_value = params.get('comparable_value', 50000000000)
    control_premium = params.get('control_premium', 10) / 100
    marketability_discount = params.get('marketability_discount', 20) / 100
    quality_multiplier = params.get('quality_multiplier', 0.86)
    
    base_value = comparable_value * transaction_multiple
    value_after_premium = base_value * (1 + control_premium)
    value_after_discount = value_after_premium * (1 - marketability_discount)
    final_value = value_after_discount * quality_multiplier
    
    return final_value


def calculate_m09(params):
    """
    M-09: Market Multiples Method (MMM)
    drivers: base_metric_value, market_multiple, control_premium, marketability_discount, intangible_share
    """
    base_metric_value = params.get('base_metric_value', 100000000000)
    market_multiple = params.get('market_multiple', 2.5)
    control_premium_percent = params.get('control_premium_percent', 10) / 100
    marketability_discount_percent = params.get('marketability_discount_percent', 20) / 100
    intangible_share_percent = params.get('intangible_share_percent', 40) / 100
    quality_multiplier = params.get('quality_multiplier', 0.86)
    
    enterprise_value = base_metric_value * market_multiple
    enterprise_value_after_premium = enterprise_value * (1 + control_premium_percent)
    enterprise_value_after_discount = enterprise_value_after_premium * (1 - marketability_discount_percent)
    intangible_value_before_quality = enterprise_value_after_discount * intangible_share_percent
    final_value = intangible_value_before_quality * quality_multiplier
    
    return final_value


def calculate_value(method_id, params):
    """تابع اصلی برای محاسبه ارزش بر اساس روش"""
    method_map = {
        'M-01': calculate_m01,
        'M-02': calculate_m02,
        'M-03': calculate_m03,
        'M-04': calculate_m04,
        'M-05': calculate_m05,
        'M-06': calculate_m06,
        'M-07': calculate_m07,
        'M-08': calculate_m08,
        'M-09': calculate_m09,
    }
    
    calculate_func = method_map.get(method_id)
    if not calculate_func:
        raise ValueError(f"روش {method_id} پشتیبانی نمی‌شود")
    
    return calculate_func(params)