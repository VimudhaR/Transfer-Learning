import { useState } from 'react';
import { Upload, Play, Loader2, AlertCircle, CheckCircle, Download, FileText, Layers, Settings, Info, PieChart as PieChartIcon } from 'lucide-react';
import { performNER } from '../lib/api';
import { supabase } from '../lib/supabase';
import { exportAsJSON, exportAsCSV } from '../lib/utils';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import mammoth from 'mammoth';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - pdfjs-dist types mismatch
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// Use a CDN for the PDF.js worker
GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

interface Entity {
  text: string;
  type: string;
  confidence: number;
  start: number;
  end: number;
}

interface BatchResult {
  filename: string;
  success: boolean;
  entityCount?: number;
  avgConfidence?: number;
  entities?: Entity[];
  entitySummary?: Record<string, number>;
  error?: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1'];

export default function BatchProcessing() {
  const [files, setFiles] = useState<File[]>([]);
  const [model, setModel] = useState('ClinicalBERT');
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<BatchResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [successCount, setSuccessCount] = useState(0);
  const [totalEntities, setTotalEntities] = useState(0);
  const [avgConfidence, setAvgConfidence] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(selectedFiles);
    setResults([]);
    setProgress(0);
    setSuccessCount(0);
    setTotalEntities(0);
    setAvgConfidence(0);
  };

  const handleBatchProcess = async () => {
    if (files.length === 0) {
      setError('Please select files to process');
      return;
    }

    setProcessing(true);
    setError('');
    setSuccessCount(0); // Reset counts for new batch
    setTotalEntities(0);
    setAvgConfidence(0);
    const batchResults: BatchResult[] = [];

    const { data: batchRecord } = await supabase
      .from('batch_analyses')
      .insert({
        batch_name: `Batch ${new Date().toLocaleString()}`,
        total_documents: files.length,
        status: 'processing',
      })
      .select()
      .single();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let text = '';

      try {
        if (file.name.endsWith('.pdf')) {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await getDocument(arrayBuffer).promise;
          for (let j = 1; j <= pdf.numPages; j++) {
            const page = await pdf.getPage(j);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            text += pageText + '\n\n';
          }
        } else if (file.name.endsWith('.docx') || file.name.endsWith('.doc') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          text = result.value;
        } else {
          throw new Error('Unsupported file format. Please upload PDF or DOCX.');
        }
      } catch (readErr) {
        batchResults.push({
          filename: file.name,
          success: false,
          error: `File reading failed: ${readErr instanceof Error ? readErr.message : 'Unknown error'}`,
        });
        continue;
      }

      try {
        const result = await performNER(text, model, 0.5);

        // Calculate summary of entity types
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const summary = (result as any).entities.reduce((acc: Record<string, number>, entity: any) => {
          acc[entity.type] = (acc[entity.type] || 0) + 1;
          return acc;
        }, {});

        batchResults.push({
          filename: file.name,
          success: true,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          entityCount: (result as any).entityCount,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          avgConfidence: (result as any).avgConfidence,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          entities: (result as any).entities,
          entitySummary: summary
        });

        await supabase.from('clinical_analyses').insert({
          input_text: text,
          model_used: model,
          analysis_type: 'Batch NER',
          results: result,
          confidence_score: result.avgConfidence,
        });

        setSuccessCount(prev => prev + 1);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setTotalEntities(prev => prev + (result as any).entityCount);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setAvgConfidence(prev => (prev * i + (result as any).avgConfidence) / (i + 1));

      } catch (err) {
        batchResults.push({
          filename: file.name,
          success: false,
          error: err instanceof Error ? err.message : 'Analysis failed',
        });
      }

      setProgress(Math.round(((i + 1) / files.length) * 100));
    }

    if (batchRecord) {
      await supabase
        .from('batch_analyses')
        .update({
          completed_documents: files.length,
          status: 'completed',
          completed_at: new Date().toISOString(),
          results_summary: {
            totalFiles: files.length,
            successCount: batchResults.filter(r => r.success).length,
            avgEntities: batchResults
              .filter(r => r.success)
              .reduce((sum, r) => sum + (r.entityCount || 0), 0) / batchResults.filter(r => r.success).length,
          },
        })
        .eq('id', batchRecord.id);
    }

