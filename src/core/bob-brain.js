/**
 * Bob Brain - AI Logic for Natural Language Processing
 *
 * This module handles natural language understanding, intent recognition,
 * and response generation for the Bob AI assistant.
 */

export class BobBrain {
  constructor(configManager) {
    this.configManager = configManager;
    this.context = {
      conversationHistory: [],
      currentIntent: null,
      awaitingInput: null
    };

    this.initializePatterns();
  }

  initializePatterns() {
    // Intent patterns for natural language understanding
    this.intentPatterns = {
      CREATE_REGION: {
        patterns: [
          /create.*region/i,
          /new.*cics/i,
          /setup.*cics/i,
          /start.*region/i,
          /build.*region/i
        ],
        handler: this.handleCreateRegion.bind(this)
      },
      ADD_JVM: {
        patterns: [
          /add.*java/i,
          /enable.*jvm/i,
          /java.*support/i,
          /add.*jvm/i,
          /configure.*java/i
        ],
        handler: this.handleAddJVM.bind(this)
      },
      ADD_CMCI: {
        patterns: [
          /add.*cmci/i,
          /enable.*management/i,
          /remote.*management/i,
          /add.*management/i,
          /enable.*cmci/i
        ],
        handler: this.handleAddCMCI.bind(this)
      },
      ADD_DATABASE: {
        patterns: [
          /add.*database/i,
          /db2.*connection/i,
          /connect.*database/i,
          /add.*db2/i,
          /database.*support/i
        ],
        handler: this.handleAddDatabase.bind(this)
      },
      OPTIMIZE: {
        patterns: [
          /optimize/i,
          /improve/i,
          /best.*practice/i,
          /review/i,
          /suggestions/i
        ],
        handler: this.handleOptimize.bind(this)
      },
      HELP: {
        patterns: [
          /help/i,
          /what.*can.*do/i,
          /how.*work/i,
          /guide/i
        ],
        handler: this.handleHelp.bind(this)
      }
    };

    // Response templates
    this.responseTemplates = {
      CREATE_REGION: {
        initial: "I'll help you create a CICS region! What should we call it? (e.g., PROD01, DEVTEST)",
        success: "Great! I've created region **{applid}** with:\n\n{features}\n\nWould you like to add any additional features?",
        followup: "Your region is ready! You can:\n- Add Java support\n- Enable remote management\n- Add database connection\n- Optimize for production"
      },
      ADD_JVM: {
        initial: "Adding JVM support for Java applications...",
        success: "✅ **JVM configured** with {heap_size} heap memory.\n\nYour region can now run Java applications!",
        suggestion: "💡 Consider increasing heap size for production workloads."
      },
      ADD_CMCI: {
        initial: "Enabling CMCI for remote management...",
        success: "✅ **CMCI enabled** on port {port}.\n\nYou can now manage this region remotely using CICS Explorer or REST APIs.",
        info: "CMCI provides a powerful interface for managing CICS resources."
      },
      ADD_DATABASE: {
        initial: "Configuring database connection...",
        success: "✅ **Database connection configured** with:\n- Connection pool: {pool_size} connections\n- Transaction support enabled\n\nYour region can now access databases!",
        info: "Make sure your database is properly configured on z/OS."
      },
      OPTIMIZE: {
        initial: "Let me review your configuration for optimization opportunities...",
        success: "I've analyzed your configuration. Here are my recommendations:\n\n{recommendations}",
        noIssues: "✅ Your configuration looks great! No optimization needed."
      }
    };
  }

  /**
   * Process user message and generate response
   */
  async processMessage(message) {
    // Add to conversation history
    this.context.conversationHistory.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // Check if we're awaiting specific input
    if (this.context.awaitingInput) {
      return await this.handleAwaitedInput(message);
    }

    // Recognize intent
    const intent = this.recognizeIntent(message);

    if (intent) {
      this.context.currentIntent = intent;
      return await this.intentPatterns[intent].handler(message);
    }

    // Default response if no intent recognized
    return this.generateDefaultResponse(message);
  }

  /**
   * Recognize intent from user message
   */
  recognizeIntent(message) {
    for (const [intent, config] of Object.entries(this.intentPatterns)) {
      for (const pattern of config.patterns) {
        if (pattern.test(message)) {
          return intent;
        }
      }
    }
    return null;
  }

