/**
 * Bob YAML Wizard - Main Application Entry Point
 *
 * This is the main entry point for the application.
 * It initializes all components and sets up event listeners.
 */

import { ChatComponent } from './components/chat/ChatComponent.js';
import { DiagramComponent } from './components/diagram/DiagramComponent.js';
import { YAMLEditorComponent } from './components/editor/YAMLEditorComponent.js';
import { BobBrain } from './core/bob-brain.js';
import { ConfigurationManager } from './core/config-manager.js';
import { setupModals, showDuplicateRegionDialog } from './utils/modals.js';
import { setupTheme } from './utils/theme.js';
import { showToast } from './utils/toast.js';

// Initialize application
class App {
  constructor() {
    this.chat = null;
    this.diagram = null;
    this.yamlEditor = null;
    this.bobBrain = null;
    this.configManager = null;
  }

  async init() {
    console.log('🚀 Initializing Bob YAML Wizard...');

    try {
      // Initialize core components
      this.configManager = new ConfigurationManager();
      this.bobBrain = new BobBrain(this.configManager);

      // Initialize UI components
      this.chat = new ChatComponent('chat-messages');
      this.diagram = new DiagramComponent('diagram-container');
      this.yamlEditor = new YAMLEditorComponent('yaml-editor');

      // Setup event listeners
      this.setupEventListeners();

      // Setup utilities
      setupModals();
      setupTheme();

      // Setup mobile tabs
      this.setupMobileTabs();

      // Setup diagram region click handler
      this.setupDiagramHandlers();

      console.log('✅ Application initialized successfully');
      showToast('Welcome to Bob YAML Wizard!', 'success');
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      showToast('Failed to initialize application', 'error');
    }
  }

  setupEventListeners() {
    // Chat input
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    const sendMessage = async () => {
      const message = userInput.value.trim();
      if (!message) return;

      // Clear input
      userInput.value = '';

      // Add user message to chat
      this.chat.addMessage('user', message);

      // Show typing indicator
      this.chat.showTyping();

      try {
        // Process message with Bob
        const response = await this.bobBrain.processMessage(message);

        // Hide typing indicator
        this.chat.hideTyping();

        // Add Bob's response
        this.chat.addMessage('bob', response.text, {
          type: response.type || 'text'
        });

        // Update diagram if needed
        if (response.diagramChanges) {
          const allRegions = this.configManager.getAllRegions();
          await this.diagram.render(
            this.configManager.getConfig(),
            allRegions.length > 0 ? allRegions : null
          );
        }

        // Update YAML if needed
        if (response.configChanges) {
          this.updateYAMLEditor();
        }

        // Show suggestions if any
        if (response.suggestions && response.suggestions.length > 0) {
          this.chat.addSuggestions(response.suggestions);
        }
      } catch (error) {
        console.error('Error processing message:', error);
        this.chat.hideTyping();
        this.chat.addMessage('bob', 'Sorry, I encountered an error. Please try again.', {
          type: 'error'
        });
      }
    };

    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });

    // YAML actions
    document.getElementById('copy-yaml')?.addEventListener('click', async () => {
      const success = await this.yamlEditor.copyToClipboard();
      if (success) {
        showToast('All YAML copied to clipboard!', 'success');
      }
    });

    document.getElementById('download-yaml')?.addEventListener('click', () => {
      this.yamlEditor.downloadFile('cics-regions.yaml');
      showToast('All YAML downloaded!', 'success');
    });

    // Listen for individual region copy/download events
    window.addEventListener('yaml-copied', (e) => {
      showToast(`YAML for ${e.detail.applid} copied!`, 'success');
    });

    window.addEventListener('yaml-downloaded', (e) => {
      showToast(`YAML for ${e.detail.applid} downloaded!`, 'success');
    });

    // Diagram actions
    document.getElementById('zoom-in')?.addEventListener('click', () => {
      this.diagram.zoomIn();
    });

    document.getElementById('zoom-out')?.addEventListener('click', () => {
      this.diagram.zoomOut();
    });

    document.getElementById('reset-diagram')?.addEventListener('click', () => {
      this.diagram.reset();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl+C - Copy YAML
      if (e.ctrlKey && e.key === 'c' && !window.getSelection().toString()) {
        e.preventDefault();
        this.yamlEditor.copyToClipboard();
        showToast('YAML copied!', 'success');
      }

      // Ctrl+D - Download YAML
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        this.yamlEditor.downloadFile('cics-region.yaml');
        showToast('YAML downloaded!', 'success');
      }

      // Esc - Close modals
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal').forEach(modal => {
          modal.style.display = 'none';
        });
      }
    });
  }

  setupMobileTabs() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;

        // Remove active class from all tabs and contents
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        // Add active class to clicked tab and corresponding content
        tab.classList.add('active');
        document.querySelector(`[data-content="${tabName}"]`)?.classList.add('active');
      });
    });
  }

  setupDiagramHandlers() {
    // Handle region context menu (right-click) events from diagram
    this.diagram.setRegionClickHandler((action, config) => {
      if (action === 'duplicate') {
        this.handleDuplicateRegion(config);
      }
    });

    // Handle region selection (left-click) events from diagram
    this.diagram.setRegionSelectHandler((applid) => {
      this.handleRegionSelection(applid);
    });
  }

  handleRegionSelection(applid) {
    console.log('handleRegionSelection called with applid:', applid);
    
    // Set selected region in config manager
    this.configManager.setSelectedRegion(applid);
    console.log('Selected region set to:', applid);

    // Update YAML editor to show only selected region
    this.updateYAMLEditor(applid);

    showToast(`Viewing YAML for region ${applid}`, 'info');
  }

  updateYAMLEditor(selectedApplid = null) {
    const allRegions = this.configManager.getAllRegions();
    console.log('updateYAMLEditor - regions:', allRegions.map(r => r.applid));
    console.log('updateYAMLEditor - selected:', selectedApplid);
    
    this.yamlEditor.setRegions(allRegions, selectedApplid);
  }

  async handleDuplicateRegion(currentConfig) {
    // Get all existing regions including the current one
    const existingRegions = this.configManager.getAllRegions();
    
    // If regions array is empty, add current config
    if (existingRegions.length === 0 && currentConfig.applid) {
      existingRegions.push(currentConfig);
    }
    
    showDuplicateRegionDialog(
      currentConfig,
      async (newProperties) => {
        // Attempt to duplicate the region
        const result = this.configManager.duplicateRegion(newProperties);

        if (result.success) {
          // Update diagram with all regions
          const allRegions = this.configManager.getAllRegions();
          await this.diagram.render(
            this.configManager.getConfig(),
            allRegions.length > 0 ? allRegions : null
          );

          // Update YAML editor
          this.updateYAMLEditor();

          // Add message to chat
          const regionCount = allRegions.length;
          this.chat.addMessage('bob',
            `✅ Successfully duplicated region to **${newProperties.applid}**!\n\n` +
            `You now have **${regionCount} region${regionCount > 1 ? 's' : ''}** configured. ` +
            `All regions are visible in the diagram and YAML panel.`,
            { type: 'success' }
          );

          showToast(`Region duplicated as ${newProperties.applid}!`, 'success');
        } else {
          showToast(result.error || 'Failed to duplicate region', 'error');
          this.chat.addMessage('bob',
            `❌ Failed to duplicate region: ${result.error}`,
            { type: 'error' }
          );
        }
      },
      () => {
        // User cancelled
        console.log('Duplicate region cancelled');
      },
      existingRegions
    );
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
  });
} else {
  const app = new App();
  app.init();
}

// Export for debugging
window.app = App;

// Made with Bob
