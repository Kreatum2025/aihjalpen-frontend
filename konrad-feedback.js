/* konrad-feedback.js
   - Feedback-UI och tracking för Konrad
   - GDPR: skickar aldrig fritext/persondata
   - Azure Application Insights: aktiveras när AI_CONNECTION_STRING fylls i
*/

/* ======= KONFIGURERA DESSA VID BEHOV ======= */
const CHAT_ROOT_SELECTOR = '#konrad-chat-messages';        // chattcontainer
const ASSISTANT_MSG_SELECTOR = '.konrad-message';          // selektor för Konrads bubblor
const DEFAULT_ASSISTANT_ID = 'Konrad';                     // Assistant-namn/id
/* ============================================ */

/* (valfritt) Azure Application Insights connection string.
   Lämna tomt tills du skapat resursen i Azure.
   Exempelvärde (byt ut): "InstrumentationKey=...;IngestionEndpoint=https://westeurope-1.in.applicationinsights.azure.com/";
*/
const AI_CONNECTION_STRING = ""; // TODO: klistra in din Azure "Connection string" här när den finns

let appInsights = null;
(function initAppInsights(){
  if (!AI_CONNECTION_STRING) return; // ingen Azure ännu – hoppar över
  const s = document.createElement('script');
  s.src = "https://js.monitor.azure.com/scripts/b/ai.2.min.js";
  s.async = true;
  s.onload = function(){
    try {
      // global Microsoft.ApplicationInsights finns efter load
      appInsights = new Microsoft.ApplicationInsights.ApplicationInsights({
        config: { connectionString: AI_CONNECTION_STRING }
      });
      appInsights.loadAppInsights();
    } catch (e) {
      console.warn('[feedback] Kunde inte initiera Application Insights:', e);
    }
  };
  document.head.appendChild(s);
})();

/* Minimal, anonym sessions-id i localStorage (ingen persondata) */
const SID_KEY = 'konrad_sid';
const sessionId = (() => {
  try {
    const exist = localStorage.getItem(SID_KEY);
    if (exist) return exist;
    const gen = (crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Math.random()).slice(2);
    localStorage.setItem(SID_KEY, gen);
    return gen;
  } catch {
    return 'nosid';
  }
})();

/* Grund-tracker: skickar event till Azure om aktivt, annars Console */
function trackFeedback(assistant, value, extra = {}) {
  const payload = {
    assistant: assistant || DEFAULT_ASSISTANT_ID,
    value,                                     // 'up' | 'down'
    page: location.pathname,
    sessionId,
    lang: document.documentElement.lang || 'sv',
    ts: new Date().toISOString(),
    ...extra
  };

  if (appInsights) {
    try {
      appInsights.trackEvent({ name: 'feedback' }, payload);
    } catch (e) {
      console.warn('[feedback] trackEvent fail:', e, payload);
    }
  } else {
    // Ingen Azure inkopplad ännu – feedback tracking inaktivt
  }
}

/* Skapar feedback-raden */
function createFeedbackBar(assistant = DEFAULT_ASSISTANT_ID) {
  const bar = document.createElement('div');
  bar.className = 'feedback-bar';
  bar.setAttribute('role', 'group');
  bar.setAttribute('aria-label', 'Feedback på svaret');

  bar.innerHTML = `
    <button class="fb-btn fb-up"   type="button" aria-label="Tummen upp">👍</button>
    <button class="fb-btn fb-down" type="button" aria-label="Tummen ner">👎</button>
    <span class="fb-thanks" aria-live="polite">Tack för din feedback!</span>
  `;

  // Klick-hantering inom raden
  bar.addEventListener('click', (e) => {
    const up = e.target.closest && e.target.closest('.fb-up');
    const down = e.target.closest && e.target.closest('.fb-down');
    if (!up && !down) return;

    const value = up ? 'up' : 'down';
    // Skicka spårning
    trackFeedback(assistant, value);

    // Lås UI och visa tack
    bar.classList.add('voted');
    bar.querySelectorAll('.fb-btn').forEach(b => b.setAttribute('disabled', ''));
  });

  return bar;
}

/* Monterar feedback under en given assistentbubbla (idempotent) */
function attachFeedbackTo(replyEl, assistantId = DEFAULT_ASSISTANT_ID) {
  if (!replyEl) return;
  if (replyEl.querySelector('.feedback-bar')) return; // redan satt
  const bar = createFeedbackBar(assistantId);
  replyEl.appendChild(bar);
}

// Idempotensvakt för feedback-wiring (global per sidladdning)
window.__AIH_FEEDBACK_WIRED__ = window.__AIH_FEEDBACK_WIRED__ || false;

/* Automatisk montering på nya meddelanden via MutationObserver */
(function autoAttach(){
  function initFeedback() {
    const root = document.querySelector(CHAT_ROOT_SELECTOR);
    if (!root) {
      console.warn('[feedback] Hittar inte chat-rot via', CHAT_ROOT_SELECTOR);
      return false;
    }

    const addBars = (parent) => {
      parent.querySelectorAll(ASSISTANT_MSG_SELECTOR).forEach(msg => attachFeedbackTo(msg, DEFAULT_ASSISTANT_ID));
    };

    // Init för befintliga
    addBars(root);

    // Lyssna på tillagda noder
    const obs = new MutationObserver(muts => {
      for (const m of muts) {
        m.addedNodes && m.addedNodes.forEach(n => {
          if (!(n instanceof Element)) return;
          if (n.matches && n.matches(ASSISTANT_MSG_SELECTOR)) {
            // Kolla om detta är första AI-meddelandet (välkomst)
            const chatContainer = n.closest('#konrad-chat-messages');
            const existingMessages = chatContainer?.querySelectorAll('.konrad-message, .user-message');
            const isWelcomeMessage = existingMessages?.length === 1;
            
            if (!isWelcomeMessage) {
              attachFeedbackTo(n, DEFAULT_ASSISTANT_ID);
            }
          } else {
            addBars(n);
          }
        });
      }
    });
    obs.observe(root, { childList: true, subtree: true });
    return true;
  }

  if (!window.__AIH_FEEDBACK_WIRED__) {
    window.__AIH_FEEDBACK_WIRED__ = true;

    // Lyssna på modal-injektion exakt en gång
    document.addEventListener('konrad:modal-injected', initFeedback, { once: true });

    // Om modalen redan finns (t.ex. snabb navigering/soft load), initiera direkt
    if (document.querySelector('#konrad-chat-messages')) {
      initFeedback();
    }
  }
})();

/* Exportera hook om andra moduler vill trigga manuellt */
window.KonradFeedback = {
  attachFeedbackTo,
  trackFeedback
};