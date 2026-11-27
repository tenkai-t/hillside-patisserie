import * as T from './vendor/three.module.min.js';
import {box, disk, ell, group, pastry} from './model.js?v=9';
import {compact, flower} from './town.js?v=12';
import {furnishHome, stairX} from './homes.js?v=12';
import {entrances} from './places.js?v=12';

const cream='#f3ddbc', oak='#986957', dark='#695052', brass='#d8ad6b';
const glass=new T.MeshPhongMaterial({color:'#d9f4f1', transparent:true, opacity:.22, depthWrite:false, shininess:85});

function furniture(room,x,z,w,d,height,color=oak) {
  box(room,color,x,height-.065,z,w,.13,d);
  for(const i of [-1,1])for(const j of [-1,1]) {
    box(room,dark,x+i*(w/2-.10),height*.45,z+j*(d/2-.10),.12,height*.90,.12);
  }
}

function displayWindow(room,x,y) {
  box(room,dark,x,y,-4.43,2.22,1.75,.14);
  box(room,'#a8ccc5',x,y,-4.34,1.99,1.52,.046);
  box(room,'#d5e5d7',x+.38,y+.25,-4.31,.65,.83,.026).rotation.z=-.22;
  box(room,cream,x,y,-4.26,.061,1.52,.07);
  box(room,cream,x,y,-4.26,2,.066,.07);
  box(room,oak,x,y-.85,-4.22,2.32,.13,.29);
}

function pendant(room,x,z) {
  disk(room,dark,x,3.06,z,.025,.42);
  ell(room,'#e5b582',x,2.82,z,.27,.10,.27);
  ell(room,'#fff0b2',x,2.75,z,.182,.064,.182);
}

function cabinets(room,florist) {
  const count=florist?7:6;
  for(let i=0;i<count;i++){
    const x=-3.5+i*(7/(count-1));
    box(room,oak,x,.50,-3.78,.82,.99,.67);
    box(room,cream,x,1.01,-3.77,.84,.10,.74);
    box(room,'#b7886c',x,.51,-3.43,.68,.77,.036);
    ell(room,brass,x+.22,.62,-3.39,.046,.027,.02);
    if(florist){
      const color=['#dd8b9c','#eee0a5','#b5a2d0'][i%3];
      disk(room,'#b47d63',x,1.12,-3.78,.14,.22);
      flower(room,x,-3.70,1.22,color,1.45);
      flower(room,x-.087,-3.79,1.21,color,1.17);
    }
  }
}

