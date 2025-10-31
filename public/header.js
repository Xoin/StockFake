// Shared header component
// This creates a consistent header across all pages

function createHeader(options = {}) {
    const {
        title = 'StockFake',
        showNavigation = true,
        navigationLinks = [
            { href: '/', text: '← Back to Portal' },
            { href: '/trading', text: 'Trading' },
            { href: '/bank', text: 'Bank' },
            { href: '/loans', text: 'Loans' },
            { href: '/news', text: 'News' },
            { href: '/email', text: 'Email' }
        ]
    } = options;

    const headerHTML = `
        ${title ? `<h1>${title}</h1>` : ''}
        ${showNavigation ? `
        <div class="nav">
            ${navigationLinks.map((link, index) => 
                `${index > 0 ? '|' : ''} <a href="${link.href}">${link.text}</a>`
            ).join(' ')}
        </div>
        ` : ''}
        <div class="time-display" id="timeDisplay">Loading...</div>
        <div class="status-indicators" id="statusIndicators">
            <span id="pauseStatus" class="status-badge">...</span>
            <span id="speedStatus" class="status-badge speed-badge">...</span>
        </div>
    `;

    return headerHTML;
}

// Initialize header with time updates
async function initializeHeader() {
    async function updateHeaderTime() {
        try {
            const response = await fetch('/api/time');
            const data = await response.json();
            const date = new Date(data.currentTime);
            const status = data.isMarketOpen ? '🟢 MARKET OPEN' : '🔴 MARKET CLOSED';
            
            const timeDisplay = document.getElementById('timeDisplay');
            if (timeDisplay) {
                timeDisplay.textContent = `${date.toLocaleString()} - ${status}`;
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
        } catch (error) {
            console.error('Error updating header time:', error);
        }
    }
    
    // Initialize
    await updateHeaderTime();
    
    // Only set interval if not already set
    if (!window.headerUpdateInterval) {
        window.headerUpdateInterval = setInterval(updateHeaderTime, 1000);
    }
}

// Load header into a container
function loadHeader(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = createHeader(options);
        initializeHeader();
    }
}

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
