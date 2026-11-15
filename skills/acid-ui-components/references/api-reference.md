# acidUI API reference

Source of truth: `src/components.js` and `src/components.css`. These components use light DOM and a separately imported global stylesheet. They render their own internals; do not rely on preserving children placed inside them.

## Shared behavior

- `label`: accessible name; not drawn as visible text.
- `.value`: number, clamped to the component's range. Assigning it redraws without events; `value` attribute changes are observed. Property changes do not reflect back to the attribute.
- User interaction emits `input` and `change` as bubbling, composed `CustomEvent`s with `detail: { value, normalized }`. Programmatic property or attribute changes do not emit these events.
- `input` is emitted during interaction; `change` at the end. `acid-meter` is display-only.

## `<acid-knob>`

| Attribute | Default | Meaning |
| --- | --- | --- |
| `min`, `max`, `value`, `step` | `0`, `100`, `0`, `1` | Numeric range, initial value, step; interactive values snap relative to min. |
| `size` | `md` | `sm`, `md`, `lg` |
| `variant` | `dark` | `dark`, `silver` |
| `drag-mode` | `vertical` | `vertical` or relative `circular` |
| `min-angle`, `max-angle` | `-135`, `135` | Angle limits in degrees, clamped to −180..180; max is not below min. |
| `ticks` | `13` | Number of marks over the angle sweep, clamped to 2..41. |
| `sensitivity` | `140` | Vertical pixels per range; Shift provides finer adjustment. |
| `wheel` | enabled | `wheel="false"` disables the wheel. |
| `default-value` | min | Target for reset by double-click, Alt-click or `.reset()`. |
| `unit`, `show-value` | empty, `never` | Unit suffix and `always`, `hover`, `never`. |
| `disabled` | absent | Boolean attribute; disables user interaction. |

Also exposes `.normalized`, `.formattedValue`, and `.reset()`. Arrow keys and Home/End adjust values. CSS variables `--acid-tick-color` and `--acid-value-color` are supported. Unsupported: moogUI's `endless`, `wrap`, `detents`, `scale-labels`, `show-arc`, `format`, and variant names.

## `<acid-fader>`

`min`, `max`, `value`, `step` default to `0`, `100`, `0`, `1`; `size` is `sm`, `md` or `lg` (default `md`). Supports vertical pointer interaction and Arrow/Home/End keys.

## `<acid-switch>` and `<acid-button>`

Both have numeric `value` 0 or 1 and toggle on click or Space/Enter. Switch supports `size="sm|md|lg"` and `variant="horizontal|vertical"` (defaults `md`, `horizontal`). Button supports `color="orange|red|yellow|ivory"` (default `orange`) and `caption` (default empty). Button is latched, not momentary. No `checked` property or `disabled` interaction support is provided for these elements.

## `<acid-meter>`

`value` is 0..1; `segments` defaults to 12 and is clamped to 6..32. `clip` is a boolean attribute/property (`meter.clip = true` or `false`). Green/yellow bars display the normalized level, with yellow in the upper approximately 20% of the displayed range; red is a separate clip zone. For the demo, 0..1 maps −60..0 dBFS and red is driven by a sample at or above full scale, held for one second by application code. The meter does not analyze audio, hold clip, or emit input events itself. The bundled worklet performs approximate rectified averaging and sample peak detection; it does not calculate true peak or certify VU compliance.
