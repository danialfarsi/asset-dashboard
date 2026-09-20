
'use client';

import React, { useMemo } from 'react';
import {
  Grid3X3,
  GitBranch,
  Coins,
  TrendingDown,
  TrendingUp,
  Activity,
  Info,
  Target,
} from 'lucide-react';

/* =========================================================
   Helpers
========================================================= */

const toPersianNumber = (
  value: number | string,
  maximumFractionDigits = 0
) => {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';

  let str: string;

  if (typeof value === 'number') {
    str = value.toLocaleString('en-US', {
      maximumFractionDigits,
      minimumFractionDigits:
        maximumFractionDigits > 0 ? maximumFractionDigits : 0,
    });
  } else {
    str = String(value);
  }

  return str
    .replace(/\d/g, (d) => persianDigits[Number(d)])
    .replace('.', '٫');
};

const formatValue = (val: number) => {
  if (!val || val === 0) return '۰';

  const isNegative = val < 0;
  const absVal = Math.abs(val);

  let formatted: string;

  if (absVal >= 1e12) {
    formatted = `${(absVal / 1e12).toFixed(1)}T`;
  } else if (absVal >= 1e9) {
    formatted = `${(absVal / 1e9).toFixed(1)}B`;
  } else if (absVal >= 1e6) {
    formatted = `${(absVal / 1e6).toFixed(1)}M`;
  } else if (absVal >= 1e3) {
    formatted = `${(absVal / 1e3).toFixed(1)}K`;
  } else {
    formatted = absVal.toFixed(0);
  }

  const result = isNegative ? `-${formatted}` : formatted;

  return result
    .replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])
    .replace('.', '٫');
};

const displayPercent = (value: number) => {
  if (value === undefined || value === null) return '۰٪';

  const num = Math.abs(value) <= 1 ? value * 100 : value;

  return `${toPersianNumber(num, 1)}٪`;
};

/* =========================================================
   Types
========================================================= */

interface MatrixTableProps {
  drivers: any[];
  baseValue: number;
  methodId: string;
}

interface MatrixDriverPair {
  d1: any;
  d2: any;
}

/* =========================================================
   Component
========================================================= */

