'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Gift, CheckCircle, Mail } from 'lucide-react';
import api from '@/lib/api';

export function ClaimAssetsButton() {
  const [loading, setLoading] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [count, setCount] = useState(0);
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [assets, setAssets] = useState<any[]>([]);

  useEffect(() => {
    const checkExternalAssets = async () => {
      try {
        const response = await api.get('/intangible/claim-external-assets/');
        if (response.data.count > 0) {
          setCount(response.data.count);
          setAssets(response.data.assets || []);
          setShow(true);
        }
      } catch (error) {
        console.error('Error checking external assets:', error);
      }
    };
    
    checkExternalAssets();
    
    const savedEmail = localStorage.getItem('discovery_email');
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const handleClaim = async () => {
    setLoading(true);
    try {
      const response = await api.post('/intangible/claim-external-assets/', {
        email: email
      });
      
      if (response.data.success) {
        setClaimed(true);
        setCount(response.data.count);
        setAssets(response.data.assets || []);
        localStorage.removeItem('discovery_session_id');
        localStorage.removeItem('discovery_email');
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    } catch (error) {
      console.error('Error claiming assets:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!show && !claimed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      {claimed ? (
        <div className="bg-green-100 border border-green-300 rounded-lg p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-medium text-green-800">✅ دارایی‌ها متصل شدند!</p>
              <p className="text-sm text-green-700">{count} دارایی به حساب شما اضافه شد</p>
            </div>
          </div>
          {assets.length > 0 && (
            <div className="mt-2 text-sm text-green-700">
              {assets.map((asset: any) => (
                <div key={asset.id} className="flex items-center gap-2 py-1 border-b border-green-200 last:border-0">
                  <span>📦 {asset.asset_name}</span>
                  <span className="text-xs bg-green-200 px-2 py-0.5 rounded">
                    {asset.result === 'confirmed' ? 'قطعی' : 'مشروط'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border rounded-lg p-4 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="w-5 h-5 text-blue-600" />
            <span className="font-medium">دارایی‌های ثبت شده قبلی</span>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            {count} دارایی ثبت شده با ایمیل <span className="font-semibold">{email || 'شما'}</span> پیدا شد.
          </p>
          {assets.length > 0 && (
            <div className="max-h-32 overflow-y-auto mb-3">
              {assets.map((asset: any) => (
                <div key={asset.id} className="text-xs text-gray-600 py-1 border-b border-gray-100">
                  📦 {asset.asset_name}
                </div>
              ))}
            </div>
          )}
          <Button
            onClick={handleClaim}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            ) : (
              <Mail className="w-4 h-4 ml-2" />
            )}
            اتصال به حساب کاربری
          </Button>
        </div>
      )}
    </div>
  );
}
