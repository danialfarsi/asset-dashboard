/**
 * 📅 JalaliDatePicker — انتخاب تاریخ شمسی با Modal
 * طراحی: Modal وسط صفحه + بک‌دراپ تیره
 */
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronRight, ChevronLeft, X } from 'lucide-react';
import jalaliMoment from 'jalali-moment';

interface JalaliDatePickerProps {
  value?: string;
  onChange: (gregorian: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  name?: string;
}

export function JalaliDatePicker({
  value,
  onChange,
  placeholder = 'انتخاب تاریخ...',
  disabled = false,
  className = '',
  required = false,
  name,
}: JalaliDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) return jalaliMoment(value);
    return jalaliMoment();
  });

  // برای SSR
  useEffect(() => {
    setMounted(true);
  }, []);

  // فرمت نمایش
  const displayValue = useMemo(() => {
    if (!value) return '';
    try {
      return jalaliMoment(value).locale('fa').format('YYYY/MM/DD');
    } catch {
      return '';
    }
  }, [value]);

  // ═══════════════════════════════════════════════════════
  // ساخت گرید روزهای ماه
  // ═══════════════════════════════════════════════════════
  const calendarDays = useMemo(() => {
    const year = viewDate.jYear();
    const month = viewDate.jMonth();

    const firstDay = jalaliMoment(`${year}/${month + 1}/1`, 'jYYYY/jM/jD');
    const daysInMonth = jalaliMoment.jDaysInMonth(year, month);
    const firstDayOfWeek = (firstDay.day() + 1) % 7;

    const days: Array<{ day: number; isToday: boolean; isEmpty: boolean }> = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ day: 0, isToday: false, isEmpty: true });
    }

    const today = jalaliMoment();
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday =
        today.jYear() === year &&
        today.jMonth() === month &&
        today.jDate() === d;
      days.push({ day: d, isToday, isEmpty: false });
    }

    return days;
  }, [viewDate]);

  // انتخاب روز
  const handleSelectDay = (day: number) => {
    if (day === 0) return;
    const year = viewDate.jYear();
    const month = viewDate.jMonth() + 1;
    const gregorianDate = jalaliMoment(`${year}/${month}/${day}`, 'jYYYY/jM/jD').format('YYYY-MM-DD');
    onChange(gregorianDate);
    setIsOpen(false);
  };

  // پاک کردن
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  // ناوبری
  const prevMonth = () => setViewDate(viewDate.clone().subtract(1, 'jMonth'));
  const nextMonth = () => setViewDate(viewDate.clone().add(1, 'jMonth'));

  const monthName = viewDate.locale('fa').format('jMMMM jYYYY');
  const weekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

  // بستن با Esc
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  // قفل اسکرول
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* ─── Input Trigger ─── */}
      <div className={`relative ${className}`} dir="rtl">
        <div
          onClick={() => !disabled && setIsOpen(true)}
          className={`
            flex items-center gap-2 w-full px-3 py-2 border rounded-lg
            bg-white cursor-pointer transition
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#04241D]/30'}
            ${isOpen ? 'border-[#04241D] ring-2 ring-[#04241D]/20' : 'border-gray-300'}
          `}
        >
          <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
          <input
            type="text"
            value={displayValue}
            placeholder={placeholder}
            readOnly
            required={required}
            name={name}
            className="flex-1 outline-none bg-transparent cursor-pointer text-sm text-right"
          />
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-red-500 transition shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ─── Modal ─── */}
      {mounted && isOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setIsOpen(false)}
          dir="rtl"
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-[340px] overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-br from-[#04241D] to-[#0B4A3C] p-4 text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                    <Calendar className="h-4 w-4 text-[#F2D27E]" />
                  </div>
                  <div>
                    <p className="text-[11px] text-white/60">انتخاب تاریخ</p>
                    <p className="text-sm font-bold">
                      {displayValue || 'تاریخ را انتخاب کنید'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Month Navigation */}
              <div className="flex items-center justify-between bg-white/10 rounded-lg px-2 py-1.5">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-white hover:bg-white/15 transition"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <div className="text-sm font-bold">
                  {monthName}
                </div>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-white hover:bg-white/15 transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Calendar Body */}
            <div className="p-4">
              {/* Week days */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map((d) => (
                  <div
                    key={d}
                    className="flex h-8 items-center justify-center text-[11px] font-bold text-gray-500"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((d, i) => {
                  if (d.isEmpty) return <div key={i} className="h-10" />;

                  const isSelected = value && (() => {
                    try {
                      const selected = jalaliMoment(value);
                      return (
                        selected.jYear() === viewDate.jYear() &&
                        selected.jMonth() === viewDate.jMonth() &&
                        selected.jDate() === d.day
                      );
                    } catch {
                      return false;
                    }
                  })();

                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectDay(d.day)}
                      className={`
                        flex h-10 items-center justify-center rounded-xl text-sm font-medium transition
                        ${
                          isSelected
                            ? 'bg-[#04241D] text-white font-bold shadow-md scale-105'
                            : d.isToday
                            ? 'bg-[#04241D]/10 text-[#04241D] font-bold hover:bg-[#04241D]/20'
                            : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      {d.day.toLocaleString('fa-IR')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 p-4 pt-0">
              <button
                type="button"
                onClick={() => {
                  const today = jalaliMoment().format('YYYY-MM-DD');
                  onChange(today);
                  setIsOpen(false);
                }}
                className="flex-1 bg-[#04241D] hover:bg-[#0B4A3C] text-white text-sm font-medium py-2.5 rounded-xl transition"
              >
                📅 امروز ({jalaliMoment().locale('fa').format('D MMMM')})
              </button>
              {value && (
                <button
                  type="button"
                  onClick={() => {
                    onChange('');
                    setIsOpen(false);
                  }}
                  className="px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition"
                >
                  پاک کردن
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
