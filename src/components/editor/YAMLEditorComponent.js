/**
 * YAML Editor Component - Accordion-based multi-region viewer
 *
 * Displays YAML configurations in an accordion structure
 */

export class YAMLEditorComponent {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }

    this.regions = [];
    this.selectedApplid = null;
    this.expandedRegions = new Set();
    this.initialize();
  }

  /**
   * Initialize the editor
   */
  initialize() {
    // Clear any existing content
    this.container.innerHTML = '';
    
    // Create accordion container
    const accordionContainer = document.createElement('div');
    accordionContainer.className = 'yaml-accordion-container';
    accordionContainer.id = 'yaml-accordion';
    this.container.appendChild(accordionContainer);
  }

  /**
   * Set regions to display
   */
  setRegions(regions, selectedApplid = null) {
    this.regions = regions || [];
    this.selectedApplid = selectedApplid;
    this.render();
  }

  /**
   * Render the accordion
   */
  render() {
    const accordionContainer = this.container.querySelector('#yaml-accordion');
    if (!accordionContainer) return;

    // Clear existing content
    accordionContainer.innerHTML = '';

    // Hide placeholder if exists
    const placeholder = this.container.querySelector('.yaml-placeholder');
    if (placeholder) {
      placeholder.style.display = 'none';
    }

    // If no regions, show placeholder
    if (this.regions.length === 0) {
      if (placeholder) {
        placeholder.style.display = 'flex';
      }
      return;
    }

    // Filter regions based on selection
    const regionsToShow = this.selectedApplid
      ? this.regions.filter(r => r.applid === this.selectedApplid)
      : this.regions;

    // Create accordion items
    regionsToShow.forEach((region, index) => {
      const accordionItem = this.createAccordionItem(region, index);
      accordionContainer.appendChild(accordionItem);
    });
  }

  /**
   * Create an accordion item for a region
   */
  createAccordionItem(region, index) {
    const item = document.createElement('div');
    item.className = 'yaml-accordion-item';
    item.dataset.applid = region.applid;

    // Header
    const header = document.createElement('div');
    header.className = 'yaml-accordion-header';
    
    const headerContent = document.createElement('div');
    headerContent.className = 'yaml-accordion-header-content';
    
    const title = document.createElement('div');
    title.className = 'yaml-accordion-title';
    title.innerHTML = `
      <span class="yaml-accordion-icon">📄</span>
      <span class="yaml-accordion-region-name">${region.applid}</span>
      <span class="yaml-accordion-region-info">${region.memory || '512M'} • ${this.getRegionFeatures(region)}</span>
    `;
    
    const actions = document.createElement('div');
    actions.className = 'yaml-accordion-actions';
    actions.innerHTML = `
      <button class="yaml-action-btn" data-action="copy" title="Copy YAML">
        <span class="icon">📋</span>
      </button>
      <button class="yaml-action-btn" data-action="download" title="Download YAML">
        <span class="icon">💾</span>
      </button>
      <button class="yaml-action-btn yaml-expand-btn" data-action="toggle" title="Expand/Collapse">
        <span class="icon">▼</span>
      </button>
    `;
    
    headerContent.appendChild(title);
    header.appendChild(headerContent);
    header.appendChild(actions);

    // Content
    const content = document.createElement('div');
    content.className = 'yaml-accordion-content';
    
    const yamlCode = document.createElement('pre');
    yamlCode.className = 'yaml-code';
    
    const codeElement = document.createElement('code');
    codeElement.className = 'language-yaml';
    
    // Generate YAML for this region
    const yaml = this.generateRegionYAML(region);
    codeElement.textContent = yaml;
    this.applySyntaxHighlighting(codeElement);
    
    yamlCode.appendChild(codeElement);
    content.appendChild(yamlCode);

    // Assemble item
    item.appendChild(header);
    item.appendChild(content);

    // Add event listeners
    this.attachEventListeners(item, region, yaml);

    // Auto-expand if selected or if it's the only region
    if (this.selectedApplid === region.applid || this.regions.length === 1) {
      this.expandedRegions.add(region.applid);
      item.classList.add('expanded');
    }

    return item;
  }

  /**
   * Get region features summary
   */
  getRegionFeatures(region) {
    const features = [];
    if (region.jvm && region.jvm.enabled) features.push('JVM');
    if (region.cmci && region.cmci.enabled) features.push('CMCI');
    if (region.database && region.database.enabled) features.push('DB');
    return features.length > 0 ? features.join(', ') : 'Basic';
  }

  /**
   * Generate YAML for a single region
   */
  generateRegionYAML(region) {
    const lines = [];
    
    lines.push(`# CICS Region: ${region.applid}`);
    lines.push(`# Generated: ${new Date().toISOString()}`);
    lines.push('');
    lines.push('cics_region:');
    lines.push(`  applid: ${region.applid}`);
    lines.push('  installation:');
    lines.push('    data_sets:');
    lines.push('      cics:');
    lines.push(`        hlq: ${region.cics_hlq || 'CICS.TS61'}`);
    lines.push(`  region_hlq: ${region.region_hlq || `USER.${region.applid}`}`);
    lines.push('');
    lines.push('  region_jcl:');
    lines.push('    job_parameters:');
    lines.push(`      region: ${region.memory || '512M'}`);
    lines.push('');
    lines.push('  sit_parameters:');
    lines.push(`    start: ${region.sit_parameters?.start || 'AUTO'}`);
    lines.push(`    cicssvc: ${region.sit_parameters?.cicssvc || 217}`);
    lines.push(`    grplist: ${region.sit_parameters?.grplist || '(DFHLIST)'}`);
    
    if (region.sit_parameters?.mnfreq) {
      lines.push(`    mnfreq: ${region.sit_parameters.mnfreq}`);
    }
    
    if (region.jvm && region.jvm.enabled) {
      lines.push('');
      lines.push('  jvm:');
      lines.push(`    heap_size: ${region.jvm.heap_size || '512M'}`);
      if (region.jvm.profile) {
        lines.push(`    profile: ${region.jvm.profile}`);
      }
    }
    
    if (region.cmci && region.cmci.enabled) {
      lines.push('');
      lines.push('  extensions:');
      lines.push('    - cics_cmci:');
      lines.push(`        port: ${region.cmci.port || 1490}`);
    }
    
    lines.push('');
    lines.push('  datasets:');
    if (region.datasets?.csd) {
      lines.push('    csd:');
      lines.push(`      primary: ${region.datasets.csd.primary || 10}`);
      lines.push(`      secondary: ${region.datasets.csd.secondary || 5}`);
    }
    if (region.datasets?.gcd) {
      lines.push('    gcd:');
      lines.push(`      primary: ${region.datasets.gcd.primary || 5}`);
      lines.push(`      secondary: ${region.datasets.gcd.secondary || 2}`);
    }
    
    return lines.join('\n');
  }

  /**
   * Apply syntax highlighting
   */
  applySyntaxHighlighting(element) {
    const yaml = element.textContent;
    
    const highlighted = yaml
      .replace(/(#.*)$/gm, '<span class="yaml-comment">$1</span>')
      .replace(/^(\s*)([a-zA-Z_][a-zA-Z0-9_]*)(:\s*)/gm, '$1<span class="yaml-key">$2</span>$3')
      .replace(/(['"])(.*?)\1/g, '<span class="yaml-string">$1$2$1</span>')
      .replace(/:\s*(\d+)/g, ': <span class="yaml-number">$1</span>')
      .replace(/:\s*(true|false|yes|no|on|off)/gi, ': <span class="yaml-boolean">$1</span>');
    
    element.innerHTML = highlighted;
  }

  /**
   * Attach event listeners to accordion item
   */
  attachEventListeners(item, region, yaml) {
    const header = item.querySelector('.yaml-accordion-header-content');
    const toggleBtn = item.querySelector('[data-action="toggle"]');
    const copyBtn = item.querySelector('[data-action="copy"]');
    const downloadBtn = item.querySelector('[data-action="download"]');

    // Toggle expansion
    const toggle = (e) => {
      e.stopPropagation();
      const isExpanded = item.classList.contains('expanded');
      
      if (isExpanded) {
        item.classList.remove('expanded');
        this.expandedRegions.delete(region.applid);
      } else {
        item.classList.add('expanded');
        this.expandedRegions.add(region.applid);
      }
    };

    header.addEventListener('click', toggle);
    toggleBtn.addEventListener('click', toggle);

    // Copy YAML
    copyBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(yaml);
        copyBtn.innerHTML = '<span class="icon">✓</span>';
        setTimeout(() => {
          copyBtn.innerHTML = '<span class="icon">📋</span>';
        }, 2000);
        
        // Dispatch event for toast notification
        window.dispatchEvent(new CustomEvent('yaml-copied', { 
          detail: { applid: region.applid } 
        }));
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    });

    // Download YAML
    downloadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const blob = new Blob([yaml], { type: 'text/yaml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${region.applid.toLowerCase()}-config.yaml`;
      link.click();
      URL.revokeObjectURL(url);
      
      // Dispatch event for toast notification
      window.dispatchEvent(new CustomEvent('yaml-downloaded', { 
        detail: { applid: region.applid } 
      }));
    });
  }

  /**
   * Legacy method for compatibility
   */
  setContent(yamlString) {
    // This method is kept for backward compatibility
    // but the new accordion structure doesn't use it directly
    console.log('setContent called (legacy method)');
  }

  /**
   * Get content (for backward compatibility)
   */
  getContent() {
    if (this.regions.length === 0) return '';
    return this.regions.map(r => this.generateRegionYAML(r)).join('\n\n---\n\n');
  }

  /**
   * Copy all YAML to clipboard
   */
  async copyToClipboard() {
    const content = this.getContent();
    try {
      await navigator.clipboard.writeText(content);
      return true;
    } catch (error) {
      console.error('Failed to copy:', error);
      return false;
    }
  }

  /**
   * Download all YAML as file
   */
  downloadFile(filename = 'cics-regions.yaml') {
    const content = this.getContent();
    const blob = new Blob([content], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Clear content
   */
  clear() {
    this.regions = [];
    this.selectedApplid = null;
    this.expandedRegions.clear();
    this.render();
    
    const placeholder = this.container.querySelector('.yaml-placeholder');
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
  }
}

// Made with Bob