  /**
   * Handle CREATE_REGION intent
   */
  async handleCreateRegion(message) {
    const config = this.configManager.getConfig();

    // Check if region already exists
    if (config.applid) {
      return {
        text: `You already have a region called **${config.applid}**. Would you like to:\n- Modify the existing region\n- Create a new configuration (this will replace the current one)`,
        type: 'info',
        suggestions: ['Modify existing', 'Create new']
      };
    }

    // Extract applid if provided in message
    const applidMatch = message.match(/called?\s+([A-Z0-9]{1,8})/i);

    if (applidMatch) {
      const applid = applidMatch[1].toUpperCase();
      return await this.createRegionWithApplid(applid, message);
    }

    // Ask for applid
    this.context.awaitingInput = 'applid';
    return {
      text: this.responseTemplates.CREATE_REGION.initial,
      type: 'question',
      suggestions: ['PROD01', 'DEVTEST', 'JAVAPROD']
    };
  }

  /**
   * Create region with specified applid
   */
  async createRegionWithApplid(applid, originalMessage) {
    // Determine region type from message
    const isJava = /java/i.test(originalMessage);
    const isDev = /dev|test/i.test(originalMessage);
    const isProd = /prod/i.test(originalMessage);

    // Update configuration
    const updates = {
      applid: applid,
      region_hlq: `USER.${applid}`,
      memory: isDev ? '256M' : '512M'
    };

    // Add JVM if Java mentioned
    if (isJava) {
      updates.jvm = {
        enabled: true,
        heap_size: '512M'
      };
    }

    this.configManager.updateConfig(updates);

    // Build features list
    const features = [
      `✓ Region name: **${applid}**`,
      `✓ Memory: **${updates.memory}**`,
      `✓ Standard datasets configured`,
      `✓ Auto-start enabled`
    ];

    if (isJava) {
      features.push('✓ JVM support with 512MB heap');
    }

    const text = this.responseTemplates.CREATE_REGION.success
      .replace('{applid}', applid)
      .replace('{features}', features.join('\n'));

    return {
      text: text,
      type: 'success',
      configChanges: updates,
      diagramChanges: true,
      suggestions: ['Add CMCI', 'Add database', 'Optimize']
    };
  }

  /**
   * Handle ADD_JVM intent
   */
  async handleAddJVM(message) {
    const config = this.configManager.getConfig();

    if (!config.applid) {
      return {
        text: "Let's create a CICS region first! What should we call it?",
        type: 'info',
        suggestions: ['PROD01', 'DEVTEST', 'JAVAPROD']
      };
    }

    if (config.jvm && config.jvm.enabled) {
      return {
        text: `JVM is already enabled with ${config.jvm.heap_size} heap. Would you like to:\n- Increase heap size\n- Modify JVM profile\n- Keep current settings`,
        type: 'info',
        suggestions: ['Increase to 1G', 'Keep current']
      };
    }

    // Add JVM
    const updates = {
      jvm: {
        enabled: true,
        heap_size: '512M',
        profile: 'DFHJVMPR'
      }
    };

    this.configManager.updateConfig(updates);

    const text = this.responseTemplates.ADD_JVM.success
      .replace('{heap_size}', '512MB');

    return {
      text: text + '\n\n' + this.responseTemplates.ADD_JVM.suggestion,
      type: 'success',
      configChanges: updates,
      diagramChanges: true,
      suggestions: ['Increase heap to 1G', 'Add CMCI', 'Done']
    };
  }

  /**
   * Handle ADD_CMCI intent
   */
  async handleAddCMCI(message) {
    const config = this.configManager.getConfig();

    if (!config.applid) {
      return {
        text: "Let's create a CICS region first! What should we call it?",
        type: 'info'
      };
    }

    if (config.cmci && config.cmci.enabled) {
      return {
        text: `CMCI is already enabled on port ${config.cmci.port}. Everything is set up for remote management!`,
        type: 'info'
      };
    }

    // Add CMCI
    const updates = {
      cmci: {
        enabled: true,
        port: 1490
      }
    };

    this.configManager.updateConfig(updates);

    const text = this.responseTemplates.ADD_CMCI.success
      .replace('{port}', '1490');

    return {
      text: text + '\n\n' + this.responseTemplates.ADD_CMCI.info,
      type: 'success',
      configChanges: updates,
      diagramChanges: true,
      suggestions: ['Add database', 'Optimize', 'Done']
    };
  }

