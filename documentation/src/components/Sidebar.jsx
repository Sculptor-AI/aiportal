import React, { useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Book, Code, Layers, Settings, FileText, Home } from 'lucide-react';
import '../styles/components.css';

// Pre-define key sections if needed or rely on file structure
// For this implementation, I'll rely on a manual mapping for critical sections 
// and dynamic generation for the rest if I had a robust glob parser.
// Given time constraints, I'll map the known structure from the previous `list_dir`.

const NAV_STRUCTURE = [
    {
        title: 'Overview',
        items: [
            { path: '/docs/INDEX.md', label: 'Introduction', icon: Home },
            { path: '/docs/PROJECT_OVERVIEW.md', label: 'Project Overview', icon: Layers },
            { path: '/docs/FEATURES.md', label: 'Features', icon: FileText },
        ]
    },
    {
        title: 'Guides',
        items: [
            { path: '/docs/SETUP_GUIDE.md', label: 'Setup Guide', icon: Settings },
            { path: '/docs/DEVELOPMENT_GUIDE.md', label: 'Development Guide', icon: Code },
            { path: '/docs/TROUBLESHOOTING.md', label: 'Troubleshooting', icon: Book },
        ]
    },
    {
        title: 'Architecture',
        items: [
            { path: '/docs/FRONTEND_ARCHITECTURE.md', label: 'Frontend', icon: Layers },
            { path: '/docs/BACKEND_ARCHITECTURE.md', label: 'Backend', icon: Layers },
            { path: '/docs/API_DOCUMENTATION.md', label: 'API Reference', icon: Code },
            { path: '/docs/MODEL_CONFIG.md', label: 'Model Configuration', icon: Settings },
        ]
    },
    {
        title: 'Gemini Live',
        items: [
            { path: '/docs/GEMINI_LIVE_API_README.md', label: 'Gemini Live API', icon: Code },
        ]
    }

];

const Sidebar = () => {
    // Determine active by simple string matching since paths in sidebar map to URL
    // URL will look like /docs/FILENAME.md
    return (
        <aside className="sidebar">
            <div className="logo-area">
                <h2>
                    <span style={{ color: 'var(--accent-primary)' }}>AI</span>Portal
                    <span style={{ fontSize: '0.8em', opacity: 0.5, fontWeight: 400 }}>Docs</span>
                </h2>
            </div>
            <nav className="nav-scroll">
                {NAV_STRUCTURE.map((group) => (
                    <div key={group.title} className="nav-group">
                        <div className="nav-group-title">{group.title}</div>
                        {group.items.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            >
                                <item.icon className="nav-item-icon" />
                                <span>{item.label}</span>
                            </NavLink>
                        ))}
                    </div>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;
