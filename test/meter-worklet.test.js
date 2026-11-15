import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
let Processor;
const messages=[];
class AudioWorkletProcessor { constructor(){this.port={postMessage:message=>messages.push(message)}} }
vm.runInNewContext(readFileSync(new URL('../src/meter-worklet.js',import.meta.url),'utf8'),{AudioWorkletProcessor,sampleRate:48000,registerProcessor:(_name,klass)=>{Processor=klass},Math});
test('worklet averages a calibrated sine while passing audio through',()=>{
 const p=new Processor();let frame=0;for(let block=0;block<120;block++){const input=Float32Array.from({length:128},()=>Math.sin(2*Math.PI*1000*frame++/48000)*.1);const output=new Float32Array(128);p.process([[input]],[[output]]);assert.deepEqual(output,input)}
 const last=messages.at(-1);assert.ok(last.level>.097&&last.level<.102,`level ${last.level}`);assert.ok(Math.abs(last.peak-.1)<.00001);
});
test('single-sample clip is retained until the next message',()=>{
 messages.length=0;const p=new Processor();for(let block=0;block<14;block++){const input=new Float32Array(128);if(block===0)input[0]=1.1;p.process([[input]],[[new Float32Array(128)]])}assert.ok(messages[0].peak>1);
});
