import React from 'react';
import { X, Calendar, Phone, User } from 'lucide-react';

const ShareModal = ({ isOpen, onClose, data }) => {
    if (!isOpen || !data) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in">
            <div
                className="w-full max-w-md overflow-hidden bg-white rounded-2xl shadow-xl border border-slate-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with Image Background */}
                <div className="relative h-48 w-full bg-emerald-50">
                    {data.image ? (
                        <img
                            src={data.image}
                            alt={data.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(data.name) + '&background=random';
                            }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-100 to-teal-200">
                            <User size={64} className="text-emerald-300/50" />
                        </div>
                    )}

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white text-slate-600 transition-colors shadow-sm backdrop-blur-md"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <h2 className="text-2xl font-bold mb-1 text-slate-800">{data.name}</h2>
                    <p className="text-slate-500 text-sm mb-6">Patient Details</p>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                            <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-600">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Date of Birth</p>
                                <p className="font-semibold text-slate-700">{data.dob || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                            <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-600">
                                <Phone size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Mobile Number</p>
                                <p className="font-semibold text-slate-700">{data.mobile || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors shadow-emerald-200 shadow-lg"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
