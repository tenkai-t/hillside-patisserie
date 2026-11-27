export const townBounds = [-16, 16, -62, 15];
export const riverCenter = x => -48 + Math.sin(x * .16) * 1.25;
export const riverHalfWidth = 2.25;
export const bridgeHalfWidth = 1.48;
export const offBridgeChannel = (x,z,r=0) =>
  Math.abs(z-riverCenter(x)) < riverHalfWidth+r && Math.abs(x) > bridgeHalfWidth-r;

export const townHouses = [
  ['bakery',-6.35,7.8,5.0,4.0,3.55,['#ead2c4','#975c69','#ae7583'],Math.PI/2],
  ['cafe',6.9,6,4.75,4.3,3.7,['#eed5ae','#966859','#7a9b9d'],-Math.PI/2],
  ['atelier',-6.5,1.15,4.5,3.9,3.52,['#f0dfb8','#9c7662','#a77b6c'],Math.PI/2],
  ['mintHome',6.45,-.25,4.8,3.7,3.82,['#d4ded1','#7a6b65','#b87d89'],-Math.PI/2],
  ['florist',-11.4,-9.8,4.1,4.4,3.42,['#e8d6af','#926f63','#789ca0'],Math.PI/2],
  ['books',11.0,-7.7,4.4,4.4,4.1,['#ead2c2','#98705d','#a5717d'],-Math.PI/2],
  ['roseHome',-7.5,-19.3,5.9,4.4,4.2,['#e7d6b6','#9c7866','#9f7481'],0],
  ['blueHome',6.9,-19.0,4.9,4.0,3.85,['#e9dbbc','#927468','#789b9a'],0],
  ['eastHome',14.8,1.7,5,4.5,3.6,['#d8dbc4','#8d7b66','#859a9f'],-Math.PI/2],
  ['westHome',-14.5,2.0,5.4,5.3,3.6,['#e9cbbb','#9d7d68','#b2837f'],Math.PI/2],
];
export const hillHouses = [
  ['hillRose',-5.1,-24.9,3.9,3.8,3.25,['#e6ccb3','#99685d','#a67686'],Math.PI/2],
  ['hillMint',5.25,-26.8,3.9,3.8,3.25,['#e3dfc0','#8d6c60','#799b94'],-Math.PI/2],
  ['hillLodge',5.55,-32.6,3.9,3.8,3.25,['#ead5bb','#976b67','#ae7a79'],-Math.PI/2],
];
export const homeIds=['mintHome','roseHome','blueHome','eastHome','westHome','hillRose','hillMint'];
const buildingInfo = {
  bakery:{name:'パティスリー',sign:['お菓子屋','PÂTISSERIE']},
  florist:{name:'花屋',sign:['花と枝','FLEURS']},
  cafe:{name:'坂道の喫茶店',sign:['喫茶店','CAFÉ'],type:'cafe',detail:'木のテーブルに焼き菓子が並んでいます。窓側の席には、午後の光が差し込みます。'},
  atelier:{name:'小さな工房',sign:['小さな工房','ATELIER'],type:'atelier',detail:'作業台に絵の具や陶器が並びます。窓辺には乾かしているうつわが置いてあります。'},
  books:{name:'広場の本屋',sign:['広場の本屋','LIBRAIRIE'],type:'books',detail:'本棚には物語や、花の育て方を書いた本が並んでいます。'},
  mintHome:{name:'ミント色の家',detail:'緑のクッションを置いたソファと、窓辺の鉢植えがあります。'},
  roseHome:{name:'北通りの家',detail:'テーブルには花瓶が置かれています。窓からは北通りの石畳が見えます。'},
  blueHome:{name:'青い屋根の家',detail:'木の棚に小さなうつわが飾ってあります。'},
  eastHome:{name:'東の路地の家',detail:'窓辺の小さなソファに、青いクッションが並んでいます。'},
  westHome:{name:'西の路地の家',detail:'木の机とラグがある静かな居間です。'},
  hillRose:{name:'丘の赤屋根の家',detail:'居間の窓から、坂道を行き来する人を眺められます。'},
  hillMint:{name:'丘の緑屋根の家',detail:'テーブルに花が一輪、窓辺には小さな植木鉢が置いてあります。'},
  hillLodge:{name:'丘の休憩所',type:'cafe',detail:'展望台へ向かう人がひと休みできるよう、窓のそばにテーブルが並んでいます。'},
};
export const entrances = Object.fromEntries([...townHouses,...hillHouses].map(([id,x,z,w,d,,palette,heading])=>{
  const dx=-w*.30,dz=d*.5+.61;
  const doorX=x+dx*Math.cos(heading)+dz*Math.sin(heading);
  const doorZ=z-dx*Math.sin(heading)+dz*Math.cos(heading);
  const point=id==='florist'?{x:-8.50,z:-8.05}:{x:doorX,z:doorZ};
  return [id,{...buildingInfo[id],...point,palette,heading,floors:homeIds.includes(id)?2:1,inside:{x:0,z:3.38,heading:Math.PI}}];
}));
export const flowerPatch = {x:-4.4, z:-55.2};
export const overlook = {x:-6.25, z:-31.8};
export const benches = [
  {x:-4.9,z:-7.0,height:.505}, {x:6.4,z:-11.1,height:.505},
  {x:-4.65,z:10.2,height:.505},
  {x:overlook.x,z:overlook.z-.84,height:.445,backless:true},
];

export function placeName(x,z) {
  if(z < -51)return '川向こうの花畑';
  if(z < -43)return '川沿いの小道';
  if(z < -36)return '街はずれの門';
  if(z < -28 && x < -3)return '坂の上の展望台';
  if(z < -22)return '丘の住宅街';
  if(z < -15)return '花の広場 北通り';
  if(z < -4)return '花の広場';
  return z > 5 ? 'パティスリー前' : '石畳の坂道';
}

export function hitsCollider(x,z,collider,r) {
  const dx=Math.abs(x-collider.x), dz=Math.abs(z-collider.z);
  return collider.r
    ? dx*dx+dz*dz < (collider.r+r)**2
    : dx < collider.a+r && dz < collider.b+r;
}

export function canStand(x,z,area,r=.26,feet=-Infinity,stepUp=0) {
  const [west,east,north,south]=area.bounds;
  if(x < west+r || x > east-r || z < north+r || z > south-r)return false;
  if(area.river && !area.riverFrozen && offBridgeChannel(x,z,r))return false;
  return !area.colliders.some(c => feet+(c.step?stepUp:0) < (c.top ?? Infinity)-.001 && hitsCollider(x,z,c,r));
}

export function supportHeight(x,z,area,maxY,stepUp=0){
  let y=area.height(x,z);
  for(const collider of area.colliders){
    if(collider.top!==undefined && collider.top<=maxY+.001+(collider.step?stepUp:0) && collider.top>y && hitsCollider(x,z,collider,.26)){
      y=collider.top;
    }
  }
  return y;
}
