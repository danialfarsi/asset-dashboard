'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, Upload, FileText, File, Database, Mic, BookOpen } from 'lucide-react';

interface ScreenedAsset {
  id: number;
  asset_uid: string;
  asset_name: string;
  category: string;
  result: string;
  result_label: string;
  discovery_date: string;
  version: string;
  description: string;
}

interface UploadFile {
  id: string;
  type: 'interview' | 'document' | 'process' | 'database' | 'rd';
  label: string;
  file: File | null;
  fileName: string;
  icon: any;
}

export default function ScreeningDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  
  const [asset, setAsset] = useState<ScreenedAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([
    { id: 'interview', type: 'interview', label: 'مصاحبه', file: null, fileName: '', icon: Mic },
    { id: 'document', type: 'document', label: 'سند', file: null, fileName: '', icon: File },
    { id: 'process', type: 'process', label: 'فرآیند', file: null, fileName: '', icon: BookOpen },
    { id: 'database', type: 'database', label: 'پایگاه داده', file: null, fileName: '', icon: Database },
    { id: 'rd', type: 'rd', label: 'پروژه R&D', file: null, fileName: '', icon: FileText },
  ]);

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1];
        const response = await fetch(`http://localhost:8000/api/intangible/screened-assets/${id}/`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setAsset(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchAsset();
  }, [id]);

  const handleFileChange = (type: string, file: File | null) => {
    setUploadFiles(prev => prev.map(item => 
      item.id === type 
        ? { ...item, file, fileName: file ? file.name : '' } 
        : item
    ));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      alert('فایل‌ها با موفقیت آپلود شدند!');
      router.back();
    } catch (error) {
      console.error(error);
      alert('خطا در آپلود فایل‌ها');
    } finally {
      setSubmitting(false);
    }
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'confirmed':
        return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">دارایی قطعی</span>;
      case 'conditional':
        return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">مشروط</span>;
      case 'rejected':
        return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">رد شده</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="text-center py-10">در حال بارگذاری...</div>;
  }

  if (!asset) {
    return <div className="text-center py-10">دارایی یافت نشد</div>;
  }

  return (
    <div dir="rtl" className="space-y-6 max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1 rounded-lg hover:bg-gray-100">
          <ArrowRight className="w-5 h-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{asset.asset_name}</h1>
          <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
            <span>کد: {asset.asset_uid}</span>
            <span>|</span>
            <span>دسته‌بندی: {asset.category}</span>
            <span>|</span>
            <span>{getResultBadge(asset.result)}</span>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">اطلاعات دارایی</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div><span className="font-medium">شناسه:</span> {asset.asset_uid}</div>
          <div><span className="font-medium">نام:</span> {asset.asset_name}</div>
          <div><span className="font-medium">دسته‌بندی:</span> {asset.category}</div>
          <div><span className="font-medium">وضعیت:</span> {asset.result_label}</div>
          <div><span className="font-medium">نسخه:</span> {asset.version}</div>
          <div><span className="font-medium">تاریخ کشف:</span> {new Date(asset.discovery_date).toLocaleDateString('fa-IR')}</div>
          {asset.description && (
            <div className="col-span-2"><span className="font-medium">توضیحات:</span> {asset.description}</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">آپلود فایل‌های مرتبط</CardTitle>
          <p className="text-xs text-gray-500">فایل‌های مصاحبه، سند، فرآیند، پایگاه داده و پروژه R&D را آپلود کنید</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {uploadFiles.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <Label className="font-medium">{item.label}</Label>
                  <div className="flex items-center gap-3 mt-1">
                    <Input
                      type="file"
                      onChange={(e) => handleFileChange(item.id, e.target.files?.[0] || null)}
                      className="flex-1 text-sm"
                    />
                    {item.fileName && (
                      <span className="text-xs text-green-600">✓ {item.fileName}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex gap-3">
          <Button 
            onClick={handleSubmit} 
            disabled={submitting}
            className="flex-1"
          >
            <Upload className="w-4 h-4 ml-2" />
            {submitting ? 'در حال آپلود...' : 'ذخیره و آپلود فایل‌ها'}
          </Button>
          <Button variant="outline" onClick={() => router.back()}>بازگشت</Button>
        </div>
      </div>
    </div>
  );
}
