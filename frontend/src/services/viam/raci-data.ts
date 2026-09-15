/**
 * 🎯 داده‌های ثابت RACI — طبق اکسل RACI_IAM_Matrix
 * ۲۰ فعالیت × ۱۴ نقش (بسته به نوع کسب‌وکار)
 */

// ═══════════════════════════════════════════════════════════
// ۲۰ فعالیت (طبق اکسل)
// ═══════════════════════════════════════════════════════════

export const ACTIVITIES = [
  { code: 't1a', name: 'برنامه‌ریزی راهبردی', engine: 'لایه موتور' },
  { code: 't1b', name: 'نقشه‌برداری دارایی‌ها', engine: 'موتور 1' },
  { code: 't2a', name: 'کشف اولیه', engine: 'موتور 1' },
  { code: 't2b', name: 'شناسنامه‌سازی', engine: 'موتور 1' },
  { code: 't3a', name: 'ارزیابی کیفی-غربالگری', engine: 'موتور 2' },
  { code: 't3b', name: 'ارزش‌گذاری اقتصادی', engine: 'موتور 2' },
  { code: 't4a', name: 'حفاظت حقوقی', engine: 'موتور 3' },
  { code: 't4b', name: 'امنیت فنی', engine: 'موتور 3' },
  { code: 't5a', name: 'توسعه دارایی', engine: 'موتور 4' },
  { code: 't5b', name: 'نوآوری', engine: 'موتور 4' },
  { code: 't6a', name: 'یکپارچه‌سازی سیستمی', engine: 'موتور 6' },
  { code: 't6b', name: 'هم‌افزایی', engine: 'موتور 7' },
  { code: 't7a', name: 'بهره‌برداری داخلی', engine: 'موتور 5' },
  { code: 't7b', name: 'تجاری‌سازی', engine: 'موتور 5' },
  { code: 't8a', name: 'پایش و KPI', engine: 'موتور 6/9' },
  { code: 't8b', name: 'به‌روزرسانی شناسنامه', engine: 'موتور 6' },
  { code: 't9a', name: 'بهینه‌سازی سبد', engine: 'موتور 8' },
  { code: 't9b', name: 'ارتقای رژیم حفاظت', engine: 'موتور 3/8' },
  { code: 't10a', name: 'گزارش‌دهی راهبردی', engine: 'موتور 6' },
  { code: 't10b', name: 'تصمیم‌گیری راهبردی', engine: 'موتور 8' },
] as const;

// ═══════════════════════════════════════════════════════════
// ۱۴ نقش — بر اساس نوع کسب‌وکار (طبق اکسل)
// ═══════════════════════════════════════════════════════════

export interface Role {
  code: string;
  name: string;
  abbr: string;
}

export const ROLES_MANUFACTURING: Role[] = [
  { code: 'sc',  name: 'کمیته راهبری', abbr: 'SC' },
  { code: 'iam', name: 'مدیر واحد IAM', abbr: 'IAM' },
  { code: 'aud', name: 'ممیز مستقل', abbr: 'AUD' },
  { code: 'own', name: 'مالک دارایی', abbr: 'OWN' },
  { code: 'cus', name: 'متولی دارایی/مستندات', abbr: 'CUS' },
  { code: 'rnd', name: 'مدیر R&D', abbr: 'RND' },
  { code: 'qm',  name: 'مدیر تضمین کیفیت', abbr: 'QM' },
  { code: 'pro', name: 'مدیر مهندسی فرآیند', abbr: 'PRO' },
  { code: 'leg', name: 'مدیر حقوقی', abbr: 'LEG' },
  { code: 'fin', name: 'مدیر مالی', abbr: 'FIN' },
  { code: 'ict', name: 'مدیر IT/CISO', abbr: 'ICT' },
  { code: 'hrk', name: 'مدیر منابع انسانی', abbr: 'HRK' },
  { code: 'scm', name: 'مدیر زنجیره تأمین', abbr: 'SCM' },
  { code: 'plt', name: 'مدیر پلتفرم متا', abbr: 'PLT' },
];

