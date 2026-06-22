/**
 * تبدیل تاریخ میلادی به شمسی با فرمت دلخواه
 * @param date - تاریخ میلادی (string یا Date)
 * @param format - فرمت خروجی: 'full', 'date', 'time', 'datetime'
 * @returns تاریخ شمسی فرمت شده
 */
export function toPersianDate(
  date: string | Date, 
  format: 'full' | 'date' | 'time' | 'datetime' = 'datetime'
): string {
  if (!date) return '-';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // بررسی اعتبار تاریخ
  if (isNaN(d.getTime())) return '-';
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Tehran',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };
  
  if (format === 'time' || format === 'datetime') {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  if (format === 'full' || format === 'datetime') {
    options.second = '2-digit';
  }
  
  try {
    return new Intl.DateTimeFormat('fa-IR', options).format(d);
  } catch (error) {
    console.error('Error formatting date:', error);
    return d.toLocaleString('fa-IR');
  }
}

/**
 * تبدیل تاریخ میلادی به شمسی با فرمت سفارشی
 */
export function toPersianDateCustom(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {}
): string {
  if (!date) return '-';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '-';
  
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      timeZone: 'Asia/Tehran',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...options,
    }).format(d);
  } catch (error) {
    return d.toLocaleString('fa-IR');
  }
}
