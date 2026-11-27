import * as T from './vendor/three.module.min.js';

const stages=[
  [4.5,'曙','#876e9f','#f2a994','#b9a3b5','#ffd4a5','#e1d5ff',.64,.97],
  [7,'朝','#8fc0db','#ffe5c1','#e3e5d2','#ffe3b0','#f5f4ff',1.35,1.34],
  [12,'昼','#74b6d4','#f7e7c5','#e2e7cb','#fff4df','#f2fcff',1.75,1.60],
  [17.5,'夕方','#947ba9','#f5a784','#dca999','#ffc287','#f0ccd8',1.18,1.12],
  [20,'夜','#192745','#4e5574','#4e5573','#a4bbe9','#acbfe8',.32,.80],
  [24,'夜','#15223c','#404b6b','#464f6e','#a4bbe9','#a2b8e4',.26,.77],
];
const key='hillside-patisserie.clock.v1';
const rates=[0,5,12,24];
const colors=stages.map(stage=>stage.slice(2,7).map(hex=>new T.Color(hex)));
const element=id=>document.getElementById(id);
const wrap=hour=>((hour%24)+24)%24;
const minuteAt=hour=>Math.floor(hour*60+1e-7)%1440;

export function phaseAt(hour){
  const time=wrap(hour);
  return [...stages].reverse().find(stage=>time>=stage[0])?.[1]??'夜';
}

function timeText(minutes){
  return String(Math.floor(minutes/60)).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0');
}

export function createDayCycle({sky,sun,ambient,fog,background,stars,lantern}) {
  let hour=9, duration=12;
  try {
    const old=JSON.parse(localStorage.getItem(key));
    if(Number.isFinite(old?.hour))hour=wrap(old.hour);
    if(rates.includes(old?.duration))duration=old.duration;
  } catch {}
  const time=element('clock-time'), rate=element('clock-rate'), label=element('clock-value');
  const status=element('clock-button');
  let shownMinute=-1;
  const slots=[sky.zenith.value,sky.horizon.value,fog.color,sun.color,ambient.color];

  function showDraft(){
    const minutes=Number(time.value);
    label.textContent=phaseAt(minutes/60)+' '+timeText(minutes);
  }

  function tick(dt){
    if(duration>0)hour=wrap(hour+dt*.4/duration);
    const minutes=minuteAt(hour);
    if(minutes!==shownMinute){
      shownMinute=minutes;
      status.textContent=phaseAt(minutes/60)+' '+timeText(minutes);
    }

    const next=stages.findIndex(stage=>stage[0]>hour);
    const current=(next+stages.length-1)%stages.length;
    const left=stages[current], right=stages[next];
    const start=next===0?0:left[0];
    const blend=T.MathUtils.smoothstep(hour,start,right[0]);
    slots.forEach((color,i)=>color.copy(colors[current][i]).lerp(colors[next][i],blend));
    background.copy(sky.horizon.value);
    sun.intensity=T.MathUtils.lerp(left[7],right[7],blend);
    const dark=(1-T.MathUtils.smoothstep(hour,4,7.8))+T.MathUtils.smoothstep(hour,17.7,21);
    stars.material.opacity=dark*.78;
    stars.visible=dark>.01;
    lantern.emissiveIntensity=dark*.72;
    ambient.intensity=T.MathUtils.lerp(left[8],right[8],blend);
    const angle=(hour-6)/24*Math.PI*2;
    sun.position.set(-Math.cos(angle)*22,7+Math.max(0,Math.sin(angle))*24,9);
  }

  time.addEventListener('input',showDraft);
  element('clock-form').addEventListener('submit',event=>{
    event.preventDefault();
    hour=wrap(Number(time.value)/60);
    duration=rates.includes(Number(rate.value))?Number(rate.value):12;
    try {localStorage.setItem(key,JSON.stringify({hour,duration}));} catch {}
    tick(0);
    element('dialog').close();
  });
  tick(0);
  return {tick,open(){
    time.value=String(minuteAt(hour));
    rate.value=String(duration);
    showDraft();
  }};
}
