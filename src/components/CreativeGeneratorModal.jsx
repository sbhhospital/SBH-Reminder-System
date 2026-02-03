import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Upload, Calendar, Clock, User, Type, Loader } from 'lucide-react';
import babyBoyImg from '/baby_boy.png';
import babyGirlImg from '/baby_girl.png';

const CreativeGeneratorModal = ({ isOpen, onClose, initialData, onSuccess }) => {
    const [formData, setFormData] = useState({
        gender: 'boy',
        cast: '',
        date: '',
        time: ''
    });

    // Text Configuration State
    const [textConfig, setTextConfig] = useState({
        cast: { x: 50, y: 22, size: 80, color: '#1E40AF' },
        date: { x: 50, y: 63, size: 60, color: '#4B5563' },
        photo: { x: 50, y: 41.5, size: 29, panX: 0, panY: 0, zoom: 100 }
    });

    const [activeTab, setActiveTab] = useState('cast'); // 'cast', 'date', or 'photo'

    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [uploadedImage, setUploadedImage] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    // Initialize date and time with current values or patient data
    useEffect(() => {
        if (isOpen) {
            const now = new Date();

            // Determine Gender
            let initialGender = 'boy';
            if (initialData?.baby) {
                const babyLower = String(initialData.baby).toLowerCase();
                if (babyLower.includes('girl')) initialGender = 'girl';
            }

            // Determine Date
            let initialDate = now.toISOString().split('T')[0];
            if (initialData?.rawDob) {
                try {
                    const dob = new Date(initialData.rawDob);
                    if (!isNaN(dob.getTime())) {
                        const year = dob.getFullYear();
                        const month = String(dob.getMonth() + 1).padStart(2, '0');
                        const day = String(dob.getDate()).padStart(2, '0');
                        initialDate = `${year}-${month}-${day}`;
                    }
                } catch (e) {
                    console.error("Error parsing DOB:", e);
                }
            }

            setFormData(prev => ({
                ...prev,
                gender: initialGender,
                cast: initialData?.cast || '',
                date: initialDate,
                time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
            }));
        }
    }, [isOpen, initialData]);

    // Load image when gender changes
    useEffect(() => {
        const img = new Image();
        img.src = formData.gender === 'boy' ? babyBoyImg : babyGirlImg;
        img.onload = () => {
            setPreviewImage(img);
            setImageLoaded(true);
        };
    }, [formData.gender]);

    // Draw canvas whenever form data or image changes
    useEffect(() => {
        if (isOpen && imageLoaded && previewImage && canvasRef.current) {
            drawCanvas();
        }
    }, [isOpen, imageLoaded, previewImage, formData, textConfig, uploadedImage]);

    const drawCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = previewImage;

        // Set canvas dimensions to match image natural size
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        // Draw Background
        ctx.drawImage(img, 0, 0);

        // Draw Uploaded Photo
        if (uploadedImage) {
            const size = Math.max(canvas.width, canvas.height) * (textConfig.photo.size / 100);

            const x = (canvas.width * (textConfig.photo.x / 100));
            const y = (canvas.height * (textConfig.photo.y / 100));

            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, size / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();

            // Draw image centered at x, y
            const aspectRatio = uploadedImage.naturalWidth / uploadedImage.naturalHeight;
            let drawWidth = size;
            let drawHeight = size / aspectRatio;

            // Ensure the image covers the circle (zoom effect)
            if (drawHeight < size) {
                drawHeight = size;
                drawWidth = size * aspectRatio;
            }

            // Apply manual zoom
            const zoomFactor = (textConfig.photo.zoom || 100) / 100;
            drawWidth *= zoomFactor;
            drawHeight *= zoomFactor;

            // Apply panning
            const panXOffset = (drawWidth * (textConfig.photo.panX / 100));
            const panYOffset = (drawHeight * (textConfig.photo.panY / 100));

            ctx.drawImage(uploadedImage, x - drawWidth / 2 + panXOffset, y - drawHeight / 2 + panYOffset, drawWidth, drawHeight);
            ctx.restore();
        }

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Cast / Name
        if (formData.cast) {
            ctx.font = `bold ${textConfig.cast.size}px "Lobster Two", "Brush Script MT", cursive, sans-serif`;
            ctx.fillStyle = textConfig.cast.color;
            // Position based on percentage
            const x = canvas.width * (textConfig.cast.x / 100);
            const y = canvas.height * (textConfig.cast.y / 100);
            ctx.fillText(formData.cast, x, y);
        }

        // Date & Time
        ctx.font = `bold ${textConfig.date.size}px "Lobster Two", sans-serif`;
        ctx.fillStyle = textConfig.date.color;

        const formatDate = (dateString) => {
            if (!dateString) return '';
            const [y, m, d] = dateString.split('-').map(Number);
            const date = new Date(y, m - 1, d);
            const day = date.getDate();
            const month = date.toLocaleString('default', { month: 'short' });
            const year = date.getFullYear();

            const suffix = (d) => {
                if (d > 3 && d < 21) return 'th';
                switch (d % 10) {
                    case 1: return "st";
                    case 2: return "nd";
                    case 3: return "rd";
                    default: return "th";
                }
            };
            return `On ${day}${suffix(day)} ${month} ${year}`;
        };

        const formatTime = (timeString) => {
            if (!timeString) return '';
            const [hours, minutes] = timeString.split(':');
            const date = new Date();
            date.setHours(parseInt(hours, 10));
            date.setMinutes(parseInt(minutes, 10));
            return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
        };

        const dateStr = formData.date ? formatDate(formData.date) : '';
        const timeStr = formData.time ? formatTime(formData.time) : '';

        const dateTimeStr = [dateStr, timeStr].filter(Boolean).join('   ');

        if (dateTimeStr) {
            const x = canvas.width * (textConfig.date.x / 100);
            const y = canvas.height * (textConfig.date.y / 100);
            ctx.fillText(dateTimeStr, x, y);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleConfigChange = (type, field, value) => {
        setTextConfig(prev => ({
            ...prev,
            [type]: {
                ...prev[type],
                [field]: value
            }
        }));
    };

    const toggleGender = () => {
        setFormData(prev => ({
            ...prev,
            gender: prev.gender === 'boy' ? 'girl' : 'boy'
        }));
    };

    const handleDownload = () => {
        if (!canvasRef.current) return;

        const link = document.createElement('a');
        link.download = `birth-announcement-${formData.gender}-${Date.now()}.png`;
        link.href = canvasRef.current.toDataURL('image/png');
        link.click();
    };

    const handleUpload = async () => {
        if (!canvasRef.current || !initialData) return;

        try {
            setIsUploading(true);
            const APPSCRIPT_URL = import.meta.env.VITE_APPSCRIPT_URL;
            const FOLDER_ID = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID;

            // 1. Get Base64 from Canvas
            const base64Data = canvasRef.current.toDataURL('image/png');

            // 2. Upload to Drive
            const uploadBody = new URLSearchParams();
            uploadBody.append('action', 'uploadFile');
            uploadBody.append('base64Data', base64Data);
            uploadBody.append('fileName', `creative_${initialData.father}_${Date.now()}.png`);
            uploadBody.append('mimeType', 'image/png');
            uploadBody.append('folderId', FOLDER_ID);

            const uploadResponse = await fetch(APPSCRIPT_URL, {
                method: 'POST',
                body: uploadBody
            });

            const uploadResult = await uploadResponse.json();

            if (!uploadResult.success) {
                throw new Error(uploadResult.error || "Image upload failed");
            }

            const fileUrl = uploadResult.fileUrl;

            // 3. Update Sheet (Column H = Index 8)
            // Row calculation: Header (1) + Index (0-based) + 1 = Index + 2
            const rowIndex = initialData.id + 2;

            const updateBody = new URLSearchParams();
            updateBody.append('action', 'updateCell');
            updateBody.append('sheetName', 'Data');
            updateBody.append('rowIndex', rowIndex);
            updateBody.append('columnIndex', 8); // Column H
            updateBody.append('value', fileUrl);

            const updateResponse = await fetch(APPSCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: updateBody
            });

            const updateResult = await updateResponse.json();

            if (updateResult.success) {
                alert("Creative uploaded and record updated successfully!");
                if (onSuccess) onSuccess();
                onClose();
            } else {
                throw new Error(updateResult.error || "Failed to update record");
            }

        } catch (error) {
            console.error("Upload Error:", error);
            alert("Error: " + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    setUploadedImage(img);
                    setActiveTab('photo'); // Switch to photo tab automatically
                };
            };
            reader.readAsDataURL(file);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">

                {/* Left Panel: Inputs */}
                <div className="w-full md:w-1/3 p-6 bg-slate-50 border-r border-slate-100 flex flex-col overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Creative Generator</h2>
                            {initialData?.serialNo && (
                                <p className="text-xs text-slate-500 font-medium">Serial No: {initialData.serialNo}</p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-200 rounded-full transition-colors md:hidden"
                        >
                            <X size={20} className="text-slate-500" />
                        </button>
                    </div>

                    <div className="space-y-5 flex-1">

                        {/* Gender / Theme Selection */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 block">Theme</label>
                            <div className="flex gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                                <button
                                    onClick={() => setFormData(prev => ({ ...prev, gender: 'boy' }))}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${formData.gender === 'boy'
                                        ? 'bg-blue-100 text-blue-700 shadow-sm'
                                        : 'text-slate-500 hover:bg-slate-50'
                                        }`}
                                >
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                    Boy
                                </button>
                                <button
                                    onClick={() => setFormData(prev => ({ ...prev, gender: 'girl' }))}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${formData.gender === 'girl'
                                        ? 'bg-pink-100 text-pink-700 shadow-sm'
                                        : 'text-slate-500 hover:bg-slate-50'
                                        }`}
                                >
                                    <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                                    Girl
                                </button>
                            </div>
                        </div>

                        {/* Cast Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <User size={16} className="text-slate-400" />
                                To
                            </label>
                            <input
                                type="text"
                                name="cast"
                                value={formData.cast}
                                onChange={handleInputChange}
                                placeholder="Enter Name or Details"
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none"
                            />
                        </div>

                        {/* Date Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Calendar size={16} className="text-slate-400" />
                                Date
                            </label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none"
                            />
                        </div>

                        {/* Time Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Clock size={16} className="text-slate-400" />
                                Time
                            </label>
                            <input
                                type="time"
                                name="time"
                                value={formData.time}
                                onChange={handleInputChange}
                            />
                        </div>

                        {/* Upload Photo Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Upload size={16} className="text-slate-400" />
                                Upload Photo
                            </label>
                            <input
                                type="file"
                                onChange={handleFileChange}
                                accept="image/*"
                                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 transition-all cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Text Styling Controls */}
                    <div className="pt-4 border-t border-slate-200">
                        <label className="text-sm font-semibold text-slate-700 block mb-2">Adjust Text</label>

                        {/* Tabs */}
                        <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
                            <button
                                onClick={() => setActiveTab('cast')}
                                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'cast' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                Name/Cast
                            </button>
                            <button
                                onClick={() => setActiveTab('date')}
                                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'date' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                Date & Time
                            </button>
                            <button
                                onClick={() => setActiveTab('photo')}
                                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'photo' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                Photo
                            </button>
                        </div>

                        <div className="space-y-3 bg-white p-3 rounded-xl border border-slate-200">
                            {/* Hint for Photo Tab */}
                            {activeTab === 'photo' && !uploadedImage && (
                                <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded-lg mb-2">
                                    Click "Upload" below to add a photo.
                                </div>
                            )}
                            {/* Position X */}
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-500">Horizontal (X)</span>
                                    <span className="text-slate-700 font-medium">{textConfig[activeTab].x}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={textConfig[activeTab].x}
                                    onChange={(e) => handleConfigChange(activeTab, 'x', parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                                />
                            </div>

                            {/* Position Y */}
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-500">Vertical (Y)</span>
                                    <span className="text-slate-700 font-medium">{textConfig[activeTab].y}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={textConfig[activeTab].y}
                                    onChange={(e) => handleConfigChange(activeTab, 'y', parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                                />
                            </div>

                            {/* Font Size */}
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-500">Size</span>
                                    <span className="text-slate-700 font-medium">{textConfig[activeTab].size}px</span>
                                </div>
                                <input
                                    type="range"
                                    min={activeTab === 'photo' ? "5" : "10"}
                                    max={activeTab === 'photo' ? "100" : "200"}
                                    value={textConfig[activeTab].size}
                                    onChange={(e) => handleConfigChange(activeTab, 'size', parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                                />
                            </div>

                            {/* Color */}
                            {activeTab !== 'photo' && (
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-500">Color</span>
                                    <input
                                        type="color"
                                        value={textConfig[activeTab].color}
                                        onChange={(e) => handleConfigChange(activeTab, 'color', e.target.value)}
                                        className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                                    />
                                </div>
                            )}

                            {/* Pan Controls for Photo */}
                            {activeTab === 'photo' && (
                                <>
                                    {/* Zoom Control */}
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-500">Zoom Image</span>
                                            <span className="text-slate-700 font-medium">{textConfig.photo.zoom}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="100"
                                            max="300"
                                            value={textConfig.photo.zoom}
                                            onChange={(e) => handleConfigChange('photo', 'zoom', parseInt(e.target.value))}
                                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                                        />
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-500">Pan Horizontal</span>
                                            <span className="text-slate-700 font-medium">{textConfig.photo.panX}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="-100"
                                            max="100"
                                            value={textConfig.photo.panX}
                                            onChange={(e) => handleConfigChange('photo', 'panX', parseInt(e.target.value))}
                                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                                        />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-500">Pan Vertical</span>
                                            <span className="text-slate-700 font-medium">{textConfig.photo.panY}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="-100"
                                            max="100"
                                            value={textConfig.photo.panY}
                                            onChange={(e) => handleConfigChange('photo', 'panY', parseInt(e.target.value))}
                                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-200 space-y-3">
                        <button
                            onClick={handleDownload}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold shadow-lg shadow-amber-200 transition-all"
                        >
                            <Download size={20} />
                            Download Creative
                        </button>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={toggleGender}
                                className="flex items-center justify-center gap-2 py-2.5 bg-white border(slate-200) hover:bg-slate-50 text-slate-700 rounded-xl font-medium transition-all border"
                            >
                                Switch Theme
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={isUploading}
                                className="flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isUploading ? (
                                    <Loader size={18} className="animate-spin" />
                                ) : (
                                    <Upload size={18} />
                                )}
                                {isUploading ? 'Uploading...' : 'Upload'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Preview */}
                <div className="relative w-full md:w-2/3 bg-slate-200/50 flex flex-col items-center justify-center p-8 overflow-hidden">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white rounded-full transition-colors hidden md:block shadow-sm z-10"
                    >
                        <X size={20} className="text-slate-500" />
                    </button>

                    <div className="relative shadow-2xl rounded-sm overflow-hidden bg-white">
                        <canvas
                            ref={canvasRef}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '70vh',
                                width: 'auto',
                                height: 'auto',
                            }}
                        />
                    </div>
                    <p className="mt-4 text-slate-400 text-sm font-medium">
                        Preview updates automatically
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CreativeGeneratorModal;
