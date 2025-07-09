
document.addEventListener('DOMContentLoaded', () => {
    const nav = document.getElementById('sidebar-nav');
    const content = document.getElementById('content');
    const searchInput = document.getElementById('search');
    const converter = new showdown.Converter();

    const files = [
        'INDEX.md',
        'SETUP.md',
        'DEVELOPMENT_GUIDE.md',
        'COMPLETE_API_DOCUMENTATION.md',
        'ADMIN_API_DOCS.md',
        'GEMINI_LIVE_API_README.md',
        'DEEP_RESEARCH_API_DOCS.md',
        'ADMIN_PORTAL.md',
        'MODELS.md',
        'MODEL_CONFIG.md',
        'EXAMPLES.md',
        'FLOWCHART_FEATURE.md',
        'TROUBLESHOOTING.md'
    ];

    function generateNav() {
        nav.innerHTML = files.map(file => 
            `<a href="#${file}" id="nav-${file}">${file.replace('.md', '').replace(/_/g, ' ')}</a>`
        ).join('');
    }

    function loadContent(file) {
        fetch(`./docs/${file}`)
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
        document.querySelectorAll('#sidebar-nav a').forEach(link => {
            if (link.textContent.toLowerCase().includes(filter)) {
                link.style.display = '';
            } else {
                link.style.display = 'none';
            }
        });
    }

    nav.addEventListener('click', e => {
        if (e.target.tagName === 'A') {
            const file = e.target.hash.substring(1);
            window.location.hash = file;
            loadContent(file);
        }
    });

    searchInput.addEventListener('keyup', filterNav);

    // Handle routing
    function router() {
        const file = window.location.hash.substring(1) || 'INDEX.md';
        loadContent(file);
    }

    window.addEventListener('hashchange', router);

    // Initial setup
    generateNav();
    router();
});