export function buildInterior(id, root, floor=1) {
  const entrance=entrances[id];
  const florist=id==='florist', bakery=id==='bakery';
  const [,trim,roof]=entrance.palette;
  const room=new T.Group();
  const wall=florist?'#dce5cb':bakery?'#f2d5c9':entrance.palette[0];
  const stairs=entrance.floors===2;
  const openingX=stairs?stairX(id,floor):0;
  const cabinetry=florist?'#739179':bakery?'#ab737c':roof;
  function base(color,y,h,opening){
    if(!opening){
      box(room,color,0,y,0,10.1,h,9.1);
      return;
    }
    for(const [left,right] of [[-5.05,openingX-.70],[openingX+.70,5.05]]){
      box(room,color,(left+right)/2,y,0,right-left,h,9.10);
    }
    box(room,color,openingX,y,-3.24,1.40,h,2.62);
    box(room,color,openingX,y,3.03,1.40,h,3.04);
  }
  base(dark,-.092,.17,floor===2);
  for(let i=0;i<20;i++)for(let j=0;j<6;j++){
    if(floor===2 && Math.abs((i-9.5)*.50-openingX)<.92 && j>=1&&j<=3)continue;
    box(room,['#bc8e6a','#cc9f78','#d4a782'][(i*7+j*11)%3],(i-9.5)*.50,-.019,(j-2.5)*1.5,.496,.035,1.49);
  }
  for(const x of [-5,5]){
    box(room,wall,x,1.64,0,.18,3.28,9.15);
    box(room,cabinetry,x, .46,0,.21,.92,9.04);
    box(room,cream,x,.94,0,.24,.075,9.05);
  }
  for(const z of [-4.5,4.5]){
    box(room,wall,0,1.64,z,10,3.28,.17);
    box(room,cabinetry,0,.46,z,9.95,.92,.21);
    box(room,cream,0,.94,z,9.97,.075,.24);
  }
  base('#efdfc5',floor===1&&stairs?2.63:3.31,.12,floor===1&&stairs);
  if(!(floor===1&&stairs))for(const z of [-3,0,3])box(room,oak,0,3.15,z,9.88,.16,.21);
  for(const x of [-2.7,2.7])displayWindow(room,x,floor===1&&stairs?1.67:2.03);
  if(!(floor===1&&stairs))for(const x of [-2.1,2.1])pendant(room,x,-.40);
  if(bakery||florist)cabinets(room,florist);

  if(floor===1){
    box(room,cream,0,1.08,4.35,1.48,2.15,.13);
    box(room,florist?'#64867a':bakery?'#925e6c':trim,0,1.05,4.25,1.26,2.03,.08);
    box(room,'#a7c5b5',0,1.39,4.195,.71,.84,.055);
    box(room,cream,0,1.39,4.16,.04,.84,.038);
    box(room,cream,0,1.39,4.16,.71,.04,.038);
    ell(room,brass,.42,.98,4.15,.059,.049,.034);
    box(room,cabinetry,0,.001,3.59,1.85,.015,1.16);
    for(const x of [-.82,.82])box(room,cream,x,.012,3.59,.042,.011,1.08);
  }

  const colliders=[];
  let landing;
  if(bakery||florist)colliders.push({x:0,z:-3.78,a:4.1,b:.43});
  if(florist){
    for(const [x,z] of [[-2.65,.05],[2.65,-.03]]){
      furniture(room,x,z,1.86,1.34,.80,'#8b6b57');
      colliders.push({x,z,a:.93,b:.67});
      for(let i=0;i<5;i++){
        const px=x+(i-2)*.33;
        disk(room,i%2?'#cc9d75':'#e5c49b',px,.91,z,.142,.22);
        flower(room,px,z,1.02,i%2?'#d886a3':'#ecdca8',1.29);
      }
    }
    for(const x of [-4.21,4.21]){
      disk(room,'#c99570',x,.19,2.92,.27,.38);
      for(let i=0;i<5;i++){
        flower(room,x+Math.cos(i)*.12,2.92+Math.sin(i)*.13,.34,'#e6b2bb',2.1);
      }
      colliders.push({x,z:2.92,r:.29});
    }
  } else if(bakery){
    box(room,cabinetry,-2.45,.45,-.72,3.32,.90,1.00);
    box(room,cream,-2.45,.94,-.72,3.46,.11,1.12);
    for(const z of [-1.21,-.22]){
      box(room,oak,-2.45,1.55,z,3.43,.06,.06);
      for(const x of [-4.13,-.77])box(room,oak,x,1.25,z,.062,.66,.069);
    }
    box(room,cream,-2.45,1.58,-.72,3.42,.048,1.04);
    for(let i=0;i<12;i++)pastry(room,-3.87+(i%6)*.54,1.0,-.48-Math.floor(i/6)*.45,i%3,1.7);
    box(room,dark,2.25,.58,-3.45,1.12,1.15,.58);
    box(room,'#c99673',2.25,.45,-3.13,.76,.60,.075);
    box(room,'#594654',2.25,.45,-3.08,.53,.42,.04);
    ell(room,brass,2.25,.72,-3.03,.16,.023,.019);
    for (const [x,z] of [[2.6,1.52],[2.55,-1.25]]){
      furniture(room,x,z,1.52,1.06,.81);
      colliders.push({x,z,a:.76,b:.53});
      disk(room,'#f0dbb2',x,.828,z,.19,.025);
      pastry(room,x,.846,z,z>0?0:1,1.55);
    }
    colliders.push({x:-2.45,z:-.72,a:1.73,b:.57},{x:2.25,z:-3.45,a:.56,b:.30});
  } else if(stairs){
    landing=furnishHome(room,colliders,id,floor,roof);
  } else {
    furnishRoom(room,colliders,entrance.type,roof);
  }
  compact(room,root);
  if(bakery){
    const pane=new T.Mesh(new T.BoxGeometry(3.31,.58,.023),glass);
    pane.position.set(-2.45,1.27,-.186);
    root.add(pane);
    pane.renderOrder=2;
  }
  return {root, name:entrance.name+(stairs?` ${floor}階`:bakery||florist?'の店内':'の中'),
    height:()=>0, ceiling:floor===1&&stairs?2.55:3.03, floor, landing,
    bounds:[-4.92,4.92,-4.42,4.42], colliders};
}

