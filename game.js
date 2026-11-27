import * as T from './vendor/three.module.min.js';
import {buildPlayer, disposePlayer, mesh, poseSeated} from './model.js?v=9';
import {createCharacterEditor} from './character-editor.js?v=9';
import {loadAppearance} from './wardrobe.js?v=9';
import {town, ground, frozenGround, target, flower as addFlower} from './town.js?v=12';
import {buildInterior} from './interiors.js?v=12';
import {townBounds, offBridgeChannel, entrances, flowerPatch, overlook, benches, placeName, canStand, hitsCollider, supportHeight} from './places.js?v=12';

import {createDayCycle} from './day-cycle.js?v=9';
import {createWeather} from './weather.js?v=12';
import {bindMobileControls} from './mobile-controls.js?v=10';

const $=id=>document.getElementById(id);
const canvas=$('world'), loading=$('loading'), dialog=$('dialog');
const clamp=T.MathUtils.clamp;
const keys=new Set();
let touchControls;
let orbitPointer=null, jumpBuffer=0, completed=false;
let yaw=0, pitch=.29, zoom=0;
let activePop='';
function dropInput() {
  keys.clear();
  jumpBuffer=0;
  orbitPointer=null;
  touchControls?.clear();
}
function show(which) {
  activePop=which;
  for(const id of ['instructions','wardrobe','delivery','discovery','clock','weather']) $(id).hidden=id!==which;
  dialog.classList.toggle('wardrobe-dialog',which==='wardrobe');
  dialog.setAttribute('aria-labelledby',which+'-title');
  dropInput();
  if(!dialog.open)dialog.showModal();
}
$('help').onclick=()=>show('instructions');
$('close').onclick=$('continue').onclick=$('discovery-continue').onclick=()=>dialog.close();
dialog.addEventListener('close',()=>{activePop=''; dropInput();});
function flip() {yaw+=Math.PI;}
$('view').onclick=flip;

