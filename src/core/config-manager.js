/**
 * Configuration Manager
 *
 * Manages the current configuration state and generates YAML
 */

import { YAMLGenerator } from './yaml-generator.js';

export class ConfigurationManager {
  constructor() {
    this.config = this.getDefaultConfig();
    this.regions = []; // Array to store multiple regions
    this.selectedApplid = null; // Currently selected region for YAML display
    this.history = [];
    this.maxHistorySize = 50;
  }

  /**
   * Get default configuration
   */
  getDefaultConfig() {
    return {
      sysid: '',
      applid: '',
      region_hlq: '',
      cics_hlq: 'CICSTS63.CICS',
      datasets: {
        csd: {
          primary_space: 4,
          secondary_space: 1,
          unit: 'MB'
        },
        global_catalog: {
          primary_space: 5,
          secondary_space: 1,
          unit: 'MB'
        },
        local_catalog: {
          primary_space: 200,
          secondary_space: 5,
          unit: 'records'
        },
        aux_temp_storage: {
          primary_space: 200,
          secondary_space: 10,
          unit: 'records'
        },
        aux_trace: {
          enabled: false
        },
        local_request_queue: {
          primary_space: 200,
          secondary_space: 5,
          unit: 'records'
        },
        transaction_dump: {
          enabled: true
        },
        td_intrapartition: {
          primary_space: 100,
          secondary_space: 10,
          unit: 'records'
        }
      },
      sit_parameters: {
        start: 'INITIAL',
        cicssvc: 217,
        gmtext: 'Region provisioned with zconfig',
        usshome: '/uss/home'
      }
    };
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return JSON.parse(JSON.stringify(this.config)); // Deep clone
  }

  /**
   * Update configuration
   */
  updateConfig(changes) {
    try {
      // Save current state to history
      this.saveToHistory();

      // Deep merge changes into config
      this.config = this.deepMerge(this.config, changes);

      // Validate configuration
      const validation = this.validate();
      if (!validation.valid) {
        console.warn('Configuration validation warnings:', validation.warnings);
      }

      return true;
    } catch (error) {
      console.error('Failed to update configuration:', error);
      return false;
    }
  }

