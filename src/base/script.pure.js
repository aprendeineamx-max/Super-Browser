// Content Script Puro (V2) - humano y con auto-configuración de Wit.ai
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
    const audioBtn = document.querySelector('#recaptcha-audio-button');
    if (audioBtn) {
      await simulateClick(audioBtn);
      await randomSleep(800, 1500);
    }

    let audioEl = null;
    for (let i = 0; i < 10 && !audioEl; i++) {
      audioEl = document.querySelector('audio#audio-source');
      if (!audioEl) await randomSleep(300, 600);
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

    const btn = document.createElement('button');
    btn.id = BTN_ID;
    btn.innerText = '⚡ SOLVE';
    Object.assign(btn.style, {
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      zIndex: '2147483647',
      backgroundColor: '#ff4500',
      color: 'white',
      padding: '10px 16px',
      border: '2px solid white',
      borderRadius: '6px',
      fontWeight: 'bold',
      cursor: 'pointer',
      boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
    });

    if (
      window.location.href.includes('google.com/recaptcha') ||
      window.location.href.includes('recaptcha.net/recaptcha')
    ) {
      btn.innerText = '⚡ SOLVE (IFRAME)';
      btn.style.backgroundColor = '#00C853';
      btn.style.top = '0';
      btn.style.left = '0';
      btn.style.bottom = 'auto';
      btn.style.right = 'auto';
    }

    btn.addEventListener('click', ev => {
      ev.preventDefault();
      ev.stopPropagation();
      solveAudio();
    });

    (document.body || document.documentElement).appendChild(btn);
  }

  setInterval(injectButton, 500);
})();
