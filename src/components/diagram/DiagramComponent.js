/**
 * Diagram Component
 *
 * Handles visual architecture diagrams using Mermaid.js
 */

import mermaid from 'mermaid';

export class DiagramComponent {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }

    this.currentConfig = null;
    this.zoomLevel = 1;

    // Initialize Mermaid
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
      }
    });
  }

  /**
   * Render diagram from configuration
   */
  async render(config) {
    this.currentConfig = config;

    // Clear placeholder if exists
    const placeholder = this.container.querySelector('.diagram-placeholder');
    if (placeholder) {
      placeholder.remove();
    }

    // Generate Mermaid code
    const mermaidCode = this.generateMermaidCode(config);

    try {
      // Create unique ID for this diagram
      const diagramId = `diagram-${Date.now()}`;

      // Render with Mermaid
      const { svg } = await mermaid.render(diagramId, mermaidCode);

      // Update container
      this.container.innerHTML = svg;

      // Apply zoom
      this.applyZoom();

      // Animate in
      this.animateIn();
    } catch (error) {
      console.error('Error rendering diagram:', error);
      this.showError('Failed to render diagram');
    }
  }

  /**
   * Generate Mermaid code from configuration
   */
  generateMermaidCode(config) {
    if (!config.applid) {
      return this.getEmptyDiagram();
    }

    const components = [];
    const connections = [];
    const styles = [];

    // CICS Region (always present)
    components.push(`CICS["🏢 CICS Region<br/><b>${config.applid}</b><br/>${config.memory || '512M'}"]`);
    styles.push('class CICS cicsStyle');

    // JVM
    if (config.jvm && config.jvm.enabled) {
      components.push(`JVM["☕ JVM<br/>${config.jvm.heap_size || '512M'} heap"]`);
      connections.push('CICS --> JVM');
      styles.push('class JVM jvmStyle');
    }

    // CMCI
    if (config.cmci && config.cmci.enabled) {
      components.push(`CMCI["🔧 CMCI<br/>Port ${config.cmci.port || 1490}"]`);
      connections.push('CICS --> CMCI');
      styles.push('class CMCI cmciStyle');
    }

    // Database
    if (config.database && config.database.enabled) {
      components.push(`DB[("🗄️ ${config.database.type || 'DB2'}<br/>Database")]`);
      connections.push('CICS --> DB');
      styles.push('class DB dbStyle');
    }

    // Datasets
    if (config.applid) {
      components.push(`CSD["📁 CSD<br/>System Definitions"]`);
      components.push(`GCD["📁 GCD<br/>Global Catalog"]`);
      connections.push('CICS -.-> CSD');
      connections.push('CICS -.-> GCD');
      styles.push('class CSD,GCD datasetStyle');
    }

    // Build the complete diagram
    const mermaidCode = `
graph TD
    ${components.join('\n    ')}

    ${connections.join('\n    ')}

    classDef cicsStyle fill:#0f62fe,stroke:#fff,stroke-width:2px,color:#fff
    classDef jvmStyle fill:#24a148,stroke:#fff,stroke-width:2px,color:#fff
    classDef cmciStyle fill:#8a3ffc,stroke:#fff,stroke-width:2px,color:#fff
    classDef dbStyle fill:#da1e28,stroke:#fff,stroke-width:2px,color:#fff
    classDef datasetStyle fill:#f1c21b,stroke:#333,stroke-width:2px,color:#333

    ${styles.join('\n    ')}
`;

    return mermaidCode;
  }

  /**
   * Get empty diagram placeholder
   */
  getEmptyDiagram() {
    return `
graph TD
    START["🚀 Start Building<br/>Chat with Bob to begin"]

    classDef startStyle fill:#e0e0e0,stroke:#999,stroke-width:2px,color:#333
    class START startStyle
`;
  }

  /**
   * Animate diagram in
   */
  animateIn() {
    const svg = this.container.querySelector('svg');
    if (svg) {
      svg.style.opacity = '0';
      svg.style.transform = 'scale(0.95)';

      requestAnimationFrame(() => {
        svg.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        svg.style.opacity = '1';
        svg.style.transform = 'scale(1)';
      });
    }
  }

  /**
   * Zoom in
   */
  zoomIn() {
    this.zoomLevel = Math.min(this.zoomLevel + 0.1, 2);
    this.applyZoom();
  }

  /**
   * Zoom out
   */
  zoomOut() {
    this.zoomLevel = Math.max(this.zoomLevel - 0.1, 0.5);
    this.applyZoom();
  }

  /**
   * Reset zoom
   */
  reset() {
    this.zoomLevel = 1;
    this.applyZoom();
  }

  /**
   * Apply current zoom level
   */
  applyZoom() {
    const svg = this.container.querySelector('svg');
    if (svg) {
      svg.style.transform = `scale(${this.zoomLevel})`;
      svg.style.transformOrigin = 'center center';
      svg.style.transition = 'transform 0.3s ease';
    }
  }

  /**
   * Update specific component
   */
  async updateComponent(componentId, properties) {
    // Re-render with updated config
    if (this.currentConfig) {
      await this.render(this.currentConfig);
    }
  }

  /**
   * Highlight component
   */
  highlight(componentId) {
    const elements = this.container.querySelectorAll(`[id*="${componentId}"]`);
    elements.forEach(el => {
      el.style.filter = 'drop-shadow(0 0 10px rgba(15, 98, 254, 0.8))';
      setTimeout(() => {
        el.style.filter = '';
      }, 2000);
    });
  }

  /**
   * Export diagram as SVG
   */
  exportAsSVG() {
    const svg = this.container.querySelector('svg');
    if (!svg) return null;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    return new Blob([svgString], { type: 'image/svg+xml' });
  }

  /**
   * Export diagram as PNG
   */
  async exportAsPNG() {
    const svg = this.container.querySelector('svg');
    if (!svg) return null;

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          resolve(blob);
        });
      };

      img.src = url;
    });
  }

  /**
   * Show error message
   */
  showError(message) {
    this.container.innerHTML = `
      <div class="diagram-error">
        <div class="error-icon">⚠️</div>
        <p>${message}</p>
      </div>
    `;
  }

  /**
   * Clear diagram
   */
  clear() {
    this.currentConfig = null;
    this.container.innerHTML = `
      <div class="diagram-placeholder">
        <div class="placeholder-icon">📊</div>
        <p>Your architecture diagram will appear here</p>
        <p class="placeholder-hint">Start chatting with Bob to build your configuration</p>
      </div>
    `;
  }
}

// Made with Bob