export const ROLES_SERVICE: Role[] = [
  { code: 'sc',  name: 'کمیته راهبری', abbr: 'SC' },
  { code: 'iam', name: 'مدیر واحد IAM', abbr: 'IAM' },
  { code: 'aud', name: 'ممیز مستقل', abbr: 'AUD' },
  { code: 'own', name: 'مالک دارایی', abbr: 'OWN' },
  { code: 'cus', name: 'متولی دارایی/مستندات', abbr: 'CUS' },
  { code: 'bdm', name: 'مدیر توسعه کسب‌وکار', abbr: 'BDM' },
  { code: 'mkt', name: 'مدیر بازاریابی/برند', abbr: 'MKT' },
  { code: 'leg', name: 'مدیر حقوقی', abbr: 'LEG' },
  { code: 'fin', name: 'مدیر مالی', abbr: 'FIN' },
  { code: 'ict', name: 'مدیر IT/CISO', abbr: 'ICT' },
  { code: 'hrk', name: 'مدیر منابع انسانی', abbr: 'HRK' },
  { code: 'cxm', name: 'مدیر تجربه مشتری', abbr: 'CXM' },
  { code: 'plt', name: 'مدیر پلتفرم متا', abbr: 'PLT' },
];

export const ROLES_RTO: Role[] = [
  { code: 'sc',  name: 'کمیته راهبری', abbr: 'SC' },
  { code: 'iam', name: 'مدیر واحد IAM', abbr: 'IAM' },
  { code: 'aud', name: 'ممیز مستقل', abbr: 'AUD' },
  { code: 'pi',  name: 'مجری پژوهشی/مالک دارایی', abbr: 'PI' },
  { code: 'cus', name: 'متولی دارایی/مستندات', abbr: 'CUS' },
  { code: 'tto', name: 'دفتر انتقال فناوری', abbr: 'TTO' },
  { code: 'lab', name: 'مدیر آزمایشگاه/تیم فنی', abbr: 'LAB' },
  { code: 'leg', name: 'مدیر حقوقی', abbr: 'LEG' },
  { code: 'fin', name: 'مدیر مالی', abbr: 'FIN' },
  { code: 'ict', name: 'مدیر IT/CISO', abbr: 'ICT' },
  { code: 'hrk', name: 'مدیر منابع انسانی', abbr: 'HRK' },
  { code: 'ext', name: 'شرکای خارجی/صنعت', abbr: 'EXT' },
  { code: 'plt', name: 'مدیر پلتفرم متا', abbr: 'PLT' },
];

export const ROLES_HOLDING: Role[] = [
  { code: 'sc',  name: 'کمیته راهبری', abbr: 'SC' },
  { code: 'iam', name: 'مدیر واحد IAM', abbr: 'IAM' },
  { code: 'aud', name: 'ممیز مستقل', abbr: 'AUD' },
  { code: 'cao', name: 'مدیر ارشد دارایی (CAO)', abbr: 'CAO' },
  { code: 'sub', name: 'مدیران شرکت‌های تابعه', abbr: 'SUB' },
  { code: 'fin', name: 'مدیر مالی', abbr: 'FIN' },
  { code: 'leg', name: 'مدیر حقوقی', abbr: 'LEG' },
  { code: 'str', name: 'مدیر استراتژی', abbr: 'STR' },
  { code: 'bdm', name: 'مدیر توسعه کسب‌وکار', abbr: 'BDM' },
  { code: 'ict', name: 'مدیر IT/CISO', abbr: 'ICT' },
  { code: 'hrk', name: 'مدیر منابع انسانی', abbr: 'HRK' },
  { code: 'plt', name: 'مدیر پلتفرم متا', abbr: 'PLT' },
];

export function getRolesByBusinessType(businessType: string): Role[] {
  switch (businessType) {
    case 'service': return ROLES_SERVICE;
    case 'rto': return ROLES_RTO;
    case 'holding': return ROLES_HOLDING;
    case 'manufacturing':
    default: return ROLES_MANUFACTURING;
  }
}

