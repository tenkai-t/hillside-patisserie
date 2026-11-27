import * as T from './vendor/three.module.min.js';
import {normalizeAppearance, outfits, hairColors, eyeColors} from './wardrobe.js?v=9';

export const townsperson = Object.freeze({
  faceY:1.58, faceWidth:.157, faceHeight:.179, faceDepth:.144,
});

export function buildTownFace(parent, skinColor, options) {
  const {faceWidth, faceHeight, faceDepth}=townsperson;
  const surface=(x,y)=>faceDepth*Math.sqrt(1-(x/faceWidth)**2-(y/faceHeight)**2);
  ell(parent,skinColor,0,0,0,faceWidth,faceHeight,faceDepth,true);
  const eyeColor=options
    ? '#'+new T.Color(options.base).lerp(new T.Color('#37272f'),.62).getHexString()
    : '#473a47';
  for(const sign of [-1,1]){
    const x=sign*.062,y=.022;
    const eye=group(parent,x,y,surface(x,y));
    eye.rotation.y=sign*.33;
    ell(eye,eyeColor,0,0,0,.017,.025,.009,true);
    if(options){
      ell(eye,'#fff5e9',-.005,.008,.008,.0039,.0046,.0023,true);
      const blush=new T.CircleGeometry(1,24);
      const positions=blush.attributes.position;
      for(let i=0;i<positions.count;i++){
        const x=sign*.102+positions.getX(i)*.020;
        const y=-.026+positions.getY(i)*.008;
        positions.setXYZ(i,x,y,surface(x,y)+.0012);
      }
      blush.computeVertexNormals();
      mesh(parent,blush,'#f4b6a8',0,0,0,true);
    }
  }
  const smile=[[-.023,-.052],[-.012,-.059],[0,-.061],[.012,-.059],[.023,-.052]];
  tube(parent,'#985864',smile.map(([x,y])=>[x,y,surface(x,y)+.003]),.0042,true);
}

const mats = new Map();
const unit = new T.SphereGeometry(1, 20, 14);
const scenerySphere = new T.SphereGeometry(1, 12, 8);
const cube = new T.BoxGeometry(1, 1, 1);
const cylinder = new T.CylinderGeometry(1, 1, 1, 24);
const toonRamp = new T.DataTexture(new Uint8Array([115, 179, 235, 255]), 4, 1, T.RedFormat);
toonRamp.minFilter = toonRamp.magFilter = T.NearestFilter;
toonRamp.needsUpdate = true;

export function mesh(parent, geometry, color, x=0, y=0, z=0, toon=false) {
  const key = color + String(toon);
  if (!mats.has(key)) {
    mats.set(key, toon ? new T.MeshToonMaterial({color, gradientMap:toonRamp, side:T.DoubleSide}) :
      new T.MeshLambertMaterial({color, side:T.DoubleSide}));
  }
  const obj = new T.Mesh(geometry, mats.get(key));
  obj.position.set(x,y,z);
  parent.add(obj);
  return obj;
}
export function group(parent,x=0,y=0,z=0) {
  const obj = new T.Group();
  obj.position.set(x,y,z);
  parent.add(obj);
  return obj;
}
export function ell(parent,color,x,y,z,a,b,c,toon=false) {
  const obj=mesh(parent,toon?unit:scenerySphere,color,x,y,z,toon);
  obj.scale.set(a,b,c);
  return obj;
}
export function box(parent,color,x,y,z,a,b,c) {
  const obj=mesh(parent,cube,color,x,y,z);
  obj.scale.set(a,b,c);
  return obj;
}
export function disk(parent,color,x,y,z,a,h,b=a,toon=false) {
  const obj=mesh(parent,cylinder,color,x,y,z,toon);
  obj.scale.set(a,h,b);
  return obj;
}
export function tube(parent,color,points,r,toon=false) {
  const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
  return mesh(parent,new T.TubeGeometry(curve,Math.max(8,points.length*4),r,7,false),color,0,0,0,toon);
}
function relief(parent,color,points,z) {
  const path=new T.Shape();
  path.moveTo(...points[0]);
  for (const [a,b,c,d] of points.slice(1)) path.quadraticCurveTo(a,b,c,d);
  path.closePath();
  return mesh(parent,new T.ShapeGeometry(path,14),color,0,0,z,true);
}

