---
name: acid-ui-components
description: >-
  Integrate and customize acidUI Web Components for hardware-inspired web controls.
  Use when adding acid-knob, acid-button, acid-switch, acid-fader, or acid-meter,
  wiring their events, or connecting the meter to a Web Audio signal.
---

# acidUI Components

Use this skill to integrate the existing UI controls, not to invent an instrument or unsupported features. The repository's current source is authoritative.

## Files and setup

- `src/components.js`: registers all five Custom Elements on import, guarded against duplicate registration.
- `src/components.css`: standalone component styles; load alongside the module.
- `src/meter-worklet.js`: optional audio-thread average and sample-peak processor, not required by the UI components.
- `docs/getting-started.md`: integration, browser and audio setup.
- `references/api-reference.md`: supported attributes, properties, events and limitations.
- `templates/control-panel.html`: working browser example inside this repository.

Copy `components.js` and `components.css` to a project's served assets, or import them from a bundler. No npm publication is assumed. Import JS only in the browser in SSR applications. If using the worklet, copy it separately and provide its real URL to `audioWorklet.addModule()` in a secure context.

## Integration procedure

1. Pick the relevant elements and give each a meaningful `label`; add separate visible labels if needed. These are UI controls, not audio engines.
2. Configure only attributes listed in `references/api-reference.md`; provide explicit `min`, `max`, `step`, and `value` when ranges matter. For knobs use `drag-mode="vertical"` or `"circular"` and keep `min-angle` less than `max-angle`.
3. Listen to bubbling `input` or `change` CustomEvents and use `event.detail.value` or `.normalized`. Setting `.value` programmatically updates the UI without dispatching an event. `acid-button` is a toggle, not a momentary button.
4. For a meter, provide a calibrated dB VU `value` and configure `yellow-start` as needed. Red indicates a level above 0 VU, not verified digital clipping. Never infer digital clipping from an averaged VU-style level. The bundled worklet is approximate, not a standards-certified VU or true-peak meter. Start audio only after user interaction.
5. Validate with `npm test` and `npm run build`. When changing interaction or meter processing, add tests for the behavior. Check pointer and keyboard interaction, event values, and the demo in a browser where possible.

## Minimal example

```html
<link rel="stylesheet" href="./components.css">
<script type="module" src="./components.js"></script>
<acid-knob id="cutoff" label="Cutoff" min="0" max="100" step="1" value="50" drag-mode="circular"></acid-knob>
<acid-meter id="level" label="Output level" segments="12"></acid-meter>
<script type="module">
  await customElements.whenDefined('acid-knob');
  document.querySelector('#cutoff').addEventListener('input', e => console.log(e.detail.value));
</script>
```

`endless`, `wrap`, `detents`, `scale-labels`, `show-arc`, and moogUI-specific variants are **not** implemented. Do not imply otherwise. See the API reference before generating markup.
