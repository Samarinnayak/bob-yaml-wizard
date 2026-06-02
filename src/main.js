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
import { setupModals } from './utils/modals.js';
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
          await this.diagram.render(this.configManager.getConfig());
        }

        // Update YAML if needed
        if (response.configChanges) {
          const yaml = this.configManager.generateYAML();
          this.yamlEditor.setContent(yaml);
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
    document.getElementById('copy-yaml')?.addEventListener('click', () => {
      this.yamlEditor.copyToClipboard();
      showToast('YAML copied to clipboard!', 'success');
    });

    document.getElementById('download-yaml')?.addEventListener('click', () => {
      this.yamlEditor.downloadFile('cics-region.yaml');
      showToast('YAML downloaded!', 'success');
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
