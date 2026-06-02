/**
 * Configuration Manager
 *
 * Manages the current configuration state and generates YAML
 */

import { YAMLGenerator } from './yaml-generator.js';

export class ConfigurationManager {
  constructor() {
    this.config = this.getDefaultConfig();
    this.history = [];
    this.maxHistorySize = 50;
  }

  /**
   * Get default configuration
   */
  getDefaultConfig() {
    return {
      applid: '',
      region_hlq: '',
      cics_hlq: 'CICS.TS61',
      memory: '512M',
      jvm: {
        enabled: false,
        heap_size: '512M',
        profile: 'DFHJVMPR'
      },
      cmci: {
        enabled: false,
        port: 1490
      },
      database: {
        enabled: false,
        type: 'db2',
        connection_pool: 10
      },
      datasets: {
        csd: {
          primary: 10,
          secondary: 5,
          record_format: 'FB',
          record_length: 4089
        },
        gcd: {
          primary: 5,
          secondary: 2
        },
        lcd: {
          primary: 5,
          secondary: 2
        }
      },
      sit_parameters: {
        start: 'AUTO',
        cicssvc: 217,
        grplist: '(DFHLIST)'
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

    // Validate APPLID
    if (this.config.applid) {
      if (!/^[A-Z0-9]{1,8}$/.test(this.config.applid)) {
        errors.push({
          field: 'applid',
          message: 'APPLID must be 1-8 alphanumeric characters'
        });
      }
    }

    // Validate memory
    if (this.config.memory) {
      if (!/^\d+[MG]$/.test(this.config.memory)) {
        errors.push({
          field: 'memory',
          message: 'Memory must be in format like 512M or 2G'
        });
      } else {
        const value = parseInt(this.config.memory);
        if (value < 256) {
          warnings.push({
            field: 'memory',
            message: 'Memory allocation is very low (< 256MB)'
          });
        }
      }
    }

    // Validate JVM heap
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
    return YAMLGenerator.generate(this.config);
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
}

// Made with Bob