export function pastry(parent,x,y,z,kind,scale=1) {
  const item=group(parent,x,y,z);
  item.scale.setScalar(scale);
  const fruit=['#d74949','#344579','#f1a040'][kind];
  disk(item,'#cf8850',0,.023,0,.068,.046,.068,true);
  disk(item,kind===1?'#e4b376':'#f7e5bb',0,.055,0,.064,.022,.064,true);
  if(kind!==1) {
    disk(item,fruit,0,.074,0,.066,.017,.066,true);
    disk(item,'#fff3d8',0,.09,0,.067,.017,.067,true);
  }
  for(let i=0;i<6;i++) {
    const a=i*Math.PI/3;
    ell(item,kind===1?fruit:'#fff3e6',Math.cos(a)*.037,.106,Math.sin(a)*.037,.024,.022,.024,true);
  }
  ell(item,fruit,0,.132,0,.026,kind===0?.039:.026,.025,true);
  const leaf=ell(item,'#659747',.016,.153,-.004,.024,.007,.009,true);
  leaf.rotation.z=.45;
  return item;
}

function ribbon(parent,x,y,z,color,size) {
  const g=group(parent,x,y,z);
  g.scale.setScalar(size);
  for (const sign of [-1,1]) {
    ell(g,color,sign*.075,.025,0,.082,.041,.025,true).rotation.z=sign*.25;
    box(g,color,sign*.052,-.055,-.002,.048,.129,.019).rotation.z=sign*.31;
  }
  ell(g,color,0,0,.016,.033,.029,.024,true);
  return g;
}
function blossom(parent,x,y,z,s) {
  for(let i=0;i<5;i++){
    const a=i*Math.PI*.4;
    ell(parent,'#fff0d7',x+Math.cos(a)*s*.62,y+Math.sin(a)*s*.62,z,s*.54,s*.6,s*.31,true);
  }
  ell(parent,'#d8a662',x,y,z+s*.20,s*.37,s*.37,s*.3,true);
}
const skin='#ffd5bd', gold='#dca965';
const figureWidth=.88, figureHeight=.86;
const shoeClearance=.023;
const playerHeadX=townsperson.faceWidth/(.206*figureWidth);
const playerHeadY=townsperson.faceHeight/(.229*figureHeight);