function furnishRoom(room,colliders,type,accent) {
  const bookColors=['#a76a75','#729391','#bf9673','#d0ad71','#807491','#8c9e73'];
  if(type==='books'){
    for(const x of [-2.70,0,2.70]){
      box(room,dark,x,1.26,-3.91,2.34,2.51,.66);
      for(const y of [.25,.91,1.56,2.22]){
        box(room,oak,x,y,-3.58,2.31,.088,.18);
        if(y>2)continue;
        for(let i=0;i<10;i++){
          const h=.31+((i*3)%5)*.043;
          const book=box(room,bookColors[(i+Math.round(y*7))%6],x+(i-4.5)*.197,y+h*.5+.05,-3.42,.163,h,.30);
          book.rotation.z=i%4===0?.07:0;
        }
      }
      colliders.push({x,z:-3.76,a:1.18,b:.50});
    }
    furniture(room,-2.15,-.65,2.15,.97,.81);
    box(room,'#718b84',-2.17,.824,-.62,.46,.027,.31).rotation.y=.18;
    box(room,'#fff1cf',-2.17,.845,-.62,.42,.021,.28).rotation.y=.18;
    colliders.push({x:-2.15,z:-.65,a:1.08,b:.49});
    return;
  }

  if(type==='cafe'||type==='atelier'){
    const cafe=type==='cafe';
    for(const [x,z] of [[-2.45,-1.1],[2.42,-1.0]]){
      furniture(room,x,z,1.96,1.29,.84,oak);
      colliders.push({x,z,a:.98,b:.65});
      if(cafe){
        for(const side of [-1,1]){
          disk(room,'#e9caaa',x+side*.59,.419,z+.97,.25,.085);
          disk(room,dark,x+side*.59,.20,z+.97,.046,.38);
          colliders.push({x:x+side*.59,z:z+.97,r:.26});
        }
        disk(room,'#fff1cd',x,.856,z,.23,.032);
        pastry(room,x,.87,z,x>0?1:0,1.6);
      }else{
        for(let i=0;i<5;i++){
          const color=bookColors[i];
          disk(room,color,x+(i-2)*.28,.96,z,.106,.24);
          disk(room,cream,x+(i-2)*.28,1.09,z,.100,.029);
        }
      }
    }
    box(room,accent,0,.46,-3.65,4.65,.91,.76);
    box(room,cream,0,.96,-3.65,4.72,.10,.83);
    for(let i=0;i<7;i++){
      const x=(i-3)*.54;
      if(cafe)pastry(room,x,1.01,-3.65,i%3,1.48);
      else ell(room,bookColors[i%6],x,1.17,-3.65,.127,.164,.124);
    }
    colliders.push({x:0,z:-3.65,a:2.34,b:.43});
    return;
  }

}
