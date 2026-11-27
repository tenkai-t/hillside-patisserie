import * as T from './vendor/three.module.min.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {riverCenter, riverHalfWidth, bridgeHalfWidth, flowerPatch, overlook, benches, entrances, townHouses, hillHouses} from './places.js?v=12';
import {mesh, group, ell, box, disk, tube, pastry, townsperson, buildTownFace} from './model.js?v=8';

let seed=3869;
const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
const n=(a,b)=>a+random()*(b-a);
const stone=['#dbc5aa','#e1cdb5','#e8d5bc','#d2bda8','#e5ceae','#cdb5a1','#dfccba'];
const foliage=['#54966d','#74a877','#88b980','#a7c384'];
const roofGeo=new T.CylinderGeometry(0,1,1,4,1);
const wood='#86615d', trim='#f8dfb9';
const treeMaterial=new T.MeshLambertMaterial({vertexColors:true});
const lanternGlass=new T.MeshLambertMaterial({color:'#fae1a0',emissive:'#ffbb66',emissiveIntensity:0});
function landHeight(x,z){
  const north=-z-22;
  return .055*z+.17*Math.sin(z*.18)+.15*Math.sin(x*.12)*Math.sin(z*.15)
    +5.4*T.MathUtils.smoothstep(north,0,13)-2.1*T.MathUtils.smoothstep(north,15,31);
}
const waterLevel=landHeight(0,-48)-.15;
const iceLevel=waterLevel+.031;
const iceBankWidth=riverHalfWidth+.55;
const bridgeY=waterLevel+.57;
const bridgeZ=-48, bridgeHalfLength=4.15;
const bridgeEnd=(z)=>landHeight(0,z);
export function ground(x,z){
  if(Math.abs(x)>=bridgeHalfWidth || Math.abs(z-bridgeZ)>bridgeHalfLength)return landHeight(x,z);
  const side=z<bridgeZ?-1:1;
  const mix=T.MathUtils.smoothstep(Math.abs(z-bridgeZ),2.75,bridgeHalfLength);
  return T.MathUtils.lerp(bridgeY,bridgeEnd(bridgeZ+side*bridgeHalfLength),mix);
}
function iceHeight(x,z){
  const offset=Math.abs(z-riverCenter(x));
  const bank=T.MathUtils.smoothstep(offset,riverHalfWidth-.68,iceBankWidth);
  return T.MathUtils.lerp(iceLevel,landHeight(x,z),bank);
}
export function frozenGround(x,z){
  if(Math.abs(x)<bridgeHalfWidth&&Math.abs(z-bridgeZ)<=bridgeHalfLength)return ground(x,z);
  return iceHeight(x,z);
}
export const target={x:-7.0,z:-10.2};
const stoneAt=()=>stone[Math.floor(random()*stone.length)];

