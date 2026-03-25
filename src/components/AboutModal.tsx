import { X, Github, Users, FileText, BookOpen } from 'lucide-react';

interface AboutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
    if (!isOpen) return null;

    const teamMembers = [
        { name: "Shreehari Menon", role: "Principal Investigator & Tech Lead", linkedin: "https://www.linkedin.com/in/shreehari-menon-bb7979260/", image: "/team/shreehari.jpg" },
        { name: "S Monishaa", role: "ML Systems Architect & Researcher", linkedin: "https://www.linkedin.com/in/monishaashiva/", image: "/team/monishaa.jpg" },
        { name: "Syeda Aayesha Aiman Hashmi", role: "Clinical Data & Software Engineer", linkedin: "https://www.linkedin.com/in/syeda-aiman04/", image: "/team/aiman.jpg" },
        { name: "Vimudha R", role: "Biomedical NLP Research Engineer", linkedin: "https://www.linkedin.com/in/vimudha-r-4013922a6/", image: "/team/vimudha.jpg" },
    ];

    return (
        <div className="fixed inset-0 z-[80] overflow-y-auto">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200">

                    <div className="bg-gradient-to-r from-teal-600 to-blue-700 px-6 py-8 text-white">
                        <h3 className="text-2xl font-bold">Breast Cancer Text Analysis Platform</h3>
                        <p className="text-blue-100 mt-2">Empowering Healthcare with NLP</p>
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-8 space-y-6">
                        <section>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Our Mission</h4>
                            <p className="text-gray-600 leading-relaxed">
                                Our goal is to assist medical professionals by automating the extraction of critical information from unstructured clinical text.
                                By leveraging transfer learning with models like BioBERT and ClinicalBERT, we aim to reduce administrative burden and improve meaningful data accessibility.
                            </p>
                        </section>

                        <section>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">The Technology</h4>
                            <ul className="list-disc pl-5 space-y-2 text-gray-600">
                                <li><strong>BioBERT:</strong> Pre-trained on large-scale biomedical corpora for general medical terminology.</li>
                                <li><strong>ClinicalBERT:</strong> Specialized for clinical notes and discharge summaries.</li>
                                <li><strong>PubMedBERT:</strong> Optimized for extracting insights from medical literature and abstracts.</li>
                            </ul>
                        </section>

                        <div className="border-t border-gray-100 pt-6 mt-6">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <FileText className="w-5 h-5 mr-2 text-indigo-600" />
                                Resources
                            </h4>

                            {/* Resources Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                                <a
                                    href="https://drive.google.com/file/d/1mbteibABTZZRFCuyeMrUNh_9wTY_pY52/view?usp=sharing"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 text-blue-700 hover:shadow-lg hover:border-blue-300 hover:-translate-y-1 transition-all duration-300 group text-center"
                                >
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                                        <FileText className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <span className="font-semibold">Research Paper</span>
                                    <span className="text-xs text-blue-400 mt-1">View Documentation</span>
                                </a>
                                <a
                                    href="https://drive.google.com/file/d/1f46__mTIVKpm418ztTPL-5Wy-Yp1qOJ6/view?usp=sharing"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-br from-teal-50 to-white border border-teal-100 text-teal-700 hover:shadow-lg hover:border-teal-300 hover:-translate-y-1 transition-all duration-300 group text-center"
                                >
                                    <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                                        <BookOpen className="w-6 h-6 text-teal-600" />
                                    </div>
                                    <span className="font-semibold">Project Report</span>
                                    <span className="text-xs text-teal-400 mt-1">Comprehensive Guide</span>
                                </a>
                                <a
                                    href="https://github.com/ShreehariMenon/TL_MP"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 text-indigo-700 hover:shadow-lg hover:border-indigo-300 hover:-translate-y-1 transition-all duration-300 group text-center"
                                >
                                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                                        <Github className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <span className="font-semibold">GitHub Repo</span>
                                    <span className="text-xs text-indigo-400 mt-1">Source Code</span>
                                </a>
                            </div>

                            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center pt-6 border-t border-gray-100">
                                <Users className="w-5 h-5 mr-2 text-indigo-600" />
                                Meet the Team
                            </h4>

                            {/* Team Grid */}
                            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-100 shadow-inner">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
                                    {teamMembers.map((member, idx) => (
                                        <a
                                            key={idx}
                                            href={member.linkedin}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center space-x-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-2xl hover:border-indigo-200 hover:scale-110 hover:z-20 relative transition-all duration-300 cursor-pointer group"
                                        >
                                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm ring-4 ring-indigo-50 group-hover:ring-indigo-200 transition-all shadow-md overflow-hidden shrink-0 group-hover:scale-110 duration-300">
                                                {member.image ? (
                                                    <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    member.name.split(' ').map(n => n[0]).join('').slice(0, 2)
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{member.name}</p>
                                                <div className="flex items-center space-x-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                                                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{member.role}</p>
                                                </div>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 px-6 py-4 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-5 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 shadow-sm transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
