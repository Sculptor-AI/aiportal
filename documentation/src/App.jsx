import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import DocViewer from './components/DocViewer';
import './styles/layout.css';

function App() {
    return (
        <div className="app-container">
            <Sidebar />
            <main className="main-content">
                <Routes>
                    <Route path="/" element={<div className="welcome-screen">
                        <h1>AI Portal Documentation</h1>
                        <p>Select a topic from the sidebar to get started.</p>
                    </div>} />
                    <Route path="/docs/*" element={<DocViewer />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;
