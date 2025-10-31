/**
 * Common header and navigation component
 * This file provides shared header functionality across all pages
 */

// Header HTML template
const headerTemplate = `
<div class="game-header" id="gameHeader">
    <div class="time-display" id="timeDisplay">
        Loading...
    </div>
    <nav class="main-nav">
        <a href="/" class="nav-link">🏠 Portal</a>
        <a href="/bank" class="nav-link">🏦 Bank</a>
        <a href="/trading" class="nav-link">📈 Trading</a>
        <a href="/indexfunds" class="nav-link">📊 Index Funds</a>
        <a href="/graphs" class="nav-link">📉 Charts</a>
        <a href="/loans" class="nav-link">💰 Loans</a>
        <a href="/taxes" class="nav-link">📑 Taxes</a>
        <a href="/news" class="nav-link">📰 News</a>
        <a href="/email" class="nav-link">📧 Email</a>
    </nav>
</div>
`;

// Header styles
const headerStyles = `
<style>
.game-header {
    margin-bottom: 20px;
}

.time-display {
    background-color: #000;
    border: 2px solid #00ff00;
    padding: 15px;
    margin-bottom: 15px;
    text-align: center;
    font-size: 1.1em;
}

.market-status {
    display: inline-block;
    margin-left: 20px;
    padding: 5px 10px;
    border-radius: 5px;
}

.market-open {
    background-color: #004400;
    color: #00ff00;
}

.market-closed {
    background-color: #440000;
    color: #ff0000;
}

.main-nav {
    background-color: #000;
    border: 2px solid #00ff00;
    padding: 12px;
    text-align: center;
}

.main-nav .nav-link {
    color: #00ff00;
    text-decoration: none;
    padding: 8px 12px;
    display: inline-block;
    margin: 2px 5px;
    transition: all 0.2s;
}

.main-nav .nav-link:hover {
    background-color: #003300;
    text-decoration: underline;
}

.main-nav .nav-link.active {
    background-color: #004400;
    border: 1px solid #00ff00;
}
</style>
`;

/**
 * Initialize the common header
 * Call this function in each page's initialization
 */
function initializeHeader(containerId = 'headerContainer') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn('Header container not found. Make sure you have a div with id="headerContainer"');
        return;
    }

    // Inject styles
    if (!document.getElementById('header-styles')) {
        const styleElement = document.createElement('div');
        styleElement.id = 'header-styles';
        styleElement.innerHTML = headerStyles;
        document.head.appendChild(styleElement.firstElementChild);
    }

    // Inject header HTML
    container.innerHTML = headerTemplate;

    // Highlight active page
    highlightActivePage();

    // Start updating time
    updateTimeDisplay();
    setInterval(updateTimeDisplay, 1000);
}

/**
 * Highlight the current page in navigation
 */
function highlightActivePage() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const linkPath = new URL(link.href).pathname;
        if (linkPath === currentPath || (currentPath === '/' && linkPath === '/')) {
            link.classList.add('active');
        }
    });
}

/**
 * Update the time display
 */
async function updateTimeDisplay() {
    try {
        const response = await fetch('/api/time');
        const data = await response.json();
        
        const timeElement = document.getElementById('timeDisplay');
        if (!timeElement) return;

        const date = new Date(data.currentTime);
        const marketStatus = data.isMarketOpen ? 
            '<span class="market-status market-open">🟢 Market Open</span>' :
            '<span class="market-status market-closed">🔴 Market Closed</span>';

        const pauseStatus = data.isPaused ? '⏸️ PAUSED' : '▶️ Running';
        
        let speedText = '';
        if (data.timeMultiplier === 60) speedText = '🐌 Slow';
        else if (data.timeMultiplier === 3600) speedText = '⚡ Normal';
        else if (data.timeMultiplier === 86400) speedText = '🚀 Fast';
        else speedText = `⏩ ${data.timeMultiplier}x`;

        timeElement.innerHTML = `
            <strong>${date.toLocaleString()}</strong>
            ${marketStatus}
            <span style="margin-left: 20px;">${pauseStatus}</span>
            <span style="margin-left: 10px;">${speedText}</span>
        `;

        // Show trade halt warning if applicable
        if (data.tradeHalt && data.tradeHalt.isHalted) {
            const haltWarning = `
                <div style="margin-top: 10px; color: #ff8800; font-weight: bold;">
                    ⚠️ TRADING HALTED: ${data.tradeHalt.reason}
                    ${data.tradeHalt.resumeDate ? `(Resumes: ${new Date(data.tradeHalt.resumeDate).toLocaleDateString()})` : ''}
                </div>
            `;
            timeElement.innerHTML += haltWarning;
        }
    } catch (error) {
        console.error('Error fetching time:', error);
    }
}

// Auto-initialize if headerContainer exists when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('headerContainer')) {
            initializeHeader();
        }
    });
} else {
    if (document.getElementById('headerContainer')) {
        initializeHeader();
    }
}
