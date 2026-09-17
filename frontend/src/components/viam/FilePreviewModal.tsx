/**
 * FilePreviewModal — پیش‌نمایش کامل فایل
 */
'use client';

import { useEffect, useState } from 'react';
import {
  X, Download, Trash2, FileText, Image as ImageIcon, Video, Music,
  FileSpreadsheet, Presentation, Database, Archive, Code, File as FileIcon,
  Calendar, User, HardDrive, ExternalLink, Maximize2, Minimize2, Copy, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VIAMUpload } from '@/services/viam/uploads';

interface FilePreviewModalProps {
  file: VIAMUpload | null;
  onClose: () => void;
  onDelete?: (id: number) => void;
}

const BRAND = { ink: '#04241D', inkSoft: '#0B4A3C' };

export function FilePreviewModal({ file, onClose, onDelete }: FilePreviewModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  // بستن با Esc
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // قفل اسکرول پس‌زمینه
  useEffect(() => {
    if (file) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [file]);

  if (!file) return null;

  const formatSize = (bytes: number) => {
    if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
    if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(2)} MB`;
    if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(2)} KB`;
    return `${bytes} B`;
  };

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return date;
    }
  };

  const getFileMeta = (type: string) => {
    const meta: Record<string, { icon: any; color: string; bg: string; ring: string; label: string }> = {
      pdf:        { icon: FileText,        color: 'text-rose-600',    bg: 'bg-rose-50',    ring: 'ring-rose-100',    label: 'PDF' },
      word:       { icon: FileIcon,        color: 'text-blue-600',    bg: 'bg-blue-50',    ring: 'ring-blue-100',    label: 'Word' },
      excel:      { icon: FileSpreadsheet, color: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-100', label: 'اکسل' },
      powerpoint: { icon: Presentation,    color: 'text-orange-600',  bg: 'bg-orange-50',  ring: 'ring-orange-100',  label: 'پاورپوینت' },
      image:      { icon: ImageIcon,       color: 'text-teal-600',    bg: 'bg-teal-50',    ring: 'ring-teal-100',    label: 'تصویر' },
      video:      { icon: Video,           color: 'text-violet-600',  bg: 'bg-violet-50',  ring: 'ring-violet-100',  label: 'ویدیو' },
      audio:      { icon: Music,           color: 'text-amber-600',   bg: 'bg-amber-50',   ring: 'ring-amber-100',   label: 'صوت' },
      database:   { icon: Database,        color: 'text-cyan-600',    bg: 'bg-cyan-50',    ring: 'ring-cyan-100',    label: 'دیتابیس' },
      archive:    { icon: Archive,         color: 'text-yellow-600',  bg: 'bg-yellow-50',  ring: 'ring-yellow-100',  label: 'آرشیو' },
      code:       { icon: Code,            color: 'text-indigo-600',  bg: 'bg-indigo-50',  ring: 'ring-indigo-100',  label: 'کد' },
      other:      { icon: FileIcon,        color: 'text-slate-600',   bg: 'bg-slate-50',   ring: 'ring-slate-100',   label: 'فایل' },
    };
    return meta[type] || meta.other;
  };

  const meta = getFileMeta(file.file_type);
  const Icon = meta.icon;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(file.file_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  /* حالت مشترک «پیش‌نمایش ندارد» */
  const FallbackPane = ({
    icon: PaneIcon,
    title,
    hint,
    cta,
    extra,
  }: {
    icon: any;
    title: string;
    hint: string;
    cta: string;
    extra?: React.ReactNode;
  }) => (
    <div className="flex h-full flex-col items-center justify-center gap-5 p-8 text-center">
      <div className={`flex h-28 w-28 items-center justify-center rounded-3xl ${meta.bg} ring-8 ${meta.ring}`}>
        <PaneIcon className={`h-14 w-14 ${meta.color}`} />
      </div>
      <div className="max-w-md">
        <h3 className="mb-1.5 text-lg font-bold text-slate-800 break-all">{title}</h3>
        <p className="text-sm text-slate-500">{hint}</p>
        {extra}
      </div>
      <a href={file.file_url} download={file.original_name}>
        <Button
          className="h-10 rounded-xl px-5 text-white shadow-sm transition-colors"
          style={{ backgroundColor: BRAND.ink }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BRAND.inkSoft)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BRAND.ink)}
        >
          <Download className="ml-2 h-4 w-4" />
          {cta}
        </Button>
      </a>
    </div>
  );

  // ═══════════════════════════════════════════════════
  // پیش‌نمایش محتوا بر اساس نوع فایل
  // ═══════════════════════════════════════════════════
  const renderPreview = () => {
    switch (file.file_type) {
      case 'pdf':
        return (
          <iframe
            src={`${file.file_url}#toolbar=1&navpanes=0`}
            className="h-full w-full border-0 bg-white"
            title={file.original_name}
          />
        );

      case 'image':
        return (
          <div className="flex h-full items-center justify-center p-6">
            <img
              src={file.file_url}
              alt={file.title}
              className="max-h-full max-w-full rounded-2xl object-contain shadow-[0_30px_60px_-25px_rgba(0,0,0,0.6)]"
            />
          </div>
        );

      case 'video':
        return (
          <div className="flex h-full items-center justify-center bg-black p-6">
            <video
              src={file.file_url}
              controls
              className="max-h-full max-w-full rounded-2xl shadow-2xl"
            >
              مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
            </video>
          </div>
        );

      case 'audio':
        return (
          <div className="flex h-full flex-col items-center justify-center gap-7 p-8">
            <div className={`relative flex h-32 w-32 items-center justify-center rounded-full ${meta.bg} ring-8 ${meta.ring}`}>
              <span className="absolute inset-0 animate-ping rounded-full bg-amber-200/30" />
              <Music className={`relative h-16 w-16 ${meta.color}`} />
            </div>
            <p className="max-w-lg truncate text-sm font-semibold text-slate-700">
              {file.title || file.original_name}
            </p>
            <div className="w-full max-w-lg rounded-2xl bg-white p-3 ring-1 ring-slate-200">
              <audio src={file.file_url} controls className="w-full">
                مرورگر شما از پخش صوت پشتیبانی نمی‌کند.
              </audio>
            </div>
          </div>
        );

      case 'excel':
        return (
          <FallbackPane
            icon={FileSpreadsheet}
            title={file.original_name}
            hint="پیش‌نمایش فایل‌های اکسل نیاز به دانلود دارد"
            cta="دانلود و مشاهده"
          />
        );

      case 'database':
        return (
          <FallbackPane
            icon={Database}
            title="فایل دیتابیس"
            hint="این نوع فایل در مرورگر قابل نمایش نیست"
            cta="دانلود دیتابیس"
            extra={
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-[11px] text-slate-600" dir="ltr">
                  {file.original_name}
                </span>
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">
                  {formatSize(file.file_size)}
                </span>
              </div>
            }
          />
        );

      case 'code':
        return (
          <iframe
            src={file.file_url}
            className="h-full w-full border-0 bg-slate-900"
            title={file.original_name}
          />
        );

      case 'word':
      case 'powerpoint':
      case 'archive':
      case 'other':
      default:
        return (
          <FallbackPane
            icon={Icon}
            title={file.original_name}
            hint="پیش‌نمایش این نوع فایل پشتیبانی نمی‌شود"
            cta="دانلود فایل"
          />
        );
    }
  };

  const metaItems = [
    { icon: Calendar, label: 'تاریخ آپلود', value: formatDate(file.created_at), ltr: false },
    { icon: User, label: 'آپلودکننده', value: file.uploaded_by_name || '—', ltr: false },
    { icon: HardDrive, label: 'حجم', value: formatSize(file.file_size), ltr: false },
    { icon: FileIcon, label: 'نام فایل', value: file.original_name, ltr: true },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={file.title || file.original_name}
      dir="rtl"
      style={{ fontFamily: 'Vazirmatn, IRANSans, Tahoma, sans-serif' }}
    >
      <div
        className={`relative flex w-full flex-col overflow-hidden rounded-3xl bg-white shadow-[0_40px_90px_-30px_rgba(0,0,0,0.75)] ring-1 ring-white/10 transition-all duration-300 animate-in zoom-in-95 ${
          isFullscreen ? 'h-full max-w-none' : 'h-[90vh] max-w-6xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ═══════════════ Header ═══════════════ */}
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 bg-white/90 px-5 py-4 backdrop-blur-xl">
          <div className="flex min-w-0 flex-1 items-center gap-3.5">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${meta.bg} ring-4 ${meta.ring}`}>
              <Icon className={`h-5 w-5 ${meta.color}`} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-bold text-slate-800">
                {file.title || file.original_name}
              </h2>
              <div className="mt-1 flex items-center gap-2">
                <span className={`rounded-full ${meta.bg} ${meta.color} px-2 py-0.5 text-[10px] font-bold`}>
                  {meta.label}
                </span>
                <span className="text-[11px] text-slate-400">{formatSize(file.file_size)}</span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              title={isFullscreen ? 'خروج از تمام‌صفحه' : 'تمام‌صفحه'}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
              title="بستن (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* ═══════════════ Preview Area ═══════════════ */}
        <div className="min-h-0 flex-1 overflow-hidden bg-slate-100/70">
          {renderPreview()}
        </div>

        {/* ═══════════════ Info Footer ═══════════════ */}
        <footer className="shrink-0 border-t border-slate-100 bg-white px-5 py-4">
          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {metaItems.map((m) => {
              const MetaIcon = m.icon;
              return (
                <div
                  key={m.label}
                  className="flex items-center gap-2.5 rounded-2xl bg-slate-50/80 px-3 py-2 ring-1 ring-slate-100"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-slate-100">
                    <MetaIcon className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400">{m.label}</p>
                    <p
                      className="truncate text-xs font-semibold text-slate-700"
                      dir={m.ltr ? 'ltr' : undefined}
                      title={m.value}
                    >
                      {m.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={file.file_url}
              download={file.original_name}
              className="flex-1 md:flex-none"
            >
              <Button
                className="h-10 w-full rounded-xl px-5 text-xs text-white shadow-sm transition-colors md:w-auto"
                style={{ backgroundColor: BRAND.ink }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BRAND.inkSoft)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BRAND.ink)}
              >
                <Download className="ml-2 h-4 w-4" />
                دانلود
              </Button>
            </a>

            <a
              href={file.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 md:flex-none"
            >
              <Button variant="outline" className="h-10 w-full rounded-xl border-slate-200 text-xs text-slate-600 hover:bg-slate-50 md:w-auto">
                <ExternalLink className="ml-2 h-4 w-4" />
                باز کردن در تب جدید
              </Button>
            </a>

            <Button
              variant="outline"
              onClick={copyLink}
              className={`h-10 flex-1 rounded-xl border-slate-200 text-xs transition-colors md:flex-none md:w-auto ${
                copied ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {copied ? (
                <>
                  <Check className="ml-2 h-4 w-4" />
                  کپی شد!
                </>
              ) : (
                <>
                  <Copy className="ml-2 h-4 w-4" />
                  کپی لینک
                </>
              )}
            </Button>

            {onDelete && (
              <Button
                variant="outline"
                onClick={() => {
                  if (confirm('آیا از حذف این فایل مطمئن هستید؟')) {
                    onDelete(file.id);
                    onClose();
                  }
                }}
                className="h-10 flex-1 rounded-xl border-rose-200 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 md:w-auto md:flex-none"
              >
                <Trash2 className="ml-2 h-4 w-4" />
                حذف
              </Button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
