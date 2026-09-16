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
  const [activeView, setActiveView] = useState('matrix');

  const loadData = async () => {
    setLoading(true);
    try {
      const [oppRes, ideasRes, oppStatsRes, ideasStatsRes] = await Promise.all([
        engine05Api.getOpportunities(),
        engine05Api.getIdeas(),
        engine05Api.getOpportunitiesStats(),
        engine05Api.getIdeasStats(),
      ]);
      setOpportunities(oppRes.data.results || []);
      setIdeas(ideasRes.data.results || []);
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
          <Button variant={activeView === 'ideas' ? 'default' : 'outline'} size="sm" onClick={() => setActiveView('ideas')} className={activeView === 'ideas' ? 'bg-[#04241D]' : ''}>
            <Lightbulb className="w-4 h-4 ml-1" /> ایده‌ها ({ideas.length})
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={loadData}>
          <RefreshCw className="w-4 h-4 ml-1" /> بروزرسانی
        </Button>
      </div>

      {activeView === 'matrix' && <QuadrantMatrix opportunities={opportunities} />}
      {activeView === 'opportunities' && <OpportunitiesList opportunities={opportunities} />}
      {activeView === 'ideas' && <IdeasList ideas={ideas} />}
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
  const maxValue = Math.max(...opportunities.map(o => parseFloat(o.potential_value) || 0), 1);
  const maxGap = Math.max(...opportunities.map(o => o.gap_score), 1);
  
  const getQuadrant = (opp: any) => {
    const value = parseFloat(opp.potential_value) || 0;
    const gap = opp.gap_score;
    const highValue = value > maxValue / 2;
    const highGap = gap > maxGap / 2;
    if (highValue && !highGap) return 'q1';
    if (highValue && highGap) return 'q2';
    if (!highValue && !highGap) return 'q3';
    return 'q4';
  };

  const quadrants = [
    { key: 'q2', title: 'پروژه‌های استراتژیک', subtitle: 'Strategic', color: 'bg-blue-50 border-blue-300', textColor: 'text-blue-800' },
    { key: 'q1', title: 'برندگان فوری', subtitle: 'Quick Wins', color: 'bg-green-50 border-green-300', textColor: 'text-green-800' },
    { key: 'q4', title: 'معلق یا حذفی', subtitle: 'Backlog', color: 'bg-red-50 border-red-300', textColor: 'text-red-800' },
    { key: 'q3', title: 'بهینه‌سازی کم‌هزینه', subtitle: 'Optimization', color: 'bg-yellow-50 border-yellow-300', textColor: 'text-yellow-800' },
  ];

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
        <BarChart3 className="w-4 h-4" /> ماتریس ۴ ربعی تحلیل شکاف
      </h3>
      <p className="text-xs text-gray-500 mb-4">محور افقی: امتیاز شکاف | محور عمودی: ارزش بالقوه</p>
      
      <div className="grid grid-cols-2 gap-3">
        {quadrants.map((q) => {
          const items = opportunities.filter(o => getQuadrant(o) === q.key);
          return (
            <div key={q.key} className={`border-2 rounded-xl p-4 ${q.color}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className={`text-sm font-bold ${q.textColor}`}>{q.title}</h4>
                  <p className="text-[10px] text-gray-500">{q.subtitle}</p>
                </div>
                <span className={`text-2xl font-bold ${q.textColor}`}>{items.length}</span>
              </div>
              <div className="space-y-1">
                {items.slice(0, 3).map((item: any) => (
                  <div key={item.id} className="text-[10px] bg-white/70 rounded px-2 py-1 truncate">
                    {item.asset_name}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OpportunitiesList({ opportunities }: any) {
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
        <Card key={opp.id} className="border hover:shadow-md transition">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
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
                  <span>شکاف: {opp.gap_score.toFixed(2)}</span>
                </div>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                {opp.status_display}
              </span>
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
