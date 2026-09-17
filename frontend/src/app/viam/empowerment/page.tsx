'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  GraduationCap, FileText, Image as ImageIcon, Video, Music, Trash2,
  Download, Eye, Search, RefreshCw, Loader2, HardDrive, Calendar, User,
  FileSpreadsheet, Presentation, Database, Archive, Code,
  ArrowRight, UploadCloud, SlidersHorizontal, FolderOpen,
} from 'lucide-react';
import { FileUploader } from '@/components/viam/FileUploader';
import { FilePreviewModal } from '@/components/viam/FilePreviewModal';
import { viamUploadsApi, VIAMUpload } from '@/services/viam/uploads';

/* ───────────────────────── Design tokens ───────────────────────── */
const BRAND = {
  ink: '#04241D',
  inkSoft: '#0B4A3C',
  gold: '#D9B65D',
  goldSoft: '#F2D27E',
};

export default function EmpowermentPage() {
  const [uploads, setUploads] = useState<VIAMUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewFile, setPreviewFile] = useState<VIAMUpload | null>(null);

  // تبدیل اعداد به فارسی
  const toFa = (num: number | string): string => {
    return String(num).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
  };

  const loadUploads = async () => {
    setLoading(true);
    try {
      const res = await viamUploadsApi.list({ section: 'empowerment' });
      setUploads(res.data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUploads();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('آیا از حذف این فایل مطمئن هستید؟')) return;
    try {
      await viamUploadsApi.delete(id);
      setUploads((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      alert('خطا در حذف');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1e9) return `${toFa((bytes / 1e9).toFixed(2))} گیگابایت`;
    if (bytes >= 1e6) return `${toFa((bytes / 1e6).toFixed(2))} مگابایت`;
    if (bytes >= 1e3) return `${toFa((bytes / 1e3).toFixed(2))} کیلوبایت`;
    return `${toFa(bytes)} بایت`;
  };

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return date;
    }
  };

  const getFileIcon = (type: string) => {
    const map: Record<string, { icon: any; color: string; bg: string; ring: string }> = {
      pdf:        { icon: FileText,        color: 'text-rose-600',    bg: 'bg-rose-50',    ring: 'ring-rose-100' },
      word:       { icon: FileText,        color: 'text-blue-600',    bg: 'bg-blue-50',    ring: 'ring-blue-100' },
      excel:      { icon: FileSpreadsheet, color: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-100' },
      powerpoint: { icon: Presentation,    color: 'text-orange-600',  bg: 'bg-orange-50',  ring: 'ring-orange-100' },
      image:      { icon: ImageIcon,       color: 'text-teal-600',    bg: 'bg-teal-50',    ring: 'ring-teal-100' },
      video:      { icon: Video,           color: 'text-violet-600',  bg: 'bg-violet-50',  ring: 'ring-violet-100' },
      audio:      { icon: Music,           color: 'text-amber-600',   bg: 'bg-amber-50',   ring: 'ring-amber-100' },
      database:   { icon: Database,        color: 'text-cyan-600',    bg: 'bg-cyan-50',    ring: 'ring-cyan-100' },
      archive:    { icon: Archive,         color: 'text-yellow-600',  bg: 'bg-yellow-50',  ring: 'ring-yellow-100' },
      code:       { icon: Code,            color: 'text-indigo-600',  bg: 'bg-indigo-50',  ring: 'ring-indigo-100' },
      other:      { icon: FileText,        color: 'text-slate-600',   bg: 'bg-slate-50',   ring: 'ring-slate-100' },
    };
    return map[type] || map.other;
  };

  const filteredUploads = uploads.filter((u) => {
    if (filterType !== 'all' && u.file_type !== filterType) return false;
    if (searchTerm && !u.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !u.original_name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const stats = {
    total: uploads.length,
    pdf: uploads.filter((u) => u.file_type === 'pdf').length,
    word: uploads.filter((u) => u.file_type === 'word').length,
    excel: uploads.filter((u) => u.file_type === 'excel').length,
    powerpoint: uploads.filter((u) => u.file_type === 'powerpoint').length,
    image: uploads.filter((u) => u.file_type === 'image').length,
    video: uploads.filter((u) => u.file_type === 'video').length,
    audio: uploads.filter((u) => u.file_type === 'audio').length,
    database: uploads.filter((u) => u.file_type === 'database').length,
  };

  const totalSize = uploads.reduce((sum, u) => sum + (u.file_size || 0), 0);

  const FILTERS = [
    { key: 'all', label: 'همه' },
    { key: 'pdf', label: 'PDF' },
    { key: 'word', label: 'Word' },
    { key: 'excel', label: 'اکسل' },
    { key: 'powerpoint', label: 'PPT' },
    { key: 'image', label: 'تصویر' },
    { key: 'video', label: 'ویدیو' },
    { key: 'audio', label: 'صوت' },
    { key: 'database', label: 'دیتابیس' },
  ];

  return (
    <div
      className="min-h-screen bg-[#FAFAF9]"
      style={{ fontFamily: 'Vazirmatn, IRANSans, Tahoma, sans-serif' }}
      dir="rtl"
    >
      <div className="container mx-auto max-w-7xl px-4 py-8 space-y-7">

        {/* ─── بازگشت ─── */}
        <Link
          href="/dashboard"
          className="group inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#04241D] transition-colors"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition-all group-hover:border-[#04241D]/30 group-hover:shadow">
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          </span>
          <span className="font-medium">بازگشت به داشبورد</span>
        </Link>

        {/* ─── هدر ─── */}
        <header className="relative overflow-hidden rounded-3xl p-7 md:p-9 text-white shadow-[0_20px_50px_-20px_rgba(4,36,29,0.55)]"
          style={{ background: `linear-gradient(135deg, ${BRAND.ink} 0%, ${BRAND.inkSoft} 55%, #0d5a49 100%)` }}
        >
          {/* بافت نوری */}
          <div className="pointer-events-none absolute -top-28 -right-16 h-72 w-72 rounded-full bg-white/[0.07] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -left-10 h-72 w-72 rounded-full bg-[#D9B65D]/15 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.15]"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,.5) 1px, transparent 0)', backgroundSize: '22px 22px' }}
          />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
                <GraduationCap className="h-7 w-7" style={{ color: BRAND.goldSoft }} />
              </div>
              <div className="pt-0.5">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
                  VIAM · مدیریت اسناد
                </p>
                <h1 className="text-2xl md:text-[28px] font-bold leading-tight">
                  توانمندسازی و گواهی حرفه‌ای
                </h1>
                <p className="mt-1.5 text-sm text-white/65">
                  آپلود، سازمان‌دهی و مدیریت اسناد آموزشی و گواهی‌نامه‌ها
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end rounded-2xl bg-white/[0.07] px-4 py-2 ring-1 ring-white/10">
                <span className="text-[10px] text-white/50">حجم کل</span>
                <span className="text-sm font-bold" style={{ color: BRAND.goldSoft }}>
                  {formatSize(totalSize)}
                </span>
              </div>
              <Button
                onClick={loadUploads}
                variant="outline"
                size="sm"
                className="h-10 rounded-xl border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
              >
                <RefreshCw className={`ml-1.5 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                بروزرسانی
              </Button>
            </div>
          </div>

          {/* ─── آمار ─── */}
          <div className="relative mt-7 grid grid-cols-3 gap-2.5 sm:grid-cols-5 lg:grid-cols-9">
            {[
              { label: 'کل فایل‌ها', value: stats.total, dot: '#F2D27E' },
              { label: 'PDF', value: stats.pdf, dot: '#fda4af' },
              { label: 'Word', value: stats.word, dot: '#93c5fd' },
              { label: 'اکسل', value: stats.excel, dot: '#6ee7b7' },
              { label: 'PPT', value: stats.powerpoint, dot: '#fdba74' },
              { label: 'تصویر', value: stats.image, dot: '#5eead4' },
              { label: 'ویدیو', value: stats.video, dot: '#c4b5fd' },
              { label: 'صوت', value: stats.audio, dot: '#fcd34d' },
              { label: 'دیتابیس', value: stats.database, dot: '#67e8f9' },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl bg-white/[0.07] px-3 py-2.5 ring-1 ring-white/10 backdrop-blur-sm transition-colors hover:bg-white/[0.12]"
              >
                <div className="mb-1 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
                  <p className="truncate text-[10px] text-white/55">{s.label}</p>
                </div>
                <p className="text-xl font-bold leading-none text-white">{toFa(s.value)}</p>
              </div>
            ))}
          </div>
        </header>

        {/* ─── آپلودر ─── */}
        <Card className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_2px_20px_-12px_rgba(0,0,0,0.25)]">
          <CardContent className="p-6 md:p-7">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#04241D]/[0.06] ring-1 ring-[#04241D]/10">
                <UploadCloud className="h-4.5 w-4.5 text-[#04241D]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">آپلود فایل جدید</h2>
                <p className="text-xs text-slate-400">فایل را بکشید و رها کنید یا از دکمه انتخاب استفاده کنید</p>
              </div>
            </div>
            <FileUploader
              section="empowerment"
              onSuccess={() => loadUploads()}
            />
          </CardContent>
        </Card>

        {/* ─── فیلترها ─── */}
        <div className="sticky top-4 z-20">
          <Card className="rounded-2xl border border-slate-200/80 bg-white/85 shadow-sm backdrop-blur-xl">
            <CardContent className="p-3.5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-[220px] flex-1">
                  <Search className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="جستجو در عنوان یا نام فایل..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pr-10 pl-3 text-sm outline-none transition-all placeholder:text-slate-300 focus:border-[#04241D]/40 focus:bg-white focus:ring-4 focus:ring-[#04241D]/[0.07]"
                  />
                </div>

                <div className="flex items-center gap-1 rounded-xl bg-slate-100/80 p-1">
                  <SlidersHorizontal className="mr-1 h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <div className="flex flex-wrap gap-1">
                    {FILTERS.map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setFilterType(t.key)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                          filterType === t.key
                            ? 'bg-[#04241D] text-white shadow-sm'
                            : 'text-slate-500 hover:bg-white hover:text-slate-800'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── لیست فایل‌ها ─── */}
        {loading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white">
                <div className="h-36 animate-pulse bg-slate-100" />
                <div className="space-y-2.5 p-5">
                  <div className="h-3.5 w-3/4 animate-pulse rounded bg-slate-100" />
                  <div className="h-2.5 w-1/2 animate-pulse rounded bg-slate-100" />
                  <div className="h-2.5 w-2/3 animate-pulse rounded bg-slate-50" />
                </div>
              </div>
            ))}
            <div className="col-span-full flex items-center justify-center gap-2 py-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              در حال بارگذاری...
            </div>
          </div>
        ) : filteredUploads.length === 0 ? (
          <Card className="rounded-3xl border-2 border-dashed border-slate-200 bg-white/60">
            <CardContent className="p-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-slate-100">
                <FolderOpen className="h-7 w-7 text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-600">
                {uploads.length === 0 ? 'هنوز فایلی آپلود نشده است' : 'فایلی با این فیلتر پیدا نشد'}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {uploads.length === 0
                  ? 'اولین سند آموزشی خود را از بخش بالا بارگذاری کنید'
                  : 'عبارت جستجو یا نوع فایل را تغییر دهید'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between px-1">
              <p className="text-xs text-slate-400">
                نمایش <span className="font-bold text-slate-600">{toFa(filteredUploads.length)}</span> فایل
                از <span className="font-bold text-slate-600">{toFa(uploads.length)}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredUploads.map((u) => {
                const meta = getFileIcon(u.file_type);
                const Icon = meta.icon;

                return (
                  <Card
                    key={u.id}
                    className="group overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 hover:border-[#04241D]/15 hover:shadow-[0_24px_40px_-24px_rgba(4,36,29,0.4)]"
                  >
                    <CardContent className="p-0">
                      {/* پیش‌نمایش */}
                      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100">
                        {u.file_type === 'image' ? (
                          <img
                            src={u.file_url}
                            alt={u.title}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${meta.bg} ring-4 ${meta.ring} transition-transform duration-300 group-hover:scale-105`}>
                              <Icon className={`h-8 w-8 ${meta.color}`} />
                            </div>
                          </div>
                        )}

                        {/* برچسب نوع */}
                        <div className={`absolute right-3 top-3 rounded-full ${meta.bg} ${meta.color} px-2.5 py-1 text-[10px] font-bold shadow-sm ring-1 ring-black/[0.03]`}>
                          {u.file_type_display}
                        </div>

                        {/* اکشن‌ها */}
                        <div className="absolute inset-0 flex items-center justify-center gap-2.5 bg-gradient-to-t from-[#04241D]/85 via-[#04241D]/45 to-transparent opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100">
                          <button
                            onClick={() => setPreviewFile(u)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-sm transition hover:bg-white/30"
                            title="پیش‌نمایش"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <a
                            href={u.file_url}
                            download={u.original_name}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-sm transition hover:bg-white/30"
                            title="دانلود"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/85 text-white ring-1 ring-white/20 transition hover:bg-rose-500"
                            title="حذف"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* اطلاعات */}
                      <div className="p-5">
                        <h3 className="mb-1 truncate text-sm font-bold text-slate-800">
                          {u.title || u.original_name}
                        </h3>
                        <p className="mb-4 truncate text-[11px] text-slate-400" dir="ltr">
                          {u.original_name}
                        </p>

                        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                          <span className="inline-flex items-center gap-1.5">
                            <HardDrive className="h-3.5 w-3.5 text-slate-300" />
                            {formatSize(u.file_size)}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-300" />
                            {formatDate(u.created_at)}
                          </span>
                        </div>

                        {u.uploaded_by_name && (
                          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[10px] text-slate-500 ring-1 ring-slate-100">
                            <User className="h-3 w-3 text-slate-300" />
                            {u.uploaded_by_name}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {/* ─── Modal ─── */}
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
