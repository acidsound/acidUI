// Framework-independent Custom Elements. Import components.css alongside this module.
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
const num=(value,fallback)=>Number.isFinite(Number(value))&&value!==null&&String(value).trim()!==''?Number(value):fallback;
class AcidControl extends HTMLElement {
 static get observedAttributes(){return ['value','min','max','step','label','size','color','variant','caption','segments','drag-mode','min-angle','max-angle','ticks','sensitivity','wheel','disabled','default-value','unit','show-value','clip']}
 get min(){return num(this.getAttribute('min'),0)}
 get max(){return Math.max(this.min,num(this.getAttribute('max'),100))}
 get value(){return this._value??clamp(num(this.getAttribute('value'),0),this.min,this.max)}
 set value(v){this._value=clamp(num(v,0),this.min,this.max);if(this.isConnected)this.render()}
 attributeChangedCallback(name,oldValue,newValue){if(oldValue===newValue)return;if(name==='value')this._value=clamp(num(newValue,0),this.min,this.max);else if(name==='min'||name==='max')this._value=clamp(this.value,this.min,this.max);if(this.isConnected)this.render()}
 connectedCallback(){this._value=clamp(this.value,this.min,this.max);this.render()}
 emit(type='input'){this.dispatchEvent(new CustomEvent(type,{bubbles:true,composed:true,detail:{value:this.value,normalized:(this.value-this.min)/(this.max-this.min||1)}}))}
 change(v,final=false){const step=Math.abs(num(this.getAttribute('step'),1))||1;this.value=this.min+Math.round((v-this.min)/step)*step;this.emit();if(final)this.emit('change')}
 keyboard(e){if(this.hasAttribute('disabled'))return;let step=Math.abs(num(this.getAttribute('step'),1))||1,v=this.value;if(['ArrowUp','ArrowRight'].includes(e.key))v+=step;else if(['ArrowDown','ArrowLeft'].includes(e.key))v-=step;else if(e.key==='Home')v=this.min;else if(e.key==='End')v=this.max;else return;e.preventDefault();this.change(v,true)}
 slider(label){this.setAttribute('role','slider');this.tabIndex=0;this.setAttribute('aria-label',this.getAttribute('label')||label);this.setAttribute('aria-valuemin',this.min);this.setAttribute('aria-valuemax',this.max);this.setAttribute('aria-valuenow',this.value)}
}
class AcidKnob extends AcidControl {
 get minAngle(){return clamp(num(this.getAttribute('min-angle'),-135),-180,180)}
 get maxAngle(){return Math.max(this.minAngle,clamp(num(this.getAttribute('max-angle'),135),-180,180))}
 get normalized(){return (this.value-this.min)/(this.max-this.min||1)}
 get formattedValue(){return `${Number(this.value.toFixed(6))}${this.getAttribute('unit')||''}`}
 reset(){this.change(num(this.getAttribute('default-value'),this.min),true)}
 constructor(){super();
  this.addEventListener('keydown',e=>this.keyboard(e));
  this.addEventListener('dblclick',()=>{if(!this.hasAttribute('disabled'))this.reset()});
  this.addEventListener('wheel',e=>{if(this.hasAttribute('disabled')||this.getAttribute('wheel')==='false')return;e.preventDefault();this.change(this.value+(e.deltaY<0?1:-1)*(Math.abs(num(this.getAttribute('step'),1))||1),true)},{passive:false});
  this.addEventListener('pointerdown',e=>{
   if(this.hasAttribute('disabled'))return;
   e.preventDefault();this.focus();if(e.altKey){this.reset();return}this.setPointerCapture(e.pointerId);
   const y=e.clientY,start=this.value, circular=this.getAttribute('drag-mode')==='circular';
   const angleAt=ev=>{const r=this.getBoundingClientRect();return Math.atan2(ev.clientX-(r.left+r.width/2),-(ev.clientY-(r.top+r.height/2)))*180/Math.PI};
   // Relative angular movement avoids a jump when a drag starts away from the indicator.
   let previous=angleAt(e), angle=this.minAngle+this.normalized*(this.maxAngle-this.minAngle);
   const move=ev=>{if(circular){const next=angleAt(ev);let delta=next-previous;if(delta>180)delta-=360;if(delta< -180)delta+=360;previous=next;angle=clamp(angle+delta,this.minAngle,this.maxAngle);this.change(this.min+(angle-this.minAngle)/(this.maxAngle-this.minAngle||1)*(this.max-this.min))}else{const sensitivity=Math.max(1,num(this.getAttribute('sensitivity'),140))*(ev.shiftKey?6:1);this.change(start+(y-ev.clientY)*(this.max-this.min)/sensitivity)}};
   const end=()=>{this.removeEventListener('pointermove',move);this.removeEventListener('pointerup',end);this.removeEventListener('pointercancel',end);this.emit('change')};this.addEventListener('pointermove',move);this.addEventListener('pointerup',end);this.addEventListener('pointercancel',end)
  })
 }
 render(){const angle=this.minAngle+this.normalized*(this.maxAngle-this.minAngle),ticks=clamp(Math.round(num(this.getAttribute('ticks'),13)),2,41);const marks=Array.from({length:ticks},(_,i)=>`<i style="--tick-angle:${this.minAngle+i*(this.maxAngle-this.minAngle)/(ticks-1)}deg"></i>`).join('');this.innerHTML=`<div class="knob-wrap" style="--angle:${angle}deg"><div class="knob-ticks">${marks}</div><div class="knob"><i></i></div></div><span class="knob-value"></span>`;this.querySelector('.knob-value').textContent=this.formattedValue;this.slider('Knob');this.setAttribute('aria-valuetext',this.formattedValue);this.setAttribute('aria-disabled',String(this.hasAttribute('disabled')));this.tabIndex=this.hasAttribute('disabled')?-1:0}
}
class AcidFader extends AcidControl {
 constructor(){super();this.addEventListener('keydown',e=>this.keyboard(e));this.addEventListener('pointerdown',e=>{e.preventDefault();this.focus();this.setPointerCapture(e.pointerId);const move=ev=>{const r=this.getBoundingClientRect();this.change(this.max-clamp((ev.clientY-r.top-10)/(r.height-20),0,1)*(this.max-this.min))};move(e);const end=()=>{this.removeEventListener('pointermove',move);this.removeEventListener('pointerup',end);this.removeEventListener('pointercancel',end);this.emit('change')};this.addEventListener('pointermove',move);this.addEventListener('pointerup',end);this.addEventListener('pointercancel',end)})}
 render(){let p=(this.value-this.min)/(this.max-this.min||1);this.innerHTML=`<div class="fader-track"><div class="fader-cap" style="top:${(1-p)*100}%"></div></div>`;this.slider('Fader')}
}
class AcidSwitch extends AcidControl {
 constructor(){super();this.addEventListener('click',()=>this.change(this.value?0:1,true));this.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();this.click()}})}
 get max(){return 1} get min(){return 0}
 render(){this.innerHTML='<span class="switch-slot"><span class="switch-handle"></span></span>';this.classList.toggle('on',!!this.value);this.setAttribute('role','switch');this.tabIndex=0;this.setAttribute('aria-label',this.getAttribute('label')||'Switch');this.setAttribute('aria-checked',!!this.value)}
}
class AcidButton extends AcidControl {
 constructor(){super();this.addEventListener('click',()=>this.change(this.value?0:1,true));this.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();this.click()}})}
 get max(){return 1} get min(){return 0}
 render(){this.classList.toggle('active',!!this.value);this.setAttribute('role','button');this.tabIndex=0;this.setAttribute('aria-label',this.getAttribute('label')||'Button');this.setAttribute('aria-pressed',!!this.value);this.innerHTML='<span class="button-light"></span><span class="button-face"></span>';this.querySelector('.button-face').textContent=this.getAttribute('caption')||''}
}
class AcidMeter extends AcidControl {
 get min(){return 0} get max(){return 1}
 get clip(){return this.hasAttribute('clip')}
 set clip(on){this.toggleAttribute('clip',Boolean(on))}
 render(){
  const count=clamp(Math.round(num(this.getAttribute('segments'),12)),6,32);
  const redCount=Math.max(2,Math.round(count/6)), bars=count-redCount, lit=Math.ceil(this.value*bars);
  const segments=Array.from({length:bars},(_,i)=>{
   // The normalized bar represents -60..0 dBFS; yellow begins at -12 dBFS.
   const zone=(i+1)/bars > 0.8?'yellow':'green';
   return `<i class="${zone} ${i<lit?'lit':''}"></i>`
  }).join('');
  this.innerHTML=segments+Array.from({length:redCount},()=>`<i class="red ${this.clip?'lit':''}"></i>`).join('');
  this.setAttribute('role','meter');this.setAttribute('aria-label',this.getAttribute('label')||'Level');this.setAttribute('aria-valuemin','0');this.setAttribute('aria-valuemax','1');this.setAttribute('aria-valuenow',this.value.toFixed(2));
  this.setAttribute('aria-valuetext',`${this.value===0?'Below -60':Math.round(this.value*60-60)} dBFS, ${this.clip?'sample clip detected':'no clip detected'}`)
 }
}
for(const [name,klass] of Object.entries({'acid-knob':AcidKnob,'acid-fader':AcidFader,'acid-switch':AcidSwitch,'acid-button':AcidButton,'acid-meter':AcidMeter}))if(!customElements.get(name))customElements.define(name,klass);