function dressBand(parent, color, rings, phase=0) {
  const vertices=[], indexes=[];
  const segments=64;
  for(const [height,rx,rz,pleat] of rings) {
    for(let i=0;i<=segments;i++) {
      const a=i/segments*Math.PI*2;
      const wave=1+Math.cos(a*12+phase)*pleat;
      vertices.push(Math.sin(a)*rx*wave,height+(Math.cos(a*12+phase)-.3)*pleat*.15,Math.cos(a)*rz*wave);
    }
  }
  for(let j=0;j<rings.length-1;j++) for(let i=0;i<segments;i++) {
    const n=j*(segments+1)+i;
    indexes.push(n,n+1,n+segments+1,n+1,n+segments+2,n+segments+1);
  }
  const geo=new T.BufferGeometry();
  geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
  geo.setIndex(indexes);geo.computeVertexNormals();
  return mesh(parent,geo,color,0,0,0,true);
}
function face(root, appearance, {main, dark, accent, light}) {
  const {base:hair, shade:hairShade, shine:hairShine}=hairColors[appearance.hairColor];
  const eyes=eyeColors[appearance.eyeColor];
  const headY=(townsperson.faceY+shoeClearance)/figureHeight-.015*playerHeadY;
  const head=group(root,0,headY,.015), h=group(head);
  head.scale.set(playerHeadX,playerHeadY,.88);
  if(appearance.hairstyle==='bob'){
    ell(h,hairShade,0,-.08,-.083,.241,.228,.188,true);
    for(const sign of [-1,1]){
      ell(h,hair,sign*.179,-.096,.008,.076,.197,.105,true).rotation.z=-sign*.10;
      ell(h,hairShine,sign*.205,-.066,.089,.024,.088,.020,true).rotation.z=-sign*.10;
    }
  }
  if(appearance.hairstyle==='ponytail'){
    ell(h,accent,0,.101,-.237,.075,.058,.053,true);
    ell(h,hair,0,-.051,-.282,.110,.163,.095,true).rotation.x=.29;
    ell(h,hairShade,.017,-.184,-.317,.072,.162,.063,true).rotation.z=.24;
    ell(h,hairShine,-.039,-.055,-.347,.039,.111,.023,true).rotation.x=.25;
  }
  if(appearance.hairstyle==='sideUpdo'){
    const bun=group(h,.182,-.075,-.143);
    ell(bun,hairShade,0,0,0,.123,.124,.135,true);
    ell(bun,hair,.026,.017,.020,.111,.096,.119,true).rotation.z=.58;
    for(let i=0;i<3;i++){
      const x=-.028+i*.043;
      tube(bun,hairShine,[[x,.091,.042],[x+.021,.049,.102],[x+.026,-.014,.121],[x+.012,-.072,.089]],.007,true);
    }
    const knot=ribbon(h,.263,-.023,-.040,'#b7403c',.76);
    knot.rotation.set(.10,.46,.36);
    for(const sign of [-1,1]){
      ell(knot,gold,sign*.072,-.120,.008,.022,.022,.019,true);
      ell(knot,'#a33535',sign*.080,-.166,.010,.024,.042,.022,true);
    }
    tube(h,hair,[[.149,.126,.125],[.192,.021,.153],[.168,-.088,.133],[.185,-.199,.153]],.016,true);
  }
  ell(h,hairShade,0,.05,-.054,.245,.269,.215,true);
  const features=group(h,0,.015,.022);
  features.scale.set(.206/townsperson.faceWidth,.229/townsperson.faceHeight,.187/townsperson.faceDepth);
  buildTownFace(features,skin,appearance.eyeColor==='black'?null:eyes);
  ell(h,hair,0,.15,-.048,.245,.168,.208,true).rotation.z=.08;
  for(const sign of [-1,1]){
    ell(h,skin,sign*.196,-.027,.025,.055,.074,.048,true);
    if(appearance.hairstyle==='buns'){
      const bun=group(h,sign*.207,-.094,-.080);
      ell(bun,hair,0,0,0,.117,.107,.114,true).rotation.z=sign*.4;
      for(let line=0;line<4;line++){
        const shift=(line-1.5)*.036;
        tube(bun,line%2?hairShine:hairShade,[[shift,.074,.052],[shift+sign*.035,.032,.089],[shift+sign*.031,-.032,.093],[shift-sign*.005,-.082,.048]],.008,true);
      }
      blossom(bun,sign*.01,.061,.088,.036);
      blossom(bun,-sign*.044,.073,.079,.024);
    }
    const lock=ell(h,hair,sign*.179,.063,.087,.055,.160,.070,true);
    lock.rotation.z=sign*-.23;
    tube(h,hairShine,[[sign*.158,.20,.108],[sign*.202,.114,.139],[sign*.191,.01,.138],[sign*.162,-.08,.153]],.007,true);
  }
  for(const [x,y,z,a,b,c,rot] of [
    [-.116,.149,.137,.067,.139,.082,-.48],[-.055,.155,.172,.063,.133,.071,-.25],
    [.011,.169,.166,.057,.127,.067,-.23],[.087,.182,.133,.053,.103,.060,.69],[.136,.149,.121,.057,.093,.076,.63]
  ]){
    const strand=ell(h,hair,x,y+.025,z,a,b*.92,c*.91,true);
    strand.rotation.z=rot;
    const sheen=ell(h,hairShine,x-.012,y+.048,z+c*.83,a*.29,b*.33,c*.12,true);
    sheen.rotation.z=rot;
  }
  for(const [yy,ang] of [[.139,-.58],[.158,.56]]) {
    const pin=box(h,gold,.137,yy,.191,.060,.009,.011);pin.rotation.z=ang;pin.rotation.y=.3;
  }
  if(appearance.outfit==='patisserie'){
    const hat=group(h,-.069,.241,-.009);
    hat.rotation.set(-.11,-.18,.34);
    ell(hat,light,0,.024,-.023,.248,.087,.207,true);
    ell(hat,main,0,.056,-.029,.243,.083,.194,true);
    for(let i=0;i<19;i++){
      const a=.18+i*.153;
      ell(hat,light,Math.cos(a)*.238,.005,Math.sin(a)*.189,.032,.026,.029,true).rotation.y=-a;
    }
    ribbon(hat,-.209,-.014,.079,accent,.76).rotation.z=.42;
    ell(hat,gold,-.175,-.003,.12,.030,.030,.011,true);
  } else if(appearance.outfit==='garden'){
    blossom(h,-.195,.118,.134,.051);
    blossom(h,-.220,.061,.118,.033);
  } else if(appearance.outfit==='evening'){
    ribbon(h,-.184,.106,.085,accent,.59).rotation.z=.49;
  }
  return head;
}

