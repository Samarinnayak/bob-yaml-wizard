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
    this.onRegionClick = null; // Callback for region clicks
    this.onRegionSelect = null; // Callback for region selection (to show YAML)

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
  async render(config, allRegions = null) {
    this.currentConfig = config;
    this.allRegions = allRegions;

    // Clear placeholder if exists
    const placeholder = this.container.querySelector('.diagram-placeholder');
    if (placeholder) {
      placeholder.remove();
    }

    // Generate Mermaid code
    const mermaidCode = allRegions && allRegions.length > 1
      ? this.generateMultiRegionMermaidCode(allRegions)
      : this.generateMermaidCode(config);

    try {
      // Create unique ID for this diagram
      const diagramId = `diagram-${Date.now()}`;

      // Render with Mermaid
      const { svg } = await mermaid.render(diagramId, mermaidCode);

      // Update container
      this.container.innerHTML = svg;

      // Apply zoom
      this.applyZoom();

      // Add click handlers to region nodes
      this.setupRegionClickHandlers();

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
    const sysidLabel = config.sysid ? `SYSID: ${config.sysid}<br/>` : '';
    components.push(`CICS["🏢 CICS Region<br/>${sysidLabel}<b>${config.applid}</b>"]`);
    styles.push('class CICS cicsStyle');

    // CMCI (optional)
    if (config.extensions && config.extensions.cics_cmci) {
      components.push(`CMCI["🔧 CMCI<br/>Port ${config.extensions.cics_cmci.port}"]`);
      connections.push('CICS --> CMCI');
      styles.push('class CMCI cmciStyle');
    }

    // JVM Profiles (optional)
    if (config.jvm_profiles && config.jvm_profiles.length > 0) {
      config.jvm_profiles.forEach((profile, index) => {
        const jvmId = `JVM${index}`;
        // Extract profile name from path (e.g., "EYUSMSSJ.jvmprofile" -> "EYUSMSSJ")
        const profileName = profile.replace('.jvmprofile', '');
        components.push(`${jvmId}["☕ JVM Profile<br/><b>${profileName}</b>"]`);
        connections.push(`CICS --> ${jvmId}`);
        styles.push(`class ${jvmId} jvmStyle`);
      });
    }

    // All 8 Datasets (always present when applid exists)
    if (config.applid) {
      components.push(`CSD["📁 CSD<br/>System Definitions"]`);
      components.push(`GCD["📁 GCD<br/>Global Catalog"]`);
      components.push(`LCD["📁 LCD<br/>Local Catalog"]`);
      components.push(`ATS["📁 ATS<br/>Aux Temp Storage"]`);
      components.push(`ATR["📁 ATR<br/>Aux Trace"]`);
      components.push(`LRQ["📁 LRQ<br/>Local Request Queue"]`);
      components.push(`TXD["📁 TXD<br/>Transaction Dump"]`);
      components.push(`TDI["📁 TDI<br/>TD Intrapartition"]`);
      
      connections.push('CICS -.-> CSD');
      connections.push('CICS -.-> GCD');
      connections.push('CICS -.-> LCD');
      connections.push('CICS -.-> ATS');
      connections.push('CICS -.-> ATR');
      connections.push('CICS -.-> LRQ');
      connections.push('CICS -.-> TXD');
      connections.push('CICS -.-> TDI');
      
      styles.push('class CSD,GCD,LCD,ATS,ATR,LRQ,TXD,TDI datasetStyle');
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
   * Generate Mermaid code for multiple regions
   */
  generateMultiRegionMermaidCode(regions) {
    const components = [];
    const connections = [];
    const styles = [];

    regions.forEach((config, index) => {
      const regionId = `CICS${index}`;
      
      // CICS Region
      const sysidLabel = config.sysid ? `SYSID: ${config.sysid}<br/>` : '';
      components.push(`${regionId}["🏢 CICS Region<br/>${sysidLabel}<b>${config.applid}</b>"]`);
      styles.push(`class ${regionId} cicsStyle`);

      // CMCI
      if (config.extensions && config.extensions.cics_cmci) {
        const cmciId = `CMCI${index}`;
        components.push(`${cmciId}["🔧 CMCI<br/>Port ${config.extensions.cics_cmci.port}"]`);
        connections.push(`${regionId} --> ${cmciId}`);
        styles.push(`class ${cmciId} cmciStyle`);
      }

      // JVM Profiles
      if (config.jvm_profiles && config.jvm_profiles.length > 0) {
        config.jvm_profiles.forEach((profile, pIndex) => {
          const jvmId = `JVM${index}_${pIndex}`;
          const profileName = profile.replace('.jvmprofile', '');
          components.push(`${jvmId}["☕ JVM Profile<br/><b>${profileName}</b>"]`);
          connections.push(`${regionId} --> ${jvmId}`);
          styles.push(`class ${jvmId} jvmStyle`);
        });
      }

      // All 8 Datasets
      const csdId = `CSD${index}`;
      const gcdId = `GCD${index}`;
      const lcdId = `LCD${index}`;
      const atsId = `ATS${index}`;
      const atrId = `ATR${index}`;
      const lrqId = `LRQ${index}`;
      const txdId = `TXD${index}`;
      const tdiId = `TDI${index}`;
      
      components.push(`${csdId}["📁 CSD<br/>${config.applid}"]`);
      components.push(`${gcdId}["📁 GCD<br/>${config.applid}"]`);
      components.push(`${lcdId}["📁 LCD<br/>${config.applid}"]`);
      components.push(`${atsId}["📁 ATS<br/>${config.applid}"]`);
      components.push(`${atrId}["📁 ATR<br/>${config.applid}"]`);
      components.push(`${lrqId}["📁 LRQ<br/>${config.applid}"]`);
      components.push(`${txdId}["📁 TXD<br/>${config.applid}"]`);
      components.push(`${tdiId}["📁 TDI<br/>${config.applid}"]`);
      
      connections.push(`${regionId} -.-> ${csdId}`);
      connections.push(`${regionId} -.-> ${gcdId}`);
      connections.push(`${regionId} -.-> ${lcdId}`);
      connections.push(`${regionId} -.-> ${atsId}`);
      connections.push(`${regionId} -.-> ${atrId}`);
      connections.push(`${regionId} -.-> ${lrqId}`);
      connections.push(`${regionId} -.-> ${txdId}`);
      connections.push(`${regionId} -.-> ${tdiId}`);
      
      styles.push(`class ${csdId},${gcdId},${lcdId},${atsId},${atrId},${lrqId},${txdId},${tdiId} datasetStyle`);
    });

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

  /**
   * Setup click handlers for region nodes
   */
  setupRegionClickHandlers() {
    if (!this.currentConfig || !this.currentConfig.applid) return;

    // Find the CICS region node in the SVG
    const svg = this.container.querySelector('svg');
    if (!svg) return;

    // Find all nodes - Mermaid creates nodes with specific IDs
    const nodes = svg.querySelectorAll('.node');
    
    nodes.forEach(node => {
      const label = node.querySelector('.nodeLabel, text');
      if (label && label.textContent.includes('CICS Region')) {
        // Make it clickable
        node.style.cursor = 'pointer';
        
        // Add click event for left-click (select region)
        node.addEventListener('click', (e) => {
          e.stopPropagation();
          
          // Only show context menu on right-click
          if (e.button === 2 || e.ctrlKey) {
            return; // Let contextmenu event handle it
          }
          
          // Left-click: select region to show YAML
          const applid = this.getRegionApplidFromNode(node);
          if (applid && this.onRegionSelect) {
            this.onRegionSelect(applid);
          }
        });
        
        // Add context menu event for right-click
        node.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.showRegionContextMenu(e, node);
        });

        // Add hover effect
        node.addEventListener('mouseenter', () => {
          node.style.filter = 'brightness(1.1) drop-shadow(0 0 8px rgba(15, 98, 254, 0.6))';
        });

        node.addEventListener('mouseleave', () => {
          node.style.filter = '';
        });
      }
    });
  }

  /**
   * Show context menu for region
   */
  showRegionContextMenu(event, node) {
    // Remove any existing context menu
    const existingMenu = document.querySelector('.region-context-menu');
    if (existingMenu) {
      existingMenu.remove();
    }

    // Create context menu
    const menu = document.createElement('div');
    menu.className = 'region-context-menu';
    menu.innerHTML = `
      <div class="context-menu-item" data-action="duplicate">
        <span class="icon">📋</span>
        <span>Duplicate Region</span>
      </div>
    `;

    // Position menu near the click
    const rect = node.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.left = `${rect.right + 10}px`;
    menu.style.top = `${rect.top}px`;
    menu.style.zIndex = '10000';

    document.body.appendChild(menu);

    // Handle menu item clicks
    menu.querySelector('[data-action="duplicate"]').addEventListener('click', () => {
      menu.remove();
      if (this.onRegionClick) {
        this.onRegionClick('duplicate', this.currentConfig);
      }
    });

    // Close menu when clicking outside
    const closeMenu = (e) => {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    };

    setTimeout(() => {
      document.addEventListener('click', closeMenu);
    }, 100);
  }

  /**
   * Extract APPLID from a region node
   */
  getRegionApplidFromNode(node) {
    const label = node.querySelector('.nodeLabel, text');
    if (!label) return null;
    
    const text = label.textContent;
    // Extract APPLID from text like "CICS Region: CICSPROD"
    const match = text.match(/CICS Region:\s*(\w+)/);
    return match ? match[1] : null;
  }

  /**
   * Set callback for region click events
   */
  setRegionClickHandler(callback) {
    this.onRegionClick = callback;
  }

  /**
   * Set callback for region selection events
   */
  setRegionSelectHandler(callback) {
    this.onRegionSelect = callback;
  }
}

// Made with Bob
