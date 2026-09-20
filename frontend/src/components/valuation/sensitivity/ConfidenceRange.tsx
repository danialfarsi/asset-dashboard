
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Target,
  Info,
} from 'lucide-react';

const toPersianNumber = (num: number) => {
  if (!num && num !== 0) return '۰';

  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';

  return String(Math.round(num)).replace(
    /\d/g,
    (d) => persianDigits[parseInt(d)]
  );
};

interface ConfidenceRangeProps {
  pessimisticValue: number;
  baseValue: number;
  optimisticValue: number;
  confidenceLevel: number;
  globalMin?: number;
  globalMax?: number;
}

export function ConfidenceRange({
  pessimisticValue,
  baseValue,
  optimisticValue,
  confidenceLevel,
  globalMin,
  globalMax,
}: ConfidenceRangeProps) {
  /* -------------------------------------------
     Currency formatter
  ------------------------------------------- */

  const formatCurrency = (value: number) => {
    if (!value || value === 0) return '۰';

    const isNegative = value < 0;
    const absValue = Math.abs(value);

    let formatted: string;

    if (absValue >= 1e12) {
      formatted = `${(absValue / 1e12).toFixed(1)}T`;
    } else if (absValue >= 1e9) {
      formatted = `${(absValue / 1e9).toFixed(1)}B`;
    } else if (absValue >= 1e6) {
      formatted = `${(absValue / 1e6).toFixed(1)}M`;
    } else {
      formatted = absValue.toFixed(0);
    }

    const result = isNegative ? `-${formatted}` : formatted;

    return result.replace(
      /\d/g,
      (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]
    );
  };

  /* -------------------------------------------
     Range calculation
  ------------------------------------------- */

  const minVal =
    globalMin !== undefined
      ? globalMin
      : Math.min(
          pessimisticValue,
          baseValue,
          optimisticValue
        );

  const maxVal =
    globalMax !== undefined
      ? globalMax
      : Math.max(
          pessimisticValue,
          baseValue,
          optimisticValue
        );

  const range = maxVal - minVal || 1;

  const getPosition = (value: number) => {
    const position =
      ((value - minVal) / range) * 100;

    /*
      کمی فاصله از دو لبه می‌دهیم
      تا tooltip و marker بریده نشوند.
    */
    return Math.min(
      Math.max(position, 3),
      97
    );
  };

  const positions = {
    pessimistic: getPosition(pessimisticValue),
    base: getPosition(baseValue),
    optimistic: getPosition(optimisticValue),
  };

  /* -------------------------------------------
     Change relative to base
  ------------------------------------------- */

  const getChange = (value: number) => {
    if (!baseValue) return 0;

    return (
      ((value - baseValue) / baseValue) *
      100
    );
  };

  const pessimisticChange =
    getChange(pessimisticValue);

  const optimisticChange =
    getChange(optimisticValue);

  /* -------------------------------------------
     Tick labels
  ------------------------------------------- */

  const ticks = Array.from(
    { length: 7 },
    (_, index) => {
      const percentage = index / 6;

      return {
        position: percentage * 100,
        value: minVal + range * percentage,
      };
    }
  );

  return (
    <Card
      dir="rtl"
      className="
        relative
        overflow-hidden
        rounded-[28px]
        border
        border-slate-200/80
        bg-white
        shadow-sm
      "
      style={{
        fontFamily: 'var(--font-vazir)',
      }}
    >
      {/* Background glow */}

      <div
        className="
          pointer-events-none
          absolute
          -right-24
          -top-24
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
          -left-24
          top-32
          h-64
          w-64
          rounded-full
          bg-sky-100/30
          blur-3xl
        "
      />

      {/* =====================================
          Header
      ====================================== */}

      <CardHeader
        className="
          relative
          border-b
          border-slate-100
          px-5
          py-6
          sm:px-7
        "
      >
        <div
          className="
            flex
            flex-col
            gap-4
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div className="flex items-center gap-3">
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
              <ShieldCheck className="h-6 w-6" />
            </div>

            <div>
              <CardTitle
                className="
                  text-xl
                  font-black
                  tracking-tight
                  text-slate-900
                "
              >
                بازه اطمینان ارزش‌گذاری
              </CardTitle>

              <p
                className="
                  mt-1
                  text-sm
                  leading-6
                  text-slate-500
                "
              >
                محدوده احتمالی ارزش بر اساس
                سناریوهای تحلیل حساسیت
              </p>
            </div>
          </div>

          {/* Confidence badge */}

          <div
            className="
              flex
              w-fit
              items-center
              gap-3
              rounded-2xl
              border
              border-emerald-100
              bg-emerald-50
              px-4
              py-2.5
            "
          >
            <div
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-xl
                bg-emerald-100
                text-emerald-700
              "
            >
              <ShieldCheck className="h-4 w-4" />
            </div>

            <div>
              <p
                className="
                  text-[11px]
                  font-semibold
                  text-slate-500
                "
              >
                سطح اطمینان
              </p>

              <p
                className="
                  text-lg
                  font-black
                  text-emerald-700
                "
              >
                {toPersianNumber(confidenceLevel)}٪
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent
        className="
          relative
          px-5
          py-7
          sm:px-7
          sm:py-8
        "
      >
        {/* =====================================
            Scenario cards
        ====================================== */}

        <div
          className="
            grid
            grid-cols-1
            gap-4
            md:grid-cols-3
          "
        >
          {/* Pessimistic */}

          <div
            className="
              relative
              overflow-hidden
              rounded-2xl
              border
              border-rose-100
              bg-gradient-to-br
              from-rose-50
              to-white
              p-5
              transition-all
              duration-300
              hover:-translate-y-0.5
              hover:shadow-md
            "
          >
            <div
              className="
                absolute
                -left-8
                -top-8
                h-24
                w-24
                rounded-full
                bg-rose-100/60
                blur-2xl
              "
            />

            <div
              className="
                relative
                flex
                items-start
                justify-between
              "
            >
              <div>
                <p
                  className="
                    text-sm
                    font-extrabold
                    text-rose-700
                  "
                >
                  سناریوی بدبینانه
                </p>

                <p
                  className="
                    mt-4
                    text-3xl
                    font-black
                    tracking-tight
                    text-rose-700
                  "
                >
                  {formatCurrency(
                    pessimisticValue
                  )}
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
                  bg-rose-100
                  text-rose-600
                "
              >
                <TrendingDown className="h-5 w-5" />
              </div>
            </div>

            <div
              className="
                relative
                mt-4
                flex
                items-center
                gap-2
              "
            >
              <span
                className="
                  rounded-full
                  bg-rose-100
                  px-3
                  py-1
                  text-xs
                  font-black
                  text-rose-700
                "
              >
                {toPersianNumber(
                  pessimisticChange
                )}
                ٪
              </span>

              <span
                className="
                  text-xs
                  font-medium
                  text-slate-400
                "
              >
                نسبت به مبنا
              </span>
            </div>
          </div>

          {/* Base */}

          <div
            className="
              relative
              overflow-hidden
              rounded-2xl
              border
              border-emerald-300
              bg-gradient-to-br
              from-emerald-50
              via-emerald-50/70
              to-white
              p-5
              shadow-[0_10px_35px_rgba(16,185,129,0.10)]
              transition-all
              duration-300
              hover:-translate-y-0.5
            "
          >
            <div
              className="
                absolute
                -left-8
                -top-8
                h-28
                w-28
                rounded-full
                bg-emerald-200/30
                blur-2xl
              "
            />

            <div
              className="
                relative
                flex
                items-start
                justify-between
              "
            >
              <div>
                <p
                  className="
                    text-sm
                    font-extrabold
                    text-emerald-800
                  "
                >
                  ارزش مبنا
                </p>

                <p
                  className="
                    mt-4
                    text-3xl
                    font-black
                    tracking-tight
                    text-emerald-800
                  "
                >
                  {formatCurrency(baseValue)}
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
                <Target className="h-5 w-5" />
              </div>
            </div>

            <div
              className="
                relative
                mt-4
                flex
                items-center
                gap-2
              "
            >
              <span
                className="
                  rounded-full
                  bg-emerald-100
                  px-3
                  py-1
                  text-xs
                  font-black
                  text-emerald-700
                "
              >
                ۰٪
              </span>

              <span
                className="
                  text-xs
                  font-medium
                  text-slate-400
                "
              >
                نقطه مرجع
              </span>
            </div>
          </div>

          {/* Optimistic */}

          <div
            className="
              relative
              overflow-hidden
              rounded-2xl
              border
              border-sky-100
              bg-gradient-to-br
              from-sky-50
              to-white
              p-5
              transition-all
              duration-300
              hover:-translate-y-0.5
              hover:shadow-md
            "
          >
            <div
              className="
                absolute
                -left-8
                -top-8
                h-24
                w-24
                rounded-full
                bg-sky-100/60
                blur-2xl
              "
            />

            <div
              className="
                relative
                flex
                items-start
                justify-between
              "
            >
              <div>
                <p
                  className="
                    text-sm
                    font-extrabold
                    text-sky-700
                  "
                >
                  سناریوی خوش‌بینانه
                </p>

                <p
                  className="
                    mt-4
                    text-3xl
                    font-black
                    tracking-tight
                    text-sky-700
                  "
                >
                  {formatCurrency(
                    optimisticValue
                  )}
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
                  bg-sky-100
                  text-sky-600
                "
              >
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>

            <div
              className="
                relative
                mt-4
                flex
                items-center
                gap-2
              "
            >
              <span
                className="
                  rounded-full
                  bg-sky-100
                  px-3
                  py-1
                  text-xs
                  font-black
                  text-sky-700
                "
              >
                +
                {toPersianNumber(
                  optimisticChange
                )}
                ٪
              </span>

              <span
                className="
                  text-xs
                  font-medium
                  text-slate-400
                "
              >
                نسبت به مبنا
              </span>
            </div>
          </div>
        </div>

        {/* =====================================
            CONFIDENCE BAR
        ====================================== */}

        <div
          className="
            mt-10
            rounded-[24px]
            border
            border-slate-100
            bg-gradient-to-b
            from-white
            to-slate-50/70
            px-4
            pb-6
            pt-8
            sm:px-7
          "
        >
          {/* Chart title */}

          <div
            className="
              mb-12
              flex
              items-center
              justify-between
            "
          >
            <div>
              <p
                className="
                  text-sm
                  font-extrabold
                  text-slate-800
                "
              >
                توزیع احتمال ارزش‌گذاری
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  text-slate-400
                "
              >
                موقعیت سه سناریو در دامنه
                محاسبه‌شده
              </p>
            </div>
          </div>

          {/* =====================================
              BAR + MARKERS
          ====================================== */}

          <div
            className="
              relative
              mx-auto
              mt-3
              w-full
              pb-16
              pt-[72px]
            "
            dir="ltr"
          >
            {/* -------------------------------
                Pessimistic tooltip
            -------------------------------- */}

            <div
              className="
                absolute
                top-0
                z-30
                -translate-x-1/2
                transition-[left]
                duration-700
                ease-out
              "
              style={{
                left: `${positions.pessimistic}%`,
              }}
            >
              <div
                className="
                  relative
                  min-w-[94px]
                  rounded-xl
                  border
                  border-rose-200
                  bg-white
                  px-3
                  py-2
                  text-center
                  shadow-[0_8px_25px_rgba(244,63,94,0.12)]
                "
              >
                <p
                  className="
                    whitespace-nowrap
                    text-sm
                    font-black
                    text-rose-700
                  "
                >
                  {formatCurrency(
                    pessimisticValue
                  )}
                </p>

                <p
                  className="
                    mt-0.5
                    whitespace-nowrap
                    text-[10px]
                    font-bold
                    text-rose-500
                  "
                >
                  بدبینانه
                </p>
              </div>

              {/* Triangle */}

              <div
                className="
                  absolute
                  left-1/2
                  top-full
                  -translate-x-1/2
                  border-x-[7px]
                  border-t-[8px]
                  border-x-transparent
                  border-t-rose-200
                "
              />
            </div>

            {/* -------------------------------
                Base tooltip
            -------------------------------- */}

            <div
              className="
                absolute
                top-0
                z-40
                -translate-x-1/2
                transition-[left]
                duration-700
                ease-out
              "
              style={{
                left: `${positions.base}%`,
              }}
            >
              <div
                className="
                  relative
                  min-w-[94px]
                  rounded-xl
                  border
                  border-emerald-300
                  bg-white
                  px-3
                  py-2
                  text-center
                  shadow-[0_8px_25px_rgba(16,185,129,0.16)]
                "
              >
                <p
                  className="
                    whitespace-nowrap
                    text-sm
                    font-black
                    text-emerald-800
                  "
                >
                  {formatCurrency(baseValue)}
                </p>

                <p
                  className="
                    mt-0.5
                    whitespace-nowrap
                    text-[10px]
                    font-bold
                    text-emerald-600
                  "
                >
                  مبنا
                </p>
              </div>

              <div
                className="
                  absolute
                  left-1/2
                  top-full
                  -translate-x-1/2
                  border-x-[7px]
                  border-t-[8px]
                  border-x-transparent
                  border-t-emerald-300
                "
              />
            </div>

            {/* -------------------------------
                Optimistic tooltip
            -------------------------------- */}

            <div
              className="
                absolute
                top-0
                z-30
                -translate-x-1/2
                transition-[left]
                duration-700
                ease-out
              "
              style={{
                left: `${positions.optimistic}%`,
              }}
            >
              <div
                className="
                  relative
                  min-w-[94px]
                  rounded-xl
                  border
                  border-sky-200
                  bg-white
                  px-3
                  py-2
                  text-center
                  shadow-[0_8px_25px_rgba(14,165,233,0.12)]
                "
              >
                <p
                  className="
                    whitespace-nowrap
                    text-sm
                    font-black
                    text-sky-700
                  "
                >
                  {formatCurrency(
                    optimisticValue
                  )}
                </p>

                <p
                  className="
                    mt-0.5
                    whitespace-nowrap
                    text-[10px]
                    font-bold
                    text-sky-500
                  "
                >
                  خوش‌بینانه
                </p>
              </div>

              <div
                className="
                  absolute
                  left-1/2
                  top-full
                  -translate-x-1/2
                  border-x-[7px]
                  border-t-[8px]
                  border-x-transparent
                  border-t-sky-200
                "
              />
            </div>

            {/* -------------------------------
                Colored bar
            -------------------------------- */}

            <div
              className="
                relative
                h-[38px]
                rounded-full
                border-[7px]
                border-slate-100
                bg-slate-100
                shadow-inner
              "
            >
              <div
                className="
                  absolute
                  inset-0
                  overflow-hidden
                  rounded-full
                "
              >
                {/* Full gradient */}

                <div
                  className="
                    absolute
                    inset-0
                    bg-gradient-to-r
                    from-rose-400
                    via-emerald-400
                    to-sky-400
                  "
                />

                {/* Soft white overlay */}

                <div
                  className="
                    absolute
                    inset-0
                    bg-gradient-to-b
                    from-white/10
                    to-white/25
                  "
                />

                {/* Tiny scale ticks */}

                <div
                  className="
                    absolute
                    inset-x-3
                    top-1/2
                    flex
                    -translate-y-1/2
                    items-center
                    justify-between
                    opacity-70
                  "
                >
                  {Array.from({
                    length: 31,
                  }).map((_, index) => (
                    <span
                      key={index}
                      className={`
                        block
                        w-px
                        rounded-full
                        bg-white
                        ${
                          index % 5 === 0
                            ? 'h-2.5'
                            : 'h-1'
                        }
                      `}
                    />
                  ))}
                </div>
              </div>

              {/* Pessimistic circle */}

              <div
                className="
                  absolute
                  top-1/2
                  z-20
                  h-7
                  w-7
                  -translate-x-1/2
                  -translate-y-1/2
                  rounded-full
                  border-[3px]
                  border-white
                  bg-rose-500
                  shadow-[0_3px_12px_rgba(244,63,94,0.4)]
                  transition-[left]
                  duration-700
                  ease-out
                "
                style={{
                  left: `${positions.pessimistic}%`,
                }}
              />

              {/* Base circle */}

              <div
                className="
                  absolute
                  top-1/2
                  z-30
                  flex
                  h-8
                  w-8
                  -translate-x-1/2
                  -translate-y-1/2
                  items-center
                  justify-center
                  rounded-full
                  border-[3px]
                  border-white
                  bg-emerald-600
                  shadow-[0_3px_14px_rgba(5,150,105,0.45)]
                  transition-[left]
                  duration-700
                  ease-out
                "
                style={{
                  left: `${positions.base}%`,
                }}
              >
                <div
                  className="
                    h-2
                    w-2
                    rounded-full
                    bg-white
                  "
                />
              </div>

              {/* Optimistic circle */}

              <div
                className="
                  absolute
                  top-1/2
                  z-20
                  h-7
                  w-7
                  -translate-x-1/2
                  -translate-y-1/2
                  rounded-full
                  border-[3px]
                  border-white
                  bg-sky-500
                  shadow-[0_3px_12px_rgba(14,165,233,0.4)]
                  transition-[left]
                  duration-700
                  ease-out
                "
                style={{
                  left: `${positions.optimistic}%`,
                }}
              />
            </div>

            {/* =====================================
                Scale ticks
            ====================================== */}

            <div
              className="
                absolute
                inset-x-0
                top-[120px]
                h-12
              "
            >
              {ticks.map((tick, index) => (
                <div
                  key={index}
                  className="
                    absolute
                    top-0
                    -translate-x-1/2
                    text-center
                  "
                  style={{
                    left: `${tick.position}%`,
                  }}
                >
                  <div
                    className="
                      mx-auto
                      h-2.5
                      w-px
                      bg-slate-300
                    "
                  />

                  <p
                    className="
                      mt-2
                      whitespace-nowrap
                      text-[10px]
                      font-semibold
                      text-slate-400
                    "
                  >
                    {formatCurrency(tick.value)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* =====================================
              Min / distribution / max
          ====================================== */}

          <div
            className="
              mt-2
              grid
              grid-cols-[auto_1fr_auto]
              items-center
              gap-4
            "
            dir="ltr"
          >
            <div className="text-left">
              <p
                className="
                  text-[10px]
                  font-medium
                  text-slate-400
                "
              >
                حداقل مقدار
              </p>

              <div
                className="
                  mt-1
                  rounded-xl
                  bg-slate-100
                  px-3
                  py-2
                  text-xs
                  font-black
                  text-slate-600
                "
              >
                {formatCurrency(minVal)}
              </div>
            </div>

            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <div
                className="
                  h-px
                  flex-1
                  bg-slate-200
                "
              />

              <span
                className="
                  whitespace-nowrap
                  text-xs
                  font-semibold
                  text-slate-400
                "
              >
                توزیع احتمال ارزش‌گذاری
              </span>

              <div
                className="
                  h-px
                  flex-1
                  bg-slate-200
                "
              />
            </div>

            <div className="text-right">
              <p
                className="
                  text-[10px]
                  font-medium
                  text-slate-400
                "
              >
                حداکثر مقدار
              </p>

              <div
                className="
                  mt-1
                  rounded-xl
                  bg-slate-100
                  px-3
                  py-2
                  text-xs
                  font-black
                  text-slate-600
                "
              >
                {formatCurrency(maxVal)}
              </div>
            </div>
          </div>
        </div>

        {/* =====================================
            Bottom summary
        ====================================== */}

        <div
          className="
            mt-6
            overflow-hidden
            rounded-[22px]
            border
            border-emerald-100
            bg-gradient-to-l
            from-emerald-50/80
            via-emerald-50/30
            to-white
          "
        >
          <div
            className="
              grid
              gap-6
              p-5
              lg:grid-cols-[1fr_auto]
              lg:items-center
              sm:p-6
            "
          >
            <div
              className="
                flex
                items-start
                gap-4
              "
            >
              <div
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  bg-emerald-100
                  text-emerald-700
                "
              >
                <ShieldCheck className="h-5 w-5" />
              </div>

              <div>
                <p
                  className="
                    text-sm
                    font-black
                    text-slate-800
                  "
                >
                  با{' '}
                  <span className="text-emerald-700">
                    {toPersianNumber(
                      confidenceLevel
                    )}
                    ٪
                  </span>{' '}
                  اطمینان، ارزش در محدوده زیر
                  قرار دارد:
                </p>

                <div
                  className="
                    mt-3
                    inline-flex
                    items-center
                    gap-5
                    rounded-xl
                    border
                    border-emerald-200
                    bg-white/80
                    px-5
                    py-3
                    shadow-sm
                  "
                  dir="ltr"
                >
                  <span
                    className="
                      text-base
                      font-black
                      text-slate-800
                    "
                  >
                    {formatCurrency(minVal)}
                  </span>

                  <span
                    className="
                      text-lg
                      font-bold
                      text-slate-300
                    "
                  >
                    —
                  </span>

                  <span
                    className="
                      text-base
                      font-black
                      text-slate-800
                    "
                  >
                    {formatCurrency(maxVal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Scenario summary */}

            <div
              className="
                min-w-[240px]
                space-y-2
                rounded-2xl
                bg-white/70
                p-3
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-5
                  rounded-xl
                  px-3
                  py-2
                "
              >
                <span
                  className="
                    text-xs
                    font-semibold
                    text-slate-500
                  "
                >
                  سناریوی بدبینانه
                </span>

                <span
                  className="
                    text-sm
                    font-black
                    text-rose-600
                  "
                >
                  {formatCurrency(
                    pessimisticValue
                  )}
                </span>
              </div>

              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-5
                  rounded-xl
                  bg-emerald-50
                  px-3
                  py-2
                "
              >
                <span
                  className="
                    text-xs
                    font-semibold
                    text-slate-500
                  "
                >
                  ارزش مبنا
                </span>

                <span
                  className="
                    text-sm
                    font-black
                    text-emerald-700
                  "
                >
                  {formatCurrency(baseValue)}
                </span>
              </div>

              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-5
                  rounded-xl
                  px-3
                  py-2
                "
              >
                <span
                  className="
                    text-xs
                    font-semibold
                    text-slate-500
                  "
                >
                  سناریوی خوش‌بینانه
                </span>

                <span
                  className="
                    text-sm
                    font-black
                    text-sky-600
                  "
                >
                  {formatCurrency(
                    optimisticValue
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Footer note */}

          <div
            className="
              flex
              items-center
              justify-center
              gap-2
              border-t
              border-emerald-100
              bg-white/40
              px-4
              py-3
              text-center
              text-[11px]
              leading-5
              text-slate-400
            "
          >
            <Info className="h-3.5 w-3.5 shrink-0" />

            مقادیر بر اساس تحلیل حساسیت و
            سناریوهای تعریف‌شده محاسبه شده‌اند.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
