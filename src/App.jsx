import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PatientDataPage from './pages/PatientDataPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PatientDataPage />} />
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
