import React, { useState, useEffect } from 'react';
import { Share2, Search, Loader, Users, AlertCircle, Plus, X } from 'lucide-react';
import ShareModal from '../components/ShareModal';
import AddPatientModal from '../components/AddPatientModal';
import CreativeGeneratorModal from '../components/CreativeGeneratorModal';
import { Palette } from 'lucide-react';

const PatientDataPage = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [viewImage, setViewImage] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSharing, setIsSharing] = useState(false);

    // Creative Generator State
    const [isCreativeModalOpen, setIsCreativeModalOpen] = useState(false);
    const [selectedCreativePatient, setSelectedCreativePatient] = useState(null);

    const APPSCRIPT_URL = import.meta.env.VITE_APPSCRIPT_URL;

    const handleOpenCreative = (patient) => {
        setSelectedCreativePatient(patient);
        setIsCreativeModalOpen(true);
    };

    const getDisplayableImageUrl = (url) => {
        if (!url) return null;

        try {
            const directMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
            if (directMatch && directMatch[1]) {
                return `https://drive.google.com/thumbnail?id=${directMatch[1]}&sz=w400`;
            }

            const ucMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
            if (ucMatch && ucMatch[1]) {
                return `https://drive.google.com/thumbnail?id=${ucMatch[1]}&sz=w400`;
            }

            const openMatch = url.match(/open\?id=([a-zA-Z0-9_-]+)/);
            if (openMatch && openMatch[1]) {
                return `https://drive.google.com/thumbnail?id=${openMatch[1]}&sz=w400`;
            }

            if (url.includes("thumbnail?id=")) {
                return url;
            }

            const anyIdMatch = url.match(/([a-zA-Z0-9_-]{25,})/);
            if (anyIdMatch && anyIdMatch[1]) {
                return `https://drive.google.com/thumbnail?id=${anyIdMatch[1]}&sz=w400`;
            }

            const cacheBuster = Date.now();
            return url.includes("?") ? `${url}&cb=${cacheBuster}` : `${url}?cb=${cacheBuster}`;
        } catch (e) {
            console.error("Error processing image URL:", url, e);
            return url; // Return original URL as fallback
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${APPSCRIPT_URL}?sheet=Data`);
            const result = await response.json();

            if (result.success && result.data) {
                const rows = result.data.slice(1); // Remove header

                const formattedData = rows.map((row, index) => ({
                    id: index,
                    serialNo: row[1],      // Index 1 - Column B
                    father: row[2],      // Index 2 - Column C
                    mother: row[3],      // Index 3 - Column D
                    dob: row[4] ? new Date(row[4]).toLocaleDateString() : 'N/A', // Index 4 - Column E
                    rawDob: row[4], // Store raw date for Creative Generator
                    baby: row[5],    // Index 5 - Column F
                    mobile: row[6],    // Index 6 - Column G
                    image: getDisplayableImageUrl(row[7]), // Index 7 - Column H
                    sent: row[8],      // Index 7 - Column H
                })).filter(item => item.father);

                setData(formattedData);
            } else {
                throw new Error(result.error || "Failed to load data");
            }
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load patient data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSharePatient = async () => {
        if (!selectedPatient) return;

        setIsSharing(true);
        try {
            // Row calculation: Header (1) + Index (0-based) + 1 = Index + 2
            const rowIndex = selectedPatient.id + 2;

            const params = new URLSearchParams();
            params.append('action', 'updateCell');
            params.append('sheetName', 'Data');
            params.append('rowIndex', rowIndex);
            params.append('columnIndex', 8); // Column H is index 8 (A=1...H=8)
            params.append('value', 'Yes');

            const response = await fetch(APPSCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params
            });

            const result = await response.json();

            if (result.success) {
                await fetchData(); // Refresh data to show "Yes"
                setSelectedPatient(null); // Close modal
            } else {
                alert("Failed to update status: " + result.error);
            }

        } catch (err) {
            console.error("Error sharing patient:", err);
            alert("Failed to share patient. Please try again.");
        } finally {
            setIsSharing(false);
        }
    };

    const filteredData = data.filter(patient =>
        patient.father.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(patient.mobile).includes(searchTerm)
    );

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                            Patient Records
                        </h1>
                        <p className="text-slate-500 mt-1">
                            View and manage patient information
                        </p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                        <div className="relative group w-full md:w-auto">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search size={18} className="text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search patients..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2.5 w-full md:w-80 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                            />
                        </div>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300"
                        >
                            <Plus size={20} />
                            <span>Add Patient</span>
                        </button>
                    </div>
                </header>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 flex items-center gap-3">
                        <AlertCircle size={20} />
                        <p>{error}</p>
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32">
                        <Loader className="animate-spin text-emerald-500 mb-4" size={40} />
                        <p className="text-slate-400 font-medium">Loading records...</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-emerald-50/50 border-b border-emerald-100">
                                        <th className="px-6 py-4 text-xs font-semibold text-emerald-800 uppercase tracking-wider">Serial No.</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-emerald-800 uppercase tracking-wider">Father Name</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-emerald-800 uppercase tracking-wider">Mother Name</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-emerald-800 uppercase tracking-wider">Date of Birth</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-emerald-800 uppercase tracking-wider">Baby</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-emerald-800 uppercase tracking-wider">Mobile Number</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-emerald-800 uppercase tracking-wider">Image</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-emerald-800 uppercase tracking-wider">Sent</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-emerald-800 uppercase tracking-wider text-center">Creative</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-emerald-800 uppercase tracking-wider text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredData.length > 0 ? (
                                        filteredData.map((patient, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="font-medium text-slate-700">{patient.serialNo}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-medium text-slate-700">{patient.father}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                                                    {patient.mother}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                                                    {patient.dob}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                                                    {patient.baby}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                                                    {patient.mobile}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {patient.image ? (
                                                        <img
                                                            src={patient.image}
                                                            alt="Patient"
                                                            className="w-15 h-15 rounded-lg object-cover border border-slate-100 shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                                                            onClick={() => setViewImage(patient.image)}
                                                            onError={(e) => { e.target.style.display = 'none'; }}
                                                        />
                                                    ) : (
                                                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">No Image</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    {patient.sent && patient.sent.toString().toLowerCase() === 'yes' ? (
                                                        <span className="text-xs text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-full font-medium">Yes</span>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-medium">No</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <button
                                                        onClick={() => handleOpenCreative(patient)}
                                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 text-violet-700 hover:bg-violet-100 rounded-lg text-sm font-medium transition-colors border border-violet-100 hover:border-violet-200"
                                                    >
                                                        <Palette size={16} />
                                                        Creative
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <button
                                                        onClick={() => setSelectedPatient(patient)}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-medium transition-colors border border-emerald-100 hover:border-emerald-200"
                                                    >
                                                        <Share2 size={16} />
                                                        Share
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                                                <div className="flex flex-col items-center gap-3">
                                                    <Users size={48} className="text-slate-200" />
                                                    <p>No patient records found</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <ShareModal
                    isOpen={!!selectedPatient}
                    onClose={() => setSelectedPatient(null)}
                    onShare={handleSharePatient}
                    data={selectedPatient}
                    isSharing={isSharing}
                />

                <AddPatientModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={fetchData}
                />

                {isCreativeModalOpen && (
                    <CreativeGeneratorModal
                        isOpen={isCreativeModalOpen}
                        onClose={() => {
                            setIsCreativeModalOpen(false);
                            setSelectedCreativePatient(null);
                        }}
                        initialData={selectedCreativePatient ? {
                            ...selectedCreativePatient,
                            cast: selectedCreativePatient.baby || selectedCreativePatient.father,
                        } : null}
                        onSuccess={fetchData}
                    />
                )}

                {/* Full Image View Modal */}
                {viewImage && (
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in"
                        onClick={() => setViewImage(null)}
                    >
                        <button
                            onClick={() => setViewImage(null)}
                            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                        >
                            <X size={24} />
                        </button>
                        <img
                            src={viewImage.replace('&sz=w400', '&sz=s0')} // Use original size/high res
                            alt="Full View"
                            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientDataPage;
