/**
 * Asset Type and Sector Filter Component
 * Provides filtering functionality for portfolios and trading views
 */

class AssetFilter {
    constructor(options = {}) {
        this.options = {
            containerId: options.containerId || 'filterSidebar',
            onFilterChange: options.onFilterChange || (() => {}),
            showTypes: options.showTypes !== false,
            showSectors: options.showSectors !== false,
            availableTypes: options.availableTypes || ['stocks', 'indexfunds'],
            availableSectors: options.availableSectors || [],
            ...options
        };

        this.activeFilters = {
            types: new Set(this.options.availableTypes), // All types selected by default
            sectors: new Set(),
            searchTerm: ''
        };

        this.init();
    }

    init() {
        this.addFilterStyles();
        this.renderSidebar();
        this.attachEventListeners();
    }

    addFilterStyles() {
        if (document.getElementById('asset-filter-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'asset-filter-styles';
        styles.textContent = `
            .filter-sidebar {
                background-color: #000;
                border: 2px solid #00ff00;
                padding: 15px;
                margin-bottom: 20px;
            }

            .filter-section {
                margin-bottom: 15px;
            }

            .filter-section h3 {
                color: #00ff00;
                font-size: 1em;
                margin-bottom: 10px;
                border-bottom: 1px solid #003300;
                padding-bottom: 5px;
            }

            .filter-option {
                display: flex;
                align-items: center;
                margin: 8px 0;
                cursor: pointer;
                padding: 5px;
                transition: background-color 0.2s;
            }

            .filter-option:hover {
                background-color: #002200;
            }

            .filter-checkbox {
                width: 18px;
                height: 18px;
                margin-right: 10px;
                cursor: pointer;
                accent-color: #00ff00;
            }

            .filter-label {
                color: #00ff00;
                cursor: pointer;
                user-select: none;
                flex-grow: 1;
            }

            .filter-count {
                color: #00aa00;
                font-size: 0.9em;
                margin-left: 5px;
            }

            .filter-search {
                width: 100%;
                padding: 8px;
                background-color: #001100;
                border: 1px solid #00ff00;
                color: #00ff00;
                font-family: 'Courier New', monospace;
                font-size: 0.9em;
                margin-bottom: 10px;
            }

            .filter-search::placeholder {
                color: #006600;
            }

            .filter-search:focus {
                outline: none;
                border-color: #00ff00;
                box-shadow: 0 0 5px #00ff00;
            }

            .filter-actions {
                display: flex;
                gap: 10px;
                margin-top: 15px;
            }

            .filter-btn {
                flex: 1;
                padding: 8px;
                background-color: #003300;
                border: 1px solid #00ff00;
                color: #00ff00;
                cursor: pointer;
                font-family: 'Courier New', monospace;
                font-size: 0.85em;
                transition: all 0.2s;
            }

            .filter-btn:hover {
                background-color: #004400;
            }

            .filter-btn:active {
                background-color: #005500;
            }

            .active-filters {
                background-color: #001100;
                padding: 8px;
                margin-top: 10px;
                border: 1px solid #003300;
                font-size: 0.85em;
                min-height: 30px;
            }

            .filter-tag {
                display: inline-block;
                background-color: #003300;
                color: #00ff00;
                padding: 3px 8px;
                margin: 2px;
                border: 1px solid #00ff00;
                border-radius: 3px;
                font-size: 0.8em;
            }

            .filter-tag .remove {
                margin-left: 5px;
                cursor: pointer;
                font-weight: bold;
            }

            .filter-tag .remove:hover {
                color: #ff0000;
            }
        `;
        document.head.appendChild(styles);
    }

    renderSidebar() {
        const container = document.getElementById(this.options.containerId);
        if (!container) {
            console.warn(`Filter container ${this.options.containerId} not found`);
            return;
        }

        let html = '<div class="filter-sidebar">';
        
        // Search box
        html += `
            <div class="filter-section">
                <input type="text" 
                       class="filter-search" 
                       id="filterSearch" 
                       placeholder="🔍 Search symbols or names...">
            </div>
        `;

        // Asset Type Filters
        if (this.options.showTypes && this.options.availableTypes.length > 0) {
            html += '<div class="filter-section">';
            html += '<h3>Asset Type</h3>';
            
            this.options.availableTypes.forEach(type => {
                const displayName = this.getDisplayName(type);
                const icon = this.getTypeIcon(type);
                const checked = this.activeFilters.types.has(type) ? 'checked' : '';
                
                html += `
                    <div class="filter-option">
                        <input type="checkbox" 
                               class="filter-checkbox type-filter" 
                               id="filter-type-${type}" 
                               value="${type}"
                               ${checked}>
                        <label class="filter-label" for="filter-type-${type}">
                            ${icon} ${displayName}
                            <span class="filter-count" id="count-type-${type}">0</span>
                        </label>
                    </div>
                `;
            });
            
            html += '</div>';
        }

        // Sector Filters
        if (this.options.showSectors && this.options.availableSectors.length > 0) {
            html += '<div class="filter-section">';
            html += '<h3>Sector</h3>';
            
            this.options.availableSectors.forEach(sector => {
                const checked = this.activeFilters.sectors.has(sector) ? 'checked' : '';
                
                html += `
                    <div class="filter-option">
                        <input type="checkbox" 
                               class="filter-checkbox sector-filter" 
                               id="filter-sector-${sector}" 
                               value="${sector}"
                               ${checked}>
                        <label class="filter-label" for="filter-sector-${sector}">
                            ${sector}
                            <span class="filter-count" id="count-sector-${sector}">0</span>
                        </label>
                    </div>
                `;
            });
            
            html += '</div>';
        }

        // Filter Actions
        html += `
            <div class="filter-actions">
                <button class="filter-btn" id="selectAllBtn">Select All</button>
                <button class="filter-btn" id="clearAllBtn">Clear All</button>
            </div>
        `;

        // Active Filters Display
        html += '<div class="active-filters" id="activeFiltersDisplay"></div>';

        html += '</div>';

        container.innerHTML = html;
    }

    attachEventListeners() {
        // Search input
        const searchInput = document.getElementById('filterSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.activeFilters.searchTerm = e.target.value.toLowerCase();
                this.notifyFilterChange();
            });
        }

        // Type checkboxes
        document.querySelectorAll('.type-filter').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const type = e.target.value;
                if (e.target.checked) {
                    this.activeFilters.types.add(type);
                } else {
                    this.activeFilters.types.delete(type);
                }
                this.notifyFilterChange();
            });
        });

        // Sector checkboxes
        document.querySelectorAll('.sector-filter').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const sector = e.target.value;
                if (e.target.checked) {
                    this.activeFilters.sectors.add(sector);
                } else {
                    this.activeFilters.sectors.delete(sector);
                }
                this.notifyFilterChange();
            });
        });

        // Select All button
        const selectAllBtn = document.getElementById('selectAllBtn');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => {
                document.querySelectorAll('.filter-checkbox').forEach(cb => {
                    cb.checked = true;
                    const value = cb.value;
                    if (cb.classList.contains('type-filter')) {
                        this.activeFilters.types.add(value);
                    } else if (cb.classList.contains('sector-filter')) {
                        this.activeFilters.sectors.add(value);
                    }
                });
                this.notifyFilterChange();
            });
        }

        // Clear All button
        const clearAllBtn = document.getElementById('clearAllBtn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                document.querySelectorAll('.filter-checkbox').forEach(cb => {
                    cb.checked = false;
                });
                this.activeFilters.types.clear();
                this.activeFilters.sectors.clear();
                this.notifyFilterChange();
            });
        }
    }

    notifyFilterChange() {
        this.updateActiveFiltersDisplay();
        this.options.onFilterChange(this.getFilters());
    }

    updateActiveFiltersDisplay() {
        const display = document.getElementById('activeFiltersDisplay');
        if (!display) return;

        const activeCount = this.activeFilters.types.size + 
                          this.activeFilters.sectors.size + 
                          (this.activeFilters.searchTerm ? 1 : 0);

        if (activeCount === 0) {
            display.innerHTML = '<em style="color: #666;">No active filters</em>';
            return;
        }

        let html = '';
        
        // Search term tag
        if (this.activeFilters.searchTerm) {
            html += `
                <span class="filter-tag">
                    🔍 "${this.activeFilters.searchTerm}"
                    <span class="remove" onclick="document.getElementById('filterSearch').value=''; 
                                                   document.getElementById('filterSearch').dispatchEvent(new Event('input'));">✕</span>
                </span>
            `;
        }

        display.innerHTML = html || '<em style="color: #00aa00;">Filters active</em>';
    }

    updateCounts(counts) {
        // Update type counts
        Object.keys(counts.types || {}).forEach(type => {
            const countEl = document.getElementById(`count-type-${type}`);
            if (countEl) {
                countEl.textContent = `(${counts.types[type]})`;
            }
        });

        // Update sector counts
        Object.keys(counts.sectors || {}).forEach(sector => {
            const countEl = document.getElementById(`count-sector-${sector}`);
            if (countEl) {
                countEl.textContent = `(${counts.sectors[sector]})`;
            }
        });
    }

    getFilters() {
        return {
            types: Array.from(this.activeFilters.types),
            sectors: Array.from(this.activeFilters.sectors),
            searchTerm: this.activeFilters.searchTerm
        };
    }

    getDisplayName(type) {
        const names = {
            'stocks': 'Individual Stocks',
            'indexfunds': 'Index Funds',
            'etf': 'ETFs',
            'bonds': 'Bonds'
        };
        return names[type] || type;
    }

    getTypeIcon(type) {
        const icons = {
            'stocks': '📈',
            'indexfunds': '📊',
            'etf': '🎯',
            'bonds': '💼'
        };
        return icons[type] || '•';
    }

    /**
     * Check if an item passes the current filters
     */
    matchesFilter(item) {
        // Check type filter
        if (this.activeFilters.types.size > 0 && 
            item.type && 
            !this.activeFilters.types.has(item.type)) {
            return false;
        }

        // Check sector filter (only if sectors are active)
        if (this.activeFilters.sectors.size > 0 && 
            item.sector && 
            !this.activeFilters.sectors.has(item.sector)) {
            return false;
        }

        // Check search term
        if (this.activeFilters.searchTerm) {
            const term = this.activeFilters.searchTerm;
            const searchableText = `${item.symbol || ''} ${item.name || ''}`.toLowerCase();
            if (!searchableText.includes(term)) {
                return false;
            }
        }

        return true;
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AssetFilter;
}
