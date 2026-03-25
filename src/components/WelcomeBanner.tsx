import { useState, useEffect } from 'react';
import { X, Sparkles, BookOpen, ArrowRight } from 'lucide-react';

export default function WelcomeBanner() {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const hasSeenBanner = localStorage.getItem('hasSeenWelcomeBanner');
        if (hasSeenBanner) {
            setIsVisible(false);
        }
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('hasSeenWelcomeBanner', 'true');
    };

    if (!isVisible) return null;

    return (
        <div className="bg-gradient-to-r from-blue-600 to-teal-500 rounded-xl shadow-lg p-6 mb-8 text-white relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="absolute top-0 right-0 p-4">
                <button
                    onClick={handleDismiss}
                    className="text-white/70 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                    aria-label="Dismiss welcome banner"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex flex-col md:flex-row items-center relative z-10">
                <div className="mr-6 mb-4 md:mb-0 p-4 bg-white/10 rounded-full backdrop-blur-sm">
                    <Sparkles className="w-8 h-8 text-yellow-300" />
                </div>

                <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">Welcome to Your Clinical AI Assistant</h2>
                    <p className="text-blue-50 text-base max-w-2xl leading-relaxed">
                        Analyze clinical texts with state-of-the-art accuracy using BioBERT & PubMedBERT.
                        Extract entities, summarize notes, and ask complex medical questions in seconds.
                    </p>

                    <div className="flex flex-wrap gap-3 mt-4">
                        <button
                            onClick={handleDismiss}
                            className="px-4 py-2 bg-white text-blue-600 font-semibold rounded-lg shadow-sm hover:bg-blue-50 transition-colors flex items-center"
                        >
                            Get Started
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                        <a
                            href="#" // In a real app this might link to documentation
                            className="px-4 py-2 bg-white/20 text-white font-medium rounded-lg hover:bg-white/30 transition-colors flex items-center border border-white/30"
                            onClick={(e) => { e.preventDefault(); /* handle guide open */ }}
                        >
                            <BookOpen className="w-4 h-4 ml-2 mr-2" />
                            Read Guide
                        </a>
                    </div>
                </div>
            </div>

            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-teal-400/20 rounded-full blur-2xl"></div>
        </div>
    );
}
