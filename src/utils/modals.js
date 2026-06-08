/**
 * Modal Management
 *
 * Handles modal dialogs
 */

export function setupModals() {
  // Help modal
  const helpButton = document.getElementById('help-button');
  const helpModal = document.getElementById('help-modal');

  if (helpButton && helpModal) {
    helpButton.addEventListener('click', () => {
      showModal(helpModal);
    });
  }

  // Share modal
  const shareButton = document.getElementById('share-button');
  const shareModal = document.getElementById('share-modal');

  if (shareButton && shareModal) {
    shareButton.addEventListener('click', () => {
      showModal(shareModal);
    });
  }

  // Close buttons
  document.querySelectorAll('.modal-close').forEach(button => {
    button.addEventListener('click', () => {
      const modal = button.closest('.modal');
      if (modal) {
        hideModal(modal);
      }
    });
  });

  // Click outside to close
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        hideModal(modal);
      }
    });
  });

  // Escape key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.show').forEach(modal => {
        hideModal(modal);
      });
    }
  });

  // Share modal actions
  setupShareModal();
}

function showModal(modal) {
  modal.style.display = 'flex';
  setTimeout(() => {
    modal.classList.add('show');
  }, 10);
}

function hideModal(modal) {
  modal.classList.remove('show');
  setTimeout(() => {
    modal.style.display = 'none';
  }, 300);
}

function setupShareModal() {
  const copyLinkButton = document.getElementById('copy-link');
  const generateQRButton = document.getElementById('generate-qr');

  if (copyLinkButton) {
    copyLinkButton.addEventListener('click', async () => {
      const url = window.location.href;
      try {
        await navigator.clipboard.writeText(url);
        copyLinkButton.textContent = '✓ Copied!';
        setTimeout(() => {
          copyLinkButton.innerHTML = '<span class="icon">🔗</span> Copy Link';
        }, 2000);
      } catch (error) {
        console.error('Failed to copy link:', error);
      }
    });
  }

  if (generateQRButton) {
    generateQRButton.addEventListener('click', () => {
      const qrContainer = document.getElementById('qr-code');
      if (qrContainer) {
        qrContainer.style.display = 'block';
        qrContainer.innerHTML = `
          <div style="padding: 1rem; background: white; display: inline-block; border-radius: 8px;">
            <p style="color: #333; margin-bottom: 0.5rem;">Scan to open:</p>
            <div style="font-size: 100px;">📱</div>
            <p style="color: #666; font-size: 0.875rem; margin-top: 0.5rem;">
              ${window.location.href}
            </p>
          </div>
        `;
      }
    });
  }
}

export function createModal(title, content, actions = []) {
  const modal = document.createElement('div');
  modal.className = 'modal';

  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';

  const header = document.createElement('div');
  header.className = 'modal-header';
  header.innerHTML = `
    <h2>${title}</h2>
    <button class="modal-close" aria-label="Close">&times;</button>
  `;

  const body = document.createElement('div');
  body.className = 'modal-body';
  body.innerHTML = content;

  modalContent.appendChild(header);
  modalContent.appendChild(body);

  if (actions.length > 0) {
    const footer = document.createElement('div');
    footer.className = 'modal-footer';

    actions.forEach(action => {
      const button = document.createElement('button');
      button.className = `button ${action.class || 'button-secondary'}`;
      button.textContent = action.text;
      button.onclick = () => {
        if (action.onClick) {
          action.onClick();
        }
        hideModal(modal);
      };
      footer.appendChild(button);
    });

    modalContent.appendChild(footer);
  }

  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  // Setup close handlers
  const closeButton = modal.querySelector('.modal-close');
  if (closeButton) {
    closeButton.addEventListener('click', () => hideModal(modal));
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      hideModal(modal);
    }
  });

  return modal;
}

export function showConfirmDialog(title, message, onConfirm, onCancel) {
  const modal = createModal(
    title,
    `<p>${message}</p>`,
    [
      {
        text: 'Cancel',
        class: 'button-secondary',
        onClick: onCancel
      },
      {
        text: 'Confirm',
        class: 'button-primary',
        onClick: onConfirm
      }
    ]
  );

  showModal(modal);
  return modal;
}

export function showAlertDialog(title, message) {
  const modal = createModal(
    title,
    `<p>${message}</p>`,
    [
      {
        text: 'OK',
        class: 'button-primary'
      }
    ]
  );

  showModal(modal);
  return modal;
}

