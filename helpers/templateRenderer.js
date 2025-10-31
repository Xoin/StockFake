const fs = require('fs');
const path = require('path');

/**
 * Simple template renderer for HTML templates
 * Replaces {{variable}} placeholders with provided values
 */
class TemplateRenderer {
  constructor(templatesDir = 'templates') {
    this.templatesDir = path.join(__dirname, '..', templatesDir);
    this.cache = {};
  }

  /**
   * Load a template file
   * @param {string} templateName - Name of the template file (without .html)
   * @returns {string} Template content
   */
  loadTemplate(templateName) {
    const templatePath = path.join(this.templatesDir, `${templateName}.html`);
    
    // Check cache in development mode we might want to disable caching
    if (this.cache[templatePath]) {
      return this.cache[templatePath];
    }
    
    try {
      const content = fs.readFileSync(templatePath, 'utf-8');
      this.cache[templatePath] = content;
      return content;
    } catch (error) {
      console.error(`Error loading template ${templateName}:`, error);
      throw new Error(`Template ${templateName} not found`);
    }
  }

  /**
   * Render a template with given variables
   * @param {string} template - Template content
   * @param {object} vars - Variables to replace in template
   * @returns {string} Rendered template
   */
  render(template, vars = {}) {
    let rendered = template;
    
    // Replace all {{variable}} with values from vars object
    Object.keys(vars).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, vars[key] || '');
    });
    
    // Remove any remaining unmatched placeholders
    rendered = rendered.replace(/{{[^}]+}}/g, '');
    
    return rendered;
  }

  /**
   * Render a complete page with header and footer
   * @param {object} options - Page rendering options
   * @param {string} options.title - Page title for browser tab
   * @param {string} options.pageTitle - Page heading
   * @param {string} options.content - Main content HTML
   * @param {string} options.additionalStyles - Additional CSS styles
   * @param {string} options.additionalScripts - Additional JavaScript
   * @returns {string} Complete HTML page
   */
  renderPage(options) {
    const {
      title = 'StockFake',
      pageTitle = '',
      content = '',
      additionalStyles = '',
      additionalScripts = ''
    } = options;

    const header = this.loadTemplate('header');
    const footer = this.loadTemplate('footer');

    const renderedHeader = this.render(header, {
      title,
      pageTitle,
      additionalStyles
    });

    const renderedFooter = this.render(footer, {
      additionalScripts
    });

    return renderedHeader + content + renderedFooter;
  }

  /**
   * Clear template cache (useful for development)
   */
  clearCache() {
    this.cache = {};
  }
}

module.exports = new TemplateRenderer();
