// Shared header component
// This creates a consistent header across all pages

// Helper to escape HTML to prevent XSS
function escapeHtmlAttr(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Auto-initialize shared header component
(function() {
    // Default navigation links for all pages
    const defaultNavLinks = [
        { href: '/', text: '🏠 Portal' },
        { href: '/trading', text: '📈 Stocks' },
        { href: '/indexfunds.html', text: '📊 Index Funds' },
        { href: '/bank', text: '🏦 Bank' },
        { href: '/loans', text: '💰 Loans' },
        { href: '/taxes', text: '📋 Taxes' },
        { href: '/graphs', text: '📉 Graphs' },
        { href: '/news', text: '📰 News' },
        { href: '/email', text: '📧 Email' }
    ];

    // Create and inject shared header HTML
    window.createSharedHeader = function(options = {}) {
        const {
            title = 'StockFake',
            showTitle = true,
            showNavigation = true,
            customNavLinks = null
        } = options;

        const navLinks = customNavLinks || defaultNavLinks;

        const headerHTML = `
            ${showTitle ? `<h1>${escapeHtmlAttr(title)}</h1>` : ''}
            ${showNavigation ? `
            <div class="nav">
                ${navLinks.map((link, index) => 
                    `${index > 0 ? ' | ' : ''}<a href="${escapeHtmlAttr(link.href)}">${escapeHtmlAttr(link.text)}</a>`
                ).join('')}
            </div>
            ` : ''}
            <div class="time-display" id="timeDisplay">Loading...</div>
            <div class="status-indicators" id="statusIndicators">
                <span id="pauseStatus" class="status-badge">...</span>
                <span id="speedStatus" class="status-badge speed-badge">...</span>
            </div>
        `;

        return headerHTML;
    };

    // Initialize header with time updates
    window.initializeSharedHeader = async function() {
        async function updateHeaderTime() {
            try {
                const response = await fetch('/api/time');
                const data = await response.json();
                const date = new Date(data.currentTime);
                const status = data.isMarketOpen ? '🟢 MARKET OPEN' : '🔴 MARKET CLOSED';
                
                // Format date with day of week
                const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
                const dateString = date.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
                const timeString = date.toLocaleTimeString('en-US');
                
                const timeDisplay = document.getElementById('timeDisplay');
                if (timeDisplay) {
                    timeDisplay.textContent = `${dayOfWeek}, ${dateString} ${timeString} - ${status}`;
                }
                
                // Update pause status
                const pauseStatusEl = document.getElementById('pauseStatus');
                if (pauseStatusEl) {
                    if (data.isPaused) {
                        pauseStatusEl.textContent = '⏸ PAUSED';
                        pauseStatusEl.className = 'status-badge paused-badge';
                    } else {
                        pauseStatusEl.textContent = '▶ RUNNING';
                        pauseStatusEl.className = 'status-badge running-badge';
                    }
                }
                
                // Update speed status
                const speedStatusEl = document.getElementById('speedStatus');
                if (speedStatusEl) {
                    let speedText = '';
                    if (data.timeMultiplier === 60) {
                        speedText = '🐌 SLOW';
                    } else if (data.timeMultiplier === 3600) {
                        speedText = '⚡ NORMAL';
                    } else if (data.timeMultiplier === 86400) {
                        speedText = '🚀 FAST';
                    } else {
                        speedText = `⏱ ${data.timeMultiplier}s`;
                    }
                    speedStatusEl.textContent = speedText;
                }
                
                // Apply era theme
                const year = date.getFullYear();
                if (typeof applyEraTheme === 'function') {
                    applyEraTheme(year);
                }
            } catch (error) {
                console.error('Error updating header time:', error);
            }
        }
        
        // Initialize
        await updateHeaderTime();
        
        // Only set interval if not already set
        if (!window.sharedHeaderUpdateInterval) {
            window.sharedHeaderUpdateInterval = setInterval(updateHeaderTime, 1000);
        }
    };

    // Auto-load header on DOMContentLoaded if container exists
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoLoadHeader);
    } else {
        autoLoadHeader();
    }

    function autoLoadHeader() {
        const headerContainer = document.getElementById('shared-header');
        if (headerContainer && !headerContainer.hasAttribute('data-header-loaded')) {
            const pageTitle = headerContainer.getAttribute('data-title') || 'StockFake';
            const showNav = headerContainer.getAttribute('data-show-nav') !== 'false';
            
            headerContainer.innerHTML = createSharedHeader({
                title: pageTitle,
                showNavigation: showNav
            });
            headerContainer.setAttribute('data-header-loaded', 'true');
            initializeSharedHeader();
        }
    }
})();

// Shared CSS for header components
const headerStyles = `
    .time-display {
        background-color: #000;
        border: 2px solid #00ff00;
        padding: 10px;
        margin-bottom: 20px;
        text-align: center;
    }
    .status-indicators {
        margin-top: 8px;
        margin-bottom: 20px;
        font-size: 0.9em;
        display: flex;
        justify-content: center;
        gap: 15px;
        flex-wrap: wrap;
    }
    .status-badge {
        display: inline-block;
        padding: 3px 10px;
        border-radius: 3px;
        font-weight: bold;
        font-size: 0.85em;
    }
    .paused-badge {
        background-color: #440000;
        color: #ff0000;
        border: 1px solid #ff0000;
    }
    .running-badge {
        background-color: #004400;
        color: #00ff00;
        border: 1px solid #00ff00;
    }
    .speed-badge {
        background-color: #000044;
        color: #00ffff;
        border: 1px solid #00ffff;
    }
`;

// Add styles to document if not already added
if (!document.getElementById('header-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'header-styles';
    styleElement.textContent = headerStyles;
    document.head.appendChild(styleElement);
}