export function sign(parent,x,y,z,label,sub) {
  const c=document.createElement('canvas');c.width=512;c.height=160;
  const ctx=c.getContext('2d');
  ctx.fillStyle='#613d49';ctx.fillRect(0,0,512,160);
  ctx.strokeStyle='#edc689';ctx.lineWidth=3;ctx.strokeRect(10,10,492,140);
  ctx.textAlign='center';ctx.fillStyle='#fff1cc';ctx.font='700 48px serif';ctx.fillText(label,256,70);
  ctx.fillStyle='#ebcba6';ctx.font='20px sans-serif';ctx.fillText(sub,256,116);
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
  const panel=new T.Mesh(new T.PlaneGeometry(1.94,.605),new T.MeshBasicMaterial({map:tex}));
  panel.position.set(x,y,z);parent.add(panel);
}
function roof(parent,color,w,d,h,y) {
  const a=new T.Shape();a.moveTo(-w/2,0);a.lineTo(w/2,0);a.lineTo(0,h);a.closePath();
  const main=new T.ExtrudeGeometry(a,{depth:d,bevelEnabled:false});
  mesh(parent,main,color,0,y,-d/2);
  for(const s of [-1,1]){
    const length=Math.hypot(w*.5,h);
    for(let z=-d*.5;z<=d*.5;z+=.23){
      const shingle=box(parent,s===1?color:'#ad7774',s*w*.247,y+h*.53,z,length,.043,.052);
      shingle.rotation.z=-s*Math.atan2(h,w*.5);
    }
    for(let i=0;i<3;i++) box(parent,'#754e58',s*w*.48,y-.047+i*.058,0,.105,.055,d+.13);
  }
  box(parent,'#754e58',0,y+h+.02,0,.16,.097,d+.13);
}
function windowAt(h,x,y,z,w=.68){
  box(h,'#865f59',x,y,z,w,.87,.103);
  box(h,'#7aacaa',x,y,z+.055,w-.12,.737,.026);
  box(h,'#c8e4dd',x-.065,y+.079,z+.072,w*.44,.42,.016).rotation.z=-.12;
  box(h,trim,x,y,z+.08,.039,.76,.044);
  box(h,trim,x,y,z+.08,w,.043,.044);
  box(h,'#aa7662',x,y-.458,z+.012,w+.12,.12,.27);
  for(let i=0;i<5;i++) {
    ell(h,'#76995f',x+(i-2)*w*.17,y-.36,z+.11,.098,.105,.09);
    ell(h,i%2?'#e49194':'#fff0c0',x+(i-2)*w*.17,y-.26,z+.18,.058,.056,.044);
  }
}
function house(parent,colliders,snowMaterial,x,z,w,d,h,colors,orientation,label) {
  const home=group(parent,x,ground(x,z)-.13,z);home.rotation.y=orientation;
  box(home,'#b49d8d',0,.22,0,w+.14,.44,d+.12);
  box(home,colors[0],0,h*.50+.19,0,w,h,d);
  const front=d/2;
  for(const sx of [-1,1])for(const sz of [-1,1]){
    box(home,colors[1],sx*w*.493,h*.52+.18,sz*d*.494,.17,h+.12,.16);
  }
  box(home,colors[1],0,h*.56,0,w+.10,.13,d+.10);
  box(home,colors[1],0,h+.155,0,w+.16,.19,d+.17);
  roof(home,colors[2],w+.48,d+.46,w*.31,h+.23);
  box(home,'#c18475',w*.23,h+w*.23,-d*.22,.42,.92,.43);
  box(home,'#785563',w*.23,h+w*.23+.45,-d*.22,.53,.15,.56);
  const door=-w*.30;
  box(home,colors[1],door,.89,front+.055,.85,1.57,.12);
  box(home,'#7d5a56',door,.87,front+.12,.67,1.35,.06);
  for(let i=0;i<3;i++) box(home,'#936c66',door+(i-1)*.18,.87,front+.16,.029,1.31,.028);
  ell(home,'#d6ae72',door+.235,.86,front+.185,.044,.044,.027);
  box(home,'#c6ad98',door,.09,front+.22,1.03,.16,.52);
  windowAt(home,w*.19,h*.33,front,w*.34);
  for(const s of [-1,1]) windowAt(home,s*w*.245,h*.77,front,w*.22);
  const side=group(home,w/2,h*.07,0);side.rotation.y=Math.PI/2;
  windowAt(side,-d*.22,1.22,.035,.68);
  windowAt(side,d*.23,h*.7,.041,.67);
  const other=group(home,-w/2,h*.07,0);other.rotation.y=-Math.PI/2;
  windowAt(other,-d*.20,h*.63,.039,.68);
  if(label){
    sign(home,w*.19,h*.57+.21,front+.128,...label);
    const awning=group(home,w*.19,h*.48,front+.39);awning.rotation.x=.24;
    for(let i=0;i<9;i++) {
      const stripe=i%2?'#ffe9cb':colors[2];
      box(awning,stripe,(i-4)*.196,0,0,.199,.055,.91);
      ell(awning,stripe,(i-4)*.196,-.042,.445,.102,.098,.045);
    }
    for(let i=-3;i<=3;i++){
      const depth=.33+.035*Math.cos(i*1.6);
      ell(awning,'#f0f7ff',i*.23,.039,-.04,.22,.051,depth).material=snowMaterial;
    }
  }
  const turn=Math.abs(Math.sin(orientation))>.5;
  colliders.push({x,z,a:(turn?d:w)*.5+.08,b:(turn?w:d)*.5+.08});
}
function tree(parent,trees,snowMaterial,x,z,s=1,pink=false) {
  const g=new T.Group();
  tube(g,'#896853',[[0,0,0],[-.04,.71,.02],[.07,1.26,.09],[.02,2.27,0]],.115);
  tube(g,'#97735b',[[.02,.81,.03],[.35,1.28,.08],[.63,1.76,.02]],.067);
  tube(g,'#97735b',[[-.05,.88,.03],[-.47,1.37,-.12],[-.61,1.65,-.18]],.068);
  const palette=pink?['#df90a6','#e8a5b7','#f1b6c2','#f5c4cf']:foliage;
  const caps=[];
  for(let i=0;i<15;i++){
    const a=i*2.39996;
    const r=i<3?.3:n(.42,.98);
    const crown=ell(g,palette[i%4],Math.sin(a)*r,n(1.6,2.49)+(i<3?.35:0),Math.cos(a)*r,n(.48,.75),n(.39,.57),n(.46,.68));
    const cap=new T.SphereGeometry(1,14,6,0,Math.PI*2,0,1.25+(i%4)*.075);
    cap.scale(crown.scale.x*1.035,crown.scale.y*1.09,crown.scale.z*1.035);
    cap.translate(crown.position.x,crown.position.y+.009,crown.position.z);
    caps.push(cap);
  }
  g.updateMatrixWorld(true);
  const parts=g.children.map(part=>{
    const geometry=(part.geometry.index?part.geometry.toNonIndexed():part.geometry.clone()).applyMatrix4(part.matrixWorld);
    const {r,g,b}=part.material.color;
    const colors=new Float32Array(geometry.attributes.position.count*3);
    for(let i=0;i<colors.length;i+=3){
      colors[i]=r;
      colors[i+1]=g;
      colors[i+2]=b;
    }
    geometry.setAttribute('color',new T.BufferAttribute(colors,3));
    return geometry;
  });
  const animated=new T.Mesh(mergeGeometries(parts),treeMaterial);
  parts.forEach(part=>part.dispose());
  const cover=new T.Mesh(mergeGeometries(caps),snowMaterial);
  caps.forEach(cap=>cap.dispose());
  cover.visible=false;
  animated.add(cover);
  animated.position.set(x,ground(x,z)-.08,z);
  animated.scale.setScalar(s);
  parent.add(animated);
  trees.push(animated);
}
export function flower(parent,x,z,y,main,s=1) {
  const g=group(parent,x,y,z);g.scale.setScalar(s);
  disk(g,'#5f986c',0,.14,0,.021,.29);
  ell(g,'#75a365',-.06,.134,0,.081,.027,.042).rotation.z=.41;
  ell(g,'#729a60',.05,.094,0,.075,.025,.035).rotation.z=-.37;
  for(let j=0;j<5;j++){
    const a=j*Math.PI*.4;
    ell(g,main,Math.cos(a)*.057,.293+Math.sin(a)*.052,.026,.047,.039,.027);
  }
  ell(g,'#e8be61',0,.292,.055,.032,.031,.03);
}
function lamp(parent,x,z){
  const y=ground(x,z);
  disk(parent,'#657070',x,y+.12,z,.15,.24);
  disk(parent,'#536970',x,y+1.02,z,.045,1.91);
  box(parent,'#66575d',x,y+1.86,z,.29,.088,.29);
  box(parent,'#fae1a0',x,y+2.00,z,.21,.24,.21).material=lanternGlass;
  for(const dx of [-.118,.118])for(const dz of [-.118,.118]) box(parent,'#687279',x+dx,y+2.00,z+dz,.030,.28,.030);
  mesh(parent,roofGeo,'#586970',x,y+2.17,z).scale.set(.235,.16,.235);
}
function terrainGeometry() {
  const geo=new T.PlaneGeometry(190,190,190,190);geo.rotateX(-Math.PI/2);
  const pos=geo.attributes.position;
  const colors=[], snowCover=[];
  const a=new T.Color('#91b77b'),b=new T.Color('#b9cb8f');
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),z=pos.getZ(i);
    const land=landHeight(x,z)-.025;
    const stream=1-T.MathUtils.smoothstep(Math.abs(z-riverCenter(x)),riverHalfWidth-.5,riverHalfWidth+.52);
    pos.setY(i,T.MathUtils.lerp(land,Math.min(land,waterLevel-.63),stream));
    const color=a.clone().lerp(b,(1+Math.sin(x*.29+z*.4)*Math.cos(z*.21))*.5);
    colors.push(color.r,color.g,color.b);
    snowCover.push((1-stream)*(.84+.15*Math.sin(x*.91+z*.62)*Math.cos(z*.8)));
  }
  geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  geo.setAttribute('snowCover',new T.Float32BufferAttribute(snowCover,1));
  geo.computeVertexNormals();return geo;
}
export function compact(source,dest) {
  source.updateMatrixWorld(true);
  const parts=new Map();
  source.traverse(o=>{
    if(!o.isMesh)return;
    const g=(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone()).applyMatrix4(o.matrixWorld);
    if(!parts.has(o.material))parts.set(o.material,[]);
    parts.get(o.material).push(g);
  });
  for(const [material,geometries] of parts){
    dest.add(new T.Mesh(mergeGeometries(geometries),material));
    geometries.forEach(g=>g.dispose());
  }
}
export function town(scene) {
  const colliders=[];
  const snowAmount={value:0};
  const snowMaterial=new T.MeshLambertMaterial({color:'#f0f7ff',transparent:true,opacity:0,depthWrite:false});
  const groundMaterial=new T.MeshLambertMaterial({vertexColors:true});
  groundMaterial.onBeforeCompile=shader=>{
    shader.uniforms.snowAmount=snowAmount;
    shader.vertexShader='attribute float snowCover; uniform float snowAmount;\n'+shader.vertexShader.replace(
      '#include <color_vertex>',
      '#include <color_vertex>\n vColor.rgb = mix(vColor.rgb, vec3(.87, .94, 1.0), snowCover * snowAmount);',
    );
  };
  const terrain=new T.Mesh(terrainGeometry(),groundMaterial);
  const trees=[];
  const paving=new Map(stone.map(color=>[color,{
    dry:new T.Color(color),
    wet:new T.Color(color).multiply(new T.Color().setRGB(.57,.64,.71)),
    material:new T.MeshLambertMaterial({color}),
  }]));
  scene.userData.weatherScenery={snowAmount,snowMaterial,trees,paving};
  scene.add(terrain);
  const sky=new T.Mesh(new T.SphereGeometry(155,32,20),new T.ShaderMaterial({
    side:T.BackSide,depthWrite:false,
    uniforms:{
      zenith:{value:new T.Color('#7cbbd3')},horizon:{value:new T.Color('#f5e3c6')},
      lightning:{value:0},flashDirection:{value:new T.Vector3(-.34,.25,-.90).normalize()},
    },
    vertexShader:'varying vec3 direction; void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:`
      varying vec3 direction;
      uniform vec3 zenith,horizon,flashDirection;
      uniform float lightning;
      void main(){
        vec3 dir=normalize(direction);
        float altitude=smoothstep(-.05,.68,dir.y);
        float glow=pow(max(0.0,dot(dir,flashDirection)),18.0)*lightning;
        vec3 sky=mix(horizon,zenith,altitude);
        gl_FragColor=vec4(mix(sky,vec3(.61,.70,.96),glow),1.0);
        #include <colorspace_fragment>
      }
    `,
  }));
  sky.renderOrder=-100;scene.add(sky);
  scene.userData.sky=sky.material.uniforms;
  scene.userData.lantern=lanternGlass;
  const points=[];
  for(let i=0;i<250;i++){
    const angle=i*2.39996;
    const altitude=.11+.84*((i*67)%251)/251;
    const horizontal=130*Math.sqrt(1-altitude*altitude);
    points.push(Math.sin(angle)*horizontal,130*altitude,Math.cos(angle)*horizontal);
  }
  const starGeometry=new T.BufferGeometry();
  starGeometry.setAttribute('position',new T.Float32BufferAttribute(points,3));
  const stars=new T.Points(starGeometry,new T.PointsMaterial({
    color:'#fff5db',size:.32,transparent:true,opacity:0,depthWrite:false,fog:false,
  }));
  scene.add(stars);
  scene.userData.stars=stars;
  const statics=new T.Group();
  for(const [x,z,a,b,c,col] of [
    [-44,-57,25,11,16,'#93b6a7'],[4,-85,31,16,19,'#9ab6b0'],[42,-64,25,14,17,'#8baea7'],
    [-37,-28,18,7,15,'#a8be90'],[38,-33,20,11,14,'#a7bd91'],[5,-73,21,5,11,'#b9ce9d'],
    [-4,51,48,8,14,'#b1c89b'],[56,4,16,12,44,'#a6c195'],[-57,3,16,10,49,'#a2bc95']
  ]) ell(statics,col,x,-2,z,a,b,c);
  const cloudShapes=new T.Group();
  for(const [x,z,y] of [[-32,-60,17],[22,-51,17],[-53,-35,13],[56,-30,19],[4,-61,23]]){
    for(let i=0;i<7;i++)ell(cloudShapes,i%2?'#fff5dc':'#fffaeb',x+(i-3)*2.2,y+n(-.5,.7),z+n(-2,2),n(2,4),n(.65,1.4),n(1,3));
  }
  const clouds=group(scene);
  compact(cloudShapes,clouds);
  clouds.children.forEach(cloud=>{cloud.material=cloud.material.clone();});
  scene.userData.weatherScenery.clouds=clouds;
  for(let row=-31;row<=25;row++){
    const z=row*.72;
    for(let col=-15;col<=15;col++){
      const x=col*.77+(row%2)*.33;
      const central=Math.abs(x)<(z<-4&&z>-14?8.7:3.35);
      const cross=(Math.abs(z+2)<1.6||Math.abs(z+15)<1.65)&&Math.abs(x)<12.2;
      if(!central&&!cross)continue;
      const color=stoneAt();
      const tile=box(statics,color,x,ground(x,z)+.009,z,.74,.065,.695);
      tile.material=paving.get(color).material;
      tile.rotation.x=-.055;
      tile.rotation.y=n(-.027,.027);
    }
  }
  for(const [id,x,z,w,d,h,palette,angle] of townHouses){
    house(statics,colliders,snowMaterial,x,z,w,d,h,palette,angle,entrances[id].sign);
  }

  for(const [x,z,s,pink] of [[10,10,1.3,true],[-10.5,4,1.05,true],[4.6,11,1.0,true],[-5.7,12.0,1.25,true],[9,-12,1.31,true],[-12.4,-14,1.3,true],[3.8,-19,1.15,true],[-4.1,-19,1.12,false],[-16,-4,1.2,false],[16,-11,1.3,false],[-16,10,1.5,false],[16,6,1.22,false],[1.7,-25,1.3,false],[-10,15,1.4,true],[11,15,1.4,false],[-9,-23,1.35,false],[13,-20,1.55,false]]){
    tree(scene,trees,snowMaterial,x,z,s,pink);colliders.push({x,z,a:.29,b:.29});
  }
  for(const [x,z] of [[-3.62,9.1],[3.62,4.2],[-4.2,-3.7],[4.9,-4.8],[-8.8,-12.9],[7.8,-14.5],[-3.7,-17.8],[3.65,-20.2]]) lamp(statics,x,z);

  for(const [x,z,spread] of [[-4.3,9.1,1.0],[4.8,9.5,1.25],[-3.9,-4.5,.8],[6.1,-12.6,1.3],[-6.9,-12.9,.85],[-4.4,-18.9,1.45],[4.6,-19.4,1.50],[-7.1,13,2.5],[8.5,13,2.2]]){
    for(let i=0;i<26;i++){
      const fx=x+n(-spread,spread),fz=z+n(-spread,spread);
      flower(statics,fx,fz,ground(fx,fz),'#'+['f6c6ce','eaa1b4','f9e4a7','f8eed2','b3a7d8'][i%5],n(.45,.87));
    }
  }
  // Fountain in the square.
  const fx=2.6,fz=-9.2,fy=ground(fx,fz);
  disk(statics,'#c9a995',fx,fy+.07,fz,1.68,.15);
  disk(statics,'#d8c0b1',fx,fy+.28,fz,1.47,.38);
  disk(statics,'#a3d3cf',fx,fy+.49,fz,1.26,.027);
  const rim=mesh(statics,new T.TorusGeometry(1.35,.102,9,32),'#ead4bc',fx,fy+.55,fz);rim.rotation.x=Math.PI/2;
  disk(statics,'#c4a69b',fx,fy+.78,fz,.175,.64);
  disk(statics,'#eed7bd',fx,fy+1.11,fz,.53,.14);
  disk(statics,'#94c7c1',fx,fy+1.19,fz,.42,.034);
  ell(statics,'#f4dabb',fx,fy+1.28,fz,.116,.156,.117);
  colliders.push(
    {x:fx,z:fz,r:1.65,top:fy+.145},
    {x:fx,z:fz,r:1.45,top:fy+.652},
    {x:fx,z:fz,r:.53,top:fy+1.202},
    {x:fx,z:fz,r:.12,top:fy+1.436},
  );

  const cart=group(statics,-8.25,ground(-8.25,-9.55),-9.55);
  box(cart,'#8b6766',0,.75,0,1.21,.15,1.82);
  box(cart,'#579074',0,.43,0,.97,.58,1.69);
  for(const sign of [-1,1]) for(const side of [-1,1])
    box(cart,'#885f62',sign*.5,1.29,side*.82,.07,1.32,.07);
  for(let i=0;i<7;i++){
    box(cart,i%2?'#fff1cc':'#8bb59c',0,1.95,(i-3)*.275,1.43,.067,.282).rotation.z=.085;
    const snow=ell(cart,'#f0f7ff',-.035,1.992,(i-3)*.251,.62,.052,.24);
    snow.rotation.z=.085;
    snow.material=snowMaterial;
  }
  for(let i=0;i<7;i++){
    const z=(i-3)*.232;
    disk(cart,'#bb7f69',.32,.91,z,.139,.22);
    flower(cart,.323,.96,z,[ '#f3adb5','#ffe7ae','#eee1f5'][i%3],.93);
    flower(cart,.16,.98,z+.07,'#ffe7d6',.78);
  }
  colliders.push({x:-8.25,z:-9.55,a:.61,b:.92});
  const stand=group(statics,-3.8,ground(-3.8,6.3),6.3);
  box(stand,'#9b6463',0,.45,0,.65,.86,.92);
  box(stand,'#fff0cf',0,.9,0,.74,.08,1.04);
  for(let i=0;i<3;i++)pastry(stand,.05,.95,(i-1)*.26,i,1.34);
  colliders.push({x:-3.8,z:6.3,a:.39,b:.54});

  for(let i=0;i<32;i++){
    const x=-16+i*1.03;
    const z=-22.3;
    if(Math.abs(x)<2.05)continue;
    const y=ground(x,z);
    box(statics,'#ddc7ae',x,y+.34,z,.99,.68,.34);
    box(statics,'#f1ddc2',x,y+.69,z,1.02,.125,.44);
    colliders.push({x,z,a:.52,b:.23});
  }
  hillside(statics,colliders,scene,trees,snowMaterial);
  scene.userData.weatherScenery.river=beyondTheGate(statics,colliders,scene,trees,snowMaterial);
  for(const {x,z,height,backless} of benches){
    if(backless)continue;
    const y=ground(x,z);box(statics,wood,x,y+height-.065,z,1.44,.13,.4);
    for(const s of [-1,1]) box(statics,'#765e68',x+s*.54,y+.23,z,.14,.44,.25);
    box(statics,'#a77969',x,y+.76,z-.17,1.44,.165,.1);
    colliders.push({x,z,a:.72,b:.21,top:y+height},{x,z:z-.17,a:.72,b:.05,top:y+.843});
  }

  const friend=group(statics,target.x,ground(target.x,target.z),target.z);
  ell(friend,'#8b604f',0,1.63,-.06,.188,.203,.163,true);
  buildTownFace(group(friend,0,townsperson.faceY,.031),'#ebb799');
  ell(friend,'#bb8960',0,1.745,-.02,.196,.086,.171,true);
  disk(friend,'#edc48b',0,1.77,-.04,.255,.031,.242,true);
  ell(friend,'#b28685',0,1.79,-.042,.183,.049,.177,true);
  ell(friend,'#d6b481',0,1.85,-.042,.172,.086,.166,true);
  for(const s of [-1,1]){
    ell(friend,'#a18c80',s*.104,.32,0,.064,.30,.063,true);
    ell(friend,'#6c4d44',s*.104,.07,.027,.088,.060,.117,true);
    const arm=ell(friend,'#e0e9c7',s*.209,1.04,.02,.074,.227,.074,true);arm.rotation.z=s*.25;
    ell(friend,'#ebb799',s*.237,.853,.02,.040,.070,.037,true);
  }
  ell(friend,'#dbebc6',0,1.147,0,.186,.236,.131,true);
  disk(friend,'#a66c79',0,.687,0,.226,.54,.183,true);
  box(friend,'#e2bdab',0,.885,.152,.218,.32,.025);
  flower(friend,.231,1.81,.06,'#f4b8b0',.53);
  friend.rotation.y=.75;
  colliders.push({...target,a:.25,b:.25});
  compact(statics,scene);
  const awningSnow=scene.children.find(child=>child.material===snowMaterial);
  awningSnow.visible=false;
  scene.userData.weatherScenery.awningSnow=awningSnow;
  return colliders;
}

function path(parent,points,width,color) {
  const curve=new T.CatmullRomCurve3(points.map(([x,z])=>new T.Vector3(x,0,z)));
  const segments=Math.ceil(curve.getLength()*4);
  const positions=[], indices=[];
  for(let i=0;i<=segments;i++){
    const point=curve.getPointAt(i/segments);
    const tangent=curve.getTangentAt(i/segments);
    for(const s of [-1,1]){
      const x=point.x+s*tangent.z*width*.5,z=point.z-s*tangent.x*width*.5;
      positions.push(x,ground(x,z)+.032,z);
    }
    if(i<segments)indices.push(i*2,i*2+2,i*2+1,i*2+1,i*2+2,i*2+3);
  }
  const surface=new T.BufferGeometry();
  surface.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  surface.setIndex(indices);surface.computeVertexNormals();
  mesh(parent,surface,color);
}

function directionPost(parent,x,z,label,sub) {
  const post=group(parent,x,ground(x,z),z);
  box(post,'#866352',0,.67,0,.105,1.34,.105);
  box(post,'#aa8270',0,1.22,0,2.00,.65,.12);
  sign(post,0,1.22,.075,label,sub);
}

function stoneGate(parent,colliders,z,title) {
  const y=ground(0,z);
  const gate=group(parent,0,y,z);
  for(const x of [-1.96,1.96]){
    box(gate,'#c4aa93',x,1.33,0,.82,2.92,1.02);
    for(let i=0;i<7;i++){
      box(gate,i%2?'#d0b59e':'#dad0ad',x,.15+i*.38,.51,.80,.32,.060);
    }
    box(gate,'#edddbc',x,2.76,0,.97,.20,1.12);
    colliders.push({x,z,a:.48,b:.55});
  }
  const arch=new T.Shape();
  arch.moveTo(-2.39,2.06);
  arch.quadraticCurveTo(0,5.37,2.39,2.06);
  arch.lineTo(1.52,2.06);
  arch.quadraticCurveTo(0,4.66,-1.52,2.06);
  arch.closePath();
  mesh(gate,new T.ExtrudeGeometry(arch,{depth:.68,bevelEnabled:false}),'#dbc3a5',0,0,-.34);
  sign(gate,0,3.35,.41,title,'HILLSIDE');
}

function hillside(parent,colliders,scene,trees,snowMaterial) {
  path(parent,[[0,-21.5],[0,-24],[-.9,-27.2],[.15,-30.2],[0,-34],[0,-39]],3.18,'#d7c0a2');
  path(parent,[[-.66,-26.9],[-2.7,-27.5],[-4.1,-29.55],[-6.25,-31.8]],2.15,'#d7c0a2');
  stoneGate(parent,colliders,-22.3,'丘の住宅街');
  directionPost(parent,1.93,-24.1,'展望台','← HILL VIEW');
  directionPost(parent,2.27,-33.9,'街はずれの門','↑ COUNTRY PATH');
  for(const [id,x,z,w,d,h,palette,angle] of hillHouses){
    house(parent,colliders,snowMaterial,x,z,w,d,h,palette,angle,entrances[id].sign);
  }
  for(const [x,z] of [[-2.55,-25.4],[2.43,-29.4],[-3.12,-31.7],[2.28,-35.5]])lamp(parent,x,z);
  for(const [x,z,s] of [[-9.8,-23.9,1.3],[9.8,-25.3,1.5],[-11.2,-31.8,1.38],[9.2,-34.8,1.22],[-5.1,-35,1.08]]){
    tree(scene,trees,snowMaterial,x,z,s,x<0);
    colliders.push({x,z,r:.31});
  }

  const {x,z}=overlook;
  for(let i=0;i<10;i++)for(let j=0;j<8;j++){
    const tx=x+(i-4.5)*.53,tz=z+(j-3.5)*.54;
    box(parent,stone[(i*7+j)%stone.length],tx,ground(tx,tz)-.075,tz,.526,.22,.532);
  }
  for(let i=0;i<7;i++){
    const tx=x+(i-4.5)*.53,tz=z+2.22;
    const y=ground(tx,tz);
    box(parent,'#e1c4a1',tx,y+.32,tz,.53,.62,.33);
    box(parent,'#f4dfbc',tx,y+.66,tz,.53,.13,.45);
    colliders.push({x:tx,z:tz,a:.27,b:.20,top:y+.725});
  }
  for(const dx of [-2.63,2.63]){
    for(let i=0;i<5;i++){
      const tz=z-i*.58;
      box(parent,'#e1c4a1',x+dx,ground(x+dx,tz)+.22,tz,.30,.45,.59);
      colliders.push({x:x+dx,z:tz,a:.15,b:.28});
    }
  }
  const bench=benches.at(-1);
  box(parent,'#82665c',bench.x,ground(bench.x,bench.z)+bench.height-.055,bench.z,1.75,.11,.54);
  for(const dx of [-.62,.62]){
    box(parent,'#a17b65',bench.x+dx,ground(bench.x+dx,bench.z)+.20,bench.z,.13,.4,.44);
  }
  colliders.push({x:bench.x,z:bench.z,a:.88,b:.27,top:ground(bench.x,bench.z)+bench.height});
  directionPost(parent,x-1.40,z+.64,'坂の上の展望台','HILL VIEW TERRACE');
}

function beyondTheGate(parent,colliders,scene,trees,snowMaterial) {
  const gateZ=-38.5;
  stoneGate(parent,colliders,gateZ,'川辺の小道');
  for(let i=-15;i<=15;i++){
    if(Math.abs(i)<=2)continue;
    const y=ground(i,gateZ);
    box(parent,'#c8af91',i,y+.40,gateZ,1.02,.85,.41);
    box(parent,'#ecd7b0',i,y+.83,gateZ,1.02,.12,.51);
    colliders.push({x:i,z:gateZ,a:.51,b:.25});
  }
  path(parent,[[0,-38.5],[.3,-40.4],[1.05,-42.3],[0,-43.9]],2.71,'#d6be90');
  path(parent,[[0,-52.13],[-.4,-53.4],[-1.9,-54.4],[-4.4,-55.2]],2.35,'#ded09d');
  directionPost(parent,2.30,-42.2,'川沿いの小道','RIVERSIDE');
  directionPost(parent,2.08,-53.2,'川向こうの花畑','← MEADOW');

  const vertices=[], faces=[];
  for(let i=0;i<=84;i++){
    const x=-21+i*.5,z=riverCenter(x);
    vertices.push(x,waterLevel,z-riverHalfWidth-.14,x,waterLevel,z+riverHalfWidth+.14);
    if(i<84)faces.push(i*2,i*2+1,i*2+2,i*2+1,i*2+3,i*2+2);
  }
  const stream=new T.BufferGeometry();
  stream.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
  stream.setIndex(faces);stream.computeVertexNormals();
  const water=new T.Mesh(stream,new T.MeshPhongMaterial({color:'#65afb3',shininess:85,specular:'#dff6ed',side:T.DoubleSide}));
  scene.add(water);
  const rippleShapes=new T.Group();
  for(let i=0;i<72;i++){
    const x=(i%18-8.5)*1.73+Math.sin(i*4)*.31;
    const z=riverCenter(x)+((i%4)-1.5)*.91;
    ell(rippleShapes,i%3?'#97cdc7':'#c5e4d7',x,waterLevel+.015,z,.31+(i%5)*.11,.007,.020);
  }
  const ripples=group(scene);
  compact(rippleShapes,ripples);
  const ice=createRiverIce(scene);
  for(let i=-12;i<=12;i++){
    const z=bridgeZ+i*.33;
    box(parent,i%3?'#a47260':'#bc8b69',0,ground(0,z)-.035,z,bridgeHalfWidth*2,.103,.324);
  }
  for(const x of [-bridgeHalfWidth,bridgeHalfWidth]){
    for(let i=-4;i<=4;i++){
      const z=bridgeZ+i*.99;
      box(parent,'#795c57',x,ground(0,z)+.39,z,.131,.83,.159);
    }
    for(const y of [.36,.73]){
      const points=[];
      for(let i=-8;i<=8;i++){const z=bridgeZ+i*.497;points.push([x,ground(0,z)+y,z]);}
      tube(parent,'#92645d',points,.048);
    }
  }
  for(const [x,z,s] of [[-7,-42,1.45],[6.0,-43.4,1.18],[-11,-44.9,1.0],[8.5,-52.9,1.42],[-8.7,-54.2,1.3],[4.2,-58.1,1.32],[-11.8,-59.1,1.56],[11.2,-59,1.5]]){
    tree(scene,trees,snowMaterial,x,z,s,z<-52);
    colliders.push({x,z,r:.33});
  }
  for(let i=0;i<115;i++){
    const x=flowerPatch.x+Math.cos(i*2.39996)*(1+Math.sqrt(i)*.55);
    const z=flowerPatch.z+Math.sin(i*2.39996)*(1+Math.sqrt(i)*.39);
    if(Math.abs(z-riverCenter(x))<3.1 || x>-.1 && x<1.5)continue;
    flower(parent,x,z,ground(x,z),['#f1cb87','#e2a0b0','#f8edcc','#c0a9d2'][i%4],n(.62,1.18));
  }
  return {ice,ripples,frozen:false};
}

function createRiverIce(scene){
  const columns=168, rows=10;
  const vertices=[], colors=[], faces=[];
  const pale=new T.Color('#c5e5ed'), blue=new T.Color('#83becf'), frost=new T.Color('#e1f2f1');
  for(let i=0;i<=columns;i++){
    const x=-21+i*.25;
    for(let j=0;j<=rows;j++){
      const across=j/rows*2-1;
      const z=riverCenter(x)+across*iceBankWidth;
      vertices.push(x,iceHeight(x,z)+.008,z);
      const pattern=.38+.23*Math.sin(x*.74+across*3.6)+.12*Math.cos(x*2.14-across*7.6);
      const color=blue.clone().lerp(pale,pattern).lerp(frost,Math.pow(Math.abs(across),3)*.88);
      colors.push(color.r,color.g,color.b);
      const a=i*(rows+1)+j;
      if(i<columns&&j<rows)faces.push(a,a+1,a+rows+1,a+1,a+rows+2,a+rows+1);
    }
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
  geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  geometry.setIndex(faces);
  geometry.computeVertexNormals();
  const material=new T.MeshPhongMaterial({
    vertexColors:true,specular:'#bfe2ef',shininess:54,transparent:true,opacity:0,
  });
  const ice=new T.Mesh(geometry,material);
  const markings=new T.Group();
  for(let i=0;i<30;i++){
    const x=-15.6+i*1.07+Math.sin(i*1.7)*.26;
    const across=Math.sin(i*2.4)*1.35;
    const z=riverCenter(x)+across;
    for(const [dx,dz] of [[.46,.20],[-.17,.35],[-.35,-.15]]){
      const mark=box(markings,i%3?'#d2edf3':'#9ecfdc',x+dx/2,iceHeight(x,z)+.018,z+dz/2,Math.hypot(dx,dz),.006,.012);
      mark.rotation.y=-Math.atan2(dz,dx);
    }
  }
  compact(markings,ice);
  for(const mark of ice.children){
    mark.material=mark.material.clone();
    mark.material.transparent=true;
    mark.material.depthWrite=false;
  }
  ice.visible=false;
  scene.add(ice);
  return ice;
}