function plover(parent, scale) {
  const bird=group(parent);
  bird.scale.setScalar(scale);
  ell(bird,'#fff2dc',0,0,.007,.043,.027,.008,true).rotation.z=.18;
  ell(bird,'#dbc4a8',-.007,.006,.014,.027,.013,.004,true).rotation.z=.35;
  ell(bird,'#fff4e1',.032,.025,.010,.022,.021,.006,true);
  ell(bird,'#4d3436',.039,.029,.016,.005,.005,.003,true);
  ell(bird,'#c98c69',.054,.02,.011,.012,.005,.004,true);
  for(const x of [-.013,.008]){
    tube(bird,'#ebaf67',[[x,-.017,.008],[x+.004,-.034,.009],[x+.014,-.039,.009]],.0035,true);
  }
}

function waves(parent, scale) {
  const foam=group(parent);
  foam.scale.setScalar(scale);
  for(const offset of [0,.018]){
    tube(foam,'#fff0de',[[-.054,offset,.004],[-.018,.030+offset,.009],[.019,.038+offset,.010],[.056,.022+offset,.004]],.0038,true);
  }
}

function buildYukata(body, outfit) {
  const {main, dark, light, accent}=outfit;
  const hem=group(body,0,1.13,0);
  dressBand(hem,main,[[-.888,.213,.161,.029],[-.849,.220,.169,.026],[-.61,.232,.154,.020],[-.33,.228,.148,.025],[-.11,.212,.145,.026],[.0,.175,.131,.018]],.48);
  dressBand(hem,'#9b3d3e',[[-.891,.212,.160,.029],[-.869,.218,.168,.027]],.48);
  tube(hem,'#923b38',[[.110,-.015,.106],[.124,-.25,.130],[.128,-.53,.134],[.168,-.866,.117]],.005,true);
  for(const [angle,y,bird] of [
    [-.54,-.16,true],[.65,-.29,false],[-.73,-.41,false],[.24,-.53,true],
    [-.50,-.70,true],[.66,-.78,false],[2.55,-.18,false],[3.33,-.35,true],
    [2.65,-.53,false],[3.49,-.74,true],[-1.65,-.59,true],[1.63,-.49,false],
  ]){
    const motif=group(hem,Math.sin(angle)*.232,y,Math.cos(angle)*.162);
    motif.rotation.y=angle;
    if(bird)plover(motif,1.06);
    else waves(motif,1.02);
  }

  dressBand(body,main,[[1.11,.180,.129,.01],[1.27,.192,.149,.02],[1.43,.189,.139,.02],[1.52,.184,.110,.01],[1.59,.145,.095,.01],[1.643,.080,.069,0]]);
  disk(body,skin,0,1.674,0,.067,.122,.063,true);
  tube(body,light,[[-.086,1.625,.057],[-.064,1.56,.105],[-.030,1.505,.135],[.025,1.444,.147]],.016,true);
  tube(body,light,[[.084,1.625,.057],[.063,1.555,.109],[.021,1.476,.141],[-.069,1.369,.150],[-.156,1.273,.103]],.016,true);
  tube(body,'#a13b36',[[.067,1.497,.130],[-.010,1.376,.154],[-.132,1.25,.122]],.009,true);
  const frontBird=group(body,.094,1.393,.137);
  frontBird.rotation.y=.4;
  plover(frontBird,.83);
  const frontWave=group(body,-.101,1.341,.135);
  frontWave.rotation.y=-.35;
  waves(frontWave,.66);

  dressBand(body,dark,[[1.106,.189,.144,.011],[1.124,.203,.161,.012],[1.25,.204,.169,.008],[1.277,.199,.160,.006]]);
  dressBand(body,'#da6d5c',[[1.175,.207,.172,.014],[1.195,.208,.173,.014]]);
  ribbon(body,.067,1.187,.179,accent,.63).rotation.z=-.22;
  ribbon(body,0,1.201,-.170,dark,1.23).rotation.y=Math.PI;
  for(const sign of [-1,1])ell(body,gold,.074+sign*.041,1.10,.17,.010,.013,.010,true);
  return hem;
}

