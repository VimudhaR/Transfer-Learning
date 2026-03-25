import { useState } from 'react';
import { Play, Loader2, AlertCircle, MessageSquare, HelpCircle, Gauge } from 'lucide-react';
import TextInput from './TextInput';
import { performQA } from '../lib/api';
import { supabase } from '../lib/supabase';
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts';

interface QAResult {
  question: string;
  answer: string;
  confidence: number;
  context: string;
  model: string;
}
export default function QuestionAnswering() {
  const [inputText, setInputText] = useState('');
  const [question, setQuestion] = useState('');
  const [model, setModel] = useState('ClinicalBERT');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QAResult | null>(null);
  const [error, setError] = useState('');

  const sampleQuestions = [
    'What is the tumor size?',
    'What is the receptor status?',
    'What stage is the cancer?',
    'What treatment was recommended?',
    'What is the patient age?',
  ];

  const handleAsk = async () => {
    if (!inputText.trim()) {
      setError('Please enter clinical text');
      return;
    }
    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await performQA(inputText, question, model) as QAResult;
      setResult(data);

      await supabase.from('clinical_analyses').insert({
        input_text: inputText,
        model_used: model,
        analysis_type: 'QA',
        results: data,
        confidence_score: data.confidence,
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Question answering failed');
    } finally {
      setLoading(false);
    }
  };

  // Prepare data for the donut/gauge chart
  const confidenceData = result ? [
    { name: 'Confidence', value: result.confidence * 100 },
    { name: 'Remaining', value: 100 - (result.confidence * 100) },
  ] : [];

  const confidenceColor = result ? (
    result.confidence > 0.8 ? '#10B981' : // Green
      result.confidence > 0.5 ? '#F59E0B' : // amber
        '#EF4444' // red
  ) : '#E5E7EB';

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Question Answering</h2>
        <p className="text-gray-600 mb-6">
          Ask questions about clinical texts and get AI-powered answers
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model Selection
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

          <div className="flex items-end">
            <button
              onClick={handleAsk}
              disabled={loading}
              className="w-full bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Ask Question</span>
                </>
              )}
            </button>
          </div>
        </div>

        <TextInput
          value={inputText}
          onChange={setInputText}
          placeholder="Enter clinical text context..."
        />

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Question
          </label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g., What is the tumor size?"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-2">Sample questions:</p>
            <div className="flex flex-wrap gap-2">
              {sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => setQuestion(q)}
                  className="px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full hover:bg-green-100 transition-colors border border-green-200"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        )}
      </div>

      {result && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Confidence Gauge */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center relative overflow-hidden">
              <h3 className="text-sm font-semibold text-gray-500 uppercase flex items-center absolute top-6 left-6">
                <Gauge className="w-4 h-4 mr-2" />
                Confidence
              </h3>
              <div className="h-[200px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={confidenceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      startAngle={180}
                      endAngle={0}
                      paddingAngle={0}
                      dataKey="value"
                    >
                      <Cell key="confidence" fill={confidenceColor} />
                      <Cell key="remaining" fill="#E5E7EB" />
                      <Label
                        value={`${(result.confidence * 100).toFixed(0)}%`}
                        position="center"
                        className="text-3xl font-bold fill-gray-900"
                      />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center -mt-10">
                <p className="text-sm text-gray-500">
                  {result.confidence > 0.8 ? 'High Confidence' : result.confidence > 0.5 ? 'Moderate Confidence' : 'Low Confidence'}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="md:col-span-2 space-y-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-sm text-gray-600 mb-1">Model Used</div>
                <div className="text-2xl font-bold text-blue-600">{result.model}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <HelpCircle className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Question</h3>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-gray-800">{result.question}</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow-sm border border-green-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <MessageSquare className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Answer</h3>
            </div>
            <div className="p-6 bg-white rounded-lg border border-green-300">
              <p className="text-xl text-gray-900 font-medium">{result.answer}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Supporting Context</h3>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700 leading-relaxed">{result.context}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
