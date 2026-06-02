/**
 * YAML Editor Component
 *
 * Handles YAML display and editing with syntax highlighting
 */

export class YAMLEditorComponent {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }

    this.content = '';
    this.editorElement = null;
    this.initialize();
  }

  /**
   * Initialize the editor
   */
  initialize() {
    // Clear placeholder if exists
    const placeholder = this.container.querySelector('.yaml-placeholder');
    if (placeholder) {
      placeholder.style.display = 'none';
    }

    // Create editor element
    this.editorElement = document.createElement('pre');
    this.editorElement.className = 'yaml-content';

    const codeElement = document.createElement('code');
    codeElement.className = 'language-yaml';

    this.editorElement.appendChild(codeElement);
    this.container.appendChild(this.editorElement);
  }

  /**
   * Set YAML content
   */
  setContent(yamlString) {
    this.content = yamlString;

    // Hide placeholder
    const placeholder = this.container.querySelector('.yaml-placeholder');
    if (placeholder) {
      placeholder.style.display = 'none';
    }

    // Update editor
    const codeElement = this.editorElement.querySelector('code');
    if (codeElement) {
      codeElement.textContent = yamlString;
      this.applySyntaxHighlighting(codeElement);
      this.animateUpdate();
    }
  }

  /**
   * Get YAML content
   */
  getContent() {
    return this.content;
  }

  /**
   * Apply syntax highlighting
   */
  applySyntaxHighlighting(element) {
    const yaml = element.textContent;

    // Simple syntax highlighting
    const highlighted = yaml
      // Comments
      .replace(/(#.*)$/gm, '<span class="yaml-comment">$1</span>')
      // Keys
      .replace(/^(\s*)([a-zA-Z_][a-zA-Z0-9_]*)(:\s*)/gm, '$1<span class="yaml-key">$2</span>$3')
      // Strings
      .replace(/(['"])(.*?)\1/g, '<span class="yaml-string">$1$2$1</span>')
      // Numbers
      .replace(/:\s*(\d+)/g, ': <span class="yaml-number">$1</span>')
      // Booleans
      .replace(/:\s*(true|false|yes|no|on|off)/gi, ': <span class="yaml-boolean">$1</span>')
      // Null
      .replace(/:\s*(null|~)/gi, ': <span class="yaml-null">$1</span>');

    element.innerHTML = highlighted;
  }

  /**
   * Animate content update
   */
  animateUpdate() {
    if (this.editorElement) {
      this.editorElement.style.opacity = '0.7';
      setTimeout(() => {
        this.editorElement.style.transition = 'opacity 0.3s ease';
        this.editorElement.style.opacity = '1';
      }, 50);
    }
  }

  /**
   * Highlight specific lines
   */
  highlightLines(startLine, endLine) {
    const lines = this.editorElement.querySelectorAll('.line');
    lines.forEach((line, index) => {
      if (index >= startLine - 1 && index <= endLine - 1) {
        line.classList.add('highlighted');
        setTimeout(() => {
          line.classList.remove('highlighted');
        }, 2000);
      }
    });
  }

  /**
   * Copy to clipboard
   */
  async copyToClipboard() {
    try {
      await navigator.clipboard.writeText(this.content);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback method
      return this.copyToClipboardFallback();
    }
  }

  /**
   * Fallback clipboard copy method
   */
  copyToClipboardFallback() {
    const textarea = document.createElement('textarea');
    textarea.value = this.content;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch (error) {
      console.error('Fallback copy failed:', error);
      document.body.removeChild(textarea);
      return false;
    }
  }

  /**
   * Download as file
   */
  downloadFile(filename = 'cics-region.yaml') {
    const blob = new Blob([this.content], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  /**
   * Validate YAML
   */
  validate() {
    try {
      // Basic validation - check for common YAML errors
      const lines = this.content.split('\n');
      const errors = [];

      lines.forEach((line, index) => {
        // Check for tabs (YAML doesn't allow tabs)
        if (line.includes('\t')) {
          errors.push({
            line: index + 1,
            message: 'YAML does not allow tabs for indentation'
          });
        }

        // Check for inconsistent indentation
        const indent = line.match(/^\s*/)[0].length;
        if (indent % 2 !== 0 && line.trim() !== '') {
          errors.push({
            line: index + 1,
            message: 'Inconsistent indentation (should be multiples of 2)'
          });
        }
      });

      return {
        valid: errors.length === 0,
        errors: errors
      };
    } catch (error) {
      return {
        valid: false,
        errors: [{ line: 0, message: error.message }]
      };
    }
  }

  /**
   * Format YAML content
   */
  format() {
    // Basic formatting - ensure consistent indentation
    const lines = this.content.split('\n');
    const formatted = lines.map(line => {
      // Replace tabs with spaces
      return line.replace(/\t/g, '  ');
    }).join('\n');

    this.setContent(formatted);
  }

  /**
   * Clear content
   */
  clear() {
    this.content = '';
    const codeElement = this.editorElement?.querySelector('code');
    if (codeElement) {
      codeElement.textContent = '';
    }

    // Show placeholder
    const placeholder = this.container.querySelector('.yaml-placeholder');
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
  }

  /**
   * Get line count
   */
  getLineCount() {
    return this.content.split('\n').length;
  }

  /**
   * Get character count
   */
  getCharacterCount() {
    return this.content.length;
  }

  /**
   * Export as JSON
   */
  exportAsJSON() {
    try {
      // This would require a YAML parser
      // For now, return the YAML as-is
      return {
        success: false,
        message: 'JSON export requires YAML parser'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
}

// Made with Bob
