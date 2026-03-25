import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { History, X, ChevronRight, Calendar } from 'lucide-react';
import { useFileContext } from '../context/FileContext';

interface AnalysisHistoryItem {
    id: string;
    created_at: string;
    analysis_type: string;
    input_text: string;
    model_used: string;
}

interface HistoryPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (type: string) => void;
}

export default function HistoryPanel({ isOpen, onClose, onSelect }: HistoryPanelProps) {
    const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const { setCurrentText } = useFileContext();

    useEffect(() => {
        if (isOpen) {
            fetchHistory();
        }
    }, [isOpen]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('clinical_analyses')
                .select('id, created_at, analysis_type, input_text, model_used')
                .order('created_at', { ascending: false })
                .limit(20);

            if (!error && data) {
                setHistory(data);
            }
        } catch (err) {
            console.error('Failed to fetch history', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (item: AnalysisHistoryItem) => {
        setCurrentText(item.input_text);
        // Map database types to tab IDs
        const tabMap: Record<string, string> = {
            'NER': 'ner',
            'Summarization': 'summarization',
            'QA': 'qa',
            'Batch NER': 'batch'
        };
        onSelect(tabMap[item.analysis_type] || 'ner');
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
                    onClick={onClose}
                />
            )}

            {/* Drawer */}
            <div className={`fixed inset-y-0 right-0 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-[70] flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}>
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <h2 className="font-semibold text-gray-900 flex items-center">
                        <History className="w-5 h-5 mr-2 text-blue-600" />
                        Recent Analysis
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No recent history found</p>
                        </div>
                    ) : (
                        history.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => handleSelect(item)}
                                className="group p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 cursor-pointer transition-all shadow-sm hover:shadow-md"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${item.analysis_type === 'NER' ? 'bg-blue-100 text-blue-700' :
                                        item.analysis_type === 'Summarization' ? 'bg-teal-100 text-teal-700' :
                                            item.analysis_type === 'QA' ? 'bg-green-100 text-green-700' :
                                                'bg-orange-100 text-orange-700'
                                        }`}>
                                        {item.analysis_type}
                                    </span>
                                    <span className="text-[10px] text-gray-400 flex items-center">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-2 mb-2 font-mono bg-white p-1 rounded border border-gray-50">
                                    {item.input_text.substring(0, 100)}...
                                </p>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-xs text-gray-400">{item.model_used}</span>
                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}
