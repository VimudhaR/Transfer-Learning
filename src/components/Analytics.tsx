import { useState, useEffect } from 'react';
import {
  BarChart as BarChartIcon,
  TrendingUp,
  Activity,
  Clock,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend,
  AreaChart, Area
} from 'recharts';
import { supabase, ClinicalAnalysis, ModelPerformance } from '../lib/supabase';

interface AnalyticsStats {
  totalAnalyses: number;
  avgConfidence: number;
  totalEntities: number;
  entityTypeDistribution: Record<string, number>;
  analysisTypeDistribution: Record<string, number>;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1'];

export default function Analytics() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [modelPerformance, setModelPerformance] = useState<ModelPerformance[]>([]);
  const [recentAnalyses, setRecentAnalyses] = useState<ClinicalAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    setLoading(true);

    // Fetch more analyses to ensure we have a good dataset for fallback calculations
    const { data: analyses } = await supabase
      .from('clinical_analyses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    const { data: models } = await supabase
      .from('model_performance')
      .select('*')
      .order('analysis_count', { ascending: false });

    const { data: entities } = await supabase
      .from('extracted_entities')
      .select('entity_type');

    const totalAnalyses = analyses?.length || 0;
    const avgConfidence = analyses && analyses.length > 0
      ? analyses.reduce((sum, a) => sum + (a.confidence_score || 0), 0) / analyses.length
      : 0;

    const entityTypeDistribution = entities?.reduce((acc: Record<string, number>, e) => {
      acc[e.entity_type] = (acc[e.entity_type] || 0) + 1;
      return acc;
    }, {}) || {};

    const analysisTypeDistribution = analyses?.reduce((acc: Record<string, number>, a) => {
      acc[a.analysis_type] = (acc[a.analysis_type] || 0) + 1;
      return acc;
    }, {}) || {};

    setStats({
      totalAnalyses,
      avgConfidence,
      totalEntities: entities?.length || 0,
      entityTypeDistribution,
      analysisTypeDistribution,
    });

    // Fallback Logic: If model_performance table is empty, calculate from analyses
    if (!models || models.length === 0) {
      if (analyses && analyses.length > 0) {
        const calculatedModels: Record<string, { count: number, totalConf: number }> = {};

        analyses.forEach(a => {
          if (!calculatedModels[a.model_used]) {
            calculatedModels[a.model_used] = { count: 0, totalConf: 0 };
          }
          calculatedModels[a.model_used].count += 1;
          calculatedModels[a.model_used].totalConf += (a.confidence_score || 0);
        });

        const fallbackModelPerf: ModelPerformance[] = Object.entries(calculatedModels).map(([name, data]) => ({
          id: name,
          model_name: name,
          analysis_count: data.count,
          avg_confidence: data.count > 0 ? data.totalConf / data.count : 0,
          total_entities_extracted: 0, // Cannot easily calc this without joining, setting to 0
          last_used: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        setModelPerformance(fallbackModelPerf);
      } else {
        setModelPerformance([]);
      }
    } else {
      setModelPerformance(models);
    }

    setRecentAnalyses(analyses || []);
    setLoading(false);
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  // Data Preparation for Charts
  const entityData = Object.entries(stats.entityTypeDistribution)
    .map(([name, value]) => ({
      name: name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      value
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const analysisTypeData = Object.entries(stats.analysisTypeDistribution)
    .map(([name, value]) => ({ name, value }));

  const modelData = modelPerformance.map(m => ({
    name: m.model_name,
    analyses: m.analysis_count,
    confidence: Number((m.avg_confidence * 100).toFixed(1))
  }));

  // Reverse to show chronological order (oldest -> newest) for the trend line
  // We take the last 20 from the potentially 100 fetched for the trend
  const trendData = [...recentAnalyses].slice(0, 20).reverse().map(a => ({
    date: new Date(a.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    confidence: Number(((a.confidence_score || 0) * 100).toFixed(1)),
    type: a.analysis_type
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg z-50">
          <p className="font-semibold text-gray-800">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value}
              {entry.name === 'confidence' || entry.name === 'Confidence' ? '%' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const EmptyState = ({ message }: { message: string }) => (
    <div className="h-full w-full flex flex-col items-center justify-center text-gray-400 p-4 border-2 border-dashed border-gray-100 rounded-lg">
      <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics Dashboard</h2>
            <p className="text-gray-600">Real-time performance metrics and usage statistics</p>
          </div>
          <button
            onClick={loadAnalytics}
            className="flex items-center space-x-2 px-4 py-2 bg-pink-50 text-pink-700 rounded-lg hover:bg-pink-100 transition-colors border border-pink-200"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Analyses', value: stats.totalAnalyses, icon: Activity, color: 'blue', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
            { label: 'Avg Confidence', value: `${(stats.avgConfidence * 100).toFixed(1)}%`, icon: TrendingUp, color: 'green', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
            { label: 'Total Entities', value: stats.totalEntities, icon: BarChartIcon, color: 'purple', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
            { label: 'Entity Types', value: Object.keys(stats.entityTypeDistribution).length, icon: BarChartIcon, color: 'orange', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
          ].map((stat, idx) => (
            <div key={idx} className={`${stat.bg} rounded-xl p-5 border ${stat.border} transition-transform hover:scale-[1.02]`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-sm font-medium ${stat.text}`}>{stat.label}</span>
                <stat.icon className={`w-5 h-5 ${stat.text}`} />
              </div>
              <div className={`text-3xl font-bold ${stat.text.replace('700', '900')}`}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Recent Activity Trend */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm col-span-1 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-pink-500" />
              Recent Confidence Trend
            </h3>
            <div className="h-[300px] w-full">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EC4899" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#EC4899" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} unit="%" />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="confidence"
                      stroke="#EC4899"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorConfidence)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="No analysis data to show trends" />
              )}
            </div>
          </div>

          {/* Model Performance */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-blue-500" />
              Model Performance
            </h3>
            <div className="h-[300px] w-full">
              {modelData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={modelData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                    <XAxis type="number" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#4B5563" fontSize={12} tickLine={false} axisLine={false} width={100} />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#F3F4F6' }} />
                    <Bar dataKey="confidence" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20} name="Confidence" />
                    <Bar dataKey="analyses" fill="#93C5FD" radius={[0, 4, 4, 0]} barSize={20} name="Analyses" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="No model usage data available" />
              )}
            </div>
          </div>

          {/* Entity Distribution */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
              <BarChartIcon className="w-5 h-5 mr-2 text-purple-500" />
              Entity Distribution
            </h3>
            <div className="h-[300px] w-full flex items-center justify-center">
              {entityData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={entityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {entityData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="No entities extracted yet" />
              )}
            </div>
          </div>

          {/* Analysis Type Distribution */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-teal-500" />
              Analysis Types
            </h3>
            <div className="h-[300px] w-full flex items-center justify-center">
              {analysisTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analysisTypeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#82ca9d"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {analysisTypeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[COLORS.length - 1 - (index % COLORS.length)]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="No analyses performed yet" />
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Recent List - Compact */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Clock className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Recent Logs</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentAnalyses.slice(0, 6).map((analysis) => (
            <div
              key={analysis.id}
              className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-300 transition-colors flex justify-between items-center"
            >
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  {analysis.analysis_type}
                </span>
                <span className="text-sm text-gray-600 truncate max-w-[200px]">
                  {analysis.input_text.substring(0, 30)}...
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className={`text-xs font-bold ${(analysis.confidence_score || 0) > 0.8 ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                  {((analysis.confidence_score || 0) * 100).toFixed(0)}%
                </span>
                <span className="text-[10px] text-gray-400">
                  {new Date(analysis.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
          {recentAnalyses.length === 0 && (
            <div className="col-span-2 text-center text-gray-400 py-8">
              No recent analyses found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
