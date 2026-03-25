import { X, Shield, Lock, Eye, Server } from 'lucide-react';

interface PrivacyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PrivacyModal({ isOpen, onClose }: PrivacyModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] overflow-y-auto">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200">

                    <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-8 text-white">
                        <div className="flex items-center mb-2">
                            <Shield className="w-8 h-8 mr-3 text-teal-100" />
                            <h3 className="text-2xl font-bold">Privacy & Security</h3>
                        </div>
                        <p className="text-teal-50">Your data privacy is our top priority.</p>
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-8 space-y-6 text-gray-600">
                        <p className="leading-relaxed">
                            We understand the sensitive nature of clinical data. This application is designed with strict privacy controls to ensure that patient information remains secure.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                                <div className="flex items-center mb-3">
                                    <Lock className="w-5 h-5 text-teal-600 mr-2" />
                                    <h4 className="font-semibold text-gray-900">Data Encryption</h4>
                                </div>
                                <p className="text-sm">All data transmitted between your browser and our servers is encrypted using industry-standard TLS 1.2+ protocols.</p>
                            </div>

                            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                                <div className="flex items-center mb-3">
                                    <Eye className="w-5 h-5 text-teal-600 mr-2" />
                                    <h4 className="font-semibold text-gray-900">No Persistent Storage</h4>
                                </div>
                                <p className="text-sm">Uploaded files are processed in-memory and are not permanently stored on our servers after analysis is complete.</p>
                            </div>

                            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                                <div className="flex items-center mb-3">
                                    <Server className="w-5 h-5 text-teal-600 mr-2" />
                                    <h4 className="font-semibold text-gray-900">Local Processing Option</h4>
                                </div>
                                <p className="text-sm">For extremely sensitive data, we offer a local deployment version that runs entirely within your secure network perimeter.</p>
                            </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                            <strong>Note:</strong> This is a demo application. Please ensure you have appropriate consent before uploading real PHI (Protected Health Information).
                        </div>
                    </div>

                    <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
                        <span className="text-xs text-gray-400">Last updated: December 2025</span>
                        <button
                            onClick={onClose}
                            className="px-5 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 shadow-sm transition-colors"
                        >
                            Acknowledge
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