function candiedApple(hand) {
  const apple=group(hand,-.018,-.233,.035);
  apple.rotation.set(.78,0,-.16);
  disk(apple,'#bb8955',0,.041,0,.012,.168,.012,true);
  ell(apple,'#9c1c24',0,.139,0,.067,.069,.062,true);
  ell(apple,'#e62d24',0,.152,.008,.063,.062,.059,true);
  ell(apple,'#ffae91',-.025,.175,.057,.016,.010,.005,true).rotation.z=.42;
  ell(apple,'#fff3de',-.027,.177,.059,.009,.008,.003,true);
}

export function buildPlayer(parent, choices) {
  const appearance=normalizeAppearance(choices);
  const outfit=outfits[appearance.outfit];
  const {light:cream, accent:pink, main:burgundy, dark:apronColor}=outfit;
  const yukata=appearance.outfit==='yukata';
  const festival=appearance.character==='festival';
  const dark=appearance.outfit==='garden'?'#655044':apronColor;
  const shoeColor=appearance.outfit==='patisserie'?'#493c3a':dark;
  const root=group(parent);
  const figure=group(root,0,-shoeClearance,0);
  figure.scale.set(figureWidth,figureHeight,.88);
  const legs=[], knees=[];
  for(const sign of [-1,1]){
    const thigh=group(figure,sign*(yukata?.085:.124),.93,0);
    const shin=group(thigh,0,-.46,0);
    knees.push(shin);
    if(yukata){
      ell(thigh,skin,0,-.235,0,.061,.255,.063,true);
      ell(shin,skin,0,-.187,0,.058,.201,.063,true);
      ell(shin,skin,0,-.373,.044,.066,.043,.111,true);
      ell(shin,'#74504a',0,-.407,.040,.079,.034,.117,true);
      for(const side of [-1,1]){
        tube(shin,pink,[[0,-.335,.112],[side*.032,-.342,.078],[side*.059,-.361,.037]],.012,true);
      }
      legs.push(thigh);
      continue;
    }
    ell(thigh,skin,0,-.27,0,.067,.280,.068,true);
    ell(shin,cream,0,-.19,0,.068,.22,.073,true);
    const shoe=ell(shin,shoeColor,0,-.376,.061,.086,.058,.144,true);
    shoe.rotation.x=-.07;
    box(shin,shoeColor,0,-.406,-.042,.113,.075,.090);
    disk(shin,burgundy,0,-.314,.014,.072,.028,.088,true);
    ribbon(shin,0,-.340,.155,pink,.29).rotation.x=-.26;
    box(shin,gold,sign*.045,-.297,.052,.027,.027,.02);
    legs.push(thigh);
  }
  const body=group(figure);
  const skirt=yukata?buildYukata(body,outfit):buildDress(body,appearance.outfit,outfit,dark);
  const arms=[];
  for(const sign of [-1,1]){
    const arm=group(body,sign*.177,1.505,.002);
    if(yukata){
      ell(arm,burgundy,sign*.021,-.131,.004,.072,.187,.076,true).rotation.z=sign*.18;
      ell(arm,burgundy,sign*.047,-.263,-.008,.089,.200,.092,true).rotation.z=sign*.17;
      const sleeveBird=group(arm,sign*.058,-.276,.097);
      plover(sleeveBird,.70);
      const sleeveWave=group(arm,sign*.045,-.355,.069);
      waves(sleeveWave,.69);
    } else {
      ell(arm,cream,sign*.030,-.117,.006,.070,.176,.077,true).rotation.z=sign*.25;
    }
    const fore=group(arm,sign*.060,-.225,.023);
    fore.rotation.x=sign===1?-1.30:festival?-.72:-.17;
    ell(fore,yukata?burgundy:cream,0,-.090,.011,.066,.133,.067,true);
    disk(fore,yukata?'#9b3d3b':'#edd2b7',0,-.186,0,.053,.047,.057,true);
    if(!yukata)for(let i=0;i<6;i++){
      const a=i*Math.PI/3;
      ell(fore,cream,Math.sin(a)*.046,-.190,Math.cos(a)*.046,.019,.024,.019,true);
    }
    ell(fore,skin,0,-.243,.001,.041,.061,.027,true);
    ell(fore,skin,-sign*.031,-.239,.018,.016,.033,.016,true).rotation.z=sign*.5;
    if(sign===-1&&festival){
      arm.rotation.x=-.14;
      candiedApple(fore);
    }
    arms.push({arm,fore});
  }
  const tray=group(body,.247,1.372,.287);
  disk(tray,'#707786',0,0,0,.244,.029,.204,true);
  disk(tray,'#c9c7ce',0,.013,0,.229,.018,.192,true);
  disk(tray,'#a5a5b0',0,.026,0,.211,.011,.178,true);
  const cakes=group(tray);
  for(const [x,z,i] of [[-.128,.034,0],[.009,-.042,1],[.136,.032,2]]) pastry(cakes,x,.032,z,i,.82);
  const head=face(body,appearance,outfit);
  return {root, head, body, legs, knees, arms, skirt, tray, cakes, yukata, festival,
    hipHeight:.93*figureHeight-shoeClearance};
}

