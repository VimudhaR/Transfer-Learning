import { useState } from 'react';
import { Play, Download, Loader2, AlertCircle, CheckCircle, Info, BarChart } from 'lucide-react';
import TextInput from './TextInput';
import { performNER } from '../lib/api';
import { supabase } from '../lib/supabase';
import { getEntityColor, formatEntityType, exportAsJSON, exportAsCSV, calculateCompletenessScore, generateInsights } from '../lib/utils';
import { useFileContext } from '../context/FileContext';
import { useNotification } from '../context/NotificationContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

interface Entity {
  text: string;
  type: string;
  confidence: number;
  start: number;
  end: number;
}

interface NERResult {
  entities: Entity[];
  entityCount: number;
  avgConfidence: number;
  entityTypes: string[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1'];

export default function NERAnalysis() {
  const { currentText: inputText, setCurrentText: setInputText } = useFileContext();
  const { showNotification } = useNotification();
  const [model, setModel] = useState('ClinicalBERT');
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NERResult | null>(null);
  const [error, setError] = useState('');
  const [hoveredType, setHoveredType] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      const msg = 'Please enter text to analyze';
      setError(msg);
      showNotification(msg, 'error');
      return;
    }

    if (inputText.trim().length < 10) {
      const msg = 'Text is too short for analysis. Please enter at least 10 characters.';
      setError(msg);
      showNotification(msg, 'warning');
      return;
    }

    setLoading(true);
    setError('');

    try {
      showNotification('Starting entity extraction...', 'info');
      const data = await performNER(inputText, model, confidenceThreshold) as NERResult;
      setResult(data);

      showNotification(`Successfully extracted ${data.entityCount} entities`, 'success');

      await supabase.from('clinical_analyses').insert({
        input_text: inputText,
        model_used: model,
        analysis_type: 'NER',
        results: data,
        confidence_score: data.avgConfidence,
      });

      await supabase.from('extracted_entities').insert(
        data.entities.map((entity: Entity) => ({
          analysis_id: null,
          entity_text: entity.text,
          entity_type: entity.type,
          confidence: entity.confidence,
          start_pos: entity.start,
          end_pos: entity.end,
        }))
      );

      try {
        await supabase.rpc('execute_sql', {
          query: `
          UPDATE model_performance
          SET
            analysis_count = analysis_count + 1,
            avg_confidence = (avg_confidence * analysis_count + ${data.avgConfidence}) / (analysis_count + 1),
            total_entities_extracted = total_entities_extracted + ${data.entityCount},
            last_used = now(),
            updated_at = now()
          WHERE model_name = '${model}'
        `
        });
      } catch {
        // Ignore stats update errors
      }

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      setError(msg);
      showNotification(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const highlightedText = () => {
    if (!result || !result.entities.length) return inputText;

    const sortedEntities = [...result.entities].sort((a, b) => a.start - b.start);
    let highlighted = '';
    let lastIndex = 0;

    sortedEntities.forEach((entity: Entity) => {
      highlighted += inputText.substring(lastIndex, entity.start);

      const isDimmed = hoveredType && hoveredType !== entity.type;
      const opacityClass = isDimmed ? 'opacity-20 saturate-0' : 'opacity-100';
      const transitionClass = 'transition-all duration-300';

      highlighted += `<mark class="px-1 py-0.5 rounded ${getEntityColor(entity.type)} border ${opacityClass} ${transitionClass} cursor-help" title="${formatEntityType(entity.type)} (${(entity.confidence * 100).toFixed(1)}%)">${entity.text}</mark>`;
      lastIndex = entity.end;
    });

    highlighted += inputText.substring(lastIndex);
    return highlighted;
  };

  const entityGroups = result?.entities.reduce((acc: Record<string, Entity[]>, entity: Entity) => {
    if (!acc[entity.type]) acc[entity.type] = [];
    acc[entity.type].push(entity);
    return acc;
  }, {}) || {};

  const completeness = result ? calculateCompletenessScore(result.entities) : null;
  const insights = result ? generateInsights(result.entities) : [];

  // Prepare data for PieChart
  const pieData = Object.entries(entityGroups).map(([type, entities]) => ({
    name: formatEntityType(type),
    type: type, // keep original key for matching
    value: entities.length
  })).sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Named Entity Recognition</h2>
        <p className="text-gray-600 mb-6">
          Extract biomedical entities from clinical breast cancer texts using advanced NER models
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model Selection
              <span className="ml-2 text-xs text-gray-500">(hover for info)</span>
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="BioBERT">BioBERT</option>
              <option value="ClinicalBERT">ClinicalBERT</option>
              <option value="PubMedBERT">PubMedBERT</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confidence Threshold: {(confidenceThreshold * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2 font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Analyze Entities</span>
                </>
              )}
            </button>
          </div>
        </div>

        <TextInput
          value={inputText}
          onChange={setInputText}
          placeholder="Enter clinical text for NER analysis..."
        />

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}
      </div>

      {result && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-sm text-gray-600 mb-1">Total Entities</div>
              <div className="text-3xl font-bold text-blue-600">{result.entityCount}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-sm text-gray-600 mb-1">Avg Confidence</div>
              <div className="text-3xl font-bold text-green-600">
                {(result.avgConfidence * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-sm text-gray-600 mb-1">Entity Types</div>
              <div className="text-3xl font-bold text-purple-600">{result.entityTypes.length}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-sm text-gray-600 mb-1">Completeness</div>
              <div className="text-3xl font-bold text-orange-600">
                {completeness?.score.toFixed(0)}%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Interactive Chart Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:col-span-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart className="w-5 h-5 mr-2 text-indigo-500" />
                Entity Distribution
              </h3>
              <div className="h-[300px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      onMouseEnter={(_, index) => setHoveredType(pieData[index].type)}
                      onMouseLeave={() => setHoveredType(null)}
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          stroke={hoveredType === entry.type ? '#000' : 'none'}
                          strokeWidth={2}
                          className="cursor-pointer transition-all duration-300"
                          opacity={hoveredType && hoveredType !== entry.type ? 0.3 : 1}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend
                      verticalAlign="bottom"
                      height={100}
                      content={({ payload }) => (
                        <div className="flex flex-wrap gap-2 justify-center mt-4">
                          {payload?.map((entry: any, index) => (
                            <div
                              key={`legend-${index}`}
                              className={`flex items-center space-x-1 text-xs cursor-pointer px-2 py-1 rounded transition-colors ${hoveredType === pieData[index].type ? 'bg-gray-100 font-bold' : ''
                                }`}
                              onMouseEnter={() => setHoveredType(pieData[index].type)}
                              onMouseLeave={() => setHoveredType(null)}
                              style={{ opacity: hoveredType && hoveredType !== pieData[index].type ? 0.4 : 1 }}
                            >
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                              <span className="text-gray-700">{entry.value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Text overlay */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full text-center pointer-events-none">
                  <div className="text-2xl font-bold text-gray-800">
                    {hoveredType ? pieData.find(d => d.type === hoveredType)?.value : result.entityCount}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">
                    {hoveredType ? formatEntityType(hoveredType) : 'Total'}
                  </div>
                </div>
              </div>
            </div>

            {/* Highlighted Text Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Highlighted Text</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => exportAsJSON(result, 'ner-results.json')}
                    className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>JSON</span>
                  </button>
                  <button
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onClick={() => exportAsCSV(result.entities as any, 'ner-entities.csv')}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>CSV</span>
                  </button>
                </div>
              </div>

              <div className="relative">
                {hoveredType && (
                  <div className="absolute top-2 right-2 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg z-10 animate-fade-in pointer-events-none">
                    Highlighting: {formatEntityType(hoveredType)}
                  </div>
                )}
                <div
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm leading-relaxed min-h-[300px] max-h-[500px] overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: highlightedText() }}
                />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-lg shadow-sm border border-blue-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Info className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Automated Clinical Insights</h3>
            </div>
            <div className="space-y-2">
              {insights.map((insight, idx) => (
                <div key={idx} className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">{insight}</span>
                </div>
              ))}
              {completeness && completeness.missing.length > 0 && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded">
                  <p className="text-sm text-amber-800 font-medium">Missing key attributes:</p>
                  <p className="text-xs text-amber-700 mt-1">
                    {completeness.missing.map(formatEntityType).join(', ')}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Extracted Entities by Category</h3>
            <div className="space-y-4">
              {Object.entries(entityGroups).map(([type, entities]: [string, Entity[]]) => (
                <div key={type} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    {formatEntityType(type)} ({entities.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {entities.map((entity: Entity, idx: number) => (
                      <span
                        key={idx}
                        className={`px-3 py-1 rounded-full text-sm ${getEntityColor(type)} border`}
                      >
                        {entity.text}
                        <span className="ml-2 text-xs opacity-75">
                          {(entity.confidence * 100).toFixed(0)}%
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
