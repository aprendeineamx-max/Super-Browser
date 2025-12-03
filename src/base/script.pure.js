// Content Script Puro (V2) con clicks humanizados y auto-config de Wit.ai
(function () {
  console.log('🔥 BUSTER V2 - LOGICA DE RESOLUCIÓN CARGADA 🔥');

  // Auto-configuración de Wit.ai
  const WIT_TOKEN = '6JQEKJ46JEAUGJGBD37UVMES3DHAAVWU';
  try {
    chrome.storage.local.get(['speechService', 'witAiKey'], (result) => {
      if (result.speechService !== 'witAi' || result.witAiKey !== WIT_TOKEN) {
        chrome.storage.local.set({
          speechService: 'witAi',
          witAiKey: WIT_TOKEN,
          simulateUserInput: true,
          autoUpdateClientApp: false
        });
      }
    });
  } catch (e) {
    console.warn('No se pudo setear configuración inicial de Wit.ai:', e);
  }

  const BTN_ID = 'buster-pure-btn';
  let lastSolveTs = 0;

  function randomSleep(min = 50, max = 150) {
    const t = min + Math.random() * (max - min);
    return new Promise(res => setTimeout(res, t));
  }

  function gaussianRand() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    const val = 0.5 + num * 0.15;
    return Math.min(0.9, Math.max(0.1, val));
  }

  async function simulateClick(el) {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width * gaussianRand();
    const y = rect.top + rect.height * gaussianRand();
    const opts = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: x,
      clientY: y,
      screenX: window.screenX + x,
      screenY: window.screenY + y
    };
    el.dispatchEvent(new MouseEvent('mousemove', opts));
    el.dispatchEvent(new MouseEvent('mouseover', opts));
    el.dispatchEvent(new MouseEvent('mousedown', opts));
    await randomSleep(10, 50);
    el.dispatchEvent(new MouseEvent('mouseup', opts));
    await randomSleep(10, 50);
    el.dispatchEvent(new MouseEvent('click', opts));
  }

  async function typeText(input, text) {
    if (!input) return;
    input.focus();
    let current = '';
    for (const ch of text) {
      current += ch;
      input.value = current;
      input.dispatchEvent(new Event('input', {bubbles: true}));
      await randomSleep(40, 120);
    }
  }

  async function solveAudio() {
    const now = Date.now();
    if (now - lastSolveTs < 20000) {
      console.log('[BUSTER] Demasiado rápido, esperando antes de reintentar');
      return;
    }
    lastSolveTs = now;

    // Detectar mensaje de bloqueo y abortar
    const blockedOverlay = Array.from(document.querySelectorAll('div')).find(d =>
      /inténtalo más tarde|try again later|consultas automatizadas/i.test((d.innerText || '').toLowerCase())
    );
    if (blockedOverlay) {
      console.warn('[BUSTER] Página indica bloqueo (try again later), abortando intento');
      return;
    }

    const audioBtn = document.querySelector('#recaptcha-audio-button');
    if (audioBtn) {
      await simulateClick(audioBtn);
      await randomSleep(1200, 2500);
    }

    let audioEl = null;
    for (let i = 0; i < 12 && !audioEl; i++) {
      audioEl = document.querySelector('audio#audio-source');
      if (!audioEl) await randomSleep(400, 900);
    }
    if (!audioEl || !audioEl.src) return;

    let solution = null;
    try {
      solution = await new Promise(resolve => {
        chrome.runtime.sendMessage({
          id: 'transcribeAudio',
          audioUrl: audioEl.src,
          lang: document.documentElement.lang || 'en'
        }, resp => resolve(resp && resp.text ? resp.text : resp));
      });
    } catch (e) {
      console.error('Transcribe error:', e);
      return;
    }
    if (!solution) return;

    const input = document.querySelector('#audio-response');
    await typeText(input, solution);
    await randomSleep(200, 500);
    const verifyBtn = document.querySelector('#recaptcha-verify-button');
    await simulateClick(verifyBtn);
  }

  function injectButton() {
    const old = document.getElementById(BTN_ID);
    if (old) old.remove();

    // Preferimos inyectar inline junto a los controles nativos si estamos en el iframe del reto
    const isRecaptchaFrame =
      window.location.href.includes('google.com/recaptcha') ||
      window.location.href.includes('recaptcha.net/recaptcha');

    const btn = document.createElement('button');
    btn.id = BTN_ID;
    btn.innerText = isRecaptchaFrame ? '⚡ SOLVE (IFRAME)' : '⚡ SOLVE';
    Object.assign(btn.style, {
      backgroundColor: isRecaptchaFrame ? '#00C853' : '#ff4500',
      color: 'white',
      padding: '8px 10px',
      border: '2px solid white',
      borderRadius: '6px',
      fontWeight: 'bold',
      cursor: 'pointer',
      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
      fontSize: '13px',
      lineHeight: '1.2',
      zIndex: '2147483647'
    });

    btn.addEventListener('click', ev => {
      ev.preventDefault();
      ev.stopPropagation();
      solveAudio();
    });

    let placed = false;
    if (isRecaptchaFrame) {
      const audioBtn = document.querySelector('#recaptcha-audio-button');
      const controls =
        document.querySelector('.rc-controls') ||
        document.querySelector('.primary-controls') ||
        (audioBtn && audioBtn.parentElement);
      if (controls) {
        btn.style.position = 'relative';
        btn.style.marginLeft = '8px';
        controls.appendChild(btn);
        placed = true;
      }
    }

    if (!placed) {
      // Fallback flotante
      Object.assign(btn.style, {
        position: 'fixed',
        bottom: '10px',
        right: '10px'
      });
      (document.body || document.documentElement).appendChild(btn);
    }
  }

  setInterval(injectButton, 500);
})();
