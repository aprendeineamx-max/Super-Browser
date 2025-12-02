import storage from 'storage/storage';
import {meanSleep, pingClientApp} from 'utils/app';
import {
  getText,
  findNode,
  getRandomFloat,
  sleep,
  getBrowser
} from 'utils/common';
import {targetEnv, clientAppVersion} from 'utils/config';
import {humanMouse} from 'utils/human-mouse';

function main() {
  // Script may be injected multiple times.
  if (self.baseModule) {
    return;
  } else {
    self.baseModule = true;
  }

  console.log('🚀 [CONTEXTO] URL:', window.location.href);
  console.log('🖼️ [CONTEXTO] ¿Es Iframe?:', window !== window.top);
  console.log('[BUSTER] INICIO DE SCRIPT (debug)');
  console.log('[BUSTER] Content script inyectado en: ' + window.location.href);
  const markTarget = function () {
    if (window.location.href.includes('recaptcha') || window.location.href.includes('api2')) {
      console.log('[BUSTER] TARGET DETECTED!');
      if (document && document.body) {
        document.body.style.border = '5px solid #ff4500';
        document.body.style.boxSizing = 'border-box';
        document.body.setAttribute('buster-injected', 'true');
      }
    }
  };
  markTarget();
  setInterval(markTarget, 1000);
  let solverWorking = false;
  let solverButton = null;
  let autoResolveEnabled = false;
  let isAutoSolving = false;
  let simulateHumanMouse = true;

  function setSolverState({working = true} = {}) {
    solverWorking = working;
    if (solverButton) {
      if (working) {
        solverButton.classList.add('working');
      } else {
        solverButton.classList.remove('working');
      }
    }
  }

  function resetCaptcha() {
    return browser.runtime.sendMessage({
      id: 'resetCaptcha',
      challengeUrl: window.location.href
    });
  }

  // Inyección directa y persistente de un botón visible.
  function forceInject() {
    if (document.getElementById('buster-force-btn')) return;

    const btn = document.createElement('div');
    btn.id = 'buster-force-btn';
    btn.innerText = '⚡ SOLVE';

    Object.assign(btn.style, {
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      zIndex: '2147483647',
      backgroundColor: '#ff4500',
      color: 'white',
      padding: '10px 20px',
      border: '2px solid white',
      borderRadius: '5px',
      fontWeight: 'bold',
      cursor: 'pointer',
      boxShadow: '0 0 10px rgba(0,0,0,0.5)',
      fontSize: '14px',
      lineHeight: '1.2',
      textAlign: 'center'
    });

    if (
      window.location.href.includes('google.com/recaptcha') ||
      window.location.href.includes('recaptcha.net/recaptcha')
    ) {
      btn.innerText = '🤖 ESTOY DENTRO';
      btn.style.backgroundColor = '#00C853';
      btn.style.top = '0px';
      btn.style.left = '0px';
      btn.style.bottom = 'auto';
      btn.style.right = 'auto';
    }

    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      alert('¡Click detectado dentro del iframe!');
    });

    (document.body || document.documentElement).appendChild(btn);
  }

  function ensureSolverButton() {
    forceInject();
  }

  function isBlocked({timeout = 0} = {}) {
    const selector = '.rc-doscaptcha-body';
    if (timeout) {
      return new Promise(resolve => {
        findNode(selector, {timeout, throwError: false}).then(result =>
          resolve(Boolean(result))
        );
      });
    }

    return Boolean(document.querySelector(selector));
  }

  function dispatchEnter(node) {
    const keyEvent = {
      code: 'Enter',
      key: 'Enter',
      keyCode: 13,
      which: 13,
      view: window,
      bubbles: true,
      composed: true,
      cancelable: true
    };

    node.focus();
    node.dispatchEvent(new KeyboardEvent('keydown', keyEvent));
    node.dispatchEvent(new KeyboardEvent('keypress', keyEvent));
    node.click();
  }

  async function navigateToElement(node, {forward = true} = {}) {
    if (document.activeElement === node) {
      return;
    }

    if (!forward) {
      await messageClientApp({command: 'pressKey', data: 'shift'});
      await meanSleep(300);
    }

    while (document.activeElement !== node) {
      await messageClientApp({command: 'tapKey', data: 'tab'});
      await meanSleep(300);
    }

    if (!forward) {
      await messageClientApp({command: 'releaseKey', data: 'shift'});
      await meanSleep(300);
    }
  }

  async function tapEnter(node, {navigateForward = true} = {}) {
    await navigateToElement(node, {forward: navigateForward});
    await meanSleep(200);
    await messageClientApp({command: 'tapKey', data: 'enter'});
  }

  async function clickElement(node, browserBorder, osScale) {
    const targetPos = await getClickPos(node, browserBorder, osScale);
    await messageClientApp({command: 'moveMouse', ...targetPos});
    await meanSleep(100);
    await messageClientApp({command: 'clickMouse'});
  }

  async function messageClientApp(message) {
    const rsp = await browser.runtime.sendMessage({
      id: 'messageClientApp',
      message
    });

    if (!rsp.success) {
      throw new Error(`Client app response: ${rsp.text}`);
    }

    return rsp;
  }

  async function getOsScale() {
    return browser.runtime.sendMessage({id: 'getOsScale'});
  }

  async function getBrowserBorder(clickEvent, osScale) {
    const framePos = await getFrameClientPos();
    const scale = window.devicePixelRatio;

    let evScreenPropScale = osScale;
    if (
      targetEnv === 'firefox' &&
      parseInt((await getBrowser()).version.split('.')[0], 10) >= 99
    ) {
      // https://bugzilla.mozilla.org/show_bug.cgi?id=1753836

      evScreenPropScale = scale;
    }

    return {
      left:
        clickEvent.screenX * evScreenPropScale -
        clickEvent.clientX * scale -
        framePos.x -
        window.screenX * scale,
      top:
        clickEvent.screenY * evScreenPropScale -
        clickEvent.clientY * scale -
        framePos.y -
        window.screenY * scale
    };
  }

  async function getFrameClientPos() {
    if (window !== window.top) {
      let frameIndex;
      const siblingWindows = window.parent.frames;
      for (let i = 0; i < siblingWindows.length; i++) {
        if (siblingWindows[i] === window) {
          frameIndex = i;
          break;
        }
      }

      return await browser.runtime.sendMessage({id: 'getFramePos', frameIndex});
    }

    return {x: 0, y: 0};
  }

  async function getElementScreenRect(node, browserBorder, osScale) {
    let {left: x, top: y, width, height} = node.getBoundingClientRect();

    const data = await getFrameClientPos();
    const scale = window.devicePixelRatio;

    x *= scale;
    y *= scale;
    width *= scale;
    height *= scale;

    x += data.x + browserBorder.left + window.screenX * scale;
    y += data.y + browserBorder.top + window.screenY * scale;

    const {os} = await browser.runtime.sendMessage({id: 'getPlatform'});
    if (['windows', 'macos'].includes(os)) {
      x /= osScale;
      y /= osScale;
      width /= osScale;
      height /= osScale;
    }

    return {x, y, width, height};
  }

  async function getClickPos(node, browserBorder, osScale) {
    let {x, y, width, height} = await getElementScreenRect(
      node,
      browserBorder,
      osScale
    );

    return {
      x: Math.round(x + width * getRandomFloat(0.4, 0.6)),
      y: Math.round(y + height * getRandomFloat(0.4, 0.6))
    };
  }

  async function solve(simulateUserInput, clickEvent) {
    if (isBlocked()) {
      return;
    }

    const {navigateWithKeyboard} = await storage.get('navigateWithKeyboard');

    let browserBorder;
    let osScale;
    let useMouse = true;
    if (simulateUserInput) {
      if (!navigateWithKeyboard && (clickEvent.clientX || clickEvent.clientY)) {
        osScale = await getOsScale();
        browserBorder = await getBrowserBorder(clickEvent, osScale);
      } else {
        useMouse = false;
      }
    }

    const audioElSelector = 'audio#audio-source';
    let audioEl = document.querySelector(audioElSelector);
    if (!audioEl) {
      const audioButton = document.querySelector('#recaptcha-audio-button');
      if (simulateUserInput) {
        if (useMouse) {
          await clickElement(audioButton, browserBorder, osScale);
        } else {
          audioButton.focus();
          await tapEnter(audioButton);
        }
      } else {
        if (simulateHumanMouse) {
          await humanMouse.clickOn(audioButton);
        } else {
          dispatchEnter(audioButton);
        }
      }

      const result = await Promise.race([
        new Promise(resolve => {
          findNode(audioElSelector, {timeout: 10000, throwError: false}).then(
            el => {
              meanSleep(500).then(() => resolve({audioEl: el}));
            }
          );
        }),
        new Promise(resolve => {
          isBlocked({timeout: 10000}).then(blocked => resolve({blocked}));
        })
      ]);

      if (result.blocked) {
        return;
      }

      audioEl = result.audioEl;
    }

    if (simulateUserInput) {
      const muteAudio = function () {
        audioEl.muted = true;
      };
      const unmuteAudio = function () {
        removeCallbacks();
        audioEl.muted = false;
      };

      audioEl.addEventListener('playing', muteAudio, {
        capture: true,
        once: true
      });
      audioEl.addEventListener('ended', unmuteAudio, {
        capture: true,
        once: true
      });

      const removeCallbacks = function () {
        window.clearTimeout(timeoutId);
        audioEl.removeEventListener('playing', muteAudio, {
          capture: true,
          once: true
        });
        audioEl.removeEventListener('ended', unmuteAudio, {
          capture: true,
          once: true
        });
      };

      const timeoutId = window.setTimeout(unmuteAudio, 10000); // 10 seconds

      const playButton = document.querySelector(
        '.rc-audiochallenge-play-button > button'
      );
      if (useMouse) {
        await clickElement(playButton, browserBorder, osScale);
      } else {
        await tapEnter(playButton);
      }
    }

    const audioUrl = audioEl.src;
    const lang = document.documentElement.lang;

    const solution = await browser.runtime.sendMessage({
      id: 'transcribeAudio',
      audioUrl,
      lang
    });

    if (!solution) {
      if (solverButton) {
        solverButton.classList.add('error');
      }
      await browser.runtime.sendMessage({
        id: 'notification',
        messageId: 'error_internalError'
      });
      return;
    }

    const input = document.querySelector('#audio-response');
    if (simulateUserInput) {
      if (useMouse) {
        await clickElement(input, browserBorder, osScale);
      } else {
        await navigateToElement(input);
      }
      await meanSleep(200);

      await messageClientApp({command: 'typeText', data: solution});
    } else {
      input.value = solution;
    }

    const submitButton = document.querySelector('#recaptcha-verify-button');
    if (simulateUserInput) {
      if (useMouse) {
        await clickElement(submitButton, browserBorder, osScale);
      } else {
        await tapEnter(submitButton);
      }
    } else {
      if (simulateHumanMouse) {
        await humanMouse.clickOn(submitButton);
      } else {
        dispatchEnter(submitButton);
      }
    }

    browser.runtime.sendMessage({id: 'captchaSolved'});
  }

  function solveChallenge(ev) {
    ev?.preventDefault?.();
    ev?.stopImmediatePropagation?.();

    if (!ev.isTrusted || solverWorking) {
      return;
    }
    setSolverState({working: true});

    runSolver(ev)
      .catch(err => {
        browser.runtime.sendMessage({
          id: 'notification',
          messageId: 'error_internalError'
        });
        if (solverButton) {
          solverButton.classList.add('error');
        }
        console.log(err.toString());
        throw err;
      })
      .finally(() => {
        setSolverState({working: false});
        if (solverButton) {
          solverButton.classList.remove('error');
        }
      });
  }

  async function triggerAutoSolve(audioBtn) {
    if (isAutoSolving) return;
    isAutoSolving = true;
    try {
      const fakeEvent = {preventDefault() {}, stopImmediatePropagation() {}, isTrusted: true};
      await solveChallenge(fakeEvent);
    } finally {
      isAutoSolving = false;
    }
  }

  async function runSolver(ev) {
    const {simulateUserInput, autoUpdateClientApp} = await storage.get([
      'simulateUserInput',
      'autoUpdateClientApp'
    ]);

    if (simulateUserInput) {
      try {
        let pingRsp;

        try {
          pingRsp = await pingClientApp({stop: false, checkResponse: false});
        } catch (err) {
          browser.runtime.sendMessage({
            id: 'notification',
            messageId: 'error_missingClientApp'
          });
          browser.runtime.sendMessage({id: 'openOptions'});
          throw err;
        }

        if (!pingRsp.success) {
          if (!pingRsp.apiVersion !== clientAppVersion) {
            if (!autoUpdateClientApp || pingRsp.apiVersion === '1') {
              browser.runtime.sendMessage({
                id: 'notification',
                messageId: 'error_outdatedClientApp'
              });
              browser.runtime.sendMessage({id: 'openOptions'});
              throw new Error('Client app outdated');
            } else {
              try {
                browser.runtime.sendMessage({
                  id: 'notification',
                  messageId: 'info_updatingClientApp'
                });
                const rsp = await browser.runtime.sendMessage({
                  id: 'messageClientApp',
                  message: {command: 'installClient', data: clientAppVersion}
                });

                if (rsp.success) {
                  await browser.runtime.sendMessage({id: 'stopClientApp'});
                  await sleep(10000);

                  await pingClientApp({stop: false});

                  await browser.runtime.sendMessage({
                    id: 'messageClientApp',
                    message: {command: 'installCleanup'}
                  });
                } else {
                  throw new Error(`Client app update failed: ${rsp.data}`);
                }
              } catch (err) {
                browser.runtime.sendMessage({
                  id: 'notification',
                  messageId: 'error_clientAppUpdateFailed'
                });
                browser.runtime.sendMessage({id: 'openOptions'});
                throw err;
              }
            }
          }
        }
      } catch (err) {
        console.log(err.toString());
        await browser.runtime.sendMessage({id: 'stopClientApp'});
        return;
      }
    }

    try {
      await solve(simulateUserInput, ev);
    } finally {
      if (simulateUserInput) {
        await browser.runtime.sendMessage({id: 'stopClientApp'});
      }
    }
  }

  function init() {
    const observer = new MutationObserver(ensureSolverButton);
    observer.observe(document, {
      childList: true,
      subtree: true
    });

    ensureSolverButton();
    setInterval(ensureSolverButton, 500);
  }

  async function loadSettings() {
    const {autoResolveEnabled: enabled, simulateHumanMouse: shm} = await storage.get([
      'autoResolveEnabled',
      'simulateHumanMouse'
    ]);
    autoResolveEnabled = Boolean(enabled);
    simulateHumanMouse = shm !== undefined ? Boolean(shm) : true;
  }

  function addStorageListener() {
    browser.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      if (changes.autoResolveEnabled) {
        autoResolveEnabled = Boolean(changes.autoResolveEnabled.newValue);
      }
      if (changes.simulateHumanMouse) {
        simulateHumanMouse = Boolean(changes.simulateHumanMouse.newValue);
      }
    });
  }

  loadSettings().then(() => {
    init();
    addStorageListener();
  });
}

main();