    setResults(batchResults);
    setProcessing(false);
  };

  const [selectedResult, setSelectedResult] = useState<BatchResult | null>(null);

  // Aggregate entity summary for the pie chart
  const aggregateSummary = results.reduce((acc: Record<string, number>, result) => {
    if (result.success && result.entitySummary) {
      Object.entries(result.entitySummary).forEach(([type, count]) => {
        acc[type] = (acc[type] || 0) + count;
      });
    }
    return acc;
  }, {});

  const pieData = Object.entries(aggregateSummary).map(([name, value]) => ({
    name: name.replace(/_/g, ' '),
    value
  })).sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-orange-500 to-pink-600 rounded-2xl shadow-lg p-8 text-white">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">Batch Document Processing</h2>
          <p className="text-orange-100 text-lg max-w-2xl">
            Upload multiple medical records, lab reports, or clinical notes. Our AI analyzes them in parallel.
          </p>
        </div>
        <Layers className="absolute right-0 top-0 w-64 h-64 text-white opacity-10 transform translate-x-12 -translate-y-12" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Panel: Upload & Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-gray-500" />
              Configuration
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI Model
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  disabled={processing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                >
                  <option value="BioBERT">BioBERT (General)</option>
                  <option value="ClinicalBERT">ClinicalBERT (Notes)</option>
                  <option value="PubMedBERT">PubMedBERT (Research)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={handleBatchProcess}
                  disabled={processing || files.length === 0}
                  className={`w-full py-3 px-4 rounded-xl flex items-center justify-center space-x-2 font-medium transition-all transform active:scale-95 ${processing || files.length === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-500 to-pink-600 text-white shadow-md hover:shadow-lg'
                    }`}
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processing {progress}%</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      <span>Start Analysis</span>
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-start">
                  <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>

          {/* How it works section */}
          <div className="bg-blue-50 bg-white rounded-xl shadow-sm border border-blue-100 p-6 mt-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
              <Info className="w-4 h-4 mr-2" />
              How Batch Processing Works
            </h3>
            <ul className="space-y-2 text-xs text-blue-800">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                Drag and drop multiple files (.pdf, .docx) into the upload zone.
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                Select the appropriate AI model for your clinical domain.
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                Click "Start Analysis" to process files in parallel.
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                Download the consolidated report as CSV or JSON.
              </li>
            </ul>
          </div>
        </div>

        <div
          className={`lg:col-span-2 border-2 border-dashed rounded-xl p-8 text-center transition-all ${processing ? 'bg-gray-50 border-gray-200 opacity-50' : 'bg-white border-orange-200 hover:border-orange-400 hover:bg-orange-50 cursor-pointer'
            }`}
        >
          <input
            type="file"
            accept=".pdf,.docx,.doc"
            multiple
            onChange={handleFileChange}
            disabled={processing}
            className="hidden"
            id="batch-upload"
          />
          <label htmlFor="batch-upload" className="cursor-pointer block w-full h-full">
            <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-1">Drop files here</h4>
            <p className="text-sm text-gray-500 mb-4 px-8">
              Upload patient records, clinical notes, or pathology reports to extract entities automatically.
              Supported formats: .pdf, .docx
            </p>
            <div className="inline-block px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 shadow-sm hover:shadow-md transition-shadow">
              Browse Files
            </div>
          </label>
        </div>
      </div>

      {/* Right Panel: File List & Results */}
      <div className="space-y-6">
        {files.length === 0 && (
          <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-12 flex flex-col items-center justify-center text-gray-400">
            <Layers className="w-16 h-16 mb-4 opacity-20" />
            <p>Select files to begin batch processing</p>
          </div>
        )}

        {files.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-semibold text-gray-900">Queue ({files.length} files)</h3>
              {results.length > 0 && (
                <div className="flex space-x-2">
                  <button onClick={() => exportAsJSON(results, 'batch.json')} className="p-2 hover:bg-white rounded text-gray-600 hover:text-orange-600 transition-colors" title="Export JSON"><Download className="w-4 h-4" /></button>
                </div>
              )}
            </div>
            <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
              {files.map((file, idx) => {
                const result = results.find(r => r.filename === file.name);
                const isComplete = !!result;
                const isSuccess = result?.success;

                return (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${file.name.endsWith('.pdf') ? 'bg-red-100 text-red-600' :
                        file.name.endsWith('.docx') ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 truncate max-w-xs">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {processing && !isComplete && idx === Math.floor((progress / 100) * files.length) && (
                        <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                      )}
                      {isComplete && (
                        <div className="flex items-center space-x-3">
                          <div className="flex flex-col items-end space-y-1">
                            <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${isSuccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                              {isSuccess ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                              <span>{isSuccess ? `Success (${result?.entityCount || 0})` : 'Failed'}</span>
                            </div>
                          </div>
                          {isSuccess && (
                            <button
                              onClick={() => setSelectedResult(result)}
                              className="px-3 py-1 bg-white border border-gray-200 text-gray-600 text-xs rounded-md hover:border-orange-300 hover:text-orange-600 transition-colors shadow-sm"
                            >
                              View
                            </button>
                          )}
                        </div>
                      )}

                      {!isComplete && !processing && (
                        <span className="text-xs text-gray-400">Pending</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-bottom duration-500">
            <div className="lg:col-span-1 bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
              <p className="text-xs text-gray-500 uppercase">Successful</p>
              <p className="text-2xl font-bold text-green-600">{successCount}/{files.length}</p>
            </div>
            <div className="lg:col-span-1 bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
              <p className="text-xs text-gray-500 uppercase">Total Entities</p>
              <p className="text-2xl font-bold text-blue-600">{totalEntities}</p>
              <p className="text-xs text-gray-500 mt-1 uppercase">Avg Confidence</p>
              <p className="text-xl font-bold text-purple-600">{(avgConfidence * 100).toFixed(1)}%</p>
            </div>

            {/* Consolidated Distribution Chart */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col items-center relative overflow-hidden">
              <h4 className="text-xs font-semibold text-gray-500 uppercase absolute top-4 left-4 flex items-center">
                <PieChartIcon className="w-3 h-3 mr-1" />
                Aggregate Entities
              </h4>
              <div className="w-full h-[150px] flex items-center justify-center">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend layout="vertical" align="right" verticalAlign="middle" iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-400 text-xs">No entities found</p>
                )}
              </div>
            </div>

            <button
              onClick={() => exportAsCSV(results as any, 'batch-results.csv')}
              className="lg:col-span-4 bg-gray-900 text-white p-4 rounded-xl shadow-sm hover:bg-gray-800 transition-all flex flex-col items-center justify-center text-center mt-2"
            >
              <Download className="w-5 h-5 mb-1" />
              <span className="text-xs font-bold">Download Full Report</span>
            </button>
          </div>
        )}
      </div>

      {/* Result Detail Modal */}
      {selectedResult && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedResult(null)} />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedResult.filename}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Completed</span>
                    <span className="text-xs text-gray-500">{selectedResult.entityCount} entities found</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => exportAsJSON([selectedResult], `analysis-${selectedResult.filename}.json`)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-2 text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download JSON</span>
                  </button>
                  <button
                    onClick={() => setSelectedResult(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-6 space-y-6">

                {/* Entity Summary Chips */}
                {selectedResult.entitySummary && (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(selectedResult.entitySummary).map(([type, count], idx) => (
                      <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                        <span className="text-xs font-medium text-gray-700">{type}</span>
                        <span className="text-xs bg-white border border-gray-200 px-1.5 rounded text-gray-500">{count}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Entities Table */}
                <div className="border rounded-xl overflow-hidden border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity Text</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedResult.entities?.map((entity, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entity.text}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {entity.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {(entity.confidence * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