export function poseSeated(model, seated) {
  for(const [i,leg] of model.legs.entries()){
    leg.position.y=.93;
    leg.rotation.x=seated?-1.37:0;
    model.knees[i].rotation.x=seated?1.39:0;
  }
  model.body.position.y=0;
  model.body.rotation.set(0,0,0);
  model.skirt.position.y=seated?1.04:model.yukata?1.13:1.12;
  model.skirt.rotation.set(seated?(model.yukata?-.72:-.93):0,0,0);
  model.skirt.scale.y=seated&&model.yukata?.63:1;
  model.arms[0].arm.rotation.set(seated?-.28:0,0,0);
  model.arms[1].arm.rotation.set(seated?-.32:0,0,0);
  model.arms[1].fore.rotation.x=seated?-.22:-1.30;
  model.tray.visible=!seated;
}

function buildDress(body, outfitName, outfit, dark) {
  const {light:cream, accent:pink, main:burgundy, dark:apronColor}=outfit;
  const skirt=group(body,0,1.12,0);
  dressBand(skirt,cream,[[-.477,.432,.337,.11],[-.435,.412,.321,.10],[-.38,.38,.290,.08]]);
  dressBand(skirt,burgundy,[[-.445,.438,.340,.082],[-.399,.426,.329,.078],[-.339,.390,.309,.082],[-.18,.311,.241,.070],[.0,.185,.122,.018]]);
  dressBand(skirt,pink,[[-.383,.419,.328,.078],[-.352,.406,.319,.081]]);
  dressBand(skirt,dark,[[-.447,.436,.338,.082],[-.418,.432,.332,.080]]);
  // Apron curves around the front of the skirt and has a raised scalloped border.
  const apron=group(skirt,0,-.08,.154);
  const points=[[-.133,.077],[-.097,.11,.135,.089],[.226,-.052,.254,-.228],[.162,-.295,0,-.283],[-.173,-.288,-.249,-.240],[-.226,-.045,-.133,.077]];
  function apronPanel(color, scale, layer) {
    const panel=relief(apron,color,points,0);
    const pos=panel.geometry.attributes.position;
    for(let i=0;i<pos.count;i++){
      const x=pos.getX(i)*scale,y=pos.getY(i)*scale;
      pos.setXYZ(i,x,y,.089-y*.39-x*x*.75+layer);
    }
    panel.geometry.computeVertexNormals();
  }
  if(outfitName!=='evening'){
    apronPanel(pink,1.09,0);
    apronPanel(apronColor,1,.006);
    for(const sign of [-1,1]){
      const pocket=box(apron,burgundy,sign*.109,-.105,.134,.092,.086,.016);pocket.rotation.z=sign*.14;
      const lip=box(apron,pink,sign*.109,-.065,.129,.096,.010,.017);lip.rotation.z=sign*.14;
      ell(apron,gold,sign*.109,-.082,.140,.011,.011,.006,true);
    }
  }
  const waist=disk(body,pink,0,1.133,0,.195,.041,.128,true);waist.rotation.z=.015;
  ribbon(body,.070,1.120,.150,cream,.64);
  ribbon(body,0,1.13,-.13,pink,1.05).rotation.y=Math.PI;
  ell(body,cream,0,1.377,.009,.181,.274,.141,true);
  ell(body,burgundy,0,1.254,.043,.184,.140,.122,true);
  for(const sign of [-1,1]){
    tube(body,burgundy,[[sign*.113,1.268,.136],[sign*.117,1.435,.132],[sign*.126,1.584,.073],[sign*.128,1.586,-.062],[sign*.119,1.355,-.118]],.032,true);
    for(let i=0;i<4;i++) ell(body,cream,sign*(.148+.011*Math.sin(i)),1.550-i*.054,.057,.037,.032,.055,true).rotation.z=sign*.33;
    for(const y of [1.255,1.33]) ell(body,gold,sign*.092,y,.153,.019,.019,.012,true);
  }
  disk(body,skin,0,1.675,0,.067,.145,.063,true);
  disk(body,cream,0,1.64,.006,.091,.070,.079,true);
  for(let i=0;i<10;i++){const a=i*Math.PI/5;ell(body,cream,Math.cos(a)*.082,1.662,Math.sin(a)*.074,.019,.029,.019,true);}
  ribbon(body,0,1.584,.118,pink,.69);
  ell(body,gold,0,1.583,.146,.025,.025,.012,true);
  ell(body,'#bc5591',0,1.583,.156,.016,.016,.008,true);
  return skirt;
}

export function disposePlayer(model) {
  model.root.removeFromParent();
  model.root.traverse(object=>{
    const geometry=object.geometry;
    if(geometry && geometry!==unit && geometry!==scenerySphere && geometry!==cube && geometry!==cylinder){
      geometry.dispose();
    }
  });
}
