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
    this.panX = 0;
    this.panY = 0;
    this.onRegionClick = null; // Callback for region clicks
    this.onRegionSelect = null; // Callback for region selection (to show YAML)
    
    // Touch gesture state
    this.touchState = {
      initialDistance: 0,
      initialScale: 1,
      initialPanX: 0,
      initialPanY: 0,
      touches: []
    };
    
    // Mouse drag state
    this.dragState = {
      isDragging: false,
      startX: 0,
      startY: 0,
      initialPanX: 0,
      initialPanY: 0
    };

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
    
    // Setup touch gestures
    this.setupTouchGestures();
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

    // All 8 Datasets (always present when applid exists) - arranged horizontally in a subgraph
    if (config.applid) {
      components.push(`
    subgraph Datasets["📁 Datasets"]
        direction TB
        CSD["CSD<br/>System Definitions"]
        GCD["GCD<br/>Global Catalog"]
        LCD["LCD<br/>Local Catalog"]
        ATS["ATS<br/>Aux Temp Storage"]
        ATR["ATR<br/>Aux Trace"]
        LRQ["LRQ<br/>Local Request Queue"]
        TXD["TXD<br/>Transaction Dump"]
        TDI["TDI<br/>TD Intrapartition"]
    end`);
      
      connections.push('CICS -.-> Datasets');
      
      styles.push('class CSD,GCD,LCD,ATS,ATR,LRQ,TXD,TDI datasetStyle');
    }

    // Build the complete diagram with LR (Left-Right) layout for vertical region stacking
    const mermaidCode = `
graph LR
    ${components.join('\n    ')}

    ${connections.join('\n    ')}

    classDef cicsStyle fill:#0f62fe,stroke:#fff,stroke-width:2px,color:#fff
    classDef jvmStyle fill:#24a148,stroke:#fff,stroke-width:2px,color:#fff
    classDef cmciStyle fill:#8a3ffc,stroke:#fff,stroke-width:2px,color:#fff
    classDef dbStyle fill:#da1e28,stroke:#fff,stroke-width:2px,color:#fff
    classDef datasetStyle fill:#f1c21b,stroke:#333,stroke-width:2px,color:#fff

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

      // All 8 Datasets - arranged horizontally in a subgraph
      const datasetSubgraphId = `Datasets${index}`;
      const csdId = `CSD${index}`;
      const gcdId = `GCD${index}`;
      const lcdId = `LCD${index}`;
      const atsId = `ATS${index}`;
      const atrId = `ATR${index}`;
      const lrqId = `LRQ${index}`;
      const txdId = `TXD${index}`;
      const tdiId = `TDI${index}`;
      
      components.push(`
    subgraph ${datasetSubgraphId}["📁 Datasets - ${config.applid}"]
        direction TB
        ${csdId}["CSD"]
        ${gcdId}["GCD"]
        ${lcdId}["LCD"]
        ${atsId}["ATS"]
        ${atrId}["ATR"]
        ${lrqId}["LRQ"]
        ${txdId}["TXD"]
        ${tdiId}["TDI"]
    end`);
      
      connections.push(`${regionId} -.-> ${datasetSubgraphId}`);
      
      styles.push(`class ${csdId},${gcdId},${lcdId},${atsId},${atrId},${lrqId},${txdId},${tdiId} datasetStyle`);
    });

    // Build the complete diagram with LR (Left-Right) layout for vertical stacking
    const mermaidCode = `
graph LR
    ${components.join('\n    ')}

    ${connections.join('\n    ')}

    classDef cicsStyle fill:#0f62fe,stroke:#fff,stroke-width:2px,color:#fff
    classDef jvmStyle fill:#24a148,stroke:#fff,stroke-width:2px,color:#fff
    classDef cmciStyle fill:#8a3ffc,stroke:#fff,stroke-width:2px,color:#fff
    classDef dbStyle fill:#da1e28,stroke:#fff,stroke-width:2px,color:#fff
    classDef datasetStyle fill:#f1c21b,stroke:#333,stroke-width:2px,color:#fff

    ${styles.join('\n    ')}
`;

    return mermaidCode;
  }

  /**
   * Get empty diagram placeholder
   */
  getEmptyDiagram() {
    return `