  /**
   * Deep merge objects
   */
  deepMerge(target, source) {
    const output = { ...target };

    for (const key in source) {
      if (source[key] instanceof Object && key in target) {
        output[key] = this.deepMerge(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    }

    return output;
  }

  /**
   * Validate configuration
   */
  validate() {
    const warnings = [];
    const errors = [];

    // Validate SYSID
    if (this.config.sysid) {
      if (!/^[A-Z0-9]{1,4}$/.test(this.config.sysid)) {
        errors.push({
          field: 'sysid',
          message: 'SYSID must be 1-4 alphanumeric characters'
        });
      }
    }

    // Validate APPLID
    if (this.config.applid) {
      if (!/^[A-Z0-9]{1,8}$/.test(this.config.applid)) {
        errors.push({
          field: 'applid',
          message: 'APPLID must be 1-8 alphanumeric characters'
        });
      }
    }

    // Validate JVM heap (if exists)
    if (this.config.jvm && this.config.jvm.enabled) {
      const heapSize = parseInt(this.config.jvm.heap_size);
      if (heapSize < 256) {
        warnings.push({
          field: 'jvm.heap_size',
          message: 'JVM heap size is small. Consider 512MB or higher.'
        });
      }
    }

    // Validate CMCI port
    if (this.config.cmci && this.config.cmci.enabled) {
      const port = this.config.cmci.port;
      if (port < 1024 || port > 65535) {
        errors.push({
          field: 'cmci.port',
          message: 'Port must be between 1024 and 65535'
        });
      }
    }

    // Check for best practices
    if (this.config.applid) {
      // Check secondary space allocation
      if (this.config.datasets.csd.secondary === 0) {
        warnings.push({
          field: 'datasets.csd.secondary',
          message: 'No secondary space allocation. Consider adding for automatic extension.'
        });
      }

      // Check if statistics are enabled
      if (!this.config.sit_parameters.mnfreq) {
        warnings.push({
          field: 'sit_parameters.mnfreq',
          message: 'Statistics not enabled. Consider adding MNFREQ for monitoring.'
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors,
      warnings: warnings
    };
  }

  /**
   * Generate YAML from current configuration
   */
  generateYAML() {
    return YAMLGenerator.generate(
      this.config,
      this.regions.length > 0 ? this.regions : null,
      this.selectedApplid
    );
  }

  /**
   * Set selected region for YAML display
   */
  setSelectedRegion(applid) {
    this.selectedApplid = applid;
  }

  /**
   * Clear selected region
   */
  clearSelectedRegion() {
    this.selectedApplid = null;
  }

  /**
   * Apply template
   */
  applyTemplate(templateName) {
    const templates = {
      basic: {
        applid: 'BASIC01',
        memory: '256M',
        sit_parameters: {
          start: 'AUTO',
          cicssvc: 217,
          grplist: '(DFHLIST)'
        }
      },
      java: {
        applid: 'JAVAPROD',
        memory: '1G',
        jvm: {
          enabled: true,
          heap_size: '512M'
        },
        sit_parameters: {
          start: 'AUTO',
          cicssvc: 217,
          grplist: '(DFHLIST)'
        }
      },
      management: {
        applid: 'MGMT01',
        memory: '512M',
        cmci: {
          enabled: true,
          port: 1490
        },
        sit_parameters: {
          start: 'AUTO',
          cicssvc: 217,
          grplist: '(DFHLIST)'
        }
      },
      production: {
        applid: 'PROD01',
        memory: '2G',
        jvm: {
          enabled: true,
          heap_size: '1G'
        },
        cmci: {
          enabled: true,
          port: 1490
        },
        sit_parameters: {
          start: 'AUTO',
          cicssvc: 217,
          grplist: '(DFHLIST)',
          mnfreq: '0500'
        }
      }
    };

    const template = templates[templateName];
    if (template) {
      this.updateConfig(template);
      return true;
    }

    return false;
  }

  /**
   * Save current state to history
   */
  saveToHistory() {
    const snapshot = {
      config: JSON.parse(JSON.stringify(this.config)),
      timestamp: new Date()
    };

    this.history.push(snapshot);

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  /**
   * Undo last change
   */
  undo() {
    if (this.history.length > 0) {
      const previous = this.history.pop();
      this.config = previous.config;
      return true;
    }
    return false;
  }

  /**
   * Get configuration history
   */
  getHistory() {
    return this.history.map(h => ({
      timestamp: h.timestamp,
      applid: h.config.applid
    }));
  }

  /**
   * Reset to default configuration
   */
  reset() {
    this.saveToHistory();
    this.config = this.getDefaultConfig();
  }

  /**
   * Export configuration as JSON
   */
  exportAsJSON() {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration from JSON
   */
  importFromJSON(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      this.saveToHistory();
      this.config = this.deepMerge(this.getDefaultConfig(), imported);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get configuration summary
   */
  getSummary() {
    const features = [];

    if (this.config.applid) {
      features.push(`Region: ${this.config.applid}`);
    }

    if (this.config.memory) {
      features.push(`Memory: ${this.config.memory}`);
    }

    if (this.config.jvm && this.config.jvm.enabled) {
      features.push(`JVM: ${this.config.jvm.heap_size} heap`);
    }

    if (this.config.cmci && this.config.cmci.enabled) {
      features.push(`CMCI: Port ${this.config.cmci.port}`);
    }

    if (this.config.database && this.config.database.enabled) {
      features.push(`Database: ${this.config.database.type.toUpperCase()}`);
    }

    return {
      applid: this.config.applid || 'Not set',
      features: features,
      featureCount: features.length
    };
  }

  /**
   * Duplicate current region with new properties
   */
  duplicateRegion(newProperties) {
    if (!this.config.applid) {
      return {
        success: false,
        error: 'No region to duplicate'
      };
    }

    // Validate new APPLID
    if (!newProperties.applid || !/^[A-Z0-9]{1,8}$/.test(newProperties.applid)) {
      return {
        success: false,
        error: 'Invalid APPLID. Must be 1-8 alphanumeric characters.'
      };
    }

    // Debug: Log current state
    console.log('=== DUPLICATE REGION DEBUG ===');
    console.log('Current regions:', this.regions.map(r => r.applid));
    console.log('Current config applid:', this.config.applid);
    console.log('New applid:', newProperties.applid);

    // Get all existing APPLIDs (from regions array AND current config)
    const allExistingApplids = new Set([
      ...this.regions.map(r => r.applid),
      this.config.applid
    ]);

    console.log('All existing APPLIDs:', Array.from(allExistingApplids));

    // Check if new APPLID already exists anywhere
    if (allExistingApplids.has(newProperties.applid)) {
      console.log('APPLID already exists!');
      return {
        success: false,
        error: `Region with APPLID ${newProperties.applid} already exists`
      };
    }

    // Save current state to history BEFORE making changes
    this.saveToHistory();

    // Ensure current region is in the regions array before creating new one
    const currentRegionIndex = this.regions.findIndex(r => r.applid === this.config.applid);
    if (currentRegionIndex === -1) {
      // Current region not in array, add it
      console.log('Adding current region to array:', this.config.applid);
      this.regions.push(JSON.parse(JSON.stringify(this.config)));
    } else {
      // Update the existing entry with current config state
      console.log('Updating existing region in array:', this.config.applid);
      this.regions[currentRegionIndex] = JSON.parse(JSON.stringify(this.config));
    }

    // Create a deep copy of current config
    const duplicatedConfig = JSON.parse(JSON.stringify(this.config));

    // Update with new properties
    duplicatedConfig.applid = newProperties.applid;
    duplicatedConfig.region_hlq = `USER.${newProperties.applid}`;

    if (newProperties.memory) {
      duplicatedConfig.memory = newProperties.memory;
    }

    if (newProperties.jvm_heap && duplicatedConfig.jvm && duplicatedConfig.jvm.enabled) {
      duplicatedConfig.jvm.heap_size = newProperties.jvm_heap;
    }

    if (newProperties.cmci_port && duplicatedConfig.cmci && duplicatedConfig.cmci.enabled) {
      duplicatedConfig.cmci.port = newProperties.cmci_port;
    }

    // Add duplicated config to regions array
    console.log('Adding new region to array:', duplicatedConfig.applid);
    this.regions.push(duplicatedConfig);

    // Make the duplicated config the current one
    this.config = duplicatedConfig;

    console.log('Final regions array:', this.regions.map(r => r.applid));
    console.log('Final current config:', this.config.applid);
    console.log('=== END DEBUG ===');

    return {
      success: true,
      config: this.getConfig(),
      allRegions: this.getAllRegions()
    };
  }

  /**
   * Get all regions including current config
   */
  getAllRegions() {
    const allRegions = this.regions.map(r => JSON.parse(JSON.stringify(r)));
    
    console.log('getAllRegions - regions array:', this.regions.map(r => r.applid));
    console.log('getAllRegions - current config:', this.config.applid);
    
    // If current config has an applid and is not in regions array, include it
    if (this.config.applid) {
      const existsInRegions = allRegions.some(r => r.applid === this.config.applid);
      console.log('getAllRegions - current config exists in regions?', existsInRegions);
      if (!existsInRegions) {
        allRegions.push(JSON.parse(JSON.stringify(this.config)));
        console.log('getAllRegions - added current config to result');
      }
    }
    
    console.log('getAllRegions - returning:', allRegions.map(r => r.applid));
    return allRegions;
  }

  /**
   * Switch to a different region
   */
  switchToRegion(applid) {
    const region = this.regions.find(r => r.applid === applid);
    if (region) {
      this.saveToHistory();
      this.config = JSON.parse(JSON.stringify(region));
      return true;
    }
    return false;
  }

  /**
   * Delete a region
   */
  deleteRegion(applid) {
    const index = this.regions.findIndex(r => r.applid === applid);
    if (index !== -1) {
      this.regions.splice(index, 1);
      
      // If we deleted the current region, switch to another or reset
      if (this.config.applid === applid) {
        if (this.regions.length > 0) {
          this.config = JSON.parse(JSON.stringify(this.regions[0]));
        } else {
          this.config = this.getDefaultConfig();
        }
      }
      return true;
    }
    return false;
  }

  /**
   * Update a region with new data
   */
  updateRegion(applid, updatedData) {
    console.log('updateRegion called for:', applid);
    console.log('Updated data:', updatedData);

    // Find the region in the array
    const index = this.regions.findIndex(r => r.applid === applid);
    
    if (index !== -1) {
      // Update in regions array
      this.regions[index] = { ...this.regions[index], ...updatedData };
      console.log('Updated region in array at index:', index);
    }

    // If it's the current config, update that too
    if (this.config.applid === applid) {
      this.config = { ...this.config, ...updatedData };
      console.log('Updated current config');
    }

    // Save to history
    this.saveToHistory();

    return true;
  }
}

// Made with Bob
