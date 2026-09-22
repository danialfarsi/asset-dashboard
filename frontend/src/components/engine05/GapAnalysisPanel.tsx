'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, TrendingUp, AlertCircle, RefreshCw, BarChart3, Lightbulb } from 'lucide-react';
import { engine05Api } from '@/services/engine05/api';

export function GapAnalysisPanel() {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [ideas, setIdeas] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedOpps, setSelectedOpps] = useState<number[]>([]);
  const [backlogOpps, setBacklogOpps] = useState<any[]>([]);
  const [selectedBacklog, setSelectedBacklog] = useState<number[]>([]);
  const [restoring, setRestoring] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeView, setActiveView] = useState('matrix');

  const loadData = async () => {
    setLoading(true);
    try {
      const [oppRes, ideasRes, oppStatsRes, ideasStatsRes, backlogRes] = await Promise.all([
        engine05Api.getOpportunities({ status: 'identified' }),
        engine05Api.getIdeas(),
        engine05Api.getOpportunitiesStats(),
        engine05Api.getIdeasStats(),
        engine05Api.getOpportunities({ status: 'backlog' }),
      ]);
      setOpportunities(oppRes.data.results || []);
      setIdeas(ideasRes.data.results || []);
      setBacklogOpps(backlogRes.data.results || []);
      setStats({
        opportunities: oppStatsRes.data,
        ideas: ideasStatsRes.data,
      });
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 🆕 تحلیل شکاف — ساخت فرصت‌های جدید از ارزیابی‌های completed
  const handleAnalyze = async () => {
    if (!confirm('تحلیل شکاف روی همه دارایی‌های سازمان اجرا می‌شود. ادامه؟')) return;

    setAnalyzing(true);
    try {
      // business_type توسط Backend از user خونده می‌شه
      const res = await engine05Api.analyzeAll({});
      const d = res.data || {};
      showToast(
        `✅ ${d.created || 0} فرصت جدید، ${d.updated || 0} آپدیت، ${d.skipped || 0} رد شد`,
        'success'
      );
      await loadData();
    } catch (err: any) {
      console.error('Analyze error:', err);
      showToast(
        err?.response?.data?.error || err?.response?.data?.detail || 'خطا در تحلیل شکاف',
        'error'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  // 🆕 تبدیل انتخاب‌شده‌ها به پروژه
  const handleCreateSelected = async () => {
    if (selectedOpps.length === 0) {
      showToast('هیچ فرصتی انتخاب نشده', 'error');
      return;
    }
    if (!confirm(`${selectedOpps.length} فرصت انتخاب‌شده به پروژه تبدیل می‌شن. ادامه؟`)) return;
    
    setCreating(true);
    let success = 0;
    const failures: { id: number; name: string; reason: string }[] = [];
    
    for (const oppId of selectedOpps) {
      const opp = opportunities.find(o => o.id === oppId);
      const oppName = opp?.asset_name || `فرصت #${oppId}`;
      try {
        await engine05Api.createProjectFromOpportunity(oppId, {});
        success++;
      } catch (err: any) {
        console.error(`Error on opp ${oppId}:`, err);
        const reason =
          err?.response?.data?.error ||
          err?.response?.data?.detail ||
          'خطای نامشخص';
        failures.push({ id: oppId, name: oppName, reason });
      }
    }
    
    setCreating(false);
    setSelectedOpps([]);
    await loadData();
    
    // پیام نهایی
    if (failures.length === 0) {
      showToast(`✅ ${success} پروژه ساخته شد`, 'success');
    } else if (success === 0 && failures.length === 1) {
      // فقط یه خطا — پیام کامل خطا رو نشون بده
      showToast(`❌ ${failures[0].name}: ${failures[0].reason}`, 'error');
    } else {
      // چند تا — خلاصه + جزئیات اولی
      const summary = `${success} موفق، ${failures.length} ناموفق`;
      const firstReason = failures[0].reason;
      showToast(`⚠️ ${summary} — ${failures[0].name}: ${firstReason}`, 'error');
      // جزئیات کامل توی کنسول
      console.table(failures);
    }
  };

  // 🆕 تبدیل فرصت‌ها و ایده‌ها به پروژه (گام ۲)
  const handleCreateProjects = async () => {
    if (!confirm('همه فرصت‌ها و ایده‌های این سازمان به پروژه تبدیل می‌شن. ادامه؟')) return;
    setCreating(true);
    try {
      const res = await engine05Api.createFromOpportunities({});
      const d = res.data || {};
      showToast(
        `✅ ${d.created || 0} پروژه جدید، ${d.updated || 0} آپدیت${d.errors ? `، ${d.errors} خطا` : ''}`,
        'success'
      );
      await loadData();
    } catch (err: any) {
      console.error('Create projects error:', err);
      showToast(
        err?.response?.data?.error || err?.response?.data?.detail || 'خطا در ساخت پروژه‌ها',
        'error'
      );
    } finally {
      setCreating(false);
    }
  };

  const toggleOpp = (id: number) => {
    setSelectedOpps(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // 🆕 بازگرداندن یه فرصت از backlog
  const handleRestore = async (id: number) => {
    if (!confirm('این فرصت به لیست اصلی بازگردد؟')) return;
    try {
      await engine05Api.restoreOpportunity(id);
      showToast('✅ فرصت بازگشت به لیست اصلی', 'success');
      await loadData();
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'خطا در بازگرداندن', 'error');
    }
  };

  // 🆕 بازگرداندن انتخاب‌شده‌های backlog
  const handleBulkRestore = async () => {
    if (selectedBacklog.length === 0) {
      showToast('هیچ فرصتی انتخاب نشده', 'error');
      return;
    }
    if (!confirm(`${selectedBacklog.length} فرصت بازگردانده می‌شوند. ادامه؟`)) return;
    setRestoring(true);
    try {
      const res = await engine05Api.bulkRestoreOpportunities(selectedBacklog);
      showToast(`✅ ${res.data.restored} فرصت بازگشت`, 'success');
      setSelectedBacklog([]);
      await loadData();
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'خطا', 'error');
    } finally {
      setRestoring(false);
    }
  };

  const toggleBacklog = (id: number) => {
    setSelectedBacklog(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  useEffect(() => { loadData(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#04241D]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className={`px-6 py-3 rounded-xl shadow-lg border-2 flex items-center gap-3 ${
            toast.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <span>{toast.type === 'success' ? '✅' : '❌'}</span>
            <span className="font-medium text-sm">{toast.message}</span>
          </div>
        </div>
      )}

      {/* بنر توضیحی درباره آستانه */}
      {opportunities.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 flex items-start gap-2">
          <span className="text-base">ℹ️</span>
          <span>
            فرصت‌هایی که امتیاز پیش‌بینی‌شده‌شان زیر حداقل امتیاز مورد نیاز سازمان باشد،
            قابل تبدیل به پروژه نیستند و در صورت تلاش برای تبدیل، به لیست «بازبینی» منتقل می‌شوند.
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Target className="w-5 h-5" />} title="فرصت‌های توسعه" value={stats?.opportunities?.total || 0} color="blue" />
        <StatCard icon={<AlertCircle className="w-5 h-5" />} title="فرصت‌های بحرانی" value={stats?.opportunities?.critical || 0} color="red" />
        <StatCard icon={<TrendingUp className="w-5 h-5" />} title="ایده‌های نوآوری" value={stats?.ideas?.total || 0} color="purple" />
        <StatCard icon={<Lightbulb className="w-5 h-5" />} title="در حال اجرا" value={(stats?.opportunities?.by_status?.in_progress || 0) + (stats?.ideas?.by_status?.in_progress || 0)} color="green" />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button variant={activeView === 'matrix' ? 'default' : 'outline'} size="sm" onClick={() => setActiveView('matrix')} className={activeView === 'matrix' ? 'bg-[#04241D]' : ''}>
            <BarChart3 className="w-4 h-4 ml-1" /> ماتریس ۴ ربعی
          </Button>
          <Button variant={activeView === 'opportunities' ? 'default' : 'outline'} size="sm" onClick={() => setActiveView('opportunities')} className={activeView === 'opportunities' ? 'bg-[#04241D]' : ''}>
            <Target className="w-4 h-4 ml-1" /> فرصت‌ها ({opportunities.length})
          </Button>
          {backlogOpps.length > 0 && (
            <Button 
              variant={activeView === 'backlog' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setActiveView('backlog')} 
              className={activeView === 'backlog' ? 'bg-amber-600' : 'border-amber-300 text-amber-700'}
            >
              <AlertCircle className="w-4 h-4 ml-1" /> بازبینی ({backlogOpps.length})
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleAnalyze}
            disabled={analyzing}
            className="bg-[#04241D] hover:bg-[#063028] text-white"
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-4 h-4 ml-1 animate-spin" /> در حال تحلیل...
              </>
            ) : (
              <>
                <Target className="w-4 h-4 ml-1" /> تحلیل شکاف
              </>
            )}
          </Button>
          <Button
            size="sm"
            onClick={handleCreateProjects}
            disabled={creating || opportunities.length === 0}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {creating ? (
              <>
                <RefreshCw className="w-4 h-4 ml-1 animate-spin" /> در حال ساخت...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4 ml-1" /> تبدیل به پروژه
              </>
            )}
          </Button>
          {activeView === 'backlog' && selectedBacklog.length > 0 && (
            <Button
              size="sm"
              onClick={handleBulkRestore}
              disabled={restoring}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {restoring ? (
                <>
                  <RefreshCw className="w-4 h-4 ml-1 animate-spin" /> در حال بازگرداندن...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 ml-1" /> بازگرداندن ({selectedBacklog.length})
                </>
              )}
            </Button>
          )}
          {activeView !== 'backlog' && selectedOpps.length > 0 && (
            <Button
              size="sm"
              onClick={handleCreateSelected}
              disabled={creating}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {creating ? (
                <>
                  <RefreshCw className="w-4 h-4 ml-1 animate-spin" /> در حال ساخت...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 ml-1" /> تبدیل انتخاب‌شده‌ها ({selectedOpps.length})
                </>
              )}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={loadData} disabled={analyzing || creating}>
            <RefreshCw className="w-4 h-4 ml-1" /> بروزرسانی
          </Button>
        </div>
      </div>

      {activeView === 'matrix' && <QuadrantMatrix opportunities={opportunities} />}
      {activeView === 'opportunities' && (
        <OpportunitiesList 
          opportunities={opportunities} 
          selectedOpps={selectedOpps}
          onToggle={toggleOpp}
          onCreateProject={async (id) => {
            if (!confirm('این فرصت به پروژه تبدیل بشه؟')) return;
            try {
              await engine05Api.createProjectFromOpportunity(id, {});
              showToast('✅ پروژه ساخته شد', 'success');
              await loadData();
            } catch (err: any) {
              const msg = err?.response?.data?.error || 'خطا در تبدیل به پروژه';
              showToast(msg, 'error');
              // بعد از خطا هم دوباره لود کن (ممکنه وضعیت عوض شده باشه)
              await loadData();
            }
          }}
        />
      )}
      {activeView === 'backlog' && (
        <BacklogList 
          opportunities={backlogOpps}
          selectedBacklog={selectedBacklog}
          onToggle={toggleBacklog}
          onRestore={handleRestore}
        />
      )}
    </div>
  );
}

function StatCard({ icon, title, value, color }: any) {
  const colors: any = {
    blue: 'from-blue-50 to-blue-100 border-blue-200 text-blue-700',
    red: 'from-red-50 to-red-100 border-red-200 text-red-700',
    purple: 'from-purple-50 to-purple-100 border-purple-200 text-purple-700',
    green: 'from-green-50 to-green-100 border-green-200 text-green-700',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-5`}>
      <div className="opacity-70 mb-2">{icon}</div>
      <p className="text-xs text-gray-600 mb-1">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function QuadrantMatrix({ opportunities }: { opportunities: any[] }) {
  if (opportunities.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-14 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 ring-1 ring-gray-100">
          <BarChart3 className="h-7 w-7 text-gray-300" />
        </div>
        <p className="text-sm font-medium text-gray-500">هیچ فرصتی برای نمایش در ماتریس نیست</p>
      </div>
    );
  }

  const W = 920;
  const H = 610;
  const PAD = { top: 72, right: 48, bottom: 86, left: 118 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const gaps = opportunities.map(o => Number(o.gap_score) || 0);
  const values = opportunities.map(o => parseFloat(o.potential_value) || 0);

  const maxGap = Math.max(...gaps, 1) * 1.12;
  const maxValue = Math.max(...values, 1) * 1.12;

  // منطق قبلی حفظ شده: مرز ربع‌ها بر اساس میانگین داده‌هاست.
  const splitGap = gaps.reduce((sum, value) => sum + value, 0) / gaps.length || maxGap / 2;
  const splitValue = values.reduce((sum, value) => sum + value, 0) / values.length || maxValue / 2;

  const xScale = (gap: number) => PAD.left + (gap / maxGap) * innerW;
  const yScale = (value: number) => PAD.top + innerH - (value / maxValue) * innerH;

  const splitX = xScale(splitGap);
  const splitY = yScale(splitValue);
  const plotRight = PAD.left + innerW;
  const plotBottom = PAD.top + innerH;

  const formatMoney = (value: number) => {
    if (value >= 1e9) {
      return `${(value / 1e9).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} م.ر`;
    }
    if (value >= 1e6) {
      return `${(value / 1e6).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} م.ت`;
    }
    return value.toLocaleString('fa-IR', { maximumFractionDigits: 0 });
  };

  const truncate = (value: string, max = 25) =>
    value.length > max ? `${value.slice(0, max)}…` : value;

  // مختصات واقعی نقاط؛ خود نقطه‌ها جابه‌جا نمی‌شوند.
  const pointLayout = opportunities.map((opp, index) => {
    const gap = Number(opp.gap_score) || 0;
    const value = parseFloat(opp.potential_value) || 0;
    return {
      ...opp,
      _index: index,
      _gap: gap,
      _value: value,
      _x: xScale(gap),
      _y: yScale(value),
    };
  });

  const xTicks = [0, 0.25, 0.5, 0.75, 1];
  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  const quadrants = [
    {
      key: 'strategic',
      title: 'پروژه‌های استراتژیک',
      subtitle: 'ارزش بالا · شکاف کم',
      x: PAD.left,
      y: PAD.top,
      width: splitX - PAD.left,
      height: splitY - PAD.top,
      fill: '#F2F7FF',
      stroke: '#CFE0FF',
      text: '#315B9A',
    },
    {
      key: 'quick',
      title: 'برندگان فوری',
      subtitle: 'ارزش بالا · شکاف بالا',
      x: splitX,
      y: PAD.top,
      width: plotRight - splitX,
      height: splitY - PAD.top,
      fill: '#F0F8F5',
      stroke: '#CDE9DD',
      text: '#176B52',
    },
    {
      key: 'hold',
      title: 'معلق یا حذفی',
      subtitle: 'ارزش کم · شکاف کم',
      x: PAD.left,
      y: splitY,
      width: splitX - PAD.left,
      height: plotBottom - splitY,
      fill: '#FFF5F5',
      stroke: '#F4D6D6',
      text: '#9B3B3B',
    },
    {
      key: 'optimize',
      title: 'بهینه‌سازی کم‌هزینه',
      subtitle: 'ارزش کم · شکاف بالا',
      x: splitX,
      y: splitY,
      width: plotRight - splitX,
      height: plotBottom - splitY,
      fill: '#FFFBEE',
      stroke: '#F3E5B8',
      text: '#8A6715',
    },
  ];

  // ─── چیدمان ضدهم‌پوشانی لیبل‌ها ───
  // برای هر نقطه چند موقعیت کاندید بررسی می‌شود و موقعیتی انتخاب می‌شود
  // که کمترین برخورد را با لیبل‌های قبلی، عنوان ربع‌ها و مرز نمودار داشته باشد.
  const LABEL_H = 36;
  const titleBoxes = quadrants.map(q => {
    const centerX = q.x + q.width / 2;
    const topQuadrant = q.y === PAD.top;
    const y = topQuadrant ? q.y + 16 : q.y + q.height - 52;
    const width = Math.min(Math.max(q.width - 30, 118), 176);
    return { x: centerX - width / 2, y, width, height: 38 };
  });

  type LabelBox = { x: number; y: number; width: number; height: number };
  const overlaps = (a: LabelBox, b: LabelBox, margin = 6) =>
    a.x < b.x + b.width + margin &&
    a.x + a.width + margin > b.x &&
    a.y < b.y + b.height + margin &&
    a.y + a.height + margin > b.y;

  const occupied: LabelBox[] = [...titleBoxes];
  const labelLayout: Record<number, LabelBox> = {};

  // نقاط نزدیک به هم اول چیده می‌شوند تا فضای اطراف خوشه‌ها بهتر تقسیم شود.
  const layoutOrder = [...pointLayout].sort((a, b) => a._y - b._y || a._x - b._x);

  layoutOrder.forEach(point => {
    const name = truncate(point.asset_name || `فرصت ${point.id}`);
    const width = Math.min(178, Math.max(108, name.length * 7 + 34));
    const half = width / 2;
    const gap = 18;

    const candidates = [
      { x: point._x - half, y: point._y - LABEL_H - gap },       // بالا
      { x: point._x - half, y: point._y + gap },                 // پایین
      { x: point._x + gap, y: point._y - LABEL_H / 2 },          // راست
      { x: point._x - width - gap, y: point._y - LABEL_H / 2 },  // چپ
      { x: point._x + 14, y: point._y - LABEL_H - 14 },          // بالا راست
      { x: point._x - width - 14, y: point._y - LABEL_H - 14 },  // بالا چپ
      { x: point._x + 14, y: point._y + 14 },                    // پایین راست
      { x: point._x - width - 14, y: point._y + 14 },            // پایین چپ
    ];

    let best: LabelBox | null = null;
    let bestScore = Number.POSITIVE_INFINITY;

    candidates.forEach((candidate, candidateIndex) => {
      const box: LabelBox = {
        x: Math.max(PAD.left + 6, Math.min(plotRight - width - 6, candidate.x)),
        y: Math.max(PAD.top + 6, Math.min(plotBottom - LABEL_H - 6, candidate.y)),
        width,
        height: LABEL_H,
      };

      const collisionCount = occupied.reduce(
        (count, other) => count + (overlaps(box, other) ? 1 : 0),
        0
      );

      // برخورد با خود نقطه یا نقاط دیگر هم جریمه دارد تا لیبل روی دایره ننشیند.
      const pointCollisionCount = pointLayout.reduce((count, other) => {
        const nearestX = Math.max(box.x, Math.min(other._x, box.x + box.width));
        const nearestY = Math.max(box.y, Math.min(other._y, box.y + box.height));
        const dx = other._x - nearestX;
        const dy = other._y - nearestY;
        return count + (dx * dx + dy * dy < 16 * 16 ? 1 : 0);
      }, 0);

      const distance = Math.hypot(
        box.x + box.width / 2 - point._x,
        box.y + box.height / 2 - point._y
      );
      const score = collisionCount * 10000 + pointCollisionCount * 2500 + distance + candidateIndex * 2;

      if (score < bestScore) {
        bestScore = score;
        best = box;
      }
    });

    const selected = best || {
      x: Math.max(PAD.left + 6, Math.min(plotRight - width - 6, point._x - half)),
      y: Math.max(PAD.top + 6, Math.min(plotBottom - LABEL_H - 6, point._y + gap)),
      width,
      height: LABEL_H,
    };

    labelLayout[point.id] = selected;
    occupied.push(selected);
  });


  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.05)]" dir="rtl">
      <div className="border-b border-gray-100 px-5 py-4 md:px-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#04241D] text-white shadow-sm">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 md:text-base">ماتریس اولویت‌بندی فرصت‌ها</h3>
              <p className="mt-0.5 text-[11px] text-gray-500">
                جایگاه هر فرصت بر اساس شدت شکاف و ارزش بالقوه
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[10px]">
            <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 font-medium text-gray-600">
              {opportunities.length.toLocaleString('fa-IR')} فرصت
            </span>
            <span className="rounded-full border border-[#DCE9E5] bg-[#F4F8F7] px-3 py-1.5 font-medium text-[#285E51]">
              شکاف میانگین: {splitGap.toFixed(2)}
            </span>
            <span className="rounded-full border border-[#DCE9E5] bg-[#F4F8F7] px-3 py-1.5 font-medium text-[#285E51]">
              ارزش میانگین: {formatMoney(splitValue)}
            </span>
          </div>
        </div>
      </div>

      <div className="p-3 md:p-5">
        <div className="overflow-x-auto rounded-xl border border-gray-100 bg-[#FCFDFC]">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full min-w-[760px]"
            style={{ direction: 'ltr' }}
            role="img"
            aria-label="ماتریس چهار ربعی تحلیل شکاف"
          >
            <defs>
              <filter id="matrix-dot-shadow" x="-60%" y="-60%" width="220%" height="220%">
                <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#04241D" floodOpacity="0.18" />
              </filter>
              <filter id="matrix-label-shadow" x="-20%" y="-50%" width="140%" height="200%">
                <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="#0F172A" floodOpacity="0.08" />
              </filter>
            </defs>

            {/* ربع‌ها */}
            {quadrants.map(q => (
              <rect
                key={q.key}
                x={q.x}
                y={q.y}
                width={Math.max(q.width, 0)}
                height={Math.max(q.height, 0)}
                fill={q.fill}
              />
            ))}

            {/* Grid */}
            {xTicks.map(t => {
              const x = PAD.left + t * innerW;
              return (
                <line
                  key={`grid-x-${t}`}
                  x1={x}
                  y1={PAD.top}
                  x2={x}
                  y2={plotBottom}
                  stroke="#E7ECEA"
                  strokeWidth="1"
                />
              );
            })}
            {yTicks.map(t => {
              const y = PAD.top + innerH - t * innerH;
              return (
                <line
                  key={`grid-y-${t}`}
                  x1={PAD.left}
                  y1={y}
                  x2={plotRight}
                  y2={y}
                  stroke="#E7ECEA"
                  strokeWidth="1"
                />
              );
            })}

            {/* قاب نمودار */}
            <rect
              x={PAD.left}
              y={PAD.top}
              width={innerW}
              height={innerH}
              fill="none"
              stroke="#D8E0DD"
              strokeWidth="1.2"
              rx="2"
            />

            {/* خطوط میانگین */}
            <line
              x1={splitX}
              y1={PAD.top}
              x2={splitX}
              y2={plotBottom}
              stroke="#5F756E"
              strokeWidth="1.5"
              strokeDasharray="7 6"
            />
            <line
              x1={PAD.left}
              y1={splitY}
              x2={plotRight}
              y2={splitY}
              stroke="#5F756E"
              strokeWidth="1.5"
              strokeDasharray="7 6"
            />

            {/* عنوان ربع‌ها */}
            {quadrants.map(q => {
              const centerX = q.x + q.width / 2;
              const topQuadrant = q.y === PAD.top;
              const labelY = topQuadrant ? q.y + 24 : q.y + q.height - 38;
              const availableWidth = Math.max(q.width - 28, 120);
              const badgeWidth = Math.min(availableWidth, 174);

              return (
                <g key={`title-${q.key}`} transform={`translate(${centerX - badgeWidth / 2} ${labelY - 15})`}>
                  <rect
                    width={badgeWidth}
                    height="34"
                    rx="9"
                    fill="white"
                    fillOpacity="0.88"
                    stroke={q.stroke}
                  />
                  <text
                    x={badgeWidth / 2}
                    y="14"
                    textAnchor="middle"
                    fontSize="10.5"
                    fontWeight="700"
                    fill={q.text}
                    style={{ direction: 'rtl', unicodeBidi: 'embed' }}
                  >
                    {q.title}
                  </text>
                  <text
                    x={badgeWidth / 2}
                    y="27"
                    textAnchor="middle"
                    fontSize="8"
                    fill="#7B8783"
                    style={{ direction: 'rtl', unicodeBidi: 'embed' }}
                  >
                    {q.subtitle}
                  </text>
                </g>
              );
            })}

            {/* تیک‌های محور X */}
            {xTicks.map(t => {
              const x = PAD.left + t * innerW;
              const value = t * maxGap;
              return (
                <g key={`x-${t}`}>
                  <line x1={x} y1={plotBottom} x2={x} y2={plotBottom + 6} stroke="#82908C" strokeWidth="1.2" />
                  <text x={x} y={plotBottom + 23} textAnchor="middle" fontSize="10" fill="#71807B">
                    {value.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* تیک‌های محور Y */}
            {yTicks.map(t => {
              const y = PAD.top + innerH - t * innerH;
              const value = t * maxValue;
              return (
                <g key={`y-${t}`}>
                  <line x1={PAD.left - 6} y1={y} x2={PAD.left} y2={y} stroke="#82908C" strokeWidth="1.2" />
                  <text x={PAD.left - 12} y={y + 3.5} textAnchor="end" fontSize="9.5" fill="#71807B">
                    {formatMoney(value)}
                  </text>
                </g>
              );
            })}

            {/* عنوان محور X */}
            <g transform={`translate(${PAD.left + innerW / 2} ${H - 26})`}>
              <text textAnchor="middle" fontSize="11" fontWeight="700" fill="#3E4D48">
                امتیاز شکاف
              </text>
              <text y="16" textAnchor="middle" fontSize="8.5" fill="#8A9692">
                کمتر ← شدت شکاف → بیشتر
              </text>
            </g>

            {/* عنوان محور Y */}
            <g transform={`translate(28 ${PAD.top + innerH / 2}) rotate(-90)`}>
              <text textAnchor="middle" fontSize="11" fontWeight="700" fill="#3E4D48">
                ارزش بالقوه
              </text>
              <text y="15" textAnchor="middle" fontSize="8.5" fill="#8A9692">
                کمتر ← ارزش → بیشتر
              </text>
            </g>

            {/* نقاط و برچسب‌ها */}
            {pointLayout.map(opp => {
              const isBelow = opp.is_convertible === false;
              const name = truncate(opp.asset_name || `فرصت ${opp.id}`);
              const box = labelLayout[opp.id];
              const labelCenterX = box.x + box.width / 2;
              const labelCenterY = box.y + box.height / 2;

              // اتصال از لبه‌ی نزدیک‌تر لیبل به نقطه؛ خط از داخل کارت عبور نمی‌کند.
              const connectorX = Math.max(box.x, Math.min(opp._x, box.x + box.width));
              const connectorY = Math.max(box.y, Math.min(opp._y, box.y + box.height));
              const connectorDistance = Math.hypot(connectorX - opp._x, connectorY - opp._y);

              return (
                <g key={opp.id}>
                  {connectorDistance > 8 && (
                    <line
                      x1={opp._x}
                      y1={opp._y}
                      x2={connectorX}
                      y2={connectorY}
                      stroke={isBelow ? '#B9C1C8' : '#8FA69F'}
                      strokeWidth="1.1"
                      strokeDasharray="3 3"
                    />
                  )}

                  <circle
                    cx={opp._x}
                    cy={opp._y}
                    r={isBelow ? 7 : 11}
                    fill={isBelow ? '#A8B0B7' : '#04241D'}
                    stroke="white"
                    strokeWidth={3}
                    opacity={isBelow ? 0.7 : 1}
                    filter={isBelow ? undefined : 'url(#matrix-dot-shadow)'}
                  />
                  {!isBelow && (
                    <circle cx={opp._x} cy={opp._y} r="3.5" fill="#D9E8E3" opacity="0.95" />
                  )}

                  <g
                    transform={`translate(${box.x} ${box.y})`}
                    opacity={isBelow ? 0.68 : 1}
                    filter="url(#matrix-label-shadow)"
                  >
                    <rect
                      width={box.width}
                      height={box.height}
                      rx="9"
                      fill="white"
                      fillOpacity="0.97"
                      stroke={isBelow ? '#D7DCE0' : '#CADCD6'}
                    />
                    <text
                      x={box.width / 2}
                      y="15"
                      textAnchor="middle"
                      fontSize="9.5"
                      fontWeight="700"
                      fill={isBelow ? '#7B858D' : '#172B25'}
                      style={{ direction: 'rtl', unicodeBidi: 'embed' }}
                    >
                      {name}
                    </text>
                    <text
                      x={box.width / 2}
                      y="28"
                      textAnchor="middle"
                      fontSize="7.8"
                      fill={isBelow ? '#99A1A8' : '#72807C'}
                      style={{ direction: 'rtl', unicodeBidi: 'embed' }}
                    >
                      شکاف {opp._gap.toFixed(2)} · {formatMoney(opp._value)}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
        </div>

        {/* راهنما */}
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {quadrants.map(q => (
            <div
              key={`legend-${q.key}`}
              className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2.5 shadow-[0_2px_10px_rgba(15,23,42,0.03)]"
            >
              <span
                className="h-9 w-1.5 flex-shrink-0 rounded-full"
                style={{ backgroundColor: q.stroke }}
              />
              <div className="min-w-0">
                <p className="text-[11px] font-bold" style={{ color: q.text }}>{q.title}</p>
                <p className="mt-0.5 text-[9px] text-gray-500">{q.subtitle}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-col gap-2 rounded-xl bg-gray-50/80 px-3 py-2.5 text-[10px] text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#04241D] ring-2 ring-white" />
              فرصت قابل تبدیل
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-gray-400 opacity-70 ring-2 ring-white" />
              فرصت زیر آستانه
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-5 border-t border-dashed border-gray-500" />
              مرز میانگین
            </span>
          </div>
          <span className="font-medium text-gray-600">
            مبنای تقسیم ربع‌ها: میانگین واقعی فرصت‌های موجود
          </span>
        </div>
      </div>
    </div>
  );
}

function OpportunitiesList({ opportunities, selectedOpps = [], onToggle, onCreateProject }: any) {
  if (opportunities.length === 0) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
        <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">هیچ فرصت توسعه‌ای ثبت نشده</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {opportunities.map((opp: any) => (
        <Card 
          key={opp.id} 
          className={`border hover:shadow-md transition ${
            opp.is_convertible === false 
              ? 'opacity-60 bg-gray-50 border-gray-200' 
              : 'border-gray-200'
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <input
                type="checkbox"
                checked={selectedOpps.includes(opp.id)}
                onChange={() => onToggle && onToggle(opp.id)}
                disabled={opp.is_convertible === false}
                className={`w-4 h-4 cursor-pointer ${
                  opp.is_convertible === false 
                    ? 'accent-gray-400 cursor-not-allowed' 
                    : 'accent-blue-600'
                }`}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`font-medium ${
                    opp.is_convertible === false ? 'text-gray-500' : 'text-gray-800'
                  }`}>
                    {opp.asset_name}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${opp.target_module === 'DEV' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                    {opp.target_module_display}
                  </span>
                  {opp.is_convertible === false && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-red-100 text-red-700 font-medium">
                      زیر آستانه
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                  <span>نوع: {opp.gap_type_display}</span>
                  <span>|</span>
                  <span>شکاف: {opp.gap_score?.toFixed(2)}</span>
                  {opp.predicted_priority_score !== undefined && (
                    <>
                      <span>|</span>
                      <span className={opp.is_convertible === false ? 'text-red-600 font-medium' : 'text-green-600'}>
                        امتیاز پیش‌بینی: {opp.predicted_priority_score?.toFixed(2)} / {opp.min_approval_score}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded ${
                  opp.is_convertible === false 
                    ? 'bg-gray-200 text-gray-600' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {opp.status_display}
                </span>
                {opp.status === 'identified' && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={opp.is_convertible === false}
                    onClick={() => opp.is_convertible !== false && onCreateProject && onCreateProject(opp.id)}
                    className={`text-xs h-7 ${
                      opp.is_convertible === false
                        ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                        : 'border-amber-300 text-amber-700 hover:bg-amber-50'
                    }`}
                  >
                    {opp.is_convertible === false ? 'زیر آستانه' : 'تبدیل'}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function BacklogList({ opportunities, selectedBacklog = [], onToggle, onRestore }: any) {
  if (opportunities.length === 0) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">هیچ فرصتی در backlog نیست</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
        ⚠️ این فرصت‌ها به‌خاطر امتیاز کمتر از حداقل مورد نیاز سازمان، قابل تبدیل به پروژه نبودند 
        و به لیست بازبینی منتقل شده‌اند. می‌توانید با دکمه «بازگرداندن» آن‌ها را به لیست اصلی برگردانید.
      </div>
      {opportunities.map((opp: any) => (
        <Card key={opp.id} className="border-amber-200 bg-amber-50/20 hover:shadow-md transition">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <input
                type="checkbox"
                checked={selectedBacklog.includes(opp.id)}
                onChange={() => onToggle && onToggle(opp.id)}
                className="w-4 h-4 accent-amber-600 cursor-pointer"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-800">{opp.asset_name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${opp.target_module === 'DEV' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                    {opp.target_module_display}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>نوع: {opp.gap_type_display}</span>
                  <span>|</span>
                  <span>شکاف: {opp.gap_score?.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-700">
                  {opp.status_display}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRestore && onRestore(opp.id)}
                  className="text-xs h-7 border-green-300 text-green-700 hover:bg-green-50"
                >
                  <RefreshCw className="w-3 h-3 ml-1" /> بازگرداندن
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function IdeasList({ ideas }: any) {
  if (ideas.length === 0) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
        <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">هیچ ایده‌ای ثبت نشده</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {ideas.map((idea: any) => (
        <Card key={idea.id} className="border hover:shadow-md transition">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-gray-800 text-sm">{idea.title}</h4>
              <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                {idea.status_display}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>{idea.tech_domain_display}</span>
              <span>|</span>
              <span>همسویی: {idea.strategic_alignment.toFixed(1)}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}