import {box, disk, ell, group} from './model.js?v=8';
import {flower} from './town.js?v=12';

const wood='#976b55', ivory='#fff0d0', iron='#6a575a';
const books=['#a86869','#77978c','#c39763','#817392','#d4b175'];

const plans = {
  mintHome: [
    {stairs:1,pieces:[['rug',-1.3,.45],['sofa',-2.57,-1.93],['plant',-3.92,-3.48],['desk',-.9,-2.97],['screen',.55,-.93]]},
    {stairs:1,pieces:[['bed',-2.82,-2.0],['shelf',-.58,-3.57],['plant',-4,-3.28],['rug',-1.55,1.2]]},
  ],
  roseHome: [
    {stairs:-1,pieces:[['rug',1.45,.20],['dining',2.25,-.4],['kitchen',2.44,-3.42],['plant',4.0,1.65],['screen',.55,-2.08]]},
    {stairs:-1,pieces:[['bed',2.87,-2.16],['desk',.75,-3.29],['dining',2.2,.50],['rug',1.24,.60]]},
  ],
  blueHome: [
    {stairs:1,pieces:[['rug',-1.4,-.75],['shelf',-2.78,-3.5],['pottery',-2.25,.32],['screen',-3.7,-1.18],['plant',-.5,-3.46]]},
    {stairs:1,pieces:[['desk',-2.97,-2.8],['shelf',-.14,-3.60],['pottery',-2.23,1.1],['rug',-1.93,-.78]]},
  ],
  eastHome: [
    {stairs:-1,pieces:[['sofa',2.69,.82],['shelf',3.15,-3.47],['dining',1.1,-1.95],['rug',2.18,.14],['plant',4.03,-.34]]},
    {stairs:-1,pieces:[['sofa',2.55,-2.78],['shelf',.20,-3.6],['desk',3.28,1.4],['rug',1.39,-.33]]},
  ],
  westHome: [
    {stairs:1,pieces:[['desk',-2.81,1.12],['screen',-1.84,-1.45],['bed',-3.11,-2.25],['shelf',.0,-3.53],['rug',-2.46,.60]]},
    {stairs:1,pieces:[['pottery',-2.84,-.88],['shelf',-2.52,-3.42],['dining',-.65,1.04],['plant',-4.07,-2.55]]},
  ],
  hillRose: [
    {stairs:-1,pieces:[['kitchen',2.16,-3.49],['sofa',2.65,-1.34],['plant',3.88,.36],['rug',1.68,.06],['dining',.85,1.72]]},
    {stairs:-1,pieces:[['bed',2.6,-1.84],['shelf',1.1,-3.47],['desk',3.14,1.39],['rug',1.55,.35]]},
  ],
  hillMint: [
    {stairs:1,pieces:[['plant',-3.9,-3.32],['plant',-3.83,1.75],['pottery',-2.22,-2.48],['dining',-1.05,.65],['screen',-.42,-1.48]]},
    {stairs:1,pieces:[['dining',-2.89,-2.66],['plant',-1.16,-3.6],['sofa',-2.6,1.03],['rug',-1.8,-.10]]},
  ],
};

