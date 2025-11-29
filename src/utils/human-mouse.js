import {sleep, getRandomFloat} from 'utils/common';

function bezierPoint(t, p0, p1, p2, p3) {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;
  const x = uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x;
  const y = uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y;
  return {x, y};
}

function randomCtrlPoint(a, b) {
  const dx = (b.x - a.x) * getRandomFloat(0.2, 0.8);
  const dy = (b.y - a.y) * getRandomFloat(0.2, 0.8);
  return {x: a.x + dx + getRandomFloat(-10, 10), y: a.y + dy + getRandomFloat(-10, 10)};
}

function dispatchMouseEvent(target, type, coords) {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    composed: true,
    clientX: coords.x,
    clientY: coords.y,
    screenX: coords.x,
    screenY: coords.y,
    movementX: 0,
    movementY: 0
  });
  target.dispatchEvent(event);
}

async function moveTo(startEl, endEl, {steps = 25, minDelay = 8, maxDelay = 18} = {}) {
  const startRect = startEl.getBoundingClientRect();
  const endRect = endEl.getBoundingClientRect();
  const start = {
    x: startRect.left + startRect.width / 2,
    y: startRect.top + startRect.height / 2
  };
  const end = {
    x: endRect.left + endRect.width / 2,
    y: endRect.top + endRect.height / 2
  };

  const c1 = randomCtrlPoint(start, end);
  const c2 = randomCtrlPoint(start, end);

  const totalSteps = Math.max(10, Math.floor(steps + getRandomFloat(-5, 5)));
  for (let i = 1; i <= totalSteps; i++) {
    const t = i / totalSteps;
    const point = bezierPoint(t, start, c1, c2, end);
    dispatchMouseEvent(endEl, 'mousemove', point);
    await sleep(getRandomFloat(minDelay, maxDelay));
  }
}

async function clickOn(el) {
  if (!el) return;
  const placeholder = document.documentElement;
  await moveTo(placeholder, el);
  const rect = el.getBoundingClientRect();
  const pos = {x: rect.left + rect.width / 2, y: rect.top + rect.height / 2};
  await sleep(getRandomFloat(10, 25));
  dispatchMouseEvent(el, 'mouseover', pos);
  await sleep(getRandomFloat(5, 20));
  dispatchMouseEvent(el, 'mousedown', pos);
  await sleep(getRandomFloat(5, 20));
  dispatchMouseEvent(el, 'mouseup', pos);
  await sleep(getRandomFloat(5, 20));
  dispatchMouseEvent(el, 'click', pos);
}

export const humanMouse = {moveTo, clickOn};
