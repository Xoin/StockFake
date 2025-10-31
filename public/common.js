// Common utilities for pagination and era-based theming

// Pagination helper
class Paginator {
    constructor(items, itemsPerPage = 20) {
        this.items = items;
        this.itemsPerPage = itemsPerPage;
        this.currentPage = 1;
    }

    get totalPages() {
        return Math.ceil(this.items.length / this.itemsPerPage);
    }

    getCurrentPageItems() {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        return this.items.slice(start, end);
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            return true;
        }
        return false;
    }

    prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            return true;
        }
        return false;
    }

    goToPage(page) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            return true;
        }
        return false;
    }

    renderControls() {
        if (this.totalPages <= 1) return '';
        
        const prev = this.currentPage > 1 ? 
            `<button onclick="paginator.prevPage() && renderPage()" class="page-btn">← Previous</button>` :
            `<button disabled class="page-btn">← Previous</button>`;
        
        const next = this.currentPage < this.totalPages ?
            `<button onclick="paginator.nextPage() && renderPage()" class="page-btn">Next →</button>` :
            `<button disabled class="page-btn">Next →</button>`;
        
        let pageButtons = '';
        const maxButtons = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(this.totalPages, startPage + maxButtons - 1);
        
        if (endPage - startPage < maxButtons - 1) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }
        
        if (startPage > 1) {
            pageButtons += `<button onclick="paginator.goToPage(1) && renderPage()" class="page-btn">1</button>`;
            if (startPage > 2) {
                pageButtons += `<span class="page-ellipsis">...</span>`;
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            if (i === this.currentPage) {
                pageButtons += `<button class="page-btn active">${i}</button>`;
            } else {
                pageButtons += `<button onclick="paginator.goToPage(${i}) && renderPage()" class="page-btn">${i}</button>`;
            }
        }
        
        if (endPage < this.totalPages) {
            if (endPage < this.totalPages - 1) {
                pageButtons += `<span class="page-ellipsis">...</span>`;
            }
            pageButtons += `<button onclick="paginator.goToPage(${this.totalPages}) && renderPage()" class="page-btn">${this.totalPages}</button>`;
        }
        
        return `
            <div class="pagination-controls">
                ${prev}
                ${pageButtons}
                ${next}
                <span class="page-info">Page ${this.currentPage} of ${this.totalPages} (${this.items.length} items)</span>
            </div>
        `;
    }
}

// Era-based theming
function getEraFromYear(year) {
    if (year < 1980) return '1970s';
    if (year < 1990) return '1980s';
    if (year < 2000) return '1990s';
    if (year < 2010) return '2000s';
    if (year < 2020) return '2010s';
    return '2020s';
}

function applyEraTheme(year) {
    const era = getEraFromYear(year);
    const body = document.body;
    
    // Remove all era classes
    body.className = body.className.replace(/era-\w+/g, '').trim();
    
    // Add current era class
    body.classList.add(`era-${era}`);
    
    return era;
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
