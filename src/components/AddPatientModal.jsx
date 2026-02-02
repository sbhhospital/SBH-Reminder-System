import React, { useState } from 'react';
import { X, User, Phone, Calendar, Image as ImageIcon, Save, Loader, UploadCloud, Users } from 'lucide-react';

const AddPatientModal = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('');
    const [formData, setFormData] = useState({
        fatherName: '',
        motherName: '',
        dob: '',
        baby: 'Boy', // Default value
        mobile: ''
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert("File size must be less than 5MB");
                return;
            }
            setSelectedFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setLoadingText('Saving...');

        try {
            const APPSCRIPT_URL = import.meta.env.VITE_APPSCRIPT_URL;
            const FOLDER_ID = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID;

            let imageUrl = '';

            // 1. Upload Image if selected
            if (selectedFile) {
                setLoadingText('Uploading Image...');
                const base64Data = await convertToBase64(selectedFile);

                const uploadBody = new URLSearchParams();
                uploadBody.append('action', 'uploadFile');
                uploadBody.append('base64Data', base64Data);
                uploadBody.append('fileName', selectedFile.name);
                uploadBody.append('mimeType', selectedFile.type);
                uploadBody.append('folderId', FOLDER_ID);

                const uploadResponse = await fetch(APPSCRIPT_URL, {
                    method: 'POST',
                    body: uploadBody
                });

                const uploadResult = await uploadResponse.json();

                if (!uploadResult.success) {
                    throw new Error(uploadResult.error || "Image upload failed");
                }

                imageUrl = uploadResult.fileUrl;
            }

            // 2. Save Patient Data
            setLoadingText('Saving Record...');

            const now = new Date();

            // Format Timestamp: dd/mm/yyyy hh:mm:ss
            const day = String(now.getDate()).padStart(2, '0');
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const year = now.getFullYear();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const timestamp = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;

            // Format DOB: dd/mm/yyyy
            let formattedDob = formData.dob;
            if (formData.dob) {
                const dobDate = new Date(formData.dob);
                const dobDay = String(dobDate.getDate()).padStart(2, '0');
                const dobMonth = String(dobDate.getMonth() + 1).padStart(2, '0');
                const dobYear = dobDate.getFullYear();
                formattedDob = `${dobDay}/${dobMonth}/${dobYear}`;
            }

            // Format: [Timestamp, Father, Mother, DOB, Baby, Mobile, Image, Sent]
            const rowData = [
                timestamp,          // Column A: Timestamp
                formData.fatherName, // Column B
                formData.motherName, // Column C
                formattedDob,       // Column D: Formatted DOB
                formData.baby,      // Column E: Baby
                formData.mobile,    // Column F
                imageUrl,           // Column G
                'No'                // Column H: Sent (Default)
            ];

            const saveBody = new URLSearchParams();
            saveBody.append('action', 'insert');
            saveBody.append('sheetName', 'Data');
            saveBody.append('rowData', JSON.stringify(rowData));

            const response = await fetch(APPSCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: saveBody
            });

            const result = await response.json();

            if (result.success) {
                onSuccess();
                handleClose();
            } else {
                alert('Failed to add patient: ' + result.error);
            }
        } catch (error) {
            console.error("Error adding patient:", error);
            alert('Error: ' + error.message);
        } finally {
            setLoading(false);
            setLoadingText('');
        }
    };

    const handleClose = () => {
        setFormData({
            fatherName: '',
            motherName: '',
            dob: '',
            mobile: ''
        });
        setSelectedFile(null);
        setPreviewUrl('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in">
            <div
                className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-emerald-800">Add New Patient</h2>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-full hover:bg-emerald-100 text-emerald-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                                <User size={16} className="text-emerald-500" />
                                Father Name
                            </label>
                            <input
                                type="text"
                                name="fatherName"
                                required
                                value={formData.fatherName}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                placeholder="Enter father name"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                                <User size={16} className="text-emerald-500" />
                                Mother Name
                            </label>
                            <input
                                type="text"
                                name="motherName"
                                required
                                value={formData.motherName}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                placeholder="Enter mother name"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                                <Calendar size={16} className="text-emerald-500" />
                                Date of Birth
                            </label>
                            <input
                                type="date"
                                name="dob"
                                required
                                value={formData.dob}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                                <Phone size={16} className="text-emerald-500" />
                                Mobile Number
                            </label>
                            <input
                                type="tel"
                                name="mobile"
                                required
                                value={formData.mobile}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                placeholder="Enter mobile number"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                                <Users size={16} className="text-emerald-500" />
                                Baby
                            </label>
                            <select
                                name="baby"
                                value={formData.baby}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-white"
                            >
                                <option value="Boy">Boy</option>
                                <option value="Girl">Girl</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                            <ImageIcon size={16} className="text-emerald-500" />
                            Patient Image
                        </label>

                        <div className="border-2 border-dashed border-emerald-100 rounded-xl p-4 text-center hover:bg-emerald-50/50 transition-colors relative">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />

                            {previewUrl ? (
                                <div className="flex items-center gap-3">
                                    <img src={previewUrl} alt="Preview" className="w-16 h-16 rounded-lg object-cover border border-slate-200" />
                                    <div className="text-left">
                                        <p className="text-sm font-medium text-slate-700 truncate max-w-[200px]">{selectedFile?.name}</p>
                                        <p className="text-xs text-emerald-600">Click to change</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 py-2">
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                        <UploadCloud size={20} />
                                    </div>
                                    <p className="text-sm text-slate-500">
                                        <span className="font-medium text-emerald-600">Click to upload</span> or drag and drop
                                    </p>
                                    <p className="text-xs text-slate-400">PNG, JPG up to 5MB</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors shadow-emerald-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] justify-center"
                        >
                            {loading ? (
                                <>
                                    <Loader size={18} className="animate-spin" />
                                    <span>{loadingText || 'Saving...'}</span>
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    <span>Save Patient</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddPatientModal;
