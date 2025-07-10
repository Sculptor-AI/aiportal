document.addEventListener('DOMContentLoaded', () => {
    const nav = document.getElementById('sidebar-nav');
    const content = document.getElementById('content');
    const searchInput = document.getElementById('search');
    const converter = new showdown.Converter({ tables: true, strikethrough: true });

    // Function to fetch the directory structure
    async function getDirectoryTree(path) {
        // This is a mock of what a real API might return.
        // In a real-world scenario, you would have a server-side script
        // that returns this structure as JSON.
        return {
            "docs": {
                "setup": {
                    "1_prerequisites.md": null,
                    "2_installation.md": null,
                    "3_environment_configuration.md": null,
                    "4_running_the_application": {
                        "1_running_the_backend.md": null,
                        "2_running_the_frontend.md": null
                    },
                    "5_deployment.md": null
                },
                "project_overview": {
                    "1_introduction.md": null,
                    "2_key_features.md": null,
                    "3_technical_stack": {
                        "1_frontend.md": null,
                        "2_backend.md": null
                    }
                },
                "API_DOCUMENTATION.md": null,
                "BACKEND_ARCHITECTURE.md": null,
                "DEVELOPMENT_GUIDE.md": null,
                "FEATURES.md": null,
                "FRONTEND_ARCHITECTURE.md": null,
                "GEMINI_LIVE_API_README.md": null,
                "INDEX.md": null,
                "MODEL_CONFIG.md": null,
                "PROJECT_OVERVIEW.md": null,
                "TROUBLESHOOTING.md": null,
                "features": {
                    "1_ai_chat": {
                        "index.md": null
                    },
                    "2_image_generation": {
                        "index.md": null
                    },
                    "3_project_management": {
                        "index.md": null
                    },
                    "4_tool_based_features": {
                        "index.md": null
                    },
                    "5_news_and_media_hub": {
                        "index.md": null
                    },
                    "6_customization": {
                        "index.md": null
                    }
                }
            }
        };
    }

    function generateNav(tree, path = '') {
        let html = '<ul>';
        for (const key in tree) {
            const newPath = path ? `${path}/${key}` : key;
            if (typeof tree[key] === 'object' && tree[key] !== null) {
                html += `<li><span class="folder">${key.replace(/_/g, ' ')}</span>`;
                html += generateNav(tree[key], newPath);
                html += '</li>';
            } else {
                html += `<li><a href="#${newPath}" id="nav-${newPath}">${key.replace('.md', '').replace(/_/g, ' ')}</a></li>`;
            }
        }
        html += '</ul>';
        return html;
    }

    function loadContent(file) {
        fetch(file)
            .then(response => response.text())
            .then(text => {
                content.innerHTML = converter.makeHtml(text);
                updateActiveLink(file);
            });
    }

    function updateActiveLink(activeFile) {
        document.querySelectorAll('#sidebar-nav a').forEach(link => {
            link.classList.remove('active');
            if (link.href.endsWith(`#${activeFile}`)) {
                link.classList.add('active');
            }
        });
    }

    function filterNav() {
        const filter = searchInput.value.toLowerCase();
        document.querySelectorAll('#sidebar-nav li').forEach(li => {
            const text = li.textContent.toLowerCase();
            if (text.includes(filter)) {
                li.style.display = '';
            } else {
                li.style.display = 'none';
            }
        });
    }

    nav.addEventListener('click', e => {
        if (e.target.tagName === 'A') {
            const file = e.target.hash.substring(1);
            window.location.hash = file;
            loadContent(file);
        }
        if (e.target.classList.contains('folder')) {
            e.target.parentElement.classList.toggle('open');
        }
    });

    searchInput.addEventListener('keyup', filterNav);

    function router() {
        const file = window.location.hash.substring(1) || 'docs/INDEX.md';
        loadContent(file);
    }

    window.addEventListener('hashchange', router);

    // Initial setup
    getDirectoryTree().then(tree => {
        nav.innerHTML = generateNav(tree.docs, 'docs');
        router();
    });
});