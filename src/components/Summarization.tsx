import { useState } from 'react';
import { Play, Download, Loader2, AlertCircle, FileText, BarChart2 } from 'lucide-react';
import TextInput from './TextInput';
import { performSummarization } from '../lib/api';
import { supabase } from '../lib/supabase';
import { exportAsJSON } from '../lib/utils';
import { useFileContext } from '../context/FileContext';
import { useNotification } from '../context/NotificationContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface SummarizationResult {
  summary: string;
  originalLength: number;
  summaryLength: number;
  originalWords: number;
  summaryWords: number;
  compressionRatio: string;
}

export default function Summarization() {
  const { currentText: inputText, setCurrentText: setInputText } = useFileContext();
  const { showNotification } = useNotification();
  const [model, setModel] = useState('ClinicalBERT');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SummarizationResult | null>(null);
  const [error, setError] = useState('');

  const handleSummarize = async () => {
    if (!inputText.trim()) {
      const msg = 'Please enter text to summarize';
      setError(msg);
      showNotification(msg, 'error');
      return;
    }

    setLoading(true);
    setError('');

    try {
      showNotification('Generating summary...', 'info');
      const data = await performSummarization(inputText, model) as SummarizationResult;
      setResult(data);
      showNotification('Summary generated successfully!', 'success');

      await supabase.from('clinical_analyses').insert({
        input_text: inputText,
        model_used: model,
        analysis_type: 'Summarization',
        results: data,
      });

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Summarization failed';
      setError(msg);
      showNotification(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const chartData = result ? [
    { name: 'Original', words: result.originalWords, color: '#3B82F6' },
    { name: 'Summary', words: result.summaryWords, color: '#10B981' }
  ] : [];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Text Summarization</h2>
        <p className="text-gray-600 mb-6">
          Automatically summarize lengthy clinical notes and research papers
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model Selection
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white shadow-sm"
            >
              <option value="BioBERT">BioBERT</option>
              <option value="ClinicalBERT">ClinicalBERT</option>
              <option value="PubMedBERT">PubMedBERT</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSummarize}
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-teal-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2 font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Summarizing...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>Generate Summary</span>
                </>
              )}
            </button>
          </div>
        </div>

        <TextInput
          value={inputText}
          onChange={setInputText}
          placeholder="Enter clinical text to summarize..."
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Charts Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:col-span-1 flex flex-col justify-center">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4 flex items-center">
                <BarChart2 className="w-4 h-4 mr-2" />
                Compression Analysis
              </h3>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 12 }} interval={0} />
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="words" radius={[0, 4, 4, 0]} barSize={30}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-center">
                <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600">
                  {result.compressionRatio}
                </span>
                <span className="text-xs text-gray-500 ml-2">Compression</span>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-100 flex flex-col justify-center">
                <div className="text-sm text-blue-600 mb-1">Original Content</div>
                <div className="text-3xl font-bold text-blue-900">{result.originalWords} <span className="text-base font-normal text-blue-600">words</span></div>
              </div>
              <div className="bg-green-50 rounded-lg p-6 border border-green-100 flex flex-col justify-center">
                <div className="text-sm text-green-600 mb-1">Summarized Content</div>
                <div className="text-3xl font-bold text-green-900">{result.summaryWords} <span className="text-base font-normal text-green-600">words</span></div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col justify-center">
                <div className="text-sm text-gray-600 mb-1">Model Used</div>
                <div className="text-lg font-bold text-orange-600 truncate">{model}</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col justify-center">
                <div className="text-sm text-gray-600 mb-1">Reduction</div>
                <div className="text-lg font-bold text-purple-600">
                  {Math.round((1 - result.summaryWords / result.originalWords) * 100)}%
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-teal-600" />
                <span>Summary</span>
              </h3>
              <button
                onClick={() => exportAsJSON(result, 'summary-result.json')}
                className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
            <div className="p-6 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg border border-teal-200">
              <p className="text-gray-800 leading-relaxed">{result.summary}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Original Text</h3>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-700 text-sm leading-relaxed">{inputText}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
