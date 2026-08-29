'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { DiscoveryWizard } from '@/components/discovery/DiscoveryWizard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, LogIn, X, TrendingUp, ArrowRight, Mail } from 'lucide-react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/store/auth-store';

function DiscoveryWizardContent() {
  const searchParams = useSearchParams();
  const assetId = searchParams.get('assetId') ? Number(searchParams.get('assetId')) : undefined;
  const { user } = useAuthStore();
  const isLoggedIn = !!user;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showValuationDialog, setShowValuationDialog] = useState(false);
  const [registeredAsset, setRegisteredAsset] = useState<{name: string, id: number, status?: string} | null>(null);
  const [timer, setTimer] = useState(15);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  
  // فیلدهای جدید برای ایمیل و session
  const [email, setEmail] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [emailSaved, setEmailSaved] = useState(false);

  // بارگذاری session_id و ایمیل ذخیره شده
  useEffect(() => {
    // دریافت یا ایجاد Session ID
    let sid = localStorage.getItem('discovery_session_id');
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem('discovery_session_id', sid);
    }
    setSessionId(sid);
    
    // چک کردن ایمیل ذخیره شده
    const savedEmail = localStorage.getItem('discovery_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setEmailSaved(true);
    }
  }, []);

  useEffect(() => {
    if (showPopup && timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
    if (timer === 0) {
      window.location.href = '/login';
    }
  }, [showPopup, timer]);

  const handleSaveEmail = () => {
    if (email) {
      localStorage.setItem('discovery_email', email);
      setEmailSaved(true);
      alert('✅ ایمیل شما ذخیره شد! با این ایمیل می‌توانید دارایی‌های خود را بعداً بازیابی کنید.');
    }
  };

  const handleComplete = async (assetName: string | any, answers: Record<string, boolean>, organizationType: string) => {
    setLoading(true);
    setError(null);
    
    let assetNameStr = assetName;
    if (typeof assetName === 'object' && assetName !== null) {
      assetNameStr = assetName.name || assetName.asset_name || assetName.title || 'دارایی بدون نام';
    }
    assetNameStr = String(assetNameStr);
    
    try {
      console.log('📤 ارسال به API:', { assetName: assetNameStr, organizationType, answers, email, sessionId });
      
      const response = await fetch('http://localhost:8000/api/intangible/external/discovery/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'cd5d16ad-01cf-4031-a8d9-65d3ddb050a4',
          'X-Source': 'discovery-wizard-public',
          'X-Session-ID': sessionId,
        },
        body: JSON.stringify({
          asset_name: assetNameStr,
          organization_type: organizationType,
          answers: answers,
          email: email,
          session_id: sessionId
        })
      });

      console.log('📥 پاسخ:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ خطای سرور:', errorData);
        throw new Error(errorData.error || `خطای ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ موفق:', data);
      
      setRegisteredAsset({
        name: assetNameStr,
        id: data.asset_id,
        status: 'CONFIRMED'
      });
      setIsRegistered(true);
      setIsConfirmed(true);
      
      setShowPopup(true);
      setTimer(15);
      
    } catch (err: any) {
      console.error('❌ خطا:', err);
      setError(err.message || 'خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  const handleValuationClick = () => {
    if (isLoggedIn) {
      window.location.href = '/dashboard/intangible/valuation';
    } else {
      setShowValuationDialog(true);
    }
  };

  const handleCloseValuationDialog = () => {
    setShowValuationDialog(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-dark-green">موتور شناسایی دارایی نامشهود</h1>
          <p className="text-sm text-gray-500 mt-2">
            ارزیابی دارایی بر اساس ۴ شرط اصلی (غیرفیزیکی بودن، شناسایی‌پذیری، کنترل منافع، ارزش‌آفرینی)
          </p>
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
            <span>🔓</span>
            <span>بدون نیاز به ورود - همه کاربران می‌توانند استفاده کنند</span>
          </div>
          {isLoggedIn && (
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">
              <span>✅</span>
              <span>شما وارد حساب کاربری خود شده‌اید</span>
            </div>
          )}
        </div>

        {/* بخش ایمیل */}
        <div className="mb-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-700">📧 بازیابی دارایی‌ها بعد از عضویت</span>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            با وارد کردن ایمیل، دارایی‌های ثبت شده شما حتی بعد از چند روز قابل بازیابی خواهد بود.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={emailSaved}
            />
            {!emailSaved ? (
              <Button 
                variant="outline"
                onClick={handleSaveEmail}
                disabled={!email}
                className="whitespace-nowrap"
              >
                ذخیره ایمیل
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">✅ ایمیل ذخیره شد</span>
              </div>
            )}
          </div>
          {emailSaved && (
            <p className="text-xs text-gray-400 mt-2">
              💡 ایمیل {email} برای بازیابی دارایی‌های شما ذخیره شده است.
            </p>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">❌ خطا: {error}</span>
            </div>
            <p className="text-sm text-red-600 mt-1">
              لطفاً مطمئن شوید که بک‌اند در حال اجراست (http://localhost:8000)
            </p>
          </div>
        )}

        <Card className="p-6 shadow-lg">
          <DiscoveryWizard 
            assetId={assetId} 
            onComplete={handleComplete}
            showSuggestions={false}
            loading={loading}
          />
        </Card>

        <div className="text-center mt-6 text-xs text-gray-400">
          <p>قدرت گرفته از پلتفرم مدیریت دارایی های نامشهود (META)</p>
          <p>📊 این ابزار به شما کمک می‌کند تا دارایی‌های نامشهود سازمان خود را شناسایی کنید</p>
        </div>
      </div>

      {showPopup && registeredAsset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-300">
            <button 
              onClick={handleClosePopup}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            </div>

            <h2 className="text-xl font-bold text-center text-dark-green mb-2">
              ✅ دارایی شما با موفقیت ثبت شد!
            </h2>

            <div className="space-y-3 text-center text-gray-700">
              <p className="text-sm">
                دارایی <span className="font-semibold">"{registeredAsset.name}"</span> با موفقیت در سامانه ثبت شد.
              </p>
              {email && (
                <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded-lg">
                  📧 یک کپی از این دارایی به ایمیل {email} ارسال خواهد شد.
                </p>
              )}
              {isConfirmed && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
                  <p className="text-sm text-green-800">
                    ✅ این دارایی به عنوان یک <span className="font-bold">دارایی نامشهود قطعی</span> شناسایی شده است.
                  </p>
                </div>
              )}
            </div>

            <Button 
              onClick={handleValuationClick}
              className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white"
            >
              <TrendingUp className="w-4 h-4 ml-2" />
              ارزیابی و ارزش‌گذاری دارایی
              <ArrowRight className="w-4 h-4 mr-2" />
            </Button>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-400">
                هدایت به صفحه ورود در {timer} ثانیه...
              </p>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-1000"
                  style={{ width: `${(15 - timer) / 15 * 100}%` }}
                />
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <button 
                onClick={handleClosePopup}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={showValuationDialog} onOpenChange={setShowValuationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl text-dark-green">
              🚀 برای ارزش‌گذاری دارایی خود وارد شوید
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600">
              برای ارزیابی و ارزش‌گذاری دارایی نامشهود خود، باید وارد 
              <span className="font-semibold text-blue-600"> پلتفرم مدیریت دارایی‌های نامشهود (META) </span>
              شوید.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-green-50 rounded-lg p-4 my-4 text-center">
            <p className="text-sm text-green-800">
              ✅ دارایی شما به عنوان یک <span className="font-bold">دارایی نامشهود قطعی</span> شناسایی شده است.
            </p>
            <p className="text-sm text-green-700 mt-1">
              برای ادامه فرآیند ارزش‌گذاری، لطفاً وارد حساب کاربری خود شوید.
            </p>
          </div>

          <DialogFooter className="flex flex-col gap-3 sm:flex-row">
            <Link href="/login" className="w-full">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                <LogIn className="w-4 h-4 ml-2" />
                ورود به پلتفرم META
              </Button>
            </Link>
            <Button 
              variant="outline" 
              onClick={handleCloseValuationDialog}
              className="w-full"
            >
              بعداً
            </Button>
          </DialogFooter>

          <p className="text-xs text-center text-gray-400 mt-4">
            🔒 اطلاعات شما با امنیت کامل ذخیره شده است
          </p>
        </DialogContent>
      </Dialog>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default function DiscoveryWizardPublicPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">در حال بارگذاری...</div>}>
      <DiscoveryWizardContent />
    </Suspense>
  );
}
