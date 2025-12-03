(function () {
  const BTN_ID = 'buster-pure-btn';

  function randomSleep(min = 50, max = 150) {
    const t = min + Math.random() * (max - min);
    return new Promise(res => setTimeout(res, t));
  }

  async function simulateClick(el) {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = rect.left + Math.random() * Math.max(10, rect.width * 0.3);
    const y = rect.top + Math.random() * Math.max(10, rect.height * 0.3);
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
    if (!audioBtn) return;

    await simulateClick(audioBtn);
    await randomSleep(800, 1500);

    let audioEl = document.querySelector('audio#audio-source');
    for (let i = 0; i < 10 && !audioEl; i++) {
      await randomSleep(300, 600);
      audioEl = document.querySelector('audio#audio-source');
    }
    if (!audioEl || !audioEl.src) return;

    const audioUrl = audioEl.src;
    const lang = document.documentElement.lang || 'en';

    let solution = null;
    try {
      const rsp = await chrome.runtime.sendMessage({
        id: 'transcribeAudio',
        audioUrl,
        lang
      });
      if (rsp && typeof rsp === 'string') {
        solution = rsp;
      } else if (rsp && typeof rsp.text === 'string') {
        solution = rsp.text;
      }
    } catch (err) {
      console.error('Error al transcribir:', err);
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
