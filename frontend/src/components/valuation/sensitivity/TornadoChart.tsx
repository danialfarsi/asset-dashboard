
'use client';

import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  Plugin,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import {
  Activity,
  BarChart3,
  TrendingUp,
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface TornadoChartProps {
  data: Array<{
    name: string;
    impact: number;
  }>;
}

/* -------------------------------------------------------
   تبدیل اعداد به فارسی
------------------------------------------------------- */

const toPersianNumber = (
  value: number | string,
  decimals?: number
) => {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';

  let result: string;

  if (
    typeof value === 'number' &&
    decimals !== undefined
  ) {
    result = value.toFixed(decimals);
  } else {
    result = String(value);
  }

  return result
    .replace(/\d/g, (digit) => persianDigits[Number(digit)])
    .replace('.', '٫');
};

/* -------------------------------------------------------
   Plugin
   نمایش درصد در انتهای هر Bar
------------------------------------------------------- */

const valueLabelPlugin: Plugin<'bar'> = {
  id: 'valueLabelPlugin',

  afterDatasetsDraw(chart) {
    const { ctx } = chart;

    const meta = chart.getDatasetMeta(0);
    const dataset = chart.data.datasets[0];

    if (!meta || !dataset) return;

    ctx.save();

    meta.data.forEach((bar: any, index: number) => {
      const rawValue = Number(
        dataset.data[index] ?? 0
      );

      const value = Math.abs(rawValue);

      const label =
        `${toPersianNumber(value, 1)}٪`;

      ctx.font =
        '700 11px Vazir, sans-serif';

      ctx.textBaseline = 'middle';

      /*
       * اگر Bar فضای کافی داشته باشد،
       * عدد داخل خودش نمایش داده می‌شود.
       */
      const barWidth =
        Math.abs(bar.x - bar.base);

      if (barWidth > 65) {
        ctx.fillStyle =
          'rgba(255,255,255,0.96)';

        ctx.textAlign = 'right';

        ctx.fillText(
          label,
          bar.x - 10,
          bar.y
        );
      } else {
        ctx.fillStyle = '#475569';

        ctx.textAlign = 'left';

        ctx.fillText(
          label,
          bar.x + 9,
          bar.y
        );
      }
    });

    ctx.restore();
  },
};

/* -------------------------------------------------------
   Component
------------------------------------------------------- */

export function TornadoChart({
  data,
}: TornadoChartProps) {
  /* -----------------------------------------------------
     مرتب‌سازی
  ----------------------------------------------------- */

  const sortedData = useMemo(() => {
    if (!data) return [];

    return [...data].sort(
      (a, b) =>
        Math.abs(b.impact) -
        Math.abs(a.impact)
    );
  }, [data]);

  const maxImpact = useMemo(() => {
    if (!sortedData.length) return 1;

    return Math.max(
      ...sortedData.map((item) =>
        Math.abs(item.impact)
      ),
      1
    );
  }, [sortedData]);

  /* -----------------------------------------------------
     شدت اثر
  ----------------------------------------------------- */

  const getRiskLevel = (impact: number) => {
    const ratio =
      Math.abs(impact) / maxImpact;

    if (ratio >= 0.7) {
      return {
        label: 'اثر بسیار بالا',
        text: '#be123c',
        light: '#fff1f2',
      };
    }

    if (ratio >= 0.4) {
      return {
        label: 'اثر متوسط',
        text: '#b45309',
        light: '#fffbeb',
      };
    }

    return {
      label: 'اثر پایین',
      text: '#047857',
      light: '#ecfdf5',
    };
  };

  /* -----------------------------------------------------
     Chart data
  ----------------------------------------------------- */

  const chartData = useMemo(
    () => ({
      labels: sortedData.map(
        (item) => item.name
      ),

      datasets: [
        {
          label: 'درصد تأثیر',

          /*
           * از قدر مطلق استفاده شده تا نمودار
           * رتبه شدت اثر را نمایش دهد.
           */
          data: sortedData.map((item) =>
            Math.abs(item.impact)
          ),

          /*
           * Gradient برای هر Bar
           */
          backgroundColor: (
            context: any
          ) => {
            const chart = context.chart;

            const {
              ctx,
              chartArea,
            } = chart;

            if (!chartArea) {
              return 'rgba(16,185,129,.85)';
            }

            const item =
              sortedData[context.dataIndex];

            if (!item) {
              return '#10b981';
            }

            const ratio =
              Math.abs(item.impact) /
              maxImpact;

            const gradient =
              ctx.createLinearGradient(
                chartArea.left,
                0,
                chartArea.right,
                0
              );

            /*
             * مهم‌ترین عوامل
             */
            if (ratio >= 0.7) {
              gradient.addColorStop(
                0,
                'rgba(251,113,133,.78)'
              );

              gradient.addColorStop(
                1,
                'rgba(225,29,72,.96)'
              );

              return gradient;
            }

            /*
             * عوامل متوسط
             */
            if (ratio >= 0.4) {
              gradient.addColorStop(
                0,
                'rgba(251,191,36,.70)'
              );

              gradient.addColorStop(
                1,
                'rgba(245,158,11,.95)'
              );

              return gradient;
            }

            /*
             * عوامل کم‌اثر
             */
            gradient.addColorStop(
              0,
              'rgba(52,211,153,.72)'
            );

            gradient.addColorStop(
              1,
              'rgba(5,150,105,.94)'
            );

            return gradient;
          },

          borderWidth: 0,

          borderRadius: {
            topLeft: 10,
            topRight: 10,
            bottomLeft: 10,
            bottomRight: 10,
          },

          borderSkipped: false,

          barPercentage: 0.62,

          categoryPercentage: 0.82,

          minBarLength: 5,

          hoverBackgroundColor: (
            context: any
          ) => {
            const item =
              sortedData[context.dataIndex];

            if (!item) return '#059669';

            const ratio =
              Math.abs(item.impact) /
              maxImpact;

            if (ratio >= 0.7)
              return '#e11d48';

            if (ratio >= 0.4)
              return '#f59e0b';

            return '#059669';
          },
        },
      ],
    }),
    [sortedData, maxImpact]
  );

  /* -----------------------------------------------------
     Chart options
  ----------------------------------------------------- */

  const options: ChartOptions<'bar'> =
    useMemo(
      () => ({
        indexAxis: 'y',

        responsive: true,

        maintainAspectRatio: false,

        layout: {
          padding: {
            top: 4,
            right: 52,
            bottom: 5,
            left: 5,
          },
        },

        interaction: {
          mode: 'nearest',
          intersect: false,
          axis: 'y',
        },

        plugins: {
          legend: {
            display: false,
          },

          tooltip: {
            enabled: true,

            displayColors: false,

            backgroundColor:
              'rgba(15, 23, 42, 0.96)',

            titleColor: '#ffffff',

            bodyColor: '#cbd5e1',

            borderColor:
              'rgba(255,255,255,.08)',

            borderWidth: 1,

            padding: 14,

            cornerRadius: 12,

            caretSize: 6,

            titleMarginBottom: 8,

            titleFont: {
              family: 'Vazir, sans-serif',
              size: 13,
              weight: 'bold',
            },

            bodyFont: {
              family: 'Vazir, sans-serif',
              size: 12,
              weight: 'normal',
            },

            callbacks: {
              title(context) {
                const index =
                  context[0]?.dataIndex;

                return (
                  sortedData[index]?.name ??
                  ''
                );
              },

              label(context) {
                const index =
                  context.dataIndex;

                const item =
                  sortedData[index];

                if (!item) return '';

                return `شدت تأثیر: ${toPersianNumber(
                  Math.abs(item.impact),
                  1
                )}٪`;
              },

              afterLabel(context) {
                const index =
                  context.dataIndex;

                const item =
                  sortedData[index];

                if (!item) return '';

                return getRiskLevel(
                  item.impact
                ).label;
              },
            },
          },
        },

        scales: {
          x: {
            beginAtZero: true,

            suggestedMax:
              maxImpact * 1.12,

            border: {
              display: false,
            },

            grid: {
              color:
                'rgba(148,163,184,.13)',

              lineWidth: 1,

              drawTicks: false,
            },

            ticks: {
              padding: 10,

              color: '#94a3b8',

              font: {
                family:
                  'Vazir, sans-serif',

                size: 10,

                weight: 'normal',
              },

              callback(value) {
                return (
                  toPersianNumber(
                    Number(value)
                  ) + '٪'
                );
              },
            },
          },

          y: {
            border: {
              display: false,
            },

            grid: {
              display: false,
            },

            ticks: {
              color: '#334155',

              padding: 14,

              font: {
                family:
                  'Vazir, sans-serif',

                size: 12,

                weight: 'bold',
              },

              /*
               * جلوگیری از labelهای
               * بیش از حد طولانی
               */
              callback(value) {
                const label =
                  this.getLabelForValue(
                    Number(value)
                  );

                if (label.length > 24) {
                  return (
                    label.substring(0, 24) +
                    '…'
                  );
                }

                return label;
              },
            },
          },
        },

        animation: {
          duration: 750,

          easing: 'easeOutQuart',
        },

        transitions: {
          active: {
            animation: {
              duration: 180,
            },
          },
        },
      }),
      [sortedData, maxImpact]
    );

  /* -----------------------------------------------------
     Empty State
  ----------------------------------------------------- */

  if (!data || data.length === 0) {
    return (
      <div
        dir="rtl"
        className="
          flex
          min-h-[320px]
          flex-col
          items-center
          justify-center
          rounded-2xl
          border
          border-dashed
          border-slate-200
          bg-slate-50/60
          px-6
          text-center
        "
        style={{
          fontFamily:
            'var(--font-vazir)',
        }}
      >
        <div
          className="
            flex
            h-14
            w-14
            items-center
            justify-center
            rounded-2xl
            bg-slate-100
            text-slate-400
          "
        >
          <BarChart3 className="h-6 w-6" />
        </div>

        <p
          className="
            mt-4
            text-sm
            font-bold
            text-slate-600
          "
        >
          داده‌ای برای نمایش وجود ندارد
        </p>

        <p
          className="
            mt-1
            text-xs
            text-slate-400
          "
        >
          پس از محاسبه تحلیل حساسیت،
          عوامل اثرگذار در این بخش نمایش
          داده می‌شوند.
        </p>
      </div>
    );
  }

  const highestImpact =
    sortedData[0];

  /* -----------------------------------------------------
     Render
  ----------------------------------------------------- */

  return (
    <div
      dir="rtl"
      className="
        relative
        overflow-hidden
        rounded-[24px]
        border
        border-slate-200/80
        bg-white
      "
      style={{
        fontFamily:
          'var(--font-vazir)',
      }}
    >
      {/* Decorative glow */}

      <div
        className="
          pointer-events-none
          absolute
          -right-20
          -top-24
          h-64
          w-64
          rounded-full
          bg-emerald-100/40
          blur-3xl
        "
      />

      {/* ======================================
          Internal Header
      ======================================= */}

      <div
        className="
          relative
          flex
          flex-col
          gap-4
          border-b
          border-slate-100
          px-5
          py-5
          sm:flex-row
          sm:items-center
          sm:justify-between
          sm:px-6
        "
      >
        <div
          className="
            flex
            items-center
            gap-3
          "
        >
          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-emerald-50
              text-emerald-700
            "
          >
            <Activity className="h-5 w-5" />
          </div>

          <div>
            <p
              className="
                text-sm
                font-extrabold
                text-slate-800
              "
            >
              شدت اثرگذاری متغیرها
            </p>

            <p
              className="
                mt-1
                text-xs
                text-slate-400
              "
            >
              مقایسه عوامل بر اساس میزان
              حساسیت ارزش‌گذاری
            </p>
          </div>
        </div>

        {/* Number of drivers */}

        <div
          className="
            flex
            w-fit
            items-center
            gap-2
            rounded-xl
            border
            border-slate-100
            bg-slate-50
            px-3
            py-2
          "
        >
          <BarChart3
            className="
              h-4
              w-4
              text-emerald-600
            "
          />

          <span
            className="
              text-xs
              font-semibold
              text-slate-500
            "
          >
            تعداد عوامل
          </span>

          <span
            className="
              flex
              h-6
              min-w-6
              items-center
              justify-center
              rounded-lg
              bg-white
              px-1.5
              text-xs
              font-black
              text-slate-700
              shadow-sm
            "
          >
            {toPersianNumber(
              sortedData.length
            )}
          </span>
        </div>
      </div>

      {/* ======================================
          Main Chart
      ======================================= */}

      <div
        className="
          relative
          px-3
          pb-4
          pt-6
          sm:px-5
        "
      >
        <div
          className="
            rounded-2xl
            border
            border-slate-100
            bg-gradient-to-b
            from-slate-50/70
            to-white
            px-2
            py-4
            sm:px-4
          "
        >
          <div
            style={{
              height: Math.max(
                320,
                sortedData.length * 58
              ),
              width: '100%',
              direction: 'rtl',
            }}
            key={JSON.stringify(
              data.map(
                (item) => item.impact
              )
            )}
          >
            <Bar
              data={chartData}
              options={options}
              plugins={[
                valueLabelPlugin,
              ]}
            />
          </div>
        </div>

        {/* ======================================
            Legend
        ======================================= */}

        <div
          className="
            mt-4
            flex
            flex-wrap
            items-center
            justify-center
            gap-x-5
            gap-y-2
            text-[11px]
            font-semibold
            text-slate-500
          "
        >
          <div
            className="
              flex
              items-center
              gap-2
            "
          >
            <span
              className="
                h-2.5
                w-2.5
                rounded-full
                bg-rose-500
              "
            />

            اثر بسیار بالا
          </div>

          <div
            className="
              flex
              items-center
              gap-2
            "
          >
            <span
              className="
                h-2.5
                w-2.5
                rounded-full
                bg-amber-400
              "
            />

            اثر متوسط
          </div>

          <div
            className="
              flex
              items-center
              gap-2
            "
          >
            <span
              className="
                h-2.5
                w-2.5
                rounded-full
                bg-emerald-500
              "
            />

            اثر پایین
          </div>
        </div>
      </div>

      {/* ======================================
          Insight
      ======================================= */}

      {highestImpact && (
        <div
          className="
            relative
            mx-5
            mb-5
            overflow-hidden
            rounded-2xl
            border
            border-emerald-100
            bg-gradient-to-l
            from-emerald-50
            via-emerald-50/40
            to-white
            p-4
          "
        >
          <div
            className="
              flex
              flex-col
              gap-3
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <div
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-emerald-100
                  text-emerald-700
                "
              >
                <TrendingUp className="h-4 w-4" />
              </div>

              <div>
                <p
                  className="
                    text-[11px]
                    font-semibold
                    text-slate-400
                  "
                >
                  اثرگذارترین متغیر
                </p>

                <p
                  className="
                    mt-0.5
                    text-sm
                    font-black
                    text-slate-800
                  "
                >
                  {highestImpact.name}
                </p>
              </div>
            </div>

            <div
              className="
                flex
                items-center
                gap-2
                rounded-xl
                border
                border-emerald-100
                bg-white
                px-4
                py-2
                shadow-sm
              "
            >
              <span
                className="
                  text-xs
                  font-semibold
                  text-slate-400
                "
              >
                شدت تأثیر
              </span>

              <span
                className="
                  text-base
                  font-black
                  text-emerald-700
                "
              >
                {toPersianNumber(
                  Math.abs(
                    highestImpact.impact
                  ),
                  1
                )}
                ٪
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
