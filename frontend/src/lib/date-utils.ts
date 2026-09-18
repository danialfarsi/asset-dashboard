/**
 * 📅 Date Utils — تبدیل تاریخ میلادی ↔ شمسی
 * استفاده از jalali-moment
 */
import jalaliMoment from 'jalali-moment';

// ═══════════════════════════════════════════════════════
// تبدیل میلادی → شمسی
// ═══════════════════════════════════════════════════════

/** تبدیل به شمسی کوتاه: ۱۴۰۵/۰۶/۲۵ */
export const toJalali = (date: string | Date | null | undefined): string => {
  if (!date) return '—';
  try {
    return jalaliMoment(date).locale('fa').format('YYYY/MM/DD');
  } catch {
    return '—';
  }
};

/** تبدیل به شمسی بلند: ۲۵ شهریور ۱۴۰۵ */
export const toJalaliLong = (date: string | Date | null | undefined): string => {
  if (!date) return '—';
  try {
    return jalaliMoment(date).locale('fa').format('D MMMM YYYY');
  } catch {
    return '—';
  }
};

/** تبدیل به شمسی با ساعت: ۱۴۰۵/۰۶/۲۵ - ۱۴:۳۰ */
export const toJalaliFull = (date: string | Date | null | undefined): string => {
  if (!date) return '—';
  try {
    return jalaliMoment(date).locale('fa').format('YYYY/MM/DD - HH:mm');
  } catch {
    return '—';
  }
};

/** تبدیل به شمسی + نام روز: دوشنبه ۲۵ شهریور ۱۴۰۵ */
export const toJalaliWithDay = (date: string | Date | null | undefined): string => {
  if (!date) return '—';
  try {
    return jalaliMoment(date).locale('fa').format('dddd D MMMM YYYY');
  } catch {
    return '—';
  }
};

/** تبدیل به شمسی + ساعت + ثانیه */
export const toJalaliDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return '—';
  try {
    return jalaliMoment(date).locale('fa').format('YYYY/MM/DD HH:mm:ss');
  } catch {
    return '—';
  }
};

// ═══════════════════════════════════════════════════════
// تبدیل شمسی → میلادی (برای ارسال به Backend)
// ═══════════════════════════════════════════════════════

/**
 * تبدیل شمسی → میلادی ISO
 * ورودی: '۱۴۰۵/۰۶/۲۵' یا '1405/06/25'
 * خروجی: '2026-09-16'
 */
export const toGregorian = (jalaliDate: string | null | undefined): string => {
  if (!jalaliDate) return '';
  try {
    // تبدیل اعداد فارسی به انگلیسی
    const englishDate = jalaliDate.replace(/[۰-۹]/g, (d) =>
      String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    );
    return jalaliMoment.from(englishDate, 'fa', 'YYYY/MM/DD').format('YYYY-MM-DD');
  } catch {
    return '';
  }
};

/**
 * تبدیل میلادی → شمسی برای input
 * ورودی: '2026-09-16'
 * خروجی: '1405/06/25' (انگلیسی برای input)
 */
export const toJalaliInput = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  try {
    return jalaliMoment(date).locale('en').format('YYYY/MM/DD');
  } catch {
    return '';
  }
};

// ═══════════════════════════════════════════════════════
// اعداد فارسی
// ═══════════════════════════════════════════════════════

/** تبدیل اعداد به فارسی */
export const toFa = (num: number | string | null | undefined): string => {
  if (num === null || num === undefined) return '—';
  return String(num).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
};

/** تبدیل اعداد فارسی به انگلیسی */
export const toEn = (str: string): string => {
  return str.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
};

// ═══════════════════════════════════════════════════════
// Helper: امروز
// ═══════════════════════════════════════════════════════

/** امروز به شمسی */
export const todayJalali = (): string => {
  return jalaliMoment().locale('fa').format('YYYY/MM/DD');
};

/** امروز به شمسی بلند */
export const todayJalaliLong = (): string => {
  return jalaliMoment().locale('fa').format('dddd D MMMM YYYY');
};

// ═══════════════════════════════════════════════════════
// Aliases (برای سازگاری با کد قدیمی)
// ═══════════════════════════════════════════════════════

/** Alias برای toJalali — برای سازگاری با کد قدیمی */
export const toPersianDate = toJalali;

/** Alias برای toJalaliLong */
export const toPersianDateLong = toJalaliLong;

/** Alias برای toJalaliFull */
export const toPersianDateTime = toJalaliFull;

/** Alias برای toFa */
export const toPersianNumber = toFa;

/** Alias برای toJalaliInput */
export const toPersianInput = toJalaliInput;