function furnish(room,colliders,kind,x,z,accent){
  const g=group(room,x,0,z);
  const block=(a,b)=>colliders.push({x,z,a,b});
  if(kind==='rug'){
    box(g,accent,0,.014,0,3.22,.023,2.08);
    box(g,'#e5c9a4',0,.029,0,2.96,.012,1.82);
    return;
  }
  if(kind==='plant'){
    disk(g,'#bd846b',0,.22,0,.26,.40);
    for(const [a,b] of [[0,0],[-.12,.06],[.12,-.08]])flower(g,a,b,.39,ivory,1.55);
    block(.27,.27);
    return;
  }
  if(kind==='screen'){
    for(let i=-1;i<=1;i++){
      box(g,wood,i*.48,.89,0,.49,1.77,.10).rotation.y=i*.14;
      box(g,'#ead7b4',i*.48,.91,.063,.395,1.49,.032).rotation.y=i*.14;
    }
    block(.74,.13);
    return;
  }
  if(kind==='bed'){
    box(g,wood,0,.21,0,1.55,.36,2.05);
    box(g,ivory,0,.44,0,1.48,.22,1.98);
    box(g,accent,0,.57,.33,1.46,.105,1.29);
    box(g,wood,0,.53,-.98,1.55,.98,.12);
    ell(g,'#ffebd2',0,.58,-.61,.55,.10,.23);
    block(.78,1.04);
    return;
  }
  if(kind==='sofa'){
    box(g,wood,0,.20,0,2.23,.35,.86);
    box(g,accent,0,.40,0,2.16,.18,.83);
    box(g,accent,0,.71,-.35,2.23,.54,.19);
    for(const side of [-1,1]){
      box(g,wood,side*1.06,.54,0,.21,.29,.86);
      ell(g,ivory,side*.62,.64,-.20,.22,.17,.10).rotation.z=side*.20;
    }
    block(1.13,.44);
    return;
  }
  if(kind==='shelf'){
    box(g,wood,0,1.01,0,2.04,2.0,.54);
    for(let row=0;row<3;row++){
      box(g,iron,0,.35+row*.58,.296,1.91,.49,.055);
      for(let i=0;i<8;i++)box(g,books[(i+row)%5],(i-3.5)*.22,.34+row*.58,.36,.164,.30+(i%3)*.042,.14);
    }
    block(1.04,.39);
    return;
  }
  if(kind==='kitchen'){
    box(g,accent,0,.43,0,2.8,.86,.74);
    box(g,ivory,0,.90,0,2.86,.11,.81);
    box(g,'#9fb7b1',-.55,.964,0,.65,.027,.47);
    disk(g,'#596970',.76,.97,0,.27,.037);
    disk(g,'#b28b71',-.53,1.09,-.19,.041,.24);
    block(1.43,.42);
    return;
  }
  box(g,wood,0,.73,0,1.54,.14,.92);
  for(const a of [-.63,.63])for(const b of [-.35,.35])box(g,iron,a,.34,b,.11,.69,.11);
  if(kind==='pottery'){
    for(let i=-1;i<=1;i++){
      ell(g,books[i+1],i*.40,.96,0,.137,.17,.137);
      disk(g,ivory,i*.40,1.12,0,.082,.05);
    }
  }else if(kind==='desk'){
    box(g,'#8f94a1',0,.82,0,.57,.04,.34);
    box(g,ivory,0,.85,0,.53,.029,.31);
    box(g,wood,0,.36,.75,.49,.09,.46);
    box(g,iron,0,.18,.75,.11,.35,.11);
    colliders.push({x,z:z+.75,a:.25,b:.24});
  }else{
    disk(g,ivory,0,.823,0,.19,.045);
    flower(g,0,0,.84,'#edb6a9',.95);
  }
  block(.78,.47);
}

export function stairX(id,floor){
  return plans[id]?.[floor-1].stairs*3.52;
}

export function furnishHome(room,colliders,id,floor,accent){
  const {pieces}=plans[id][floor-1];
  for(const piece of pieces)furnish(room,colliders,...piece,accent);
  const x=stairX(id,floor);
  // The visible flight leads to the landing in the other floor's scene.
  const direction=floor===1?1:-1;
  for(let i=0;i<11;i++){
    const y=direction*(.20+i*.225);
    const z=1.28-i*.31;
    box(room,wood,x,y-.09,z,1.33,.18,.313);
    box(room,ivory,x,y-.026,z+.138,1.37,.052,.057);
    if(floor===1)colliders.push({x,z,a:.67,b:.156,top:y,step:true});
  }
  for(const side of [-1,1]){
    for(let i=0;i<4;i++){
      const h=direction*(.20+i*.75),z=1.31-i*1.03;
      box(room,wood,x+side*.69,h+.32,z,.10,.72,.10);
    }
    box(room,wood,x+side*.69,1.16*direction+.32,-.23,.11,.11,3.86).rotation.x=direction*.64;
  }
  if(floor===2)colliders.push({x,z:-.24,a:.71,b:1.68});
  return {x,z:1.99};
}
