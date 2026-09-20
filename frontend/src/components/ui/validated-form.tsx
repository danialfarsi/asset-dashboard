/**
 * 📝 ValidatedForm — فرم با اعتبارسنجی فارسی
 * 
 * جایگزین <form> معمولی:
 * - noValidate: HTML5 validation رو غیرفعال می‌کنه
 * - اعتبارسنجی دستی + toast فارسی
 */
'use client';

import { FormEvent, ReactNode, useRef, useState } from 'react';
import { toast } from 'sonner';

interface ValidatedFormProps {
  children: ReactNode;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void | Promise<void>;
  className?: string;
  noValidate?: boolean;
  successMessage?: string;
}

export function ValidatedForm({
  children,
  onSubmit,
  className = '',
  noValidate = true,
  successMessage,
}: ValidatedFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (submitting) return;

    const form = e.currentTarget;

    // اعتبارسنجی دستی
    const invalidFields: { name: string; label: string }[] = [];

    const inputs = form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      'input[required], textarea[required], select[required]'
    );

    inputs.forEach((input) => {
      // چک کن خالی نباشه
      if (!input.value || input.value.trim() === '') {
        const label = 
          input.getAttribute('data-label') ||
          input.getAttribute('placeholder') ||
          input.getAttribute('name') ||
          'این فیلد';
        invalidFields.push({
          name: input.getAttribute('name') || '',
          label: label.replace('*', '').replace('...', '').trim(),
        });
        // اضافه کردن کلاس خطا
        input.classList.add('border-red-500', 'ring-2', 'ring-red-200');
      } else {
        // حذف کلاس خطا
        input.classList.remove('border-red-500', 'ring-2', 'ring-red-200');
      }
    });

    // اگه فیلد خالی هست
    if (invalidFields.length > 0) {
      // فقط یک toast با همه فیلدها
      const labels = invalidFields.map(f => f.label).join('، ');

      toast.error('لطفاً فیلدهای الزامی را پر کنید', {
        description: `این فیلدها خالی هستند: ${labels}`,
        duration: 5000,
      });

      // فوکوس روی اولین فیلد خالی
      const firstInvalid = inputs[invalidFields.length > 0 ? inputs.length - invalidFields.length : 0];
      // پیدا کردن اولین invalid واقعی
      for (const input of Array.from(inputs)) {
        if (!input.value || input.value.trim() === '') {
          input.focus();
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });
          break;
        }
      }

      return;
    }

    // call onSubmit
    try {
      setSubmitting(true);
      await onSubmit(e);

      if (successMessage) {
        toast.success(successMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      ref={formRef}
      noValidate={noValidate}
      onSubmit={handleSubmit}
      className={className}
    >
      {children}
    </form>
  );
}
