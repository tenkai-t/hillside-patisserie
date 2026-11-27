import * as T from './vendor/three.module.min.js';
import {ground} from './town.js?v=12';
import {townHouses, hillHouses, benches} from './places.js?v=12';

const presets={
  clear:{name:'晴れ',icon:'☀', cloud:.06, fog:0, wind:.10, rain:0, snow:0, text:'日差しが戻り、雨上がりの水たまりが少しずつ乾きます。'},
  cloudy:{name:'曇り',icon:'☁', cloud:.76, fog:.24, wind:.24, rain:0, snow:0, text:'空が灰色になり、日差しが弱まります。'},
  rain:{name:'雨',icon:'☂', cloud:.88, fog:.49, wind:.42, rain:.73, snow:0, text:'石畳が濡れ、低いところに水たまりができます。'},
  wind:{name:'強風',icon:'〰', cloud:.34, fog:.12, wind:1, rain:0, snow:0, text:'木の枝や葉が揺れ、花びらが風に流されます。'},
  snow:{name:'雪',icon:'❄', cloud:.70, fog:.59, wind:.28, rain:0, snow:1, text:'木やひさしにも雪が積もります。雪が続いて川が凍ると、氷の上を歩けます。'},
  mist:{name:'霧',icon:'≋', cloud:.54, fog:1, wind:.05, rain:0, snow:0, text:'遠くの建物がかすみ、展望台からの見え方が変わります。'},
  storm:{name:'雷雨',icon:'ϟ', cloud:1, fog:.65, wind:.97, rain:1, snow:0, text:'雨風が強まり、遠くの空がときどき光ります。'},
};
const fields=['cloud','fog','wind','rain','snow'];
const sequence=['clear','cloudy','rain','storm','wind','clear','mist','snow'];
const storageKey='hillside-patisserie.weather.v1';
const element=id=>document.getElementById(id);
const mix=T.MathUtils.lerp;
const wrap=T.MathUtils.euclideanModulo;
const ease=(value,target,dt,seconds)=>mix(value,target,1-Math.exp(-dt/seconds));

function createSnowRoofs(parent,material){
  const vertices=[], faces=[];
  for(const [,x,z,width,depth,wallHeight,,angle] of [...townHouses,...hillHouses]){
    const halfWidth=(width+.48)*.5, halfDepth=(depth+.46)*.5, rise=width*.31;
    for(const side of [-1,1]){
      const start=vertices.length/3;
      for(let row=0;row<=10;row++){
        const localZ=(row/10*2-1)*halfDepth;
        const edge=.88+Math.sin(row*1.7+side+width)*.075;
        for(const localX of [0,side*halfWidth*edge]){
          const worldX=x+localX*Math.cos(angle)+localZ*Math.sin(angle);
          const worldZ=z-localX*Math.sin(angle)+localZ*Math.cos(angle);
          vertices.push(worldX,ground(x,z)+wallHeight+.19+rise*(1-Math.abs(localX)/halfWidth),worldZ);
        }
        const i=start+row*2;
        if(row){
          if(side>0)faces.push(i-2,i,i-1,i-1,i,i+1);
          else faces.push(i-2,i-1,i,i-1,i+1,i);
        }
      }
    }
  }
  const geo=new T.BufferGeometry();
  geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
  geo.setIndex(faces);
  geo.computeVertexNormals();
  const roofSnow=new T.Mesh(geo,material);
  roofSnow.visible=false;
  parent.add(roofSnow);
  return roofSnow;
}

function createSnowBenches(parent,material){
  const seats=new T.Group();
  const geometry=new T.SphereGeometry(1,20,10);
  function cap(x,y,z,width,depth){
    const snow=new T.Mesh(geometry,material);
    snow.position.set(x,y,z);
    snow.scale.set(width,.004,depth);
    seats.add(snow);
  }
  for(const {x,z,height,backless} of benches){
    const y=ground(x,z);
    cap(x,y+height+.004,z,backless?.88:.73,backless?.27:.20);
    if(!backless)cap(x,y+.847,z-.17,.73,.056);
  }
  seats.visible=false;
  parent.add(seats);
  return seats;
}