graph LR
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
   * Apply current zoom level and pan
   */
  applyZoom() {
    const svg = this.container.querySelector('svg');
    if (svg) {
      svg.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoomLevel})`;
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

  /**
   * Setup touch gestures for pinch-to-zoom and pan, plus mouse drag
   */
  setupTouchGestures() {
    // Touch events for pinch-to-zoom and two-finger pan
    this.container.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.container.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.container.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    
    // Mouse events for single-click drag
    this.container.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.container.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.container.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.container.addEventListener('mouseleave', this.handleMouseUp.bind(this));
  }

  /**
   * Handle touch start
   */
  handleTouchStart(e) {
    if (e.touches.length === 2) {
      e.preventDefault();
      
      // Calculate initial center point
      const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      
      // Store initial touch positions and center
      this.touchState.touches = Array.from(e.touches).map(t => ({
        x: t.clientX,
        y: t.clientY
      }));
      this.touchState.initialCenterX = centerX;
      this.touchState.initialCenterY = centerY;
      
      // Calculate initial distance for pinch zoom
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      this.touchState.initialDistance = Math.sqrt(dx * dx + dy * dy);
      this.touchState.initialScale = this.zoomLevel;
      this.touchState.initialPanX = this.panX;
      this.touchState.initialPanY = this.panY;
    }
  }

  /**
   * Handle touch move
   */
  handleTouchMove(e) {
    if (e.touches.length === 2) {
      e.preventDefault();
      
      // Calculate current center point
      const currentCenterX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const currentCenterY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      
      // Calculate current distance for pinch zoom
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDistance = Math.sqrt(dx * dx + dy * dy);
      
      // Calculate zoom scale
      const scale = currentDistance / this.touchState.initialDistance;
      this.zoomLevel = Math.max(0.5, Math.min(3, this.touchState.initialScale * scale));
      
      // Calculate pan based on center point movement
      const deltaX = currentCenterX - this.touchState.initialCenterX;
      const deltaY = currentCenterY - this.touchState.initialCenterY;
      
      this.panX = this.touchState.initialPanX + deltaX;
      this.panY = this.touchState.initialPanY + deltaY;
      
      // Apply transform without transition for smooth gesture
      const svg = this.container.querySelector('svg');
      if (svg) {
        svg.style.transition = 'none';
        svg.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoomLevel})`;
      }
    }
  }

  /**
   * Handle touch end
   */
  handleTouchEnd(e) {
    if (e.touches.length < 2) {
      // Reset touch state
      this.touchState.touches = [];
      this.touchState.initialDistance = 0;
      
      // Re-enable transition
      const svg = this.container.querySelector('svg');
      if (svg) {
        svg.style.transition = 'transform 0.3s ease';
      }
    }
  }

  /**
   * Handle mouse down for drag
   */
  handleMouseDown(e) {
    // Only start drag on left click and not on interactive elements
    if (e.button === 0 && !e.target.closest('.nodeLabel, text, a')) {
      this.dragState.isDragging = true;
      this.dragState.startX = e.clientX;
      this.dragState.startY = e.clientY;
      this.dragState.initialPanX = this.panX;
      this.dragState.initialPanY = this.panY;
      
      const svg = this.container.querySelector('svg');
      if (svg) {
        svg.style.cursor = 'grabbing';
      }
    }
  }

  /**
   * Handle mouse move for drag
   */
  handleMouseMove(e) {
    if (this.dragState.isDragging) {
      e.preventDefault();
      
      const deltaX = e.clientX - this.dragState.startX;
      const deltaY = e.clientY - this.dragState.startY;
      
      this.panX = this.dragState.initialPanX + deltaX;
      this.panY = this.dragState.initialPanY + deltaY;
      
      const svg = this.container.querySelector('svg');
      if (svg) {
        svg.style.transition = 'none';
        svg.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoomLevel})`;
      }
    }
  }

  /**
   * Handle mouse up to end drag
   */
  handleMouseUp(e) {
    if (this.dragState.isDragging) {
      this.dragState.isDragging = false;
      
      const svg = this.container.querySelector('svg');
      if (svg) {
        svg.style.cursor = 'grab';
        svg.style.transition = 'transform 0.3s ease';
      }
    }
  }
}

// Made with Bob
