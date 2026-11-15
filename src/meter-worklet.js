// VU-style full-wave average (not a standards-certified VU meter), plus sample peak.
class AcidMeterProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.level = 0;
    this.peak = 0;
    this.frames = 0;
    // A first-order envelope reaches ~99% after 300 ms.
    this.coefficient = Math.exp(-1 / (sampleRate * (0.3 / Math.log(100))));
  }
  process(inputs, outputs) {
    const input = inputs[0] || [], output = outputs[0] || [];
    const frames = output[0]?.length || 128;
    for (let channel = 0; channel < output.length; channel++) {
      if (input[channel]) output[channel].set(input[channel]);
      else output[channel].fill(0);
    }
    for (let i = 0; i < frames; i++) {
      let magnitude = 0;
      for (const channel of input) {
        const sample = Math.abs(channel[i] || 0);
        magnitude += sample;
        this.peak = Math.max(this.peak, sample);
      }
      magnitude /= input.length || 1;
      this.level = this.coefficient * this.level + (1 - this.coefficient) * magnitude;
    }
    this.frames += frames;
    if (this.frames >= sampleRate / 30) {
      // A full-scale sine has mean rectified amplitude 2/pi.
      this.port.postMessage({ level: this.level * Math.PI / 2, peak: this.peak });
      this.peak = 0;
      this.frames = 0;
    }
    return true;
  }
}
registerProcessor('acid-meter-processor', AcidMeterProcessor);
