// js/footer-loader.js – enhetlig footer + GDPR-partial, utan dubbletter
// DEPENDENCIES: Läs efter config.js, utils.js, gdpr.js (för event-lyssnare)
// LADDNINGSORDNING: config.js → utils.js → gdpr.js → ... → footer-loader.js
(function () {
  var FOOTER_HOST_ID = 'footer-placeholder';
  var FOOTER_SNIPPET_ID = 'site-footer';             // injicerad footer får detta id
  var GDPR_ANCHOR_ID = 'global-footer-includes';     // där GDPR-partial hamnar
  var LOADED_FLAG = '__footer_injected__';
  var GDPR_FLAG = '__gdpr_injected__';

  function getFooterHost() {
    return document.getElementById(FOOTER_HOST_ID);
  }

  function footerAlreadyInjected() {
    return !!document.getElementById(FOOTER_SNIPPET_ID) || !!document.body[LOADED_FLAG];
  }

  function gdprAlreadyInjected() {
    return !!document.getElementById('gdpr-popup') || !!document.body[GDPR_FLAG];
  }

  async function injectFooter() {
    if (footerAlreadyInjected()) return;
    var host = getFooterHost();
    if (!host) {

      // Fallback: skapa footer-container i slutet av body
      host = document.createElement('div');
      host.id = FOOTER_HOST_ID;
      document.body.appendChild(host);
    }

    try {
      var res = await fetch('/partials/footer.html');
      if (!res.ok) {
        console.warn('[footer-loader] Misslyckades hämta footer-partial:', res.status);
        return;
      }
      host.innerHTML = await res.text();
      document.body[LOADED_FLAG] = true;
    } catch (e) {
      console.warn('[footer-loader] Fel vid laddning av footer-partial:', e);
    }
  }

  async function loadGdprPartial() {
    if (gdprAlreadyInjected()) {
      // Signalera att GDPR-elementen finns (för din gdpr.js init)
      document.dispatchEvent(new CustomEvent('gdprElementsLoaded'));
      return;
    }
    try {
      var anchor = document.getElementById(GDPR_ANCHOR_ID);
      if (!anchor) {
        anchor = document.createElement('div');
        anchor.id = GDPR_ANCHOR_ID;
        document.body.appendChild(anchor);
      }

      var res = await fetch('/partials/gdpr.html');
      if (!res.ok) {
        console.warn('[footer-loader] Misslyckades hämta GDPR-partial:', res.status);
        // Dispatch ändå så att gdpr.js kan fortsätta sina guards
        document.dispatchEvent(new CustomEvent('gdprElementsLoaded'));
        return;
      }
      anchor.innerHTML = await res.text();
      document.body[GDPR_FLAG] = true;

      // Signalera klart
      document.dispatchEvent(new CustomEvent('gdprElementsLoaded'));
    } catch (e) {
      console.warn('[footer-loader] Fel vid laddning av GDPR-partial:', e);
      document.dispatchEvent(new CustomEvent('gdprElementsLoaded'));
    }
  }

  async function loadKonradModal() {
    // Guard: injicera inte på 404-sida eller om modal redan finns
    if (window.location.pathname === '/404.html' || 
        document.title.includes('404') || 
        document.getElementById('konrad-modal')) {
      // Dispatch event även om modal redan finns för att trigga re-wiring
      document.dispatchEvent(new CustomEvent('konrad:modal-injected'));
      return;
    }

    try {
      var res = await fetch('/partials/konrad-modal.html');
      if (!res.ok) {
        console.warn('[footer-loader] Misslyckades hämta Konrad-modal:', res.status);
        return;
      }
      var modalHtml = await res.text();
      document.body.insertAdjacentHTML('beforeend', modalHtml);

      // Notify that modal elements are now injected - delay för DOM-stabilitet
      setTimeout(() => {
        document.dispatchEvent(new CustomEvent('konrad:modal-injected'));
      }, 10);
    } catch (e) {
      console.warn('[footer-loader] Fel vid laddning av Konrad-modal:', e);
    }
  }

  async function init() {
    if (window.__AIH_FOOTER_INIT__) return;
    window.__AIH_FOOTER_INIT__ = true;

    await injectFooter();
    await loadGdprPartial();
    await loadKonradModal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();