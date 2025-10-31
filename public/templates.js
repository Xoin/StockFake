// Shared HTML template system for StockFake
// Provides reusable components for consistent UI across all pages

const Templates = {
    // Create sortable table with consistent styling
    createSortableTable: function(options = {}) {
        const {
            id = 'dataTable',
            columns = [],
            data = [],
            onSort = null,
            renderRow = null,
            className = ''
        } = options;

        return {
            id,
            columns,
            data,
            currentSort: { column: null, direction: 'asc' },
            
            // Render the table HTML
            render: function() {
                const thead = this.renderHeaders();
                const tbody = this.renderBody();
                return `
                    <table id="${this.id}" class="sortable-table ${className}">
                        ${thead}
                        ${tbody}
                    </table>
                `;
            },
            
            // Render table headers with sort indicators
            renderHeaders: function() {
                const headers = this.columns.map(col => {
                    const sortable = col.sortable !== false;
                    const sortIndicator = this.currentSort.column === col.key 
                        ? (this.currentSort.direction === 'asc' ? ' ▲' : ' ▼')
                        : '';
                    const sortClass = sortable ? 'sortable' : '';
                    const dataKey = col.key || '';
                    
                    return `<th class="${sortClass}" data-sort-key="${dataKey}">${col.label}${sortIndicator}</th>`;
                }).join('');
                
                return `
                    <thead>
                        <tr>${headers}</tr>
                    </thead>
                `;
            },
            
            // Render table body
            renderBody: function() {
                if (this.data.length === 0) {
                    return `
                        <tbody>
                            <tr><td colspan="${this.columns.length}">No data available</td></tr>
                        </tbody>
                    `;
                }
                
                const rows = this.data.map(item => {
                    if (renderRow) {
                        return renderRow(item);
                    }
                    
                    const cells = this.columns.map(col => {
                        const value = col.key ? item[col.key] : '';
                        const formatted = col.format ? col.format(value, item) : escapeHtml(String(value));
                        const cellClass = col.cellClass ? col.cellClass(value, item) : '';
                        return `<td class="${cellClass}">${formatted}</td>`;
                    }).join('');
                    
                    return `<tr>${cells}</tr>`;
                }).join('');
                
                return `<tbody>${rows}</tbody>`;
            },
            
            // Sort data by column
            sort: function(columnKey) {
                const column = this.columns.find(c => c.key === columnKey);
                if (!column || column.sortable === false) return;
                
                // Toggle direction if same column, otherwise default to asc
                if (this.currentSort.column === columnKey) {
                    this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    this.currentSort.column = columnKey;
                    this.currentSort.direction = 'asc';
                }
                
                // Sort the data
                this.data.sort((a, b) => {
                    let aVal = a[columnKey];
                    let bVal = b[columnKey];
                    
                    // Handle custom sort values
                    if (column.sortValue) {
                        aVal = column.sortValue(a);
                        bVal = column.sortValue(b);
                    }
                    
                    // Handle different types
                    if (typeof aVal === 'number' && typeof bVal === 'number') {
                        return this.currentSort.direction === 'asc' ? aVal - bVal : bVal - aVal;
                    }
                    
                    // String comparison
                    const aStr = String(aVal).toLowerCase();
                    const bStr = String(bVal).toLowerCase();
                    
                    if (this.currentSort.direction === 'asc') {
                        return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
                    } else {
                        return bStr < aStr ? -1 : bStr > aStr ? 1 : 0;
                    }
                });
                
                if (onSort) {
                    onSort(columnKey, this.currentSort.direction);
                }
            },
            
            // Update table data and re-render
            update: function(newData) {
                this.data = newData;
                return this.render();
            }
        };
    },
    
    // Create filter sidebar
    createFilterSidebar: function(options = {}) {
        const {
            id = 'filterSidebar',
            title = 'Filters',
            filters = [],
            onFilterChange = null
        } = options;
        
        return {
            id,
            title,
            filters,
            activeFilters: {},
            
            render: function() {
                const filterGroups = this.filters.map(filter => {
                    return `
                        <div class="filter-group">
                            <h4>${escapeHtml(filter.label)}</h4>
                            ${this.renderFilterOptions(filter)}
                        </div>
                    `;
                }).join('');
                
                return `
                    <div id="${this.id}" class="filter-sidebar">
                        <h3>${escapeHtml(this.title)}</h3>
                        ${filterGroups}
                        <button onclick="Templates.clearAllFilters('${this.id}')" class="clear-filters-btn">Clear All Filters</button>
                    </div>
                `;
            },
            
            renderFilterOptions: function(filter) {
                if (filter.type === 'checkbox') {
                    return filter.options.map(option => {
                        const checked = this.activeFilters[filter.key]?.includes(option.value) ? 'checked' : '';
                        const id = `filter-${filter.key}-${option.value.replace(/\s+/g, '-')}`;
                        return `
                            <label class="filter-option">
                                <input type="checkbox" 
                                       id="${id}"
                                       data-filter-key="${filter.key}" 
                                       data-filter-value="${escapeHtml(option.value)}"
                                       ${checked}
                                       onchange="Templates.handleFilterChange('${this.id}', this)">
                                <span>${escapeHtml(option.label)} ${option.count ? `(${option.count})` : ''}</span>
                            </label>
                        `;
                    }).join('');
                }
                
                return '';
            },
            
            applyFilter: function(key, value, checked) {
                if (!this.activeFilters[key]) {
                    this.activeFilters[key] = [];
                }
                
                if (checked) {
                    if (!this.activeFilters[key].includes(value)) {
                        this.activeFilters[key].push(value);
                    }
                } else {
                    this.activeFilters[key] = this.activeFilters[key].filter(v => v !== value);
                }
                
                if (onFilterChange) {
                    onFilterChange(this.activeFilters);
                }
            },
            
            clearAll: function() {
                this.activeFilters = {};
                // Uncheck all checkboxes
                const checkboxes = document.querySelectorAll(`#${this.id} input[type="checkbox"]`);
                checkboxes.forEach(cb => cb.checked = false);
                
                if (onFilterChange) {
                    onFilterChange(this.activeFilters);
                }
            },
            
            filterData: function(data, itemKeyGetter) {
                if (Object.keys(this.activeFilters).length === 0) {
                    return data;
                }
                
                return data.filter(item => {
                    return Object.entries(this.activeFilters).every(([key, values]) => {
                        if (values.length === 0) return true;
                        const itemValue = itemKeyGetter(item, key);
                        return values.includes(itemValue);
                    });
                });
            }
        };
    },
    
    // Create portfolio summary card
    createPortfolioSummary: function(portfolioData) {
        const {
            totalValue = 0,
            cash = 0,
            stocksValue = 0,
            totalGainLoss = 0,
            percentReturn = 0,
            positionCount = 0,
            diversificationScore = 0,
            sectorAllocation = {}
        } = portfolioData;
        
        const gainLossClass = totalGainLoss >= 0 ? 'positive' : 'negative';
        const returnClass = percentReturn >= 0 ? 'positive' : 'negative';
        
        const sectorBars = Object.entries(sectorAllocation)
            .sort((a, b) => b[1] - a[1])
            .map(([sector, percentage]) => {
                return `
                    <div class="sector-bar">
                        <div class="sector-label">${escapeHtml(sector)}</div>
                        <div class="sector-progress">
                            <div class="sector-fill" style="width: ${percentage}%"></div>
                        </div>
                        <div class="sector-percentage">${percentage.toFixed(1)}%</div>
                    </div>
                `;
            }).join('');
        
        return `
            <div class="portfolio-summary-card">
                <h3>Portfolio Overview</h3>
                <div class="portfolio-metrics">
                    <div class="metric-row">
                        <span class="metric-label">Total Value:</span>
                        <span class="metric-value">$${totalValue.toFixed(2)}</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Cash:</span>
                        <span class="metric-value">$${cash.toFixed(2)}</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Stocks Value:</span>
                        <span class="metric-value">$${stocksValue.toFixed(2)}</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Total Gain/Loss:</span>
                        <span class="metric-value ${gainLossClass}">$${totalGainLoss.toFixed(2)}</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Return:</span>
                        <span class="metric-value ${returnClass}">${percentReturn >= 0 ? '+' : ''}${percentReturn.toFixed(2)}%</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Positions:</span>
                        <span class="metric-value">${positionCount}</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Diversification:</span>
                        <span class="metric-value">${diversificationScore.toFixed(0)}/100</span>
                    </div>
                </div>
                ${Object.keys(sectorAllocation).length > 0 ? `
                    <div class="sector-allocation">
                        <h4>Sector Allocation</h4>
                        ${sectorBars}
                    </div>
                ` : ''}
            </div>
        `;
    }
};

// Global helper for filter changes
Templates.handleFilterChange = function(sidebarId, checkbox) {
    const key = checkbox.dataset.filterKey;
    const value = checkbox.dataset.filterValue;
    const checked = checkbox.checked;
    
    // Find the sidebar instance and apply filter
    if (window.filterSidebarInstance) {
        window.filterSidebarInstance.applyFilter(key, value, checked);
    }
};

// Global helper to clear all filters
Templates.clearAllFilters = function(sidebarId) {
    if (window.filterSidebarInstance) {
        window.filterSidebarInstance.clearAll();
    }
};

// Helper function for HTML escaping (if not already defined)
if (typeof escapeHtml === 'undefined') {
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
