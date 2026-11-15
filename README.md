# acidUI

TB-303, TR-808, TR-909과 ReBirth에서 영감을 받은 **프레임워크 독립 Web Components UI 키트**입니다. 악기 제작 프레임워크가 아니라 노브, 버튼, 스위치, 페이더 및 미터를 다른 프로젝트에서 조합하기 위한 라이브러리입니다. 데모에는 각 컴포넌트의 속성을 직접 바꿀 수 있는 플레이그라운드와 Web Audio 연결 예제가 있습니다.

```sh
npm install
npm run dev
npm run build
npm test
```

## 문서와 Agent Skill

- [적용 가이드](docs/getting-started.md): 파일 가져오기, 이벤트 및 오디오 미터 연결
- [Agent Skill](skills/acid-ui-components/SKILL.md): 에이전트용 사용 절차, API 참조 및 실행 예제

## 사용

`src/components.js`와 `src/components.css`를 함께 가져옵니다. 번들러 없이 사용할 때는 두 파일을 웹 서버에서 제공하면 됩니다.

```html
<link rel="stylesheet" href="./src/components.css">
<script type="module" src="./src/components.js"></script>

<acid-knob label="Cutoff" min="0" max="100" step="5" value="65" size="lg" variant="silver"></acid-knob>
<acid-button label="Step 1" caption="STEP" color="red" value="1"></acid-button>
<acid-switch label="Waveform" variant="vertical" value="0"></acid-switch>
<acid-fader label="Volume" min="0" max="100" step="1" value="70" size="lg"></acid-fader>
<acid-meter label="Output level" segments="12" value="-6" yellow-start="-12"></acid-meter>
```

컴포넌트는 레이블을 직접 그리지 않으므로 주변 레이아웃에 자유롭게 배치할 수 있습니다. `label`은 접근 가능한 이름입니다. 속성은 생성 후 `setAttribute`로도 바꿀 수 있습니다.

## 속성 레퍼런스

| 컴포넌트 | 속성 | 기본값 | 설명 |
| --- | --- | --- | --- |
| knob, fader | `min`, `max`, `value`, `step` | `0`, `100`, `0`, `1` | 값 범위, 초기값, 사용자 조작 단위 |
| knob | `size` | `md` | `sm`, `md`, `lg` |
| knob | `variant` | `dark` | `dark`, `silver` |
| knob | `drag-mode` | `vertical` | `vertical` 또는 `circular` (원형 드래그는 시작 위치에서 상대적으로 회전) |
| knob | `min-angle`, `max-angle` | `-135`, `135` | 회전 및 눈금 범위 (도, 각각 -180–180) |
| knob | `ticks` | `13` | 회전 범위 안에 표시하는 눈금 수 (2–41) |
| knob | `sensitivity` | `140` | 수직 드래그 전체 범위에 필요한 픽셀 수. Shift를 누르면 6배로 세밀하게 조정 |
| knob | `wheel` | 활성화 | `false`로 설정하면 휠 비활성화 |
| knob | `default-value` | `min` | 더블 클릭 또는 Alt+클릭으로 리셋할 값 |
| knob | `unit`, `show-value` | 빈 문자열, `never` | 표시 단위 및 `always`, `hover`, `never` |
| knob | `disabled` | 없음 | 불리언 속성; 사용자 조작 및 키보드 포커스 차단 |
| fader | `size` | `md` | `sm`, `md`, `lg` 높이 |
| switch | `size` | `md` | `sm`, `md`, `lg` |
| switch | `variant` | `horizontal` | `horizontal`, `vertical` |
| button | `color` | `orange` | `orange`, `red`, `yellow`, `ivory` |
| button | `caption` | 빈 문자열 | 버튼 면의 텍스트 |
| switch, button | `value` | `0` | `0` 또는 `1` |
| meter | `value` | `min` | dB VU 값, `min`–`max` 범위로 제한 |
| meter | `min`, `max` | `-60`, `6` | 표시 범위 (각각 0 미만, 0 초과) |
| meter | `yellow-start` | `-12` | 노란 구간의 시작 dB VU (min 초과, 0 미만) |
| meter | `segments` | `12` | 전체 LED 개수 (6–32) |
| 전체 | `label` | 컴포넌트 이름 | 접근 가능한 이름 |

모든 요소는 숫자 `value` 프로퍼티를 제공합니다. 프로퍼티 설정은 화면을 갱신하지만 이벤트를 발생시키지 않습니다. 사용자 조작에는 버블링되고 shadow 경계를 통과하는 `input`과 `change` CustomEvent가 발생하며 `detail.value`와 `detail.normalized`를 제공합니다. 노브와 페이더는 수직 드래그 또는 방향키/Home/End, 스위치와 버튼은 클릭 또는 스페이스/엔터로 조작합니다.

```js
const knob = document.querySelector('acid-knob');
knob.addEventListener('input', event => console.log(event.detail.value));
knob.value = 75;
knob.setAttribute('size', 'lg');
```

## 미터 동작과 오디오 연결

이 미터는 **VU 스타일 평균 레벨**을 표시합니다. 입력 값의 단위는 dB VU이며, `yellow-start`부터 0까지는 노란색, 0을 초과하면 빨간색, 그 이하는 녹색입니다. `yellow-start`와 `min`/`max`로 구간과 범위를 조정할 수 있습니다.

- 데모는 1 kHz 정현파의 −18 dBFS 피크를 0 VU로 환산합니다. 평활된 전파 정류 평균은 약 300 ms 동안 최종값의 99%에 도달하며, 정현파 기준으로 보정됩니다. 표준 인증 VU 미터는 아닙니다.
- **0 VU 초과는 디지털 클리핑의 증거가 아닙니다.** VU는 평균 레벨이므로 짧은 피크나 실제 디지털 클립을 놓칠 수 있습니다. 클리핑 보호가 필요하면 별도의 피크/true-peak 미터를 사용하세요.
- `acid-meter`는 오디오를 분석하지 않습니다. 애플리케이션에서 dB VU 값을 `meter.value`에 전달합니다. 데모 구현은 `src/meter-worklet.js`와 `src/main.js`를 참조하세요. AudioWorklet은 보안 컨텍스트가 필요합니다.

참고: [VU 평균 동작과 피크 검출의 차이](https://www.peak-studios.de/en/peak-meter/), [피크 및 RMS 측정](https://www.bluecataudio.com/Doc/Product_DPeakMeterPro/).

## moogUI와의 관계

[moogUI 컴포넌트 스킬과 API 레퍼런스](https://github.com/acidsound/moogUI/blob/main/skills/moog-ui-components/SKILL.md)를 참고하되 acidUI는 별도의 디자인과 API를 가진 UI 키트입니다. 현재 위 표에 명시된 속성만 지원하며, moogUI의 `endless`, `wrap`, `detents`, `scale-labels`, `show-arc` 등은 아직 구현하지 않았습니다.

## GitHub Pages 배포

`main`에 변경 사항이 머지되면 GitHub Actions가 테스트 및 빌드 후 Pages에 배포합니다. 수동 실행도 가능합니다. 저장소의 Pages 소스는 **GitHub Actions**로 설정해야 합니다. 배포 URL은 <https://acidsound.github.io/acidUI/>입니다.
