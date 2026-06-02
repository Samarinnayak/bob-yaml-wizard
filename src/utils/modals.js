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

// Made with Bob
