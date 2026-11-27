export function bindMobileControls(stick, dashButton, jumpButton, onJump) {
  const input = {x:0,z:0,dash:false,clear};
  let stickTouch, stickPointer, dashTouch;

  function position(clientX,clientY) {
    const rect=stick.getBoundingClientRect();
    const limit=rect.width*.35;
    if(!limit)return;
    const x=(clientX-rect.left-rect.width*.5)/limit;
    const z=(clientY-rect.top-rect.height*.5)/limit;
    const length=Math.max(1,Math.hypot(x,z));
    input.x=x/length;
    input.z=z/length;
    stick.firstElementChild.style.transform=`translate(${input.x*limit}px, ${input.z*limit}px)`;
  }

  function endStick() {
    const pointer=stickPointer;
    stickPointer=stickTouch=undefined;
    input.x=input.z=0;
    stick.firstElementChild.style.transform='';
    if(pointer!==undefined&&stick.hasPointerCapture(pointer))stick.releasePointerCapture(pointer);
  }

  function clear() {
    endStick();
    dashTouch=undefined;
  }

  function toggleDash(){
    input.dash=!input.dash;
    dashButton.setAttribute('aria-pressed',String(input.dash));
    dashButton.querySelector('span').textContent=input.dash?'歩く':'走る';
  }
  dashButton.addEventListener('click',toggleDash);

  const touchOptions={passive:false};
  stick.addEventListener('touchstart',event=>{
    if(stickTouch!==undefined||stickPointer!==undefined)return;
    event.preventDefault();
    const touch=event.changedTouches[0];
    stickTouch=touch.identifier;
    position(touch.clientX,touch.clientY);
  },touchOptions);
  dashButton.addEventListener('touchstart',event=>{
    event.preventDefault();
    if(dashTouch===undefined)dashTouch=event.changedTouches[0].identifier;
  },touchOptions);
  function endDashTouch(event){
    const touch=Array.from(event.changedTouches).find(entry=>entry.identifier===dashTouch);
    if(!touch)return;
    dashTouch=undefined;
    if(event.type==='touchend'&&dashButton.contains(document.elementFromPoint(touch.clientX,touch.clientY)))toggleDash();
  }
  dashButton.addEventListener('touchend',endDashTouch);
  dashButton.addEventListener('touchcancel',endDashTouch);

  jumpButton.addEventListener('touchstart',event=>{
    event.preventDefault();
    onJump();
  },touchOptions);

  function syncTouches(event) {
    const touches=Array.from(event.touches);
    if(stickTouch!==undefined){
      const touch=touches.find(entry=>entry.identifier===stickTouch);
      if(!touch)endStick();
      else if(event.type==='touchmove')position(touch.clientX,touch.clientY);
    }
  }

  for(const type of ['touchstart','touchmove','touchend','touchcancel']){
    window.addEventListener(type,syncTouches,{capture:true,passive:true});
  }

  stick.addEventListener('pointerdown',event=>{
    if(event.pointerType==='touch'||event.button!==0||stickTouch!==undefined||stickPointer!==undefined)return;
    event.preventDefault();
    stickPointer=event.pointerId;
    stick.setPointerCapture(event.pointerId);
    position(event.clientX,event.clientY);
  });
  jumpButton.addEventListener('pointerdown',event=>{
    if(event.pointerType==='touch'||event.button!==0)return;
    event.preventDefault();
    onJump();
  });
  jumpButton.addEventListener('click',event=>{
    if(event.detail===0)onJump();
  });
  window.addEventListener('pointermove',event=>{
    if(event.pointerId!==stickPointer)return;
    if(event.buttons===0)endStick();
    else position(event.clientX,event.clientY);
  });
  function endPointer(event) {
    if(event.pointerId===stickPointer)endStick();
  }
  for(const type of ['pointerup','pointercancel','lostpointercapture']){
    window.addEventListener(type,endPointer,true);
  }
  return input;
}
