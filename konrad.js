// js/konrad.js
(function () {
  // Stäng av emoji-fallback – vi har riktig knapp i footer.html
  var ALLOW_FALLBACK = false;
  
  var CONSENT_KEY = 'gdprConsent';
  var NUDGE_KEY   = 'konradNudgeSeen';
  var DISABLE_ATTR = 'data-no-konrad';

  function _parseGdprValue(raw) {
    // Returnerar { ok: boolean, reason: string } där ok = om widget får starta
    if (raw == null) {
      return { ok: true, reason: 'no-consent-key (assume no-GDPR)' };
    }

    // Boolean true (om någon tidigare lagrat boolean)
    if (raw === true) return { ok: true, reason: 'boolean true' };
    if (raw === false) return { ok: false, reason: 'boolean false' };

    // Strängfall
    if (typeof raw === 'string') {
      var v = raw.trim().toLowerCase();

      if (v === 'true')  return { ok: true,  reason: 'string "true"'  };
      if (v === 'false') return { ok: false, reason: 'string "false"' };

      // JSON?
      if (v.indexOf('{') === 0 || v.indexOf('[') === 0) {
        try {
          var obj = JSON.parse(raw);

          // Vanlig form: {"necessary":true,"analytics":false,"timestamp":...}
          // SVENSK GDPR-LAG: Kräv uttryckligt analytics-samtycke för widgets som använder analytics
          // Om det finns ett explicit fält "widget": tillåt endast om det är true.
          if (obj && typeof obj === 'object') {
            if ('widget' in obj) {
              return { ok: !!obj.widget, reason: 'json widget flag' };
            }
            // SVENSK GDPR FIX: Kräv analytics-samtycke, inte bara necessary
            if ('analytics' in obj && 'necessary' in obj) {
              // Tillåt bara om både necessary OCH analytics är godkända
              const allowed = !!obj.necessary && !!obj.analytics;
              return { ok: allowed, reason: allowed ? 'json analytics consent' : 'json analytics denied' };
            }
            // Om bara necessary finns utan analytics-val → vänta på användarval
            if ('necessary' in obj) {
              return { ok: false, reason: 'json awaiting analytics consent' };
            }
            // Ingen känd struktur → kräv samtycke
            return { ok: false, reason: 'json (require explicit consent)' };
          }
          return { ok: true, reason: 'json parsed (truthy default)' };
        } catch (e) {
          // Oparsbar sträng → var liberal (vi vill inte blocka widgeten i onödan)
          return { ok: true, reason: 'unparseable string (liberal default)' };
        }
      }

      // Annan sträng → var liberal
      return { ok: true, reason: 'string (liberal default)' };
    }

    // Okänd typ → var liberal
    return { ok: true, reason: 'unknown type (liberal default)' };
  }

  function hasConsent() {
    try {
      var raw = localStorage.getItem(CONSENT_KEY);
      var verdict = _parseGdprValue(raw);


      return verdict.ok;
    } catch (e) {
      // Om localStorage kastar fel (Safari ITP / priv.läge etc) – tillåt widgeten
      return true;
    }
  }
  function disabledOnPage() {
    return document.body && document.body.hasAttribute(DISABLE_ATTR);
  }
  function exists() {
    return !!document.getElementById('konrad-launcher');
  }

  function ensureAPI() {
    window.Konrad = window.Konrad || {};
    window.Konrad.open  = window.Konrad.open  || function () {
      // Använd befintlig openKonradModal funktion om den finns
      if (typeof window.openKonradModal === 'function') {
        window.openKonradModal();
      } else {
        document.dispatchEvent(new CustomEvent('openKonradChat'));
      }
    };
    window.Konrad.close = window.Konrad.close || function () {
      // Använd befintlig closeKonradModal funktion om den finns
      if (typeof window.closeKonradModal === 'function') {
        window.closeKonradModal();
      } else {
        document.dispatchEvent(new CustomEvent('closeKonradChat'));
      }
    };
  }

  function createLauncher() {
    // Kolla om det redan finns en floating chat-knapp (den riktiga med avatar)
    var existingBtn = document.querySelector('.floating-chat-btn');
    if (existingBtn) {
      
      // Använd befintlig knapp och gör den synlig genom att ta bort is-hidden
      existingBtn.classList.remove('is-hidden');

      // Lägg till click-lyssnare om den inte redan finns
      if (!existingBtn.hasAttribute('data-konrad-wired')) {
        
        existingBtn.addEventListener('click', function (e) {
          e.preventDefault();
          ensureAPI();
          window.Konrad.open();
          hideNudge();
        });
        existingBtn.setAttribute('data-konrad-wired', 'true');
      }

      showNudgeOnce(existingBtn);
      return;
    }

    // Ingen .floating-chat-btn hittades.
    // Skapa INGEN fallback om vi inte uttryckligen tillåter det.
    if (!ALLOW_FALLBACK) {
      
      return;
    }

    // (Om fallback någon gång ska tillbaka: sätt ALLOW_FALLBACK = true
    //  och återskapa blocket som lade till knappen.)
  }

  function showNudgeOnce(anchorEl) {
    try { if (localStorage.getItem(NUDGE_KEY) === 'true') return; } catch (e) {}
    var n = document.createElement('div');
    n.id = 'konrad-nudge';
    n.role = 'status';
    n.textContent = 'Testa vår AI-assistent Konrad – fråga eller boka rådgivning!';
    document.body.appendChild(n);
    // enkel position – CSS tar resten
    setTimeout(hideNudge, 6000);
    try { localStorage.setItem(NUDGE_KEY, 'true'); } catch (e) {}
  }
  function hideNudge() {
    var n = document.getElementById('konrad-nudge');
    if (n) n.remove();
  }

  // --- KIRURGISK PATCH: Event-driven floating button reveal ---
  // Global guard för att undvika dubbel-wiring per sidladdning
  window.__AIH_KONRAD_BTN_WIRED__ = window.__AIH_KONRAD_BTN_WIRED__ || false;

  function revealAndWireFloatingBtn() {
    const btn = document.querySelector('.floating-chat-btn');
    if (!btn) return false;

    // Visa knappen
    btn.classList.remove('is-hidden');

    // Wire:a bara en gång
    if (!btn.hasAttribute('data-konrad-wired')) {
      btn.setAttribute('data-konrad-wired', '1');
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        // Öppna chatten via befintlig API
        if (typeof window.openKonradModal === 'function') {
          window.openKonradModal();
        }
      });
    }

    // Trigger nudge if consent is given
    if (hasConsent()) {
        showNudgeOnce(btn);
    }

    window.__AIH_KONRAD_BTN_WIRED__ = true;
    return true;
  }

  // 1) Försök direkt (om footern redan är injicerad)
  if (document.querySelector('.floating-chat-btn')) {
    revealAndWireFloatingBtn();
  }

  // 2) Vänta specifikt på att footern/konrad-modal injiceras
  document.addEventListener('konrad:modal-injected', revealAndWireFloatingBtn, { once: true });

  function init() {
    if (!document.body || window.__AIH_KONRAD_INIT__) return;
    if (disabledOnPage()) return;
    
    window.__AIH_KONRAD_INIT__ = true;
    ensureAPI();
  }

  function boot() {
    // 1) När DOM är redo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
    // 2) När GDPR/footern är laddad
    document.addEventListener('gdprElementsLoaded', init);
  }

  boot();
})();