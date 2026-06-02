/**
 * Chat Component
 *
 * Handles the chat interface for conversing with Bob
 */

export class ChatComponent {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }

    this.messages = [];
    this.typingIndicator = document.getElementById('typing-indicator');
  }

  /**
   * Add a message to the chat
   */
  addMessage(sender, text, options = {}) {
    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sender: sender, // 'user' or 'bob'
      text: text,
      timestamp: new Date(),
      type: options.type || 'text' // 'text', 'success', 'error', 'info', 'question'
    };

    this.messages.push(message);
    this.renderMessage(message);
    this.scrollToBottom();

    return message;
  }

  /**
   * Render a single message
   */
  renderMessage(message) {
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${message.sender}`;
    messageEl.dataset.messageId = message.id;

    if (message.type && message.type !== 'text') {
      messageEl.classList.add(`message-${message.type}`);
    }

    // Avatar
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = message.sender === 'bob' ? '🤖' : '👤';

    // Content
    const content = document.createElement('div');
    content.className = 'message-content';

    // Text (support markdown-style formatting)
    const textEl = document.createElement('div');
    textEl.className = 'message-text';
    textEl.innerHTML = this.formatText(message.text);

    // Timestamp
    const timestamp = document.createElement('div');
    timestamp.className = 'message-timestamp';
    timestamp.textContent = this.formatTime(message.timestamp);

    content.appendChild(textEl);
    content.appendChild(timestamp);

    messageEl.appendChild(avatar);
    messageEl.appendChild(content);

    // Animate in
    messageEl.style.opacity = '0';
    messageEl.style.transform = 'translateY(20px)';
    this.container.appendChild(messageEl);

    // Trigger animation
    requestAnimationFrame(() => {
      messageEl.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      messageEl.style.opacity = '1';
      messageEl.style.transform = 'translateY(0)';
    });
  }

  /**
   * Format text with basic markdown support
   */
  formatText(text) {
    return text
      // Bold: **text**
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // Italic: *text*
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      // Code: `code`
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Line breaks
      .replace(/\n/g, '<br>')
      // Lists
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  }

  /**
   * Format timestamp
   */
  formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Add suggestion buttons
   */
  addSuggestions(suggestions) {
    if (!suggestions || suggestions.length === 0) return;

    const suggestionsEl = document.createElement('div');
    suggestionsEl.className = 'message-suggestions';

    suggestions.forEach(suggestion => {
      const button = document.createElement('button');
      button.className = 'suggestion-button';
      button.textContent = suggestion;
      button.onclick = () => {
        // Trigger input with suggestion
        const input = document.getElementById('user-input');
        if (input) {
          input.value = suggestion;
          input.focus();
          // Optionally auto-send
          document.getElementById('send-button')?.click();
        }
      };
      suggestionsEl.appendChild(button);
    });

    // Find last Bob message and append suggestions
    const messages = this.container.querySelectorAll('.message-bob');
    const lastBobMessage = messages[messages.length - 1];
    if (lastBobMessage) {
      const content = lastBobMessage.querySelector('.message-content');
      content.appendChild(suggestionsEl);
    }
  }

  /**
   * Show typing indicator
   */
  showTyping() {
    if (this.typingIndicator) {
      this.typingIndicator.style.display = 'flex';
      this.scrollToBottom();
    }
  }

  /**
   * Hide typing indicator
   */
  hideTyping() {
    if (this.typingIndicator) {
      this.typingIndicator.style.display = 'none';
    }
  }

  /**
   * Scroll to bottom of chat
   */
  scrollToBottom() {
    setTimeout(() => {
      this.container.scrollTop = this.container.scrollHeight;
    }, 100);
  }

  /**
   * Clear all messages
   */
  clear() {
    this.messages = [];
    this.container.innerHTML = '';
  }

  /**
   * Get chat history
   */
  getHistory() {
    return this.messages;
  }

  /**
   * Export chat as text
   */
  exportAsText() {
    return this.messages
      .map(msg => {
        const sender = msg.sender === 'bob' ? 'Bob' : 'You';
        const time = this.formatTime(msg.timestamp);
        return `[${time}] ${sender}: ${msg.text}`;
      })
      .join('\n\n');
  }
}

// Made with Bob