function createPuddles(parent){
  const vertices=[], uvs=[], faces=[];
  const spots=[
    [.3,8.9,.94,.64],[-1.29,10.18,.45,.31],[1.79,11.12,.48,.75],[-1.49,7.14,.63,.39],
    [1.22,5.68,.98,.47],[.15,3.25,.71,.53],[-2.15,.35,.55,.36],[2.4,-2.09,.53,.81],
    [-.85,-5.57,.64,.44],[-4.35,-8.19,.73,.53],[.64,-10.9,.52,.80],[4.84,-8.55,.66,.42],
    [-.38,-14.1,.75,.51],[1.12,-18.25,.64,.51],[.12,-20.22,.54,.40],
    [-.39,-26.15,.62,.41],[.04,-33.26,.57,.44],[.58,-41.15,.51,.42],[-2.36,-54.49,.52,.37],
  ];
  for(const [index,[x,z,width,depth]] of spots.entries()){
    const start=vertices.length/3, sides=26;
    vertices.push(x,ground(x,z)+.052,z);
    uvs.push(.5,.5);
    for(let i=0;i<sides;i++){
      const a=i*Math.PI*2/sides;
      const radius=.88+.10*Math.sin(a*3+index)+.055*Math.cos(a*5-index);
      const u=Math.cos(a)*radius,v=Math.sin(a)*radius;
      const px=x+u*width,pz=z+v*depth;
      vertices.push(px,ground(px,pz)+.052,pz);
      uvs.push(.5+u*.5,.5+v*.5);
      faces.push(start,start+1+(i+1)%sides,start+1+i);
    }
  }
  const geo=new T.BufferGeometry();
  geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
  geo.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));
  geo.setIndex(faces);
  const material=new T.ShaderMaterial({
    transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,
    uniforms:{wet:{value:0},rain:{value:0},time:{value:0},tint:{value:new T.Color()}},
    vertexShader:`
      varying vec2 pool;
      varying vec2 groundPoint;
      void main(){
        pool=uv; groundPoint=position.xz;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
      }
    `,
    fragmentShader:`
      uniform float wet,rain,time;
      uniform vec3 tint;
      varying vec2 pool,groundPoint;
      float ripple(vec2 p, float delay){
        float age=fract(time*.89+delay);
        float d=abs(length(p)-age*.47);
        return (1.0-smoothstep(.005,.023,d))*(1.0-age);
      }
      void main(){
        float pattern=sin(groundPoint.x*1.42+groundPoint.y*.38);
        float rings=ripple(pool-vec2(.35,.47),pattern*.27)
          +ripple(pool-vec2(.66,.57),.49+pattern*.24);
        vec3 water=mix(vec3(.11,.20,.24), tint, .38+pool.y*.30);
        gl_FragColor=vec4(water+rings*rain*.32,wet*(.44+pool.y*.28));
        #include <colorspace_fragment>
      }
    `,
  });
  const puddles=new T.Mesh(geo,material);
  puddles.visible=false;
  puddles.renderOrder=1;
  parent.add(puddles);
  return puddles;
}

function createParticles(parent,count,color,size,kind){
  const streaks=kind==='rain';
  const positions=new Float32Array(count*(streaks?6:3));
  const geometry=new T.BufferGeometry();
  const attribute=new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage);
  geometry.setAttribute('position',attribute);
  let particles;
  if(streaks){
    const material=new T.LineBasicMaterial({color,transparent:true,depthWrite:false});
    particles=new T.LineSegments(geometry,material);
  }else{
    const canvas=document.createElement('canvas');
    canvas.width=canvas.height=32;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='white';
    ctx.beginPath();
    ctx.ellipse(16,16,kind==='leaf'?13:12,kind==='leaf'?5:12,kind==='leaf'?-.68:0,0,Math.PI*2);
    ctx.fill();
    const material=new T.PointsMaterial({
      color,size,map:new T.CanvasTexture(canvas),transparent:true,depthWrite:false,alphaTest:.12,
    });
    particles=new T.Points(geometry,material);
  }
  particles.visible=false;
  particles.frustumCulled=false;
  particles.renderOrder=2;
  parent.add(particles);

  const seeds=Array.from({length:count},(_,i)=>[
    wrap(i*.6180339887,1)*24,wrap(i*.7548776662,1)*13,wrap(i*.5698402910,1)*24,
  ]);
  return (camera,t,intensity,wind)=>{
    particles.visible=intensity>.02;
    if(!particles.visible)return;
    particles.material.opacity=intensity*(streaks?.58:.94);
    const {x,y,z}=camera.position;
    const drift=kind==='leaf'?5.5:streaks?1.55:.75;
    const active=Math.ceil(count*intensity);
    geometry.setDrawRange(0,active*(streaks?2:1));
    for(let i=0,index=0;i<active;i++){
      const [a,b,c]=seeds[i];
      const wobble=Math.sin(t*1.6+i*1.37);
      const vertical=kind==='leaf'?.61:streaks?12.6:1.34;
      const px=x-12+wrap(a+t*drift+(streaks?0:wobble*.24)-x,24);
      const py=y-5+wrap(b-t*vertical-y,13);
      const pz=z-12+wrap(c+t*.29+(streaks?0:wobble*.34)-z,24);
      positions[index++]=px;
      positions[index++]=py;
      positions[index++]=pz;
      if(streaks){
        positions[index++]=px-.075-wind*.12;
        positions[index++]=py+.49;
        positions[index++]=pz-.015;
      }
    }
    attribute.needsUpdate=true;
  };
}

