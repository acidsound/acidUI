# acidUI 적용 가이드

## 1. 파일 가져오기

acidUI는 프레임워크에 의존하지 않는 브라우저 Custom Elements입니다. 현재 npm 패키지로 배포하지 않으므로 저장소의 `src/components.js`와 `src/components.css`를 프로젝트에 복사하거나 저장소 자체를 사용하세요. 실제 URL은 배포할 디렉터리 구조에 맞춰 바꿉니다. 파일을 HTML 문서가 접근할 수 있는 웹 서버에서 제공해야 합니다.

```text
my-site/
  index.html
  vendor/acidui/
    components.js
    components.css
```

```html
<link rel="stylesheet" href="./vendor/acidui/components.css">
<script type="module" src="./vendor/acidui/components.js"></script>
```

Vite 등의 번들러에서는 파일을 프로젝트의 소스 폴더에 복사한 후 `import './vendor/acidui/components.js'`와 `import './vendor/acidui/components.css'`로 가져올 수 있습니다. 서버 사이드 렌더링 환경에서는 `HTMLElement`와 `customElements`가 있는 브라우저에서만 모듈을 import하세요. 컴포넌트 CSS는 전역 스타일시트로 로드해야 합니다.

## 2. 컨트롤 배치 및 이벤트 연결

```html
<label>Filter cutoff
  <acid-knob id="cutoff" label="Filter cutoff" min="0" max="100"
    step="1" value="50" drag-mode="circular" show-value="always"></acid-knob>
</label>
<acid-switch id="bypass" label="Bypass" value="0"></acid-switch>
<acid-button id="step" label="Step 1" caption="1" color="yellow" value="0"></acid-button>
<acid-fader id="volume" label="Volume" min="0" max="100" value="70"></acid-fader>
<acid-meter id="level" label="Output level" segments="12"></acid-meter>

<script type="module">
  // 브라우저가 모듈을 로드한 후 값을 바인딩합니다.
  await customElements.whenDefined('acid-knob');
  const cutoff = document.querySelector('#cutoff');
  cutoff.addEventListener('input', event => {
    console.log('value:', event.detail.value, 'normalized:', event.detail.normalized);
  });
  document.querySelector('#bypass').addEventListener('change', event => {
    console.log('bypass:', event.detail.value === 1);
  });
  cutoff.value = 75;                 // 프로그래밍 방식의 설정은 이벤트를 발생시키지 않음
  cutoff.setAttribute('size', 'lg'); // 속성 변경은 즉시 반영
</script>
```

`input`은 조작 중, `change`는 조작 완료 시 발생합니다. 두 이벤트는 버블링되는 `CustomEvent`이며 `detail`에 `value`와 `normalized`가 있습니다. 노브/페이더는 방향키와 Home/End, 스위치/버튼은 Space/Enter로 조작할 수 있습니다. `label`은 접근 가능한 이름이며 화면에 표시되는 제목이 아니므로 필요한 시각적 레이블은 별도로 작성하세요. 모든 속성은 [README의 속성 표](../README.md#속성-레퍼런스)를 참조하세요.

## 3. 오디오 출력 레벨 연결

`acid-meter`는 UI만 제공하며 직접 오디오를 분석하지 않습니다. 평균 레벨과 클립 여부는 호출하는 코드에서 제공해야 합니다. 이 저장소의 `src/meter-worklet.js`는 오디오가 끊기지 않도록 입력을 출력에 전달하면서 VU 스타일의 평활 레벨과 샘플 피크를 분석합니다. 이 파일을 `vendor/acidui/meter-worklet.js`에도 복사하고 다음 코드를 사용하세요.

```html
<button id="start-audio">Start audio</button>
<acid-meter id="meter" label="Output level" segments="12"></acid-meter>
<script type="module">
  const meter = document.querySelector('#meter');
  document.querySelector('#start-audio').addEventListener('click', async event => {
    event.currentTarget.disabled = true;
    try {
      const context = new AudioContext();
      // HTML 페이지를 기준으로 한 URL. 복사 위치에 맞게 변경합니다.
      await context.audioWorklet.addModule('./vendor/acidui/meter-worklet.js');
      const meterNode = new AudioWorkletNode(context, 'acid-meter-processor');
      const source = context.createOscillator(); // 기존 프로젝트의 출력 노드로 교체 가능
      const gain = context.createGain();
      gain.gain.value = 0.05;
      source.connect(gain).connect(meterNode).connect(context.destination);
      let clipUntil = 0;
      meterNode.port.onmessage = ({ data }) => {
        const db = data.level > 0 ? 20 * Math.log10(data.level) : -Infinity;
        meter.value = Math.max(0, Math.min(1, (db + 60) / 60));
        if (data.peak >= 1) clipUntil = performance.now() + 1000;
        meter.clip = performance.now() < clipUntil;
      };
      await context.resume();
      source.start();
      source.stop(context.currentTime + 2);
      // 앱의 실제 수명주기에 맞게 노드와 AudioContext를 정리하세요.
    } catch (error) {
      event.currentTarget.disabled = false;
      console.error('Audio initialization failed:', error);
    }
  });
</script>
```

AudioWorklet은 보안 컨텍스트(HTTPS 또는 localhost)와 브라우저 지원이 필요합니다. 실제 서비스에서는 사용자 제스처로 오디오를 시작하고, 사용이 끝나면 노드를 분리하고 `context.close()`를 호출하세요. 미터의 평균 표시와 클립 경고는 별개이며 true peak나 표준 인증 VU 미터가 아닙니다. [미터 설명](../README.md#미터-동작과-오디오-연결)을 참고하세요.

## 4. 실행 가능한 시작 예제

저장소 루트에서 `npm install && npm run dev`를 실행하고 `/skills/acid-ui-components/templates/control-panel.html`을 열면 실행 가능한 기본 예제를 볼 수 있습니다. 다른 프로젝트로 복사할 때 HTML의 `../../../src/` 경로를 해당 프로젝트의 파일 위치로 바꾸세요.
