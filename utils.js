// ==========================================
// UTILS MODULE - Gemensamma hjälpfunktioner
// ==========================================

// Timer för form-meddelanden för att undvika race conditions
let __formMsgTimer = null;

// Standardized element waiter - source of truth
function waitForEl(selector, timeout = 5000, interval = 50) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      const el = document.querySelector(selector);
      if (el) return resolve(el);
      if (Date.now() - started >= timeout) return reject(new Error('waitForEl timeout: ' + selector));
      setTimeout(tick, interval);
    };
    tick();
  });
}

// Centralized beforeunload handler
function handleBeforeUnloadSafe() {
  try {
    // OBS: Gör inget nytt här.
    // Endast kedja vidare till ev. befintlig logic via custom events.
    window.dispatchEvent(new Event('aih:beforeunload'));
  } catch (e) { /* no-op */ }
}

// Dark mode functionality - force light mode
function initDarkMode() {
    try {
        // Force light mode by default
        document.body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
    } catch (error) {
        console.warn('Theme initialization failed:', error);
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Chatbot popup functionality
window.togglePopup = function() {
    const popup = document.getElementById("chatbot-popup");
    if (popup) {
        popup.classList.toggle("active");
    }
};

// Function to show form messages
function showFormMessage(message, type = 'info') {
    if (!message || typeof message !== 'string') {
        console.warn('Invalid message provided to showFormMessage');
        return;
    }

    // Rensa eventuell existerande timer
    if (__formMsgTimer) {
        clearTimeout(__formMsgTimer);
        __formMsgTimer = null;
    }

    // Försök skriva till status-div (aria-live) först
    const statusDiv = document.getElementById('form-status');
    if (statusDiv) {
        // Säkerställ aria-atomic en gång
        if (!statusDiv.hasAttribute('aria-atomic')) {
            statusDiv.setAttribute('aria-atomic', 'true');
        }

        // Ta bort eventuella fristående meddelandeblock (scopea till kontakt-sektionen)
        const root = document.getElementById('kontakt') || document;
        root.querySelectorAll('.form-status:not([id="form-status"])').forEach(el => el.remove());

        statusDiv.textContent = message;
        statusDiv.classList.remove('message-success', 'message-error', 'message-info');
        statusDiv.classList.add('form-status', `message-${type}`);

        __formMsgTimer = setTimeout(() => {
            statusDiv.textContent = '';
            statusDiv.classList.remove('message-success', 'message-error', 'message-info');
            statusDiv.classList.add('form-status');
            __formMsgTimer = null;
        }, 5000);

        return;
    }

    // Fallback: skapa block nära submit-knappen (scopea till kontakt-sektionen)
    const root = document.getElementById('kontakt') || document;
    root.querySelectorAll('.form-status:not([id="form-status"])').forEach(el => el.remove());

    const messageDiv = document.createElement('div');
    messageDiv.className = `form-status message-${type}`;
    messageDiv.setAttribute('role', 'status');
    messageDiv.setAttribute('aria-live', 'polite');
    messageDiv.textContent = message;

    const contactSection = document.getElementById('kontakt') || document.body;
    const form = document.querySelector('.contact-form');
    const submitButton = form ? form.querySelector('button[type="submit"]') : null;

    if (form && submitButton) {
        form.insertBefore(messageDiv, submitButton);
    } else {
        const container = contactSection.querySelector('.container') || contactSection;
        container.firstElementChild
            ? container.insertBefore(messageDiv, container.firstElementChild)
            : container.appendChild(messageDiv);
    }

    __formMsgTimer = setTimeout(() => {
        if (messageDiv.parentNode) messageDiv.remove();
        __formMsgTimer = null;
    }, 5000);
}


// Scroll to contact function
window.scrollToContact = function() {
    const contactSection = document.getElementById('kontakt');
    if (contactSection) {
        // Close modal first
        const modal = document.getElementById('modal-overlay');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }

        contactSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
};

// FAQ toggle functionality
function toggleFaq(button) {
    const faqItem = button.parentElement;
    const isActive = faqItem.classList.contains('active');

    // Close all FAQ items
    document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
    });

    // Open clicked item if it wasn't active
    if (!isActive) {
        faqItem.classList.add('active');
    }
}

// Make toggleFaq globally available
window.toggleFaq = toggleFaq;

// Export functions for other modules
window.Utils = {
    initDarkMode,
    toggleDarkMode,
    showFormMessage,
    scrollToContact,
    waitForEl,
    handleBeforeUnloadSafe
};