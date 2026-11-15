import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, customElements: dom.window.customElements, CustomEvent: dom.window.CustomEvent });
await import('../src/components.js');
dom.window.HTMLElement.prototype.getBoundingClientRect = () => ({ left:0, top:0, width:100, height:100 });
function knob(attrs = '') { const el = document.createElement('div'); el.innerHTML = `<acid-knob ${attrs}></acid-knob>`; document.body.append(el); const control = el.firstElementChild; control.setPointerCapture = () => {}; return control; }
function pointer(el, type, x, y) { const e = new dom.window.MouseEvent(type, { bubbles:true, clientX:x, clientY:y }); Object.defineProperty(e, 'pointerId', { value:1 }); el.dispatchEvent(e); }
test('ticks respect the sweep and reactive configuration', () => { const el=knob('min="-5" max="5" value="0" ticks="5"'); const ticks=[...el.querySelectorAll('.knob-ticks i')].map(i=>i.style.getPropertyValue('--tick-angle')); assert.deepEqual(ticks,['-135deg','-67.5deg','0deg','67.5deg','135deg']); el.setAttribute('max-angle','90'); assert.equal(el.querySelector('.knob-ticks i:last-child').style.getPropertyValue('--tick-angle'),'90deg'); el.setAttribute('min','-10'); assert.equal(el.min,-10); });
test('circular drag moves relatively, clamps at stops and reports value', () => { const el=knob('min="0" max="100" value="50" drag-mode="circular"'); let detail; el.addEventListener('input',e=>detail=e.detail); pointer(el,'pointerdown',50,0); pointer(el,'pointermove',100,50); pointer(el,'pointerup',100,50); assert.equal(el.value,83); assert.equal(detail.value,83); assert.equal(detail.normalized,.83); });
test('vertical drag, steps, reset and disabled', () => {const el=knob('min="-10" max="10" value="0" step="2" sensitivity="100" default-value="-4"');pointer(el,'pointerdown',50,50);pointer(el,'pointermove',50,0);pointer(el,'pointerup',50,0);assert.equal(el.value,10);el.reset();assert.equal(el.value,-4);el.setAttribute('disabled','');pointer(el,'pointerdown',50,50);pointer(el,'pointermove',50,0);assert.equal(el.value,-4)});
test('VU meter colors follow the configured dB thresholds', () => {
 const el=document.createElement('acid-meter');el.setAttribute('segments','12');document.body.append(el);
 assert.equal(el.value,-60);assert.equal(el.querySelectorAll('.lit').length,0);
 el.value=-13;assert.equal(el.querySelectorAll('.yellow.lit, .red.lit').length,0);
 el.value=-12;assert.ok(el.querySelectorAll('.yellow.lit').length>0);assert.equal(el.querySelectorAll('.red.lit').length,0);
 el.value=0;assert.equal(el.querySelectorAll('.yellow.lit').length,el.querySelectorAll('.yellow').length);assert.equal(el.querySelectorAll('.red.lit').length,0);
 el.value=.01;assert.ok(el.querySelectorAll('.red.lit').length>0);
 el.value=6;assert.equal(el.querySelectorAll('.red.lit').length,el.querySelectorAll('.red').length);
 el.value=-10;el.setAttribute('yellow-start','-6');assert.equal(el.querySelectorAll('.yellow.lit').length,0);el.value=-6;assert.ok(el.querySelectorAll('.yellow.lit').length>0);
 assert.equal(el.getAttribute('aria-valuetext'),'-6 dB VU');el.setAttribute('value','0');el.removeAttribute('value');assert.equal(el.value,-60);
});
test('knob sizes retain a scaled visual inside a layout wrapper with a separate value', () => {
 const el=knob('size="sm" value="50" show-value="always"');
 for (const size of ['sm','md','lg']) {
  el.setAttribute('size',size);
  const wrap=el.querySelector('.knob-wrap');
  assert.ok(wrap.querySelector('.knob-inner .knob'));
  assert.equal(wrap.nextElementSibling.className,'knob-value');
  assert.equal(wrap.nextElementSibling.textContent,'50');
 }
});
test('circular drag uses the visible dial center rather than the value area', () => {
 const el=knob('value="50" drag-mode="circular" show-value="always"');
 el.getBoundingClientRect=()=>({left:0,top:0,width:200,height:200});
 pointer(el,'pointerdown',50,0);pointer(el,'pointermove',100,50);pointer(el,'pointerup',100,50);
 assert.equal(el.value,83);
});