export function createWeather({root, sky, sunlight, ambient, fog, background, stars, petals}){
  const {snowAmount,snowMaterial,trees,awningSnow,clouds,paving,river}=root.userData.weatherScenery;
  const weatherButton=element('weather-button'), modeSelect=element('weather-mode');
  const description=element('weather-description');
  const roofSnow=createSnowRoofs(root,snowMaterial);
  const benchSnow=createSnowBenches(root,snowMaterial);
  const puddles=createPuddles(root);
  const rainParticles=createParticles(root,610,'#c6e4f8',0,'rain');
  const snowParticles=createParticles(root,340,'#f7fcff',.087,'snow');
  const driftingLeaves=createParticles(root,84,'#d9be79',.13,'leaf');
  const dullSky=new T.Color('#77909f'), hazySky=new T.Color('#b4bec3');
  const darkCloud=new T.Color('#97abb6'), lightCloud=new T.Color('#fff7e4');
  let mode='auto', current='clear', nextChange=78, sequenceIndex=0;
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  let wet=0, elapsed=0, cloudTravel=0, petalTravel=0;
  let iceAmount=0;
  let nextFlash=null;
  let flashSide=1;
  try {
    const stored=localStorage.getItem(storageKey);
    const saved=stored==='sunshower'?'rain':stored;
    if(saved&&Object.hasOwn(presets,saved)) mode=current=saved;
  } catch {}
  const state={...presets[current]};
  if(current==='snow')snowAmount.value=.16;
  if(presets[current].rain>0)wet=.38;

  function showStatus(){
    const {icon,name}=presets[current];
    weatherButton.textContent=icon+' '+name;
    weatherButton.setAttribute('aria-label','天候を変更（'+name+'）');
  }
  function showDescription(){
    description.textContent=presets[modeSelect.value]?.text??'散策している間、街の天気が時間とともに変わります。';
  }
  showStatus();
  modeSelect.addEventListener('change',showDescription);
  element('weather-form').addEventListener('submit',event=>{
    event.preventDefault();
    const choice=modeSelect.value;
    mode=Object.hasOwn(presets,choice)?choice:'auto';
    if(mode!=='auto')current=mode;
    nextChange=elapsed+72;
    try {localStorage.setItem(storageKey,mode);} catch {}
    showStatus();
    element('dialog').close();
  });

  function updateLightning(){
    if(current!=='storm'){
      nextFlash=null;
      sky.lightning.value=0;
      return;
    }
    if(nextFlash===null)nextFlash=elapsed+3.4;
    const age=elapsed-nextFlash;
    if(age>=.56){
      nextFlash=elapsed+8+Math.random()*7;
      flashSide*=-1;
      sky.flashDirection.value.set(flashSide*.34,.24,-.91).normalize();
    }
    const pulse=T.MathUtils.smoothstep(age,0,.055)*(1-T.MathUtils.smoothstep(age,.055,.54));
    sky.lightning.value=pulse*(reducedMotion.matches?.12:.56);
  }

  function updatePetals(wind,visible,dt){
    petalTravel+=dt*wind*wind*4.6;
    petals.forEach((petal,i)=>{
      petal.visible=visible;
      if(!visible)return;
      const sign=i%2===0?1:-1;
      const drift=(elapsed*(.26+wind*.55)+i*.827)%6.7;
      const base=sign*(3.55+(i%7)*.83);
      const stream=wrap(base+petalTravel+12,24)-12;
      petal.position.set(
        mix(base,stream,T.MathUtils.smoothstep(wind,.25,.74))+Math.sin(elapsed*.85+i)*.41,
        3.62-drift*.54+wind*Math.sin(elapsed*2.1+i)*.42,
        10.5-(i%14)*2.02+Math.cos(i+elapsed*.73)*(.66+wind*.42),
      );
      petal.rotation.set(i+elapsed*(1+wind),0,elapsed*(1.8+wind*2.6)+i);
    });
  }

  function updateRiver(dt,freezing,keepCrossing){
    if(freezing||current==='clear'||presets[current].rain>0){
      iceAmount=ease(iceAmount,freezing?1:0,dt,freezing?5.6:13);
    }
    // Hold the crossing open until the player reaches a bank or the bridge.
    if(river.frozen&&keepCrossing)iceAmount=Math.max(iceAmount,.76);
    river.frozen=iceAmount >= (river.frozen?.50:.74);
    const strength=T.MathUtils.smoothstep(iceAmount,.04,.74);
    river.ice.visible=strength>.005;
    river.ice.material.opacity=strength;
    river.ice.material.depthWrite=strength>=.995;
    river.ripples.visible=strength<.70;
    for(const mark of river.ice.children)mark.material.opacity=strength*.87;
  }

  function tick(dt,camera,outside,keepCrossing=false){
    elapsed+=dt;
    if(mode==='auto'&&elapsed>=nextChange){
      do {
        sequenceIndex=(sequenceIndex+1)%sequence.length;
      } while(sequence[sequenceIndex]===current);
      current=sequence[sequenceIndex];
      nextChange=elapsed+78;
      showStatus();
    }
    const target=presets[current];
    for(const field of fields)state[field]=ease(state[field],target[field],dt,1.05);
    if(target.snow){
      snowAmount.value=ease(snowAmount.value,1,dt,5.5);
    }else if(current==='clear'||target.rain>0){
      snowAmount.value=ease(snowAmount.value,0,dt,current==='clear'?18:30);
    }
    updateRiver(dt,target.snow>0,keepCrossing);
    wet=ease(wet,target.rain>0?1:0,dt,target.rain>0?2.7:current==='clear'?11:23);
    fog.density=.014;
    if(!outside)return;

    const {cloud, fog:mist, rain, snow, wind}=state;
    updateLightning();
    // The day cycle sets these values before weather modifies the outdoor view.
    const daylight=T.MathUtils.smoothstep(sunlight.intensity,.25,1.30);
    sky.zenith.value.lerp(dullSky,cloud*.66*(.30+.70*daylight));
    sky.horizon.value.lerp(hazySky,cloud*.56*(.30+.70*daylight));
    background.copy(sky.horizon.value);
    fog.color.lerp(hazySky,mist*.71*(.30+.70*daylight));
    fog.density+=mist*.032;
    sunlight.intensity*=1-cloud*.50;
    ambient.intensity*=1-cloud*.18;
    stars.material.opacity*=1-cloud*.90;

    cloudTravel+=dt*(.10+.99*wind);
    clouds.position.x=Math.sin(cloudTravel*.065)*12;
    clouds.children.forEach(cloudMesh=>cloudMesh.material.color.copy(lightCloud).lerp(darkCloud,cloud*.86));
    const gust=.60+.29*Math.sin(elapsed*2.37)+.11*Math.sin(elapsed*4.15);
    trees.forEach((tree,i)=>{
      tree.children[0].visible=snowAmount.value>.025;
      tree.rotation.z=-wind*(.028+gust*.095)+wind*Math.sin(elapsed*3.45+i*.7)*.035;
      tree.rotation.x=wind*Math.cos(elapsed*2.7+i*.44)*.028;
    });
    updatePetals(wind,rain<.21&&snow<.21,dt);
    const settled=snowAmount.value;
    roofSnow.visible=benchSnow.visible=awningSnow.visible=settled>.025;
    snowMaterial.opacity=settled;
    for(const cap of benchSnow.children)cap.scale.y=.006+settled*.064;
    paving.forEach(({material,dry,wet:wetColor})=>material.color.copy(dry).lerp(wetColor,wet));
    puddles.visible=wet>.025;
    puddles.material.uniforms.wet.value=wet;
    puddles.material.uniforms.rain.value=rain;
    puddles.material.uniforms.time.value=elapsed;
    puddles.material.uniforms.tint.value.copy(sky.horizon.value);
    rainParticles(camera,elapsed,rain,wind);
    snowParticles(camera,elapsed,snow,wind);
    driftingLeaves(camera,elapsed,Math.max(0,(wind-.45)/.55),wind);
  }

  return {tick,open(){
    modeSelect.value=mode;
    showDescription();
  }};
}