export function MatrixTable({
  drivers,
  baseValue,
  methodId,
}: MatrixTableProps) {
  /* ---------------------------------------------------------
     Generate axis range
  --------------------------------------------------------- */

  const generateRange = (
    low: number,
    high: number,
    steps = 4
  ) => {
    const values: number[] = [];

    const step = (high - low) / steps;

    for (let i = 0; i <= steps; i++) {
      values.push(
        Number((low + i * step).toFixed(4))
      );
    }

    return values;
  };

  /* ---------------------------------------------------------
     Driver mapping
  --------------------------------------------------------- */

  const getMatrixDrivers = (
    driverList: any[],
    method: string
  ): MatrixDriverPair | null => {
    if (!driverList || driverList.length < 2) {
      return null;
    }

    const methodMatrixMap: Record<
      string,
      { x: string; y: string }
    > = {
      'M-01': {
        x: 'royalty_rate',
        y: 'discount_rate',
      },

      'M-02': {
        x: 'ebit_attributable',
        y: 'attrition_rate',
      },

      'M-03': {
        x: 'discount_rate',
        y: 'terminal_growth',
      },

      'M-04': {
        x: 'discount_rate',
        y: 'with_asset_growth',
      },

      'M-05': {
        x: 'functional_obs',
        y: 'economic_obs',
      },

      'M-06': {
        x: 'obsolescence',
        y: 'age_factor',
      },

      'M-07': {
        x: 'productivity_loss',
        y: 'recruit_cost',
      },

      'M-08': {
        x: 'transaction_multiple',
        y: 'control_premium',
      },

      'M-09': {
        x: 'market_multiple',
        y: 'intangible_share',
      },
    };

    const mapping = methodMatrixMap[method];

    if (!mapping) {
      return {
        d1: driverList[0],
        d2: driverList[1],
      };
    }

    const d1 = driverList.find(
      (driver) => driver.id === mapping.x
    );

    const d2 = driverList.find(
      (driver) => driver.id === mapping.y
    );

    if (!d1 || !d2) {
      return {
        d1: driverList[0],
        d2: driverList[1],
      };
    }

    return {
      d1,
      d2,
    };
  };

  /* =========================================================
     Matrix
  ========================================================= */

  const matrix = useMemo(() => {
    if (
      !drivers ||
      drivers.length < 2 ||
      !baseValue ||
      baseValue === 0
    ) {
      return null;
    }

    const selected = getMatrixDrivers(
      drivers,
      methodId
    );

    if (!selected) return null;

    const { d1, d2 } = selected;

    const xValues = generateRange(
      d1.low,
      d1.high,
      4
    );

    const yValues = generateRange(
      d2.low,
      d2.high,
      4
    );

    const data = yValues.map((y) =>
      xValues.map((x) => {
        const factor =
          1 +
          ((x - d1.base) / d1.base) * 0.5 +
          ((y - d2.base) / d2.base) * 0.3;

        return Math.round(
          baseValue * factor
        );
      })
    );

    return {
      xValues,
      yValues,
      data,

      /* labels */
      xLabel: d1.name_fa,
      yLabel: d2.name_fa,

      /* IDs - برای Base Cell */
      xDriverId: d1.id,
      yDriverId: d2.id,

      /* actual base */
      xBase: d1.base,
      yBase: d2.base,
    };
  }, [drivers, baseValue, methodId]);

  /* =========================================================
     Stats
  ========================================================= */

  const stats = useMemo(() => {
    if (!matrix) return null;

    const allValues = matrix.data.flat();

    const min = Math.min(...allValues);
    const max = Math.max(...allValues);

    return {
      min,
      max,
      range: max - min || 1,
    };
  }, [matrix]);

  /* =========================================================
     Base cell
  ========================================================= */

  const baseCell = useMemo(() => {
    if (!matrix) return null;

    /*
     * Range ممکن است دقیقاً Base را شامل نکند.
     * بنابراین نزدیک‌ترین مقدار را پیدا می‌کنیم.
     */

    const findClosestIndex = (
      values: number[],
      target: number
    ) => {
      let closestIndex = 0;
      let closestDistance = Infinity;

      values.forEach((value, index) => {
        const distance = Math.abs(
          value - target
        );

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      return closestIndex;
    };

    return {
      xIndex: findClosestIndex(
        matrix.xValues,
        matrix.xBase
      ),

      yIndex: findClosestIndex(
        matrix.yValues,
        matrix.yBase
      ),
    };
  }, [matrix]);

  /* =========================================================
     Heatmap color
  ========================================================= */

  const getHeatColor = (
    value: number,
    isBase: boolean
  ) => {
    if (!stats) {
      return {
        background: '#ffffff',
        color: '#0f172a',
      };
    }

    if (isBase) {
      return {
        background:
          'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        color: '#1d4ed8',
      };
    }

    const normalized =
      (value - stats.min) /
      stats.range;

    /*
     * 0.00 → Rose
     * 0.25 → Orange
     * 0.50 → Yellow
     * 0.75 → Green
     * 1.00 → Emerald
     */

    if (normalized <= 0.25) {
      const t = normalized / 0.25;

      return {
        background: `linear-gradient(
          135deg,
          rgba(251,113,133,${0.82 - t * 0.08}) 0%,
          rgba(251,146,60,${0.72 + t * 0.08}) 100%
        )`,
        color: '#881337',
      };
    }

    if (normalized <= 0.5) {
      const t =
        (normalized - 0.25) / 0.25;

      return {
        background: `linear-gradient(
          135deg,
          rgba(251,146,60,${0.75 - t * 0.05}) 0%,
          rgba(253,224,71,${0.76 + t * 0.08}) 100%
        )`,
        color: '#713f12',
      };
    }

    if (normalized <= 0.75) {
      const t =
        (normalized - 0.5) / 0.25;

      return {
        background: `linear-gradient(
          135deg,
          rgba(253,224,71,${0.72 - t * 0.12}) 0%,
          rgba(74,222,128,${0.66 + t * 0.14}) 100%
        )`,
        color: '#14532d',
      };
    }

    const t =
      (normalized - 0.75) / 0.25;

    return {
      background: `linear-gradient(
        135deg,
        rgba(74,222,128,${0.72 + t * 0.08}) 0%,
        rgba(5,150,105,${0.76 + t * 0.18}) 100%
      )`,

      color:
        normalized > 0.92
          ? '#ffffff'
          : '#064e3b',
    };
  };

  /* =========================================================
     Empty state
  ========================================================= */

  if (!matrix || !stats) {
    return (
      <div
        dir="rtl"
        className="
          overflow-hidden
          rounded-[28px]
          border
          border-slate-200
          bg-white
          p-6
          shadow-sm
        "
        style={{
          fontFamily:
            'var(--font-vazir)',
        }}
      >
        <div
          className="
            flex
            min-h-[260px]
            flex-col
            items-center
            justify-center
            rounded-2xl
            border
            border-dashed
            border-slate-200
            bg-slate-50/60
            text-center
          "
        >
          <div
            className="
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-2xl
              bg-emerald-50
              text-emerald-600
            "
          >
            <Grid3X3 className="h-6 w-6" />
          </div>

          <p
            className="
              mt-4
              font-extrabold
              text-slate-700
            "
          >
            ماتریس حساسیت
          </p>

          <p
            className="
              mt-2
              text-sm
              text-slate-400
            "
          >
            {drivers.length < 2
              ? 'برای نمایش ماتریس به حداقل ۲ متغیر نیاز است'
              : 'داده‌ای برای نمایش وجود ندارد'}
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     Render
  ========================================================= */

  return (
    <div
      dir="rtl"
      className="
        relative
        overflow-hidden
        rounded-[30px]
        border
        border-slate-200/80
        bg-white
        shadow-sm
      "
      style={{
        fontFamily:
          'var(--font-vazir)',
      }}
    >
      {/* Background decorations */}

      <div
        className="
          pointer-events-none
          absolute
          -right-28
          -top-28
          h-72
          w-72
          rounded-full
          bg-emerald-100/40
          blur-3xl
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          -left-28
          top-24
          h-72
          w-72
          rounded-full
          bg-blue-100/30
          blur-3xl
        "
      />

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div
        className="
          relative
          flex
          flex-col
          gap-5
          border-b
          border-slate-100
          px-5
          py-6
          sm:px-7
          lg:flex-row
          lg:items-center
          lg:justify-between
        "
      >
        {/* Title */}

        <div
          className="
            flex
            items-center
            gap-4
          "
        >
          <div
            className="
              flex
              h-12
              w-12
              shrink-0
              items-center
              justify-center
              rounded-2xl
              bg-emerald-100
              text-emerald-700
            "
          >
            <Grid3X3 className="h-6 w-6" />
          </div>

          <div>
            <h3
              className="
                text-xl
                font-black
                tracking-tight
                text-slate-900
                sm:text-2xl
              "
            >
              ماتریس حساسیت
            </h3>

            <p
              className="
                mt-1
                text-sm
                leading-6
                text-slate-500
              "
            >
              تأثیر همزمان دو متغیر کلیدی
              بر ارزش‌گذاری
            </p>
          </div>
        </div>

        {/* Header stats */}

        <div
          className="
            flex
            flex-wrap
            gap-3
          "
        >
          {/* Method */}

          <div
            className="
              flex
              min-w-[155px]
              items-center
              justify-between
              gap-4
              rounded-2xl
              border
              border-emerald-100
              bg-emerald-50/80
              px-4
              py-3
            "
          >
            <div>
              <p
                className="
                  text-[11px]
                  font-semibold
                  text-slate-500
                "
              >
                روش ارزش‌گذاری
              </p>

              <p
                dir="ltr"
                className="
                  mt-1
                  text-lg
                  font-black
                  text-emerald-700
                "
              >
                {methodId}
              </p>
            </div>

            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-emerald-100
                text-emerald-700
              "
            >
              <GitBranch className="h-5 w-5" />
            </div>
          </div>

          {/* Base */}

          <div
            className="
              flex
              min-w-[155px]
              items-center
              justify-between
              gap-4
              rounded-2xl
              border
              border-blue-100
              bg-blue-50/80
              px-4
              py-3
            "
          >
            <div>
              <p
                className="
                  text-[11px]
                  font-semibold
                  text-slate-500
                "
              >
                ارزش مبنا
              </p>

              <p
                className="
                  mt-1
                  text-lg
                  font-black
                  text-blue-700
                "
              >
                {formatValue(baseValue)}
              </p>
            </div>

            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-blue-100
                text-blue-700
              "
            >
              <Coins className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          MATRIX SECTION
      ====================================================== */}

      <div
        className="
          relative
          px-4
          py-6
          sm:px-6
        "
      >
        <div
          className="
            overflow-hidden
            rounded-[24px]
            border
            border-slate-200
            bg-slate-50/60
            p-3
            shadow-inner
            sm:p-4
          "
        >
          <div className="overflow-x-auto">
            <div className="min-w-[760px]">

              {/* X axis header */}

              <div
                className="
                  mb-2
                  grid
                  grid-cols-[140px_1fr]
                  gap-2
                "
              >
                <div />

                <div
                  className="
                    flex
                    h-14
                    items-center
                    justify-center
                    gap-3
                    rounded-2xl
                    border
                    border-blue-100
                    bg-gradient-to-l
                    from-blue-50
                    via-white
                    to-blue-50/40
                    px-4
                  "
                >
                  <div
                    className="
                      flex
                      h-8
                      w-8
                      items-center
                      justify-center
                      rounded-xl
                      bg-blue-100
                      text-blue-600
                    "
                  >
                    <TrendingUp className="h-4 w-4" />
                  </div>

                  <span
                    className="
                      text-sm
                      font-black
                      text-slate-800
                    "
                  >
                    {matrix.xLabel}
                  </span>

                  <Info
                    className="
                      h-4
                      w-4
                      text-slate-400
                    "
                  />
                </div>
              </div>

              {/* Matrix body */}

              <div
                className="
                  grid
                  grid-cols-[140px_1fr]
                  gap-2
                "
              >
                {/* Y Axis */}

                <div
                  className="
                    flex
                    flex-col
                    items-center
                    justify-center
                    rounded-2xl
                    border
                    border-emerald-100
                    bg-gradient-to-b
                    from-emerald-50
                    to-white
                    px-3
                    text-center
                  "
                >
                  <div
                    className="
                      flex
                      h-11
                      w-11
                      items-center
                      justify-center
                      rounded-2xl
                      bg-emerald-100
                      text-emerald-700
                    "
                  >
                    <Activity className="h-5 w-5" />
                  </div>

                  <p
                    className="
                      mt-3
                      text-sm
                      font-black
                      leading-6
                      text-slate-800
                    "
                  >
                    {matrix.yLabel}
                  </p>

                  <p
                    className="
                      mt-1
                      text-[10px]
                      text-slate-400
                    "
                  >
                    متغیر عمودی
                  </p>

                  <Info
                    className="
                      mt-3
                      h-4
                      w-4
                      text-slate-400
                    "
                  />
                </div>

                {/* Table */}

                <div className="space-y-2">

                  {/* Column labels */}

                  <div
                    className="
                      grid
                      grid-cols-[82px_repeat(5,minmax(105px,1fr))]
                      gap-1.5
                    "
                  >
                    <div />

                    {matrix.xValues.map(
                      (x: number, index: number) => (
                        <div
                          key={index}
                          className="
                            flex
                            h-12
                            items-center
                            justify-center
                            rounded-xl
                            border
                            border-slate-200/70
                            bg-white
                            text-sm
                            font-extrabold
                            text-slate-700
                            shadow-sm
                          "
                        >
                          {displayPercent(x)}
                        </div>
                      )
                    )}
                  </div>

                  {/* Rows */}

                  {matrix.data.map(
                    (
                      row: number[],
                      rowIndex: number
                    ) => (
                      <div
                        key={rowIndex}
                        className="
                          grid
                          grid-cols-[82px_repeat(5,minmax(105px,1fr))]
                          gap-1.5
                        "
                      >
                        {/* Y value */}

                        <div
                          className="
                            flex
                            min-h-[72px]
                            items-center
                            justify-center
                            rounded-xl
                            border
                            border-slate-200/70
                            bg-white
                            text-sm
                            font-extrabold
                            text-slate-700
                            shadow-sm
                          "
                        >
                          {displayPercent(
                            matrix.yValues[
                              rowIndex
                            ]
                          )}
                        </div>

                        {/* Cells */}

                        {row.map(
                          (
                            value: number,
                            columnIndex: number
                          ) => {
                            const isBase =
                              baseCell?.yIndex ===
                                rowIndex &&
                              baseCell?.xIndex ===
                                columnIndex;

                            const heat =
                              getHeatColor(
                                value,
                                isBase
                              );

                            const difference =
                              baseValue
                                ? ((value -
                                    baseValue) /
                                    baseValue) *
                                  100
                                : 0;

                            return (
                              <div
                                key={columnIndex}
                                className={`
                                  group
                                  relative
                                  flex
                                  min-h-[72px]
                                  cursor-default
                                  flex-col
                                  items-center
                                  justify-center
                                  overflow-hidden
                                  rounded-xl
                                  border
                                  transition-all
                                  duration-300

                                  ${
                                    isBase
                                      ? `
                                        z-10
                                        border-blue-500
                                        shadow-[0_0_0_2px_rgba(59,130,246,.15),0_8px_24px_rgba(59,130,246,.14)]
                                      `
                                      : `
                                        border-white/70
                                        hover:z-20
                                        hover:-translate-y-1
                                        hover:scale-[1.025]
                                        hover:shadow-xl
                                      `
                                  }
                                `}
                                style={{
                                  background:
                                    heat.background,

                                  color:
                                    heat.color,
                                }}
                              >
                                {/* Shine */}

                                <div
                                  className="
                                    pointer-events-none
                                    absolute
                                    inset-x-0
                                    top-0
                                    h-1/2
                                    bg-gradient-to-b
                                    from-white/20
                                    to-transparent
                                  "
                                />

                                {isBase && (
                                  <div
                                    className="
                                      absolute
                                      right-2
                                      top-2
                                      flex
                                      h-5
                                      w-5
                                      items-center
                                      justify-center
                                      rounded-full
                                      bg-blue-600
                                      text-white
                                      shadow-sm
                                    "
                                  >
                                    <Target className="h-3 w-3" />
                                  </div>
                                )}

                                <span
                                  className="
                                    relative
                                    text-base
                                    font-black
                                    tracking-tight
                                  "
                                >
                                  {formatValue(
                                    value
                                  )}
                                </span>

                                {isBase ? (
                                  <span
                                    className="
                                      relative
                                      mt-1
                                      rounded-full
                                      bg-blue-600/10
                                      px-2
                                      py-0.5
                                      text-[10px]
                                      font-black
                                      text-blue-700
                                    "
                                  >
                                    مبنا
                                  </span>
                                ) : (
                                  <span
                                    className="
                                      relative
                                      mt-1
                                      text-[9px]
                                      font-bold
                                      opacity-0
                                      transition-opacity
                                      duration-200
                                      group-hover:opacity-70
                                    "
                                  >
                                    {difference >
                                    0
                                      ? '+'
                                      : ''}
                                    {toPersianNumber(
                                      difference,
                                      1
                                    )}
                                    ٪
                                  </span>
                                )}
                              </div>
                            );
                          }
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

      
        {/* =====================================================
            INFORMATION FOOTER
        ====================================================== */}

        <div
          className="
            mt-4
            flex
            items-start
            gap-3
            rounded-2xl
            border
            border-blue-100
            bg-blue-50/50
            px-4
            py-3.5
          "
        >
          <div
            className="
              flex
              h-8
              w-8
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-blue-100
              text-blue-600
            "
          >
            <Info className="h-4 w-4" />
          </div>

          <p
            className="
              pt-1
              text-xs
              leading-6
              text-slate-500
            "
          >
            هر خانه نشان‌دهنده ارزش‌گذاری
            تخمینی بر اساس ترکیب مقادیر دو
            متغیر است. رنگ‌ها شدت تغییر نسبت
            به ارزش مبنا را نمایش می‌دهند و
            خانه دارای نشان
            <span className="mx-1 font-black text-blue-700">
              مبنا
            </span>
            نزدیک‌ترین ترکیب به مفروضات پایه
            است.
          </p>
        </div>
      </div>
    </div>
  );
}