// ═══════════════════════════════════════════════════════════
// ماتریس پیش‌فرض (طبق اکسل — manufacturing)
// ═══════════════════════════════════════════════════════════

export const DEFAULT_MATRIX_MANUFACTURING: Record<string, Record<string, string>> = {
  t1a: { sc: 'A', iam: 'R', aud: 'I', own: 'C', rnd: 'C', fin: 'C' },
  t1b: { sc: 'I', iam: 'A', aud: 'I', cus: 'R', rnd: 'C', qm: 'C', pro: 'C', scm: 'C' },
  t2a: { sc: 'I', iam: 'A', aud: 'C', cus: 'R', rnd: 'C', qm: 'C', pro: 'C', scm: 'C' },
  t2b: { sc: 'I', iam: 'I', aud: 'I', own: 'A', cus: 'R', rnd: 'C', qm: 'C', pro: 'C', leg: 'C' },
  t3a: { sc: 'I', iam: 'A', aud: 'C', own: 'C', cus: 'R', rnd: 'C', qm: 'C', leg: 'C' },
  t3b: { sc: 'A', iam: 'C', aud: 'C', own: 'C', leg: 'C', fin: 'R' },
  t4a: { sc: 'A', iam: 'C', aud: 'I', rnd: 'C', leg: 'R', ict: 'C', scm: 'C' },
  t4b: { sc: 'I', iam: 'C', aud: 'C', own: 'I', qm: 'C', pro: 'C', leg: 'C', ict: 'A/R' },
  t5a: { sc: 'I', iam: 'I', own: 'A', cus: 'C', rnd: 'R', qm: 'C', pro: 'C', hrk: 'C' },
  t5b: { sc: 'A', iam: 'C', aud: 'I', own: 'C', rnd: 'R', pro: 'C', fin: 'C' },
  t6a: { sc: 'I', iam: 'A', own: 'I', cus: 'C', qm: 'C', ict: 'C', plt: 'R' },
  t6b: { sc: 'I', iam: 'A', own: 'R', rnd: 'C', qm: 'C', pro: 'C', fin: 'C' },
  t7a: { sc: 'I', iam: 'I', own: 'A', cus: 'C', rnd: 'C', qm: 'C', pro: 'R' },
  t7b: { sc: 'A', iam: 'C', aud: 'I', rnd: 'C', leg: 'C', fin: 'R', scm: 'C' },
  t8a: { sc: 'I', iam: 'A', aud: 'C', own: 'C', qm: 'C', pro: 'C', ict: 'C', plt: 'R' },
  t8b: { sc: 'I', iam: 'I', aud: 'C', own: 'A', cus: 'R', qm: 'C', leg: 'C', fin: 'C' },
  t9a: { sc: 'A', iam: 'C', aud: 'C', own: 'C', rnd: 'C', fin: 'R' },
  t9b: { sc: 'I', iam: 'A/R', aud: 'C', own: 'I', rnd: 'C', leg: 'C', ict: 'C' },
  t10a: { sc: 'I', iam: 'A/R', aud: 'C', qm: 'C', fin: 'C' },
  t10b: { sc: 'A/R', iam: 'C', aud: 'I', own: 'C', leg: 'C', fin: 'C' },
};

// ═══════════════════════════════════════════════════════════
// گزینه‌های RACI
// ═══════════════════════════════════════════════════════════

export const RACI_OPTIONS = [
  { value: 'R', label: 'R', desc: 'مسئول اجرا', color: 'bg-blue-100 text-blue-800' },
  { value: 'A', label: 'A', desc: 'پاسخگوی نهایی', color: 'bg-red-100 text-red-800' },
  { value: 'C', label: 'C', desc: 'مشورت‌شونده', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'I', label: 'I', desc: 'مطلع‌شونده', color: 'bg-gray-100 text-gray-800' },
] as const;
