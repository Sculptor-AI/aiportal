import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import matter from 'gray-matter';
import '../styles/markdown.css';

// Glob all MD files relative to project root
const modules = import.meta.glob('/src/docs/**/*.md', { query: '?raw', import: 'default' });

const DocViewer = () => {
    const location = useLocation();
    console.log('DocViewer rendering. Path:', location.pathname);
    const [content, setContent] = useState('');
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadDoc = async () => {
            setLoading(true);
            setError(null);

            const relativePath = location.pathname.replace(/^\/docs\//, '');

            // Robust lookup: find a key that ends with the requested relative path
            const foundKey = Object.keys(modules).find(key => {
                return key.endsWith(`/${relativePath}`) || key === relativePath || key.includes(relativePath);
            });

            if (foundKey && modules[foundKey]) {
                try {
                    const mod = await modules[foundKey]();
                    // Handle both ESM default export (raw string) and direct string if eager
                    const rawMd = mod;

                    const { content: mdContent, data } = matter(rawMd);
                    setContent(mdContent);
                    setMeta(data);
                } catch (err) {
                    console.error('Failed to load doc:', err);
                    setError('Failed to load documentation file.');
                }
            } else {
                setError(`Documentation file not found. Requested: ${relativePath}`);
            }
            setLoading(false);
        };

        if (location.pathname.includes('/docs/')) {
            loadDoc();
        }
    }, [location.pathname]);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="markdown-content">
                <h1>404 Not Found</h1>
                <p>{error}</p>
                <div style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#666' }}>
                    <p>Available paths:</p>
                    <pre>{Object.keys(modules).join('\n')}</pre>
                </div>
            </div>
        );
    }

    return (
        <div className="markdown-content">
            <Markdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                    code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '')
                        return !inline && match ? (
                            <SyntaxHighlighter
                                {...props}
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                            >
                                {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                        ) : (
                            <code {...props} className={className}>
                                {children}
                            </code>
                        )
                    }
                }}
            >
                {content}
            </Markdown>
        </div>
    );
};

export default DocViewer;
