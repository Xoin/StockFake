/**
 * Table Sorter Utility
 * Provides sortable table functionality with visual indicators
 */

class TableSorter {
    constructor(tableId, options = {}) {
        this.table = document.getElementById(tableId);
        if (!this.table) {
            console.error(`Table with id "${tableId}" not found`);
            return;
        }

        this.options = {
            sortableColumns: options.sortableColumns || [], // Array of column indices to make sortable
            defaultSort: options.defaultSort || null, // { column: 0, direction: 'asc' }
            onSort: options.onSort || null, // Callback function after sorting
            ...options
        };

        this.currentSort = this.options.defaultSort;
        this.init();
    }

    init() {
        this.addSortingStyles();
        this.makeHeadersSortable();
        
        // Apply default sort if specified
        if (this.currentSort) {
            this.sortTable(this.currentSort.column, this.currentSort.direction);
        }
    }

    addSortingStyles() {
        if (document.getElementById('table-sorter-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'table-sorter-styles';
        styles.textContent = `
            .sortable-header {
                cursor: pointer;
                user-select: none;
                position: relative;
                padding-right: 20px !important;
            }

            .sortable-header:hover {
                background-color: #004400 !important;
            }

            .sortable-header::after {
                content: '⇅';
                position: absolute;
                right: 8px;
                opacity: 0.5;
                font-size: 0.8em;
            }

            .sortable-header.sort-asc::after {
                content: '↑';
                opacity: 1;
                color: #00ff00;
            }

            .sortable-header.sort-desc::after {
                content: '↓';
                opacity: 1;
                color: #00ff00;
            }

            .sortable-row:hover {
                background-color: #002200;
            }
        `;
        document.head.appendChild(styles);
    }

    makeHeadersSortable() {
        const thead = this.table.querySelector('thead');
        if (!thead) return;

        const headerRow = thead.querySelector('tr');
        if (!headerRow) return;

        const headers = headerRow.querySelectorAll('th');
        headers.forEach((header, index) => {
            // Check if this column should be sortable
            if (this.options.sortableColumns.length === 0 || 
                this.options.sortableColumns.includes(index)) {
                header.classList.add('sortable-header');
                header.dataset.columnIndex = index;
                header.addEventListener('click', () => this.handleHeaderClick(index));
            }
        });

        // Make rows hoverable
        const tbody = this.table.querySelector('tbody');
        if (tbody) {
            tbody.querySelectorAll('tr').forEach(row => {
                row.classList.add('sortable-row');
            });
        }
    }

    handleHeaderClick(columnIndex) {
        const headers = this.table.querySelectorAll('thead th');
        const header = headers[columnIndex];

        let direction = 'asc';
        
        // Toggle direction if clicking the same column
        if (this.currentSort && this.currentSort.column === columnIndex) {
            direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        }

        // Update header classes
        headers.forEach(h => {
            h.classList.remove('sort-asc', 'sort-desc');
        });
        header.classList.add(`sort-${direction}`);

        // Sort the table
        this.sortTable(columnIndex, direction);
        
        // Update current sort
        this.currentSort = { column: columnIndex, direction };

        // Call callback if provided
        if (this.options.onSort) {
            this.options.onSort(columnIndex, direction);
        }
    }

    sortTable(columnIndex, direction = 'asc') {
        const tbody = this.table.querySelector('tbody');
        if (!tbody) return;

        const rows = Array.from(tbody.querySelectorAll('tr'));
        
        // Don't sort if there's only one row or if it's a "no data" row
        if (rows.length <= 1) return;

        rows.sort((a, b) => {
            const aCell = a.cells[columnIndex];
            const bCell = b.cells[columnIndex];

            if (!aCell || !bCell) return 0;

            let aValue = aCell.textContent.trim();
            let bValue = bCell.textContent.trim();

            // Try to parse as number (handling $ signs, commas, etc.)
            const aNum = this.parseValue(aValue);
            const bNum = this.parseValue(bValue);

            let comparison = 0;
            
            if (!isNaN(aNum) && !isNaN(bNum)) {
                // Numeric comparison
                comparison = aNum - bNum;
            } else {
                // String comparison
                comparison = aValue.localeCompare(bValue);
            }

            return direction === 'asc' ? comparison : -comparison;
        });

        // Re-append rows in sorted order
        rows.forEach(row => tbody.appendChild(row));
    }

    parseValue(value) {
        // Remove common formatting characters
        const cleaned = value.replace(/[$,% ]/g, '');
        
        // Handle percentage
        if (value.includes('%')) {
            return parseFloat(cleaned);
        }
        
        // Handle negative numbers in parentheses: ($1,234) -> -1234
        if (value.includes('(') && value.includes(')')) {
            return -parseFloat(cleaned.replace(/[()]/g, ''));
        }
        
        return parseFloat(cleaned);
    }

    /**
     * Refresh the sorter after table data changes
     */
    refresh() {
        const tbody = this.table.querySelector('tbody');
        if (tbody) {
            tbody.querySelectorAll('tr').forEach(row => {
                row.classList.add('sortable-row');
            });
        }

        // Re-apply current sort if exists
        if (this.currentSort) {
            // Update header visual indicators
            const headers = this.table.querySelectorAll('thead th');
            headers.forEach((h, idx) => {
                h.classList.remove('sort-asc', 'sort-desc');
                if (idx === this.currentSort.column) {
                    h.classList.add(`sort-${this.currentSort.direction}`);
                }
            });
            
            // Re-sort the table
            this.sortTable(this.currentSort.column, this.currentSort.direction);
        }
    }

    /**
     * Get current sort state
     */
    getSortState() {
        return this.currentSort;
    }

    /**
     * Set sort state programmatically
     */
    setSortState(column, direction = 'asc') {
        this.handleHeaderClick(column);
        if (this.currentSort.direction !== direction) {
            this.handleHeaderClick(column); // Click again to toggle
        }
    }
}

/**
 * Helper function to quickly add sorting to a table
 * @param {string} tableId - ID of the table element
 * @param {object} options - Sorting options
 * @param {number[]} options.sortableColumns - Array of column indices to make sortable (empty = all columns)
 * @param {object} options.defaultSort - Default sort state { column: number, direction: 'asc'|'desc' }
 * @param {function} options.onSort - Callback function called after sorting (columnIndex, direction)
 * @returns {TableSorter} TableSorter instance
 */
function makeSortable(tableId, options = {}) {
    return new TableSorter(tableId, options);
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TableSorter, makeSortable };
}