function main() {
  const coarse=matchMedia('(pointer: coarse)').matches;
  const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,coarse?1.35:1.6));
  renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.NoToneMapping;
  const scene=new T.Scene();
  scene.background=new T.Color('#b2d7dc');
  scene.fog=new T.FogExp2('#e4e7d1',.014);
  const camera=new T.PerspectiveCamera(53,1,.08,178);
  const sunlight=new T.DirectionalLight('#fff0ca',1.75);
  sunlight.position.set(-18,25,10);
  const ambient=new T.HemisphereLight('#f0f9ff','#ac8180',1.61);
  scene.add(ambient,sunlight);
  const exteriorRoot=new T.Group();
  scene.add(exteriorRoot);
  const colliders=town(exteriorRoot);
  const {river}=exteriorRoot.userData.weatherScenery;
  const exterior={
    root:exteriorRoot, colliders, bounds:townBounds, river:true,
    get riverFrozen(){return river.frozen;},
    height:(x,z)=>river.frozen?frozenGround(x,z):ground(x,z),
  };
  const clock=createDayCycle({...exteriorRoot.userData,sun:sunlight,ambient,fog:scene.fog,background:scene.background});
  $('clock-button').onclick=()=>{
    clock.open();
    show('clock');
  };
  const interiors=new Map();
  let area=exterior;
  let roomId, seated;
  let flowerQuest='locked';
  const player=new T.Group();
  scene.add(player);
  let appearance=loadAppearance();
  let playerModel=buildPlayer(player,appearance);
  const world=new T.Vector3(.40,0,11.35);
  world.y=ground(world.x,world.z);
  const velocity=new T.Vector3();
  let walkPhase=0, moveBlend=0, lift=0, rise=0, heading=Math.PI-.17;
  player.position.copy(world);
  const portrait=$('portrait');
  playerModel.root.rotation.y=heading;
  portrait.dataset.character=appearance.character;
  let noticeTimer;
  const edit=createCharacterEditor(next=>{
    if(Object.keys(next).some(field=>appearance[field]!==next[field])){
      disposePlayer(playerModel);
      playerModel=buildPlayer(player,next);
      playerModel.root.rotation.y=heading;
      portrait.dataset.character=next.character;
      if(completed)playerModel.cakes.visible=false;
      if(seated)poseSeated(playerModel,true);
      appearance=next;
    }
    dialog.close();
    const notice=$('wardrobe-notice');
    notice.textContent=next.character==='original'?'オリジナルキャラを保存しました':'プレイヤーを切り替えました';
    clearTimeout(noticeTimer);
    noticeTimer=setTimeout(()=>{notice.textContent='';},2500);
  });
  portrait.onclick=()=>{
    show('wardrobe');
    edit(appearance);
  };
  portrait.disabled=false;

  const shadowCanvas=document.createElement('canvas');
  shadowCanvas.width=shadowCanvas.height=64;
  const shadowContext=shadowCanvas.getContext('2d');
  const gradient=shadowContext.createRadialGradient(32,32,2,32,32,31);
  gradient.addColorStop(0,'rgba(60,40,50,.65)');gradient.addColorStop(.4,'rgba(60,40,50,.38)');gradient.addColorStop(1,'rgba(60,40,50,0)');
  shadowContext.fillStyle=gradient;shadowContext.fillRect(0,0,64,64);
  const shadow=new T.Mesh(new T.PlaneGeometry(1.45,1.05),new T.MeshBasicMaterial({map:new T.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));
  shadow.rotation.x=-Math.PI/2-.039;scene.add(shadow);
  const marker=mesh(exteriorRoot,new T.OctahedronGeometry(.22),'#ffcb70',target.x,ground(target.x,target.z)+2.37,target.z);
  marker.material=new T.MeshBasicMaterial({color:'#ffc65e'});
  const guide=[];
  for(const [x,z] of [[.4,7.7],[.1,4.0],[.1,.4],[-.3,-3.25],[-2.1,-5.4],[-3.95,-7.0],[-5.5,-8.66]]){
    const m=new T.Mesh(new T.OctahedronGeometry(.105),new T.MeshBasicMaterial({color:'#fbe1a1'}));
    m.position.set(x,ground(x,z)+.20,z);exteriorRoot.add(m);guide.push(m);
  }
  const petals=[];
  const petalGeom=new T.SphereGeometry(1,7,5);
  const petalMat=new T.MeshBasicMaterial({color:'#edabcd'});
  for(let i=0;i<28;i++){
    const petal=new T.Mesh(petalGeom,petalMat);
    petal.scale.set(.039,.012,.022);
    exteriorRoot.add(petal);petals.push(petal);
  }
  const weather=createWeather({
    root:exteriorRoot,sky:exteriorRoot.userData.sky,stars:exteriorRoot.userData.stars,
    sunlight,ambient,fog:scene.fog,background:scene.background,petals,
  });
  $('weather-button').onclick=()=>{
    weather.open();
    show('weather');
  };
  const stems=new T.Group();
  exteriorRoot.add(stems);
  for(const [x,z] of [[flowerPatch.x,flowerPatch.z],[flowerPatch.x+.16,flowerPatch.z-.11],[flowerPatch.x-.14,flowerPatch.z+.09]]){
    addFlower(stems,x,z,ground(x,z),'#ffe6ac',1.72);
  }
  const trailMarker=new T.Mesh(new T.OctahedronGeometry(.15),new T.MeshBasicMaterial({color:'#ffdf9f'}));
  exteriorRoot.add(trailMarker);
  trailMarker.visible=false;
  const doorMarkers=Object.values(entrances).map(door=>{
    const pin=new T.Mesh(new T.OctahedronGeometry(.125),new T.MeshBasicMaterial({color:'#feefc8'}));
    pin.position.set(door.x,ground(door.x,door.z)+1.75,door.z);
    exteriorRoot.add(pin);
    return pin;
  });
  const indoorLight=new T.PointLight('#fff0d4',10,9,1.75);
  indoorLight.position.set(0,2.9,0);
  indoorLight.visible=false;
  scene.add(indoorLight);
  const gaze=new T.Vector3().copy(world).add(new T.Vector3(0,1.26,0));
  const desiredGaze=gaze.clone();
  const desiredCam=new T.Vector3();
  const follow=new T.Vector3();
  const fromGaze=new T.Vector3();
  const facing=new T.Vector3();
  const offset=new T.Vector3();

  function resize(){
    const w=canvas.clientWidth,h=Math.max(1,canvas.clientHeight);
    renderer.setSize(w,h,false);
    camera.aspect=w/h;
    camera.fov=camera.aspect<.80?60:53;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize',resize);resize();
  window.addEventListener('blur',dropInput);
  window.addEventListener('pagehide',dropInput);
  document.addEventListener('freeze',dropInput);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)dropInput();});
  const allowed=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight','Space','KeyE','KeyV'];
  addEventListener('keydown',e=>{
    if(activePop||!allowed.includes(e.code)||e.altKey||e.ctrlKey||e.metaKey)return;
    if(e.code==='Space' && e.target instanceof HTMLButtonElement && e.target.matches(':focus-visible'))return;
    e.preventDefault();
    keys.add(e.code);
    if(!e.repeat&&e.code==='Space')queueJump();
    if(!e.repeat&&e.code==='KeyE')interact();
    if(!e.repeat&&e.code==='KeyV')flip();
  });
  addEventListener('keyup',e=>keys.delete(e.code));

  function queueJump(){
    if(!activePop)jumpBuffer=.14;
  }
  touchControls=bindMobileControls($('stick'),$('dash'),$('jump'),queueJump);
  canvas.addEventListener('pointerdown',e=>{
    if(orbitPointer||e.button!==0)return;
    if(e.pointerType==='touch'&&e.clientX<canvas.clientWidth*.30) return;
    orbitPointer={id:e.pointerId,x:e.clientX,y:e.clientY};
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove',e=>{
    if(orbitPointer?.id!==e.pointerId)return;
    yaw-=(e.clientX-orbitPointer.x)*.0092;
    pitch=clamp(pitch+(e.clientY-orbitPointer.y)*.0054,-.18,1.05);
    orbitPointer.x=e.clientX;orbitPointer.y=e.clientY;
  });
  const stopOrbit=e=>{if(orbitPointer?.id===e.pointerId)orbitPointer=null;};
  canvas.addEventListener('pointerup',stopOrbit);
  canvas.addEventListener('pointercancel',stopOrbit);
  canvas.addEventListener('lostpointercapture',stopOrbit);
  canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=clamp(zoom+Math.sign(e.deltaY)*.42,-1.65,3.3);},{passive:false});

  function alignCamera(dt, snap=false){
    const shoulder=coarse?.27:.47;
    const wide=camera.aspect>=1.1;
    desiredGaze.set(world.x+Math.cos(yaw)*shoulder,player.position.y+1.25-lift*.23,world.z-Math.sin(yaw)*shoulder);
    gaze.lerp(desiredGaze,snap?1:1-Math.exp(-dt*10));
    const length=roomId?clamp(3.05+zoom,1.60,3.75):(wide?4.55:4.82)+zoom;
    offset.set(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch));
    desiredCam.copy(gaze).addScaledVector(offset,length);
    // Keep the third-person camera on the same side of walls as the player.
    for(let step=2;step<=13;step++){
      const dist=length*step/13;
      fromGaze.copy(gaze).addScaledVector(offset,dist);
      const {x,y,z}=fromGaze;
      const [west,east,north,south]=area.bounds;
      const outsideRoom=roomId&&(x<west+.17||x>east-.17||z<north+.17||z>south-.17||y>area.ceiling);
      const behindBuilding=!roomId&&y<area.height(x,z)+4&&
        area.colliders.some(c=>c.a>1.5&&hitsCollider(x,z,c,.16));
      if(outsideRoom||behindBuilding){
        desiredCam.copy(gaze).addScaledVector(offset,Math.max(.26,dist-.36));
        break;
      }
    }
    if(roomId){
      const [west,east,north,south]=area.bounds;
      desiredCam.x=clamp(desiredCam.x,west+.12,east-.12);
      desiredCam.z=clamp(desiredCam.z,north+.12,south-.12);
      desiredCam.y=clamp(desiredCam.y,.41,area.ceiling);
    }else desiredCam.y=Math.max(desiredCam.y,area.height(desiredCam.x,desiredCam.z)+.41);
    const cameraBlocked=camera.position.distanceTo(gaze)>desiredCam.distanceTo(gaze)+.65;
    follow.lerp(desiredCam,snap||cameraBlocked?1:1-Math.exp(-dt*18));
    camera.position.copy(follow);
    camera.lookAt(gaze);
  }
  function teleport(x,z,direction){
    dropInput();
    velocity.set(0,0,0);
    lift=rise=moveBlend=0;
    yaw=direction===Math.PI?0:direction+Math.PI;
    pitch=.29;
    zoom=0;
    heading=direction;
    world.set(x,area.height(x,z),z);
    player.position.copy(world);
    playerModel.root.rotation.y=heading;
    alignCamera(0,true);
    updateInteraction();
  }

  function enter(id,floor=1,fromStairs=false){
    const key=id+':'+floor;
    if(!interiors.has(key)){
      const root=new T.Group();
      scene.add(root);
      interiors.set(key,buildInterior(id,root,floor));
    }
    area.root.visible=false;
    roomId=id;
    area=interiors.get(key);
    area.root.visible=true;
    indoorLight.visible=true;
    if(fromStairs)teleport(area.landing.x,area.landing.z+.24,0);
    else {
      const {x,z,heading:direction}=entrances[id].inside;
      teleport(x,z,direction);
    }
  }

  function leave(){
    area.root.visible=false;
    const {x,z,heading:direction}=entrances[roomId];
    roomId=undefined;
    exteriorRoot.visible=true;
    indoorLight.visible=false;
    area=exterior;
    const exitX=x+Math.sin(direction)*.42, exitZ=z+Math.cos(direction)*.42;
    if(canStand(exitX,exitZ,area,.34))teleport(exitX,exitZ,direction);
    else teleport(x,z,direction);
  }

  function discover(title,detail){
    $('discovery-title').textContent=title;
    $('discovery-detail').textContent=detail;
    show('discovery');
  }

  function deliverCake(){
    completed=true;
    flowerQuest='looking';
    marker.visible=false;
    guide.forEach(g=>g.visible=false);
    playerModel.cakes.visible=false;
    trailMarker.visible=true;
    $('quest-title').textContent='野花のおつかい';
    $('quest-detail').textContent='街の門を出て、橋の先の花畑へ';
    show('delivery');
  }

  function pickFlower(){
    flowerQuest='carrying';
    stems.visible=false;
    $('quest-detail').textContent='花の広場の花屋さんへ戻ろう';
    discover('野花を摘んだ','川向こうの花畑で、淡い黄色の野花を摘みました。花の広場の花屋さんに届けましょう。');
  }

  function deliverFlower(){
    flowerQuest='done';
    trailMarker.visible=false;
    $('quest').classList.add('done');
    $('quest-title').textContent='おつかい完了';
    $('quest-detail').textContent='ケーキと野花を届けました';
    discover('花屋さんからのお礼','「きれいな野花をありがとう。お店の入り口に飾るね！」');
  }

  function viewOverlook(){
    yaw=Math.PI;
    pitch=.20;
    zoom=.5;
    alignCamera(0,true);
  }

  function sit(bench){
    seated=bench;
    dropInput();
    velocity.set(0,0,0);
    lift=rise=moveBlend=0;
    world.set(bench.x,area.height(bench.x,bench.z),bench.z+.085);
    player.position.set(world.x,world.y+bench.height-playerModel.hipHeight,world.z);
    heading=0;
    playerModel.root.rotation.y=heading;
    poseSeated(playerModel,true);
    shadow.visible=false;
  }

  function stand(){
    const bench=seated;
    seated=undefined;
    world.set(bench.x,area.height(bench.x,bench.z+.66),bench.z+.66);
    player.position.copy(world);
    poseSeated(playerModel,false);
    shadow.visible=true;
  }

  const standAction={label:'立ち上がる',run:stand};
  const benchActions=benches.map(bench=>({
    x:bench.x,z:bench.z+.58,radius:.99,label:'ベンチに座る',run:()=>sit(bench),
  }));

  const doorActions=Object.entries(entrances).map(([id,door])=>({
    ...door, radius:1.36, label:door.name+'に入る', run:()=>enter(id),
  }));
  const exitAction={x:0,z:3.93,radius:1.35,label:'外に出る',run:leave};
  const roomActions={
    bakery:[
      {x:-2.45,z:.38,radius:1.45,label:'ショーケースを見る',
        run:()=>discover('焼きたてのお菓子','ショーケースには、いちごのタルト、ブルーベリーの焼き菓子、柑橘のケーキが並んでいます。')},
      {x:2.25,z:-2.68,radius:1.05,label:'厨房を見る',
        run:()=>discover('奥の厨房','棚の下にオーブンがあり、ここから焼きたてのお菓子が店頭に運ばれます。')},
    ],
    florist:[
      {x:-2.65,z:1.04,radius:1.28,label:'花を見る',
        run:()=>discover('花屋さんの鉢植え','窓から差し込む光のそばに、ピンクとクリーム色の花が飾られています。')},
    ],
  };
  for(const [id,entry] of Object.entries(entrances)){
    if(entry.detail)roomActions[id]=[{
      x:0,z:.35,radius:1.02,label:'室内を見る',run:()=>discover(entry.name,entry.detail),
    }];
  }
  const cakeAction={...target,radius:1.85,label:'ケーキを渡す',run:deliverCake};
  const flowerAction={...flowerPatch,radius:1.45,label:'野花を摘む',run:pickFlower};
  const giveFlowerAction={...target,radius:1.85,label:'野花を渡す',run:deliverFlower};
  const overlookAction={...overlook,radius:1.72,label:'街を見渡す',run:viewOverlook};
  const actionButton=$('interact');

  function nearbyAction(){
    if(seated)return standAction;
    const candidates=roomId?[...roomActions[roomId]]:[...doorActions,...benchActions,overlookAction];
    if(area.floor===1)candidates.push(exitAction);
    if(area.landing){
      const upstairs=area.floor===1;
      candidates.push({...area.landing,radius:1.38,label:upstairs?'2階へ上がる':'1階へ下りる',
        run:()=>enter(roomId,upstairs?2:1,true)});
    }
    if(!roomId){
      if(!completed)candidates.push(cakeAction);
      if(flowerQuest==='looking')candidates.push(flowerAction);
      if(flowerQuest==='carrying')candidates.push(giveFlowerAction);
    }
    let nearest=null, distance=Infinity;
    for(const candidate of candidates){
      const d=Math.hypot(world.x-candidate.x,world.z-candidate.z);
      if(d<=candidate.radius&&d<distance){nearest=candidate;distance=d;}
    }
    return nearest;
  }
  function updateInteraction(){
    const nearby=nearbyAction();
    actionButton.hidden=!nearby;
    if(nearby&&actionButton.firstElementChild.textContent!==nearby.label){
      actionButton.firstElementChild.textContent=nearby.label;
    }
    const onIce=!roomId&&river.frozen&&offBridgeChannel(world.x,world.z);
    const place=area.name??(onIce?'凍った川':placeName(world.x,world.z));
    if($('location').textContent!==place)$('location').textContent=place;
  }
  function interact(){
    if(dialog.open)return;
    nearbyAction()?.run();
    updateInteraction();
  }
  actionButton.onclick=interact;
  function move(dt,t){
    if(seated){
      if(jumpBuffer>0)stand();
      else{
        playerModel.head.rotation.z=Math.sin(t*1.37)*.019;
        return;
      }
    }
    let x=touchControls.x,z=touchControls.z;
    if(keys.has('KeyW')||keys.has('ArrowUp'))z-=1;
    if(keys.has('KeyS')||keys.has('ArrowDown'))z+=1;
    if(keys.has('KeyA')||keys.has('ArrowLeft'))x-=1;
    if(keys.has('KeyD')||keys.has('ArrowRight'))x+=1;
    const magnitude=Math.hypot(x,z);
    const length=Math.max(1,magnitude);
    const running=touchControls.dash||keys.has('ShiftLeft')||keys.has('ShiftRight');
    const speed=roomId?(running?3.5:2.35):(running?5.4:2.65);
    const targetVelocityX=(x*Math.cos(yaw)+z*Math.sin(yaw))*speed/length;
    const targetVelocityZ=(-x*Math.sin(yaw)+z*Math.cos(yaw))*speed/length;
    const smooth=1-Math.exp(-dt*(lift>0?9:17));
    velocity.x=T.MathUtils.lerp(velocity.x,targetVelocityX,smooth);
    velocity.z=T.MathUtils.lerp(velocity.z,targetVelocityZ,smooth);
    const oldSupport=supportHeight(world.x,world.z,area,world.y);
    const grounded=rise<=0&&world.y<=oldSupport+.001;
    if(jumpBuffer>0&&grounded){
      rise=4.25;
      jumpBuffer=0;
    }else jumpBuffer=Math.max(0,jumpBuffer-dt);
    if(!grounded||rise>0)rise-=dt*10.8;
    const headroom=area.ceiling===undefined?Infinity:area.ceiling-1.78;
    const nextY=Math.min(world.y+rise*dt,headroom);
    if(nextY===headroom&&rise>0)rise=0;
    const clearance=Math.max(world.y,nextY);
    const stepUp=grounded&&rise<=0?.238:0;
    const dx=velocity.x*dt,dz=velocity.z*dt;
    if(canStand(world.x+dx,world.z,area,.26,clearance,stepUp))world.x+=dx;
    if(canStand(world.x,world.z+dz,area,.26,clearance,stepUp))world.z+=dz;
    const floor=supportHeight(world.x,world.z,area,clearance,stepUp);
    world.y=Math.max(nextY,floor);
    if(nextY<=floor)rise=0;
    lift=Math.max(0,world.y-floor);
    if(area.landing&&area.floor===1&&world.y>=.64&&Math.abs(world.x-area.landing.x)<.74){
      enter(roomId,2,true);
      return;
    }
    if(magnitude>.12){
      facing.set(targetVelocityX,0,targetVelocityZ);
      const desired=Math.atan2(facing.x,facing.z);
      const diff=Math.atan2(Math.sin(desired-heading),Math.cos(desired-heading));
      heading+=diff*(1-Math.exp(-dt*15));
    }
    player.position.copy(world);
    playerModel.root.rotation.y=heading;
    const speedNow=Math.hypot(velocity.x,velocity.z);
    walkPhase+=dt*(running?11.7:8.65);
    moveBlend=T.MathUtils.lerp(moveBlend,Math.min(1,speedNow/2.35),smooth);
    const stride=Math.sin(walkPhase)*moveBlend;
    const airborne=clamp(lift*3,0,1);
    const stepScale=playerModel.yukata?.39:1;
    playerModel.legs[0].rotation.x=(stride*(running?.64:.46)-airborne*.26)*stepScale;
    playerModel.legs[1].rotation.x=(-stride*(running?.64:.46)+airborne*.29)*stepScale;
    playerModel.legs[0].position.y=.93+Math.max(0,Math.cos(walkPhase))*.095*moveBlend;
    playerModel.legs[1].position.y=.93+Math.max(0,-Math.cos(walkPhase))*.095*moveBlend;
    playerModel.body.position.y=(.022*Math.cos(walkPhase*2)-.008)*moveBlend+Math.sin(t*2.4)*.012;
    playerModel.body.rotation.x=-(running?.09:.044)*moveBlend;
    playerModel.body.rotation.z=stride*.034;
    playerModel.arms[0].arm.rotation.x=playerModel.festival?-.14-stride*.15:-stride*(running?.52:.43)+airborne*.24;
    playerModel.arms[0].arm.rotation.z=-.10-airborne*.23;
    playerModel.arms[1].arm.rotation.z=.035;
    playerModel.tray.rotation.set(-playerModel.body.rotation.x,0,-playerModel.body.rotation.z);
    playerModel.skirt.rotation.set(-stride*.033,Math.cos(walkPhase)*.065*moveBlend,stride*.047*stepScale);
    playerModel.head.rotation.z=Math.sin(t*1.55)*.024-stride*.022;
    shadow.position.set(world.x,floor+.062,world.z);
    shadow.scale.setScalar(1+lift*.4);
    shadow.material.opacity=1-lift*.58;
    if(!roomId){
      marker.position.y=ground(target.x,target.z)+2.39+.16*Math.sin(t*3.1);
      marker.rotation.y=t*1.55;
      const waypoint=flowerQuest==='carrying'?target:flowerPatch;
      trailMarker.position.set(waypoint.x,ground(waypoint.x,waypoint.z)+1.28+.13*Math.sin(t*3.1),waypoint.z);
      trailMarker.rotation.y=t*1.55;
      doorMarkers.forEach(pin=>{pin.rotation.y=t*1.22;});
      guide.forEach((g,i)=>{
        g.position.y=ground(g.position.x,g.position.z)+.22+Math.sin(t*2.75-i*.58)*.07;
        g.rotation.y=t*1.5+i*.2;
      });
    }
    updateInteraction();
  }
  let last=performance.now();
  alignCamera(0,true);
  updateInteraction();
  weather.tick(0,camera,true);
  renderer.render(scene,camera);
  loading.hidden=true;
  function frame(now){
    const elapsed=Math.max(0,(now-last)*.001);
    const dt=Math.min(.04,elapsed);
    clock.tick(elapsed);
    last=now;
    if(!activePop)move(dt,now*.001);
    alignCamera(dt);
    weather.tick(Math.min(.25,elapsed),camera,!roomId,!roomId&&offBridgeChannel(world.x,world.z,.27));
    renderer.render(scene,camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  canvas.addEventListener('webglcontextlost',e=>{
    e.preventDefault();
    loading.textContent='3D表示が中断しました';
    loading.hidden=false;
  });
  canvas.addEventListener('webglcontextrestored',()=>{loading.hidden=true;});
}
try {
  main();
} catch(error) {
  loading.textContent='3D表示を起動できませんでした';
  console.error(error);
}
