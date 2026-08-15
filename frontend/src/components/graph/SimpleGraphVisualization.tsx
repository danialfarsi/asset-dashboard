'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Network, ZoomIn, ZoomOut, Move, Maximize } from 'lucide-react';
import api from '@/lib/api';

interface GraphNode {
  id: string;
  label: string;
  type: string;
  group: string;
  is_main?: boolean;
  value?: number;
  color?: string;
}

interface GraphEdge {
  from: string;
  to: string;
  type: string;
  label: string;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats?: any;
}

interface SimpleGraphVisualizationProps {
  assetId: number;
  assetName: string;
  height?: number;
}

export function SimpleGraphVisualization({ 
  assetId, 
  assetName, 
  height = 500 
}: SimpleGraphVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (assetId) {
      loadGraph();
    }
  }, [assetId]);

  useEffect(() => {
    if (graphData && containerRef.current && !isReady) {
      renderGraph();
    }
  }, [graphData, containerRef]);

  const loadGraph = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const { data } = await api.get(`/intangible/graph/${assetId}/get_graph/`);
      
      if (data && data.nodes && data.nodes.length > 0) {
        setGraphData(data);
      } else {
        setError('هیچ داده گرافی برای این دارایی یافت نشد');
      }
    } catch (err: any) {
      console.error('Error loading graph:', err);
      setError(err?.response?.data?.error || 'خطا در بارگذاری گراف');
    } finally {
      if (showRefresh) setRefreshing(false);
      else setLoading(false);
    }
  };

  const renderGraph = async () => {
    if (!containerRef.current || !graphData) return;

    try {
      const cytoscape = await import('cytoscape');
      const cytoscapeCoseBilkent = await import('cytoscape-cose-bilkent');
      
      cytoscape.default.use(cytoscapeCoseBilkent.default);

      const elements: any[] = [];

      const groupColors: Record<string, string> = {
        'assets': '#015345',
        'dimensions': '#7c3aed',
        'patent': '#2563eb',
        'brand': '#d97706',
        'license': '#0891b2',
        'default': '#6b7280'
      };

      graphData.nodes.forEach((node) => {
        const color = node.color || groupColors[node.group || 'assets'] || groupColors.default;
        const size = node.is_main ? 60 : 40;
        
        elements.push({
          data: {
            id: node.id,
            label: node.label,
            type: node.type,
            is_main: node.is_main || false,
            value: node.value || 0,
          },
          style: {
            'background-color': color,
            'width': size,
            'height': size,
            'border-color': node.is_main ? '#ffffff' : 'transparent',
            'border-width': node.is_main ? 3 : 0,
          }
        });
      });

      graphData.edges.forEach((edge) => {
        elements.push({
          data: {
            id: `edge-${edge.from}-${edge.to}`,
            source: edge.from,
            target: edge.to,
            label: edge.label || edge.type,
          }
        });
      });

      const cy = cytoscape.default({
        container: containerRef.current,
        elements: elements,
        style: [
          {
            selector: 'node',
            style: {
              'background-color': 'data(background-color)',
              'width': 'data(width)',
              'height': 'data(height)',
              'border-color': 'data(border-color)',
              'border-width': 'data(border-width)',
              'label': 'data(label)',
              'font-size': '10px',
              'text-valign': 'bottom',
              'text-halign': 'center',
              'color': '#1f2937',
              'font-family': 'var(--font-vazir)',
              'text-outline-color': '#ffffff',
              'text-outline-width': 2,
              'text-max-width': '80px',
              'text-wrap': 'wrap',
            }
          },
          {
            selector: 'node:selected',
            style: {
              'border-color': '#015345',
              'border-width': 4,
            }
          },
          {
            selector: 'edge',
            style: {
              'width': 2,
              'line-color': '#9ca3af',
              'target-arrow-color': '#9ca3af',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              'label': 'data(label)',
              'font-size': '8px',
              'text-rotation': 'autorotate',
              'color': '#6b7280',
              'font-family': 'var(--font-vazir)',
              'text-outline-color': '#ffffff',
              'text-outline-width': 2,
            }
          },
          {
            selector: 'edge:selected',
            style: {
              'line-color': '#015345',
              'target-arrow-color': '#015345',
            }
          }
        ],
        layout: {
          name: 'cose-bilkent',
          idealEdgeLength: 120,
          nodeRepulsion: 5000,
          edgeElasticity: 0.45,
          nestingFactor: 0.1,
          gravity: 0.25,
          numIter: 1000,
          tile: true,
          tilingPaddingVertical: 10,
          tilingPaddingHorizontal: 10,
        },
        wheelSensitivity: 0.2,
        boxSelectionEnabled: true,
        userZoomingEnabled: true,
        userPanningEnabled: true,
      });

      cyRef.current = cy;

      cy.on('tap', 'node', (evt: any) => {
        const node = evt.target;
        console.log('Node clicked:', node.data());
      });

      cy.on('tap', 'edge', (evt: any) => {
        const edge = evt.target;
        console.log('Edge clicked:', edge.data());
      });

      setTimeout(() => {
        cy.fit();
        cy.zoom(0.8);
        setIsReady(true);
      }, 200);

    } catch (err) {
      console.error('Error rendering graph:', err);
      setError('خطا در نمایش گراف');
    }
  };

  const handleZoomIn = () => {
    if (cyRef.current) {
      const currentZoom = cyRef.current.zoom();
      cyRef.current.zoom(currentZoom * 1.2);
    }
  };

  const handleZoomOut = () => {
    if (cyRef.current) {
      const currentZoom = cyRef.current.zoom();
      cyRef.current.zoom(currentZoom * 0.8);
    }
  };

  const handleFit = () => {
    if (cyRef.current) {
      cyRef.current.fit();
      cyRef.current.zoom(0.8);
    }
  };

  const handleReset = () => {
    if (cyRef.current) {
      cyRef.current.fit();
      cyRef.current.zoom(0.8);
      cyRef.current.center();
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-dark-green mx-auto" />
          <p className="mt-3 text-gray-500 font-[family-name:var(--font-vazir)]">در حال بارگذاری گراف دانش...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-8 text-center">
          <Network className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-red-500 font-[family-name:var(--font-vazir)]">{error}</p>
          <Button 
            className="mt-3 bg-dark-green hover:bg-dark-green/90 font-[family-name:var(--font-vazir)]"
            onClick={() => loadGraph(true)}
          >
            تلاش مجدد
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-8 text-center">
          <Network className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-[family-name:var(--font-vazir)]">
            هیچ ارتباط گرافی برای این دارایی یافت نشد
          </p>
          <p className="text-xs text-gray-400 mt-1 font-[family-name:var(--font-vazir)]">
            برای ایجاد گراف، دارایی را با سایر دارایی‌ها ارتباط دهید
          </p>
          <Button 
            className="mt-3 bg-dark-green hover:bg-dark-green/90 font-[family-name:var(--font-vazir)]"
            onClick={() => loadGraph(true)}
          >
            <RefreshCw className="w-4 h-4 ml-2" />
            به‌روزرسانی
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      {/* هدر */}
      <div className="bg-dark-green px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-white" />
          <h3 className="text-sm font-bold text-white font-[family-name:var(--font-vazir)]">
            🌐 گراف دانش دارایی
          </h3>
          <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-[family-name:var(--font-vazir)]">
            {graphData.nodes.length} گره • {graphData.edges.length} رابطه
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 p-1 h-8 w-8"
            onClick={handleZoomIn}
            title="بزرگ‌نمایی"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 p-1 h-8 w-8"
            onClick={handleZoomOut}
            title="کوچک‌نمایی"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 p-1 h-8 w-8"
            onClick={handleFit}
            title="تناسب"
          >
            <Move className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 p-1 h-8 w-8"
            onClick={handleReset}
            title="بازنشانی"
          >
            <Maximize className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-white/20 mx-1" />
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 font-[family-name:var(--font-vazir)]"
            onClick={() => loadGraph(true)}
            disabled={refreshing}
          >
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <CardContent className="p-0 relative">
        {/* کانتینر گراف */}
        <div 
          ref={containerRef} 
          style={{ height: height, width: '100%' }}
          className="bg-gray-50/30"
        />

        {/* راهنما */}
        <div className="absolute bottom-4 left-4 bg-white/90 rounded-lg shadow-lg border p-2 text-xs font-[family-name:var(--font-vazir)]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-[#015345] inline-block"></span>
              <span>دارایی</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-[#7c3aed] inline-block"></span>
              <span>بُعد</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-[#d97706] inline-block"></span>
              <span>برند</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-[#2563eb] inline-block"></span>
              <span>پتنت</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-[#0891b2] inline-block"></span>
              <span>لایسنس</span>
            </div>
          </div>
        </div>

        {/* آمار */}
        <div className="absolute top-3 right-3 bg-white/90 rounded-lg shadow-lg border px-3 py-1.5 text-xs font-[family-name:var(--font-vazir)]">
          <span className="text-gray-600">{graphData.nodes.length} گره</span>
          <span className="mx-1 text-gray-300">•</span>
          <span className="text-gray-600">{graphData.edges.length} یال</span>
        </div>
      </CardContent>
    </Card>
  );
}
