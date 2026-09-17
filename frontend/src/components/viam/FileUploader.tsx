/**
 * 📁 FileUploader — کامپوننت آپلود فایل با Drag & Drop و Preview
 */
'use client';

import { useState, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Upload, X, FileText, Image as ImageIcon, Video, Music,
  File as FileIcon, Loader2, CheckCircle, AlertCircle,
  FileSpreadsheet, Presentation, Database, Archive, Code,
} from 'lucide-react';
import { viamUploadsApi } from '@/services/viam/uploads';

interface FileUploaderProps {
  section: 'strategic_planning' | 'culture' | 'empowerment' | 'performance';
  onSuccess?: (file: any) => void;
  onError?: (error: any) => void;
}

export function FileUploader({ section, onSuccess, onError }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<Array<{
    id: string;
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
    preview?: string;
    title: string;
  }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // تشخیص نوع فایل
  const getFileType = (file: File): string => {
    const name = file.name.toLowerCase();
    if (name.endsWith('.pdf')) return 'pdf';
    if (name.match(/\.(doc|docx)$/)) return 'word';
    if (name.match(/\.(xls|xlsx|csv)$/)) return 'excel';
    if (name.match(/\.(ppt|pptx)$/)) return 'powerpoint';
    if (name.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/)) return 'image';
    if (name.match(/\.(mp4|mov|avi|mkv|webm|flv|wmv)$/)) return 'video';
    if (name.match(/\.(mp3|wav|ogg|m4a|aac|flac)$/)) return 'audio';
    if (name.match(/\.(db|sqlite|sqlite3|mdb|accdb|sql|dbf)$/)) return 'database';
    if (name.match(/\.(zip|rar|7z|tar|gz)$/)) return 'archive';
    if (name.match(/\.(py|js|ts|jsx|tsx|java|cpp|c|html|css|json|xml|yaml|yml)$/)) return 'code';
    return 'other';
  };

  // فرمت حجم
  const formatSize = (bytes: number) => {
    if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
    if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(2)} MB`;
    if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(2)} KB`;
    return `${bytes} B`;
  };

  // آیکن و رنگ
  const getFileMeta = (type: string) => {
    const meta: Record<string, { icon: any; color: string; bg: string; label: string }> = {
      pdf: { icon: FileText, color: 'text-red-600', bg: 'bg-red-50', label: 'PDF' },
      word: { icon: FileIcon, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Word' },
      excel: { icon: FileSpreadsheet, color: 'text-green-600', bg: 'bg-green-50', label: 'اکسل' },
      powerpoint: { icon: Presentation, color: 'text-orange-600', bg: 'bg-orange-50', label: 'پاورپوینت' },
      image: { icon: ImageIcon, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'تصویر' },
      video: { icon: Video, color: 'text-purple-600', bg: 'bg-purple-50', label: 'ویدیو' },
      audio: { icon: Music, color: 'text-amber-600', bg: 'bg-amber-50', label: 'صوت' },
      database: { icon: Database, color: 'text-cyan-600', bg: 'bg-cyan-50', label: 'دیتابیس' },
      archive: { icon: Archive, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'آرشیو' },
      code: { icon: Code, color: 'text-indigo-600', bg: 'bg-indigo-50', label: 'کد' },
      other: { icon: FileIcon, color: 'text-gray-600', bg: 'bg-gray-50', label: 'فایل' },
    };
    return meta[type] || meta.other;
  };

  // ساخت پیش‌نمایش
  const createPreview = (file: File, type: string): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (type === 'image') {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        resolve(undefined);
      }
    });
  };

  // پردازش فایل‌ها
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newUploads = await Promise.all(
      fileArray.map(async (file, idx) => {
        const type = getFileType(file);
        const preview = await createPreview(file, type);
        return {
          id: `${Date.now()}-${idx}-${file.name}`,
          file,
          progress: 0,
          status: 'pending' as const,
          preview,
          title: file.name.replace(/\.[^/.]+$/, ''),
        };
      })
    );

    setUploads((prev) => [...prev, ...newUploads]);

    // شروع آپلود خودکار
    for (const up of newUploads) {
      await uploadOne(up.id, up.file, up.title);
    }
  }, []);

  // آپلود یه فایل
  const uploadOne = async (id: string, file: File, title: string) => {
    setUploads((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: 'uploading' as const } : u))
    );

    const formData = new FormData();
    formData.append('file', file);
    formData.append('section', section);
    formData.append('title', title || file.name);

    try {
      const res = await viamUploadsApi.upload(formData, (percent) => {
        setUploads((prev) =>
          prev.map((u) => (u.id === id ? { ...u, progress: percent } : u))
        );
      });

      setUploads((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, status: 'success' as const, progress: 100 } : u
        )
      );

      if (onSuccess) onSuccess(res.data);

      // حذف خودکار بعد از ۳ ثانیه
      setTimeout(() => {
        setUploads((prev) => prev.filter((u) => u.id !== id));
      }, 3000);
    } catch (err: any) {
      setUploads((prev) =>
        prev.map((u) =>
          u.id === id
            ? {
                ...u,
                status: 'error' as const,
                error: err?.response?.data?.error || 'خطا در آپلود',
              }
            : u
        )
      );
      if (onError) onError(err);
    }
  };

  // Drag handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const removeUpload = (id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* ─── Drag & Drop Zone ─── */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative cursor-pointer rounded-2xl border-2 border-dashed
          transition-all duration-300 overflow-hidden
          ${
            isDragging
              ? 'border-[#04241D] bg-[#04241D]/5 scale-[1.02] shadow-lg'
              : 'border-gray-300 bg-gradient-to-br from-gray-50 to-white hover:border-[#04241D]/50 hover:bg-[#04241D]/[0.02]'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.svg,.bmp,.tiff,.mp4,.mov,.avi,.mkv,.webm,.flv,.wmv,.mp3,.wav,.ogg,.m4a,.aac,.flac,.db,.sqlite,.sqlite3,.mdb,.accdb,.sql,.dbf,.zip,.rar,.7z,.tar,.gz,.py,.js,.ts,.jsx,.tsx,.java,.cpp,.c,.html,.css,.json,.xml,.yaml,.yml"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="px-8 py-12 text-center">
          <div
            className={`
              mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl
              transition-all duration-300
              ${isDragging ? 'bg-[#04241D] scale-110' : 'bg-[#04241D]/10'}
            `}
          >
            <Upload
              className={`h-8 w-8 transition-colors ${
                isDragging ? 'text-white' : 'text-[#04241D]'
              }`}
            />
          </div>

          <h3 className="text-lg font-bold text-gray-800 mb-2">
            {isDragging ? '📥 رها کنید!' : '📁 فایل‌های خود را اینجا بکشید'}
          </h3>

          <p className="text-sm text-gray-500 mb-4">
            یا برای انتخاب کلیک کنید
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { label: 'PDF', color: 'bg-red-100 text-red-700' },
              { label: 'Word', color: 'bg-blue-100 text-blue-700' },
              { label: 'اکسل', color: 'bg-green-100 text-green-700' },
              { label: 'پاورپوینت', color: 'bg-orange-100 text-orange-700' },
              { label: 'تصویر', color: 'bg-emerald-100 text-emerald-700' },
              { label: 'ویدیو', color: 'bg-purple-100 text-purple-700' },
              { label: 'صوت', color: 'bg-amber-100 text-amber-700' },
              { label: 'دیتابیس', color: 'bg-cyan-100 text-cyan-700' },
              { label: 'آرشیو', color: 'bg-yellow-100 text-yellow-700' },
            ].map((t) => (
              <span
                key={t.label}
                className={`text-[10px] font-bold px-2 py-1 rounded-full ${t.color}`}
              >
                {t.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Uploads List with Preview ─── */}
      {uploads.length > 0 && (
        <div className="space-y-3">
          {uploads.map((up) => {
            const type = getFileType(up.file);
            const meta = getFileMeta(type);
            const Icon = meta.icon;

            return (
              <Card
                key={up.id}
                className={`
                  overflow-hidden border-2 transition-all
                  ${
                    up.status === 'success'
                      ? 'border-green-200 bg-green-50/30'
                      : up.status === 'error'
                      ? 'border-red-200 bg-red-50/30'
                      : 'border-gray-200'
                  }
                `}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* ─── Preview ─── */}
                    <div className="shrink-0">
                      {up.preview ? (
                        <div className="relative h-20 w-20 rounded-xl overflow-hidden border-2 border-white shadow-md">
                          <img
                            src={up.preview}
                            alt={up.file.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          className={`
                            flex h-20 w-20 items-center justify-center
                            rounded-xl border-2 border-white shadow-md
                            ${meta.bg}
                          `}
                        >
                          <Icon className={`h-8 w-8 ${meta.color}`} />
                        </div>
                      )}
                    </div>

                    {/* ─── Info ─── */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-gray-800 truncate">
                            {up.file.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}
                            >
                              {meta.label}
                            </span>
                            <span className="text-[11px] text-gray-500">
                              {formatSize(up.file.size)}
                            </span>
                          </div>
                        </div>

                        {/* ─── Status Icon ─── */}
                        <div className="shrink-0">
                          {up.status === 'uploading' && (
                            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                          )}
                          {up.status === 'success' && (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          )}
                          {up.status === 'error' && (
                            <AlertCircle className="h-5 w-5 text-red-600" />
                          )}
                          {up.status === 'pending' && (
                            <button
                              onClick={() => removeUpload(up.id)}
                              className="text-gray-400 hover:text-red-500 transition"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* ─── Progress Bar ─── */}
                      {up.status === 'uploading' && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-medium text-blue-700">
                              در حال آپلود...
                            </span>
                            <span className="text-[10px] font-bold text-blue-700">
                              {up.progress}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-l from-[#04241D] to-[#0B4A3C] transition-all duration-300"
                              style={{ width: `${up.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* ─── Success Message ─── */}
                      {up.status === 'success' && (
                        <p className="mt-2 text-xs font-medium text-green-700">
                          ✅ با موفقیت آپلود شد
                        </p>
                      )}

                      {/* ─── Error Message ─── */}
                      {up.status === 'error' && (
                        <p className="mt-2 text-xs font-medium text-red-700">
                          ❌ {up.error}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