export function showDuplicateRegionDialog(currentConfig, onConfirm, onCancel) {
  const suggestedApplid = generateUniqueApplid(currentConfig.applid);
  
  const content = `
    <p>Duplicate region <strong>${currentConfig.applid}</strong> with new properties:</p>
    <form id="duplicate-region-form" style="margin-top: 1rem;">
      <div style="margin-bottom: 1rem;">
        <label for="new-applid" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">
          APPLID (required) <span style="color: var(--error);">*</span>
        </label>
        <input
          type="text"
          id="new-applid"
          name="applid"
          value="${suggestedApplid}"
          maxlength="8"
          pattern="[A-Z0-9]{1,8}"
          required
          style="width: 100%; padding: 0.5rem; border: 1px solid var(--border); border-radius: 4px; font-family: var(--font-mono);"
        />
        <small style="color: var(--text-secondary); display: block; margin-top: 0.25rem;">
          1-8 alphanumeric characters
        </small>
      </div>

      <div style="margin-bottom: 1rem;">
        <label for="new-memory" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">
          Memory
        </label>
        <input
          type="text"
          id="new-memory"
          name="memory"
          value="${currentConfig.memory || '512M'}"
          pattern="\\d+[MG]"
          style="width: 100%; padding: 0.5rem; border: 1px solid var(--border); border-radius: 4px;"
        />
        <small style="color: var(--text-secondary); display: block; margin-top: 0.25rem;">
          e.g., 512M or 2G
        </small>
      </div>

      ${currentConfig.jvm && currentConfig.jvm.enabled ? `
      <div style="margin-bottom: 1rem;">
        <label for="new-jvm-heap" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">
          JVM Heap Size
        </label>
        <input
          type="text"
          id="new-jvm-heap"
          name="jvm_heap"
          value="${currentConfig.jvm.heap_size || '512M'}"
          pattern="\\d+[MG]"
          style="width: 100%; padding: 0.5rem; border: 1px solid var(--border); border-radius: 4px;"
        />
      </div>
      ` : ''}

      ${currentConfig.cmci && currentConfig.cmci.enabled ? `
      <div style="margin-bottom: 1rem;">
        <label for="new-cmci-port" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">
          CMCI Port
        </label>
        <input
          type="number"
          id="new-cmci-port"
          name="cmci_port"
          value="${currentConfig.cmci.port || 1490}"
          min="1024"
          max="65535"
          style="width: 100%; padding: 0.5rem; border: 1px solid var(--border); border-radius: 4px;"
        />
      </div>
      ` : ''}
    </form>
  `;

  const modal = createModal(
    '📋 Duplicate Region',
    content,
    [
      {
        text: 'Cancel',
        class: 'button-secondary',
        onClick: () => {
          if (onCancel) onCancel();
        }
      },
      {
        text: 'Create Duplicate',
        class: 'button-primary',
        onClick: () => {
          const form = document.getElementById('duplicate-region-form');
          if (form.checkValidity()) {
            const formData = new FormData(form);
            const newConfig = {
              applid: formData.get('applid').toUpperCase(),
              memory: formData.get('memory')
            };

            if (currentConfig.jvm && currentConfig.jvm.enabled) {
              newConfig.jvm_heap = formData.get('jvm_heap');
            }

            if (currentConfig.cmci && currentConfig.cmci.enabled) {
              newConfig.cmci_port = parseInt(formData.get('cmci_port'));
            }

            if (onConfirm) onConfirm(newConfig);
          } else {
            form.reportValidity();
            return false; // Prevent modal from closing
          }
        }
      }
    ]
  );

  // Auto-uppercase APPLID input
  const applidInput = modal.querySelector('#new-applid');
  if (applidInput) {
    applidInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase();
    });
  }

  showModal(modal);
  return modal;
}

function generateUniqueApplid(currentApplid) {
  // Extract base name and number
  const match = currentApplid.match(/^([A-Z]+)(\d*)$/);
  if (match) {
    const base = match[1];
    const num = match[2] ? parseInt(match[2]) : 1;
    const newNum = num + 1;
    const newApplid = base + newNum;
    return newApplid.substring(0, 8); // Ensure max 8 chars
  }
  return currentApplid + '2';
}

// Made with Bob
