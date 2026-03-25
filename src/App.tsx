/**
 * Advanced Breast Cancer Clinical NLP System
 *
 * A sophisticated web application for clinical text analysis using state-of-the-art
 * NLP and transfer learning techniques with BioBERT, ClinicalBERT, and PubMedBERT.
 *
 * Features:
 * - Named Entity Recognition (NER) for biomedical entities
 * - Text Summarization for clinical notes
 * - Question Answering on medical texts
 * - Multi-Model Comparison and performance analytics
 * - Batch Processing for multiple documents
 * - Analytics Dashboard with interactive visualizations
 * - Export functionality (JSON/CSV)
 * - Automated Clinical Insights and completeness scoring
 * - Fine-tuning UI scaffold for model customization
 *
 * Architecture:
 * - React 18 with TypeScript for type-safe development
 * - Supabase for backend data persistence and Edge Functions
 * - Tailwind CSS for modern, responsive medical-themed UI
 * - Transfer learning approach using clinical BERT models
 *
 * UI/UX Design:
 * - Clean, medical-friendly pastel theme with soft blue/teal accents
 * - Tab-based navigation for major workflows
 * - Responsive layouts optimized for desktop and tablet
 * - Interactive charts and visualizations
 * - Smooth transitions and hover effects
 * - Clear feedback for all user actions
 */

import { useState } from 'react';
import { Activity, FileText, MessageSquare, GitCompare, Layers, BarChart3, Settings, BookOpen, History } from 'lucide-react';
import NERAnalysis from './components/NERAnalysis';
import Summarization from './components/Summarization';
import QuestionAnswering from './components/QuestionAnswering';
import ModelComparison from './components/ModelComparison';
import BatchProcessing from './components/BatchProcessing';
import Analytics from './components/Analytics';
import FineTuning from './components/FineTuning';
import Guide from './components/Guide';
import HistoryPanel from './components/HistoryPanel';
import WelcomeBanner from './components/WelcomeBanner';
import AboutModal from './components/AboutModal';
import PrivacyModal from './components/PrivacyModal';
import { FileProvider } from './context/FileContext';
import { NotificationProvider } from './context/NotificationContext';

type Tab = 'ner' | 'summarization' | 'qa' | 'comparison' | 'batch' | 'analytics' | 'finetune' | 'guide';

function ClinicalNLPApp() {
  const [activeTab, setActiveTab] = useState<Tab>('ner');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  const tabs = [
    { id: 'ner' as Tab, label: 'NER Analysis', icon: Activity, color: 'text-blue-600' },
    { id: 'summarization' as Tab, label: 'Summarization', icon: FileText, color: 'text-teal-600' },
    { id: 'qa' as Tab, label: 'Q&A', icon: MessageSquare, color: 'text-green-600' },
    { id: 'comparison' as Tab, label: 'Model Compare', icon: GitCompare, color: 'text-purple-600' },
    { id: 'batch' as Tab, label: 'Batch Process', icon: Layers, color: 'text-orange-600' },
    { id: 'analytics' as Tab, label: 'Analytics', icon: BarChart3, color: 'text-pink-600' },
    { id: 'finetune' as Tab, label: 'Fine-Tune', icon: Settings, color: 'text-indigo-600' },
    { id: 'guide' as Tab, label: 'Guide', icon: BookOpen, color: 'text-gray-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-cyan-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => window.location.reload()}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                  Clinical NLP System
                </h1>
                <p className="text-xs text-gray-500 font-medium">
                  Breast Cancer Text Analysis Platform
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600 mr-4">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-medium text-xs border border-blue-100">
                  BioBERT
                </span>
                <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full font-medium text-xs border border-teal-100">
                  ClinicalBERT
                </span>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full font-medium text-xs border border-indigo-100">
                  PubMedBERT
                </span>
              </div>
              <button
                onClick={() => setIsHistoryOpen(true)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors relative group"
                aria-label="View History"
              >
                <History className="w-5 h-5 group-hover:text-blue-600" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 overflow-x-auto pb-2 -mb-px scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-t-lg font-medium text-sm
                    transition-all duration-200 whitespace-nowrap relative
                    ${isActive
                      ? 'bg-gradient-to-t from-white to-blue-50/50 text-blue-700 border-b-2 border-blue-500'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/50'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? tab.color : 'text-gray-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-200px)]">
        <WelcomeBanner />

        <div className="transition-all duration-300 ease-in-out">
          {activeTab === 'ner' && <NERAnalysis />}
          {activeTab === 'summarization' && <Summarization />}
          {activeTab === 'qa' && <QuestionAnswering />}
          {activeTab === 'comparison' && <ModelComparison />}
          {activeTab === 'batch' && <BatchProcessing />}
          {activeTab === 'analytics' && <Analytics />}
          {activeTab === 'finetune' && <FineTuning />}
          {activeTab === 'guide' && <Guide />}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center grayscale opacity-50">
                <Activity className="w-5 h-5 text-gray-500" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">
                  Clinical NLP System
                </p>
                <p className="text-xs text-gray-500">
                  v1.0.0 • Breast Cancer Analysis
                </p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <div className="flex space-x-6 text-sm text-gray-500 font-medium mb-2 justify-center md:justify-end">
                <button onClick={() => setIsAboutOpen(true)} className="hover:text-blue-600 transition-colors">About</button>
                <button onClick={() => setIsPrivacyOpen(true)} className="hover:text-blue-600 transition-colors">Privacy</button>
                {/* Guide is a tab, so we can just switch to it, or keep it as a link */}
                <button onClick={() => setActiveTab('guide')} className="hover:text-blue-600 transition-colors">Documentation</button>
              </div>
              <div className="flex items-center justify-center md:justify-end space-x-4 text-xs text-gray-400">
                <span>BioBERT</span>
                <span>•</span>
                <span>ClinicalBERT</span>
                <span>•</span>
                <span>PubMedBERT</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Global Components */}
      <HistoryPanel
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelect={(tab) => {
          setActiveTab(tab as Tab);
          setIsHistoryOpen(false);
        }}
      />
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
    </div>
  );
}

function App() {
  return (
    <NotificationProvider>
      <FileProvider>
        <ClinicalNLPApp />
      </FileProvider>
    </NotificationProvider>
  );
}

export default App;
