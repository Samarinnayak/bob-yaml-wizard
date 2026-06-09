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
        initial: "I'll help you create a CICS region! First, what SYSID should we use? (1-4 characters, e.g., SYS1, PROD)",
        askApplid: "Great! Now, what APPLID should we use for this region? (1-8 characters, e.g., APPLID1, DEVTEST)",
        success: "✅ **Region created successfully!**\n\n**SYSID:** {sysid}\n**APPLID:** {applid}\n**Region HLQ:** {region_hlq}\n\nAll 8 required datasets have been configured with default values.",
        followup: "Your region is ready! The YAML includes all required datasets and SIT parameters."
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

    // Step 1: Ask for SYSID
    this.context.awaitingInput = 'sysid';
    return {
      text: this.responseTemplates.CREATE_REGION.initial,
      type: 'question',
      suggestions: ['SYS1', 'PROD', 'DEV', 'TEST']
    };
  }

  /**
   * Create region with SYSID and APPLID
   */
  async createRegionWithDetails(sysid, applid) {
    // Validate inputs
    if (!/^[A-Z0-9]{1,4}$/i.test(sysid)) {
      return {
        text: '❌ Invalid SYSID. It must be 1-4 alphanumeric characters. Please try again.',
        type: 'error',
        suggestions: ['SYS1', 'PROD', 'DEV']
      };
    }

    if (!/^[A-Z0-9]{1,8}$/i.test(applid)) {
      return {
        text: '❌ Invalid APPLID. It must be 1-8 alphanumeric characters. Please try again.',
        type: 'error',
        suggestions: ['APPLID1', 'DEVTEST', 'PROD01']
      };
    }

    // Update configuration with all required fields
    const updates = {
      sysid: sysid.toUpperCase(),
      applid: applid.toUpperCase(),
      region_hlq: `REGION.${applid.toUpperCase()}`,
      cics_hlq: 'CICSTS63.CICS'
    };

    this.configManager.updateConfig(updates);

    const text = this.responseTemplates.CREATE_REGION.success
      .replace('{sysid}', updates.sysid)
      .replace('{applid}', updates.applid)
      .replace('{region_hlq}', updates.region_hlq);

    return {
      text: text,
      type: 'success',
      configChanges: updates,
      diagramChanges: true,
      suggestions: ['Create another region', 'Download YAML', 'View configuration']
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
        suggestions: ['SYS1', 'PROD', 'DEV']
      };
    }

    if (config.jvm_profiles && config.jvm_profiles.length > 0) {
      return {
        text: `JVM profile already configured: **${config.jvm_profiles[0].name}**\n\nWould you like to modify it or add another profile?`,
        type: 'info',
        suggestions: ['Modify profile', 'Add another', 'Keep current']
      };
    }

    // Ask for JVM profile name
    this.context.awaitingInput = 'jvm_profile_name';
    return {
      text: "What should we name the JVM profile? (e.g., DFHJVMPR, EYUSMSSJ)",
      type: 'question',
      suggestions: ['DFHJVMPR', 'EYUSMSSJ', 'JAVAPROD']
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
        type: 'info',
        suggestions: ['SYS1', 'PROD', 'DEV']
      };
    }

    if (config.extensions && config.extensions.cics_cmci) {
      return {
        text: `CMCI is already enabled on port ${config.extensions.cics_cmci.port}. Everything is set up for remote management!`,
        type: 'info'
      };
    }

    // Ask for CMCI port
    this.context.awaitingInput = 'cmci_port';
    return {
      text: "What port should CMCI use? (default: 1490)",
      type: 'question',
      suggestions: ['1490', '10443', '12345']
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
   * Handle awaited input (SYSID, APPLID, JVM profile name)
   */
  async handleAwaitedInput(message) {
    const inputType = this.context.awaitingInput;
    const input = message.trim().toUpperCase();

    if (inputType === 'sysid') {
      // Validate SYSID
      if (!/^[A-Z0-9]{1,4}$/.test(input)) {
        return {
          text: "❌ SYSID must be 1-4 alphanumeric characters. Please try again:",
          type: 'error',
          suggestions: ['SYS1', 'PROD', 'DEV', 'TEST']
        };
      }

      // Store SYSID and ask for APPLID
      this.context.tempSysid = input;
      this.context.awaitingInput = 'applid';
      
      return {
        text: this.responseTemplates.CREATE_REGION.askApplid,
        type: 'question',
        suggestions: ['APPLID1', 'DEVTEST', 'PROD01', 'JAVAPROD']
      };
    }

    if (inputType === 'applid') {
      // Validate APPLID
      if (!/^[A-Z0-9]{1,8}$/.test(input)) {
        return {
          text: "❌ APPLID must be 1-8 alphanumeric characters. Please try again:",
          type: 'error',
          suggestions: ['APPLID1', 'DEVTEST', 'PROD01']
        };
      }

      // Create region with both SYSID and APPLID
      const sysid = this.context.tempSysid;
      this.context.awaitingInput = null;
      this.context.tempSysid = null;

      return await this.createRegionWithDetails(sysid, input);
    }

    if (inputType === 'jvm_profile_name') {
      // Validate JVM profile name (1-8 characters)
      if (!/^[A-Z0-9]{1,8}$/.test(input)) {
        return {
          text: "❌ JVM profile name must be 1-8 alphanumeric characters. Please try again:",
          type: 'error',
          suggestions: ['DFHJVMPR', 'EYUSMSSJ', 'JAVAPROD']
        };
      }

      // Add JVM profile as string path
      const updates = {
        jvm_profiles: [`${input}.jvmprofile`]
      };

      this.configManager.updateConfig(updates);
      this.context.awaitingInput = null;

      return {
        text: `✅ **JVM Profile Added!**\n\n**Profile:** ${input}.jvmprofile\n\nThe JVM profile path has been added to your configuration.`,
        type: 'success',
        configChanges: updates,
        diagramChanges: true,
        suggestions: ['Add CMCI', 'Create another region', 'Download YAML']
      };
    }

    if (inputType === 'cmci_port') {
      const port = parseInt(message.trim());
      
      // Validate port number
      if (isNaN(port) || port < 1 || port > 65535) {
        return {
          text: "❌ Port must be a number between 1 and 65535. Please try again:",
          type: 'error',
          suggestions: ['1490', '10443', '12345']
        };
      }

      // Add CMCI extension
      const updates = {
        extensions: {
          cics_cmci: {
            provider: 'JVMSERVER',
            port: port
          }
        }
      };

      this.configManager.updateConfig(updates);
      this.context.awaitingInput = null;

      return {
        text: `✅ **CMCI Enabled!**\n\n**Port:** ${port}\n**Provider:** JVMSERVER\n\nYou can now manage this region remotely using CICS Explorer or REST APIs.`,
        type: 'success',
        configChanges: updates,
        diagramChanges: true,
        suggestions: ['Create another region', 'Download YAML']
      };
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