  /**
   * Handle ADD_DATABASE intent
   */
  async handleAddDatabase(message) {
    const config = this.configManager.getConfig();

    if (!config.applid) {
      return {
        text: "Let's create a CICS region first! What should we call it?",
        type: 'info'
      };
    }

    if (config.database && config.database.enabled) {
      return {
        text: `Database connection is already configured with ${config.database.connection_pool} connections.`,
        type: 'info'
      };
    }

    // Add database
    const updates = {
      database: {
        enabled: true,
        type: 'db2',
        connection_pool: 10
      }
    };

    this.configManager.updateConfig(updates);

    const text = this.responseTemplates.ADD_DATABASE.success
      .replace('{pool_size}', '10');

    return {
      text: text + '\n\n' + this.responseTemplates.ADD_DATABASE.info,
      type: 'success',
      configChanges: updates,
      diagramChanges: true,
      suggestions: ['Optimize', 'Done']
    };
  }

  /**
   * Handle OPTIMIZE intent
   */
  async handleOptimize(message) {
    const config = this.configManager.getConfig();

    if (!config.applid) {
      return {
        text: "Create a CICS region first, then I can help optimize it!",
        type: 'info'
      };
    }

    const recommendations = [];

    // Check JVM heap size
    if (config.jvm && config.jvm.enabled) {
      const heapSize = parseInt(config.jvm.heap_size);
      if (heapSize < 512) {
        recommendations.push('⚠️ **JVM heap is small** - Consider increasing to 512MB or higher for production');
      }
    }

    // Check memory allocation
    const memory = parseInt(config.memory);
    if (memory < 512) {
      recommendations.push('💡 **Memory allocation** - Consider 512MB or higher for better performance');
    }

    // Check CMCI
    if (!config.cmci || !config.cmci.enabled) {
      recommendations.push('💡 **Enable CMCI** - Adds remote management capabilities');
    }

    // Check statistics
    if (!config.sit_parameters || !config.sit_parameters.mnfreq) {
      recommendations.push('💡 **Enable statistics** - Add MNFREQ parameter for performance monitoring');
    }

    if (recommendations.length === 0) {
      return {
        text: this.responseTemplates.OPTIMIZE.noIssues,
        type: 'success'
      };
    }

    const text = this.responseTemplates.OPTIMIZE.success
      .replace('{recommendations}', recommendations.join('\n\n'));

    return {
      text: text + '\n\nWould you like me to apply these optimizations?',
      type: 'info',
      suggestions: ['Apply all', 'Apply specific ones', 'No thanks']
    };
  }

  /**
   * Handle HELP intent
   */
  async handleHelp(message) {
    return {
      text: `I can help you build CICS configurations! Here's what I can do:

**Creating Regions**
- "Create a CICS region called PROD01"
- "Set up a development region"
- "Build a Java application server"

**Adding Features**
- "Add Java support" - Enable JVM
- "Enable remote management" - Add CMCI
- "Add database connection" - Configure DB2

**Optimization**
- "Optimize my configuration"
- "Review for best practices"
- "Suggest improvements"

Just tell me what you need in plain English, and I'll help you build it! 🚀`,
      type: 'info',
      suggestions: ['Create a region', 'Show examples', 'Start building']
    };
  }

  /**
   * Handle awaited input (e.g., applid)
   */
  async handleAwaitedInput(message) {
    const inputType = this.context.awaitingInput;
    this.context.awaitingInput = null;

    if (inputType === 'applid') {
      const applid = message.trim().toUpperCase();

      // Validate applid
      if (!/^[A-Z0-9]{1,8}$/.test(applid)) {
        this.context.awaitingInput = 'applid';
        return {
          text: "APPLID must be 1-8 alphanumeric characters. Please try again:",
          type: 'error',
          suggestions: ['PROD01', 'DEVTEST', 'JAVAPROD']
        };
      }

      return await this.createRegionWithApplid(applid, message);
    }

    return this.generateDefaultResponse(message);
  }

  /**
   * Generate default response when no intent is recognized
   */
  generateDefaultResponse(message) {
    const responses = [
      "I'm not sure I understand. Could you rephrase that?",
      "I can help you create CICS configurations. Try saying 'create a CICS region' or 'help'.",
      "I didn't quite catch that. Would you like to create a region, add features, or get help?"
    ];

    return {
      text: responses[Math.floor(Math.random() * responses.length)],
      type: 'info',
      suggestions: ['Create a region', 'Add Java support', 'Help']
    };
  }
}

// Made with Bob
