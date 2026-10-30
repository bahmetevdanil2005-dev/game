(function(w){
'use strict';
const F=w.FragmentGame,T=F.THREE,$=id=>document.getElementById(id);
let renderer,scene,camera,clock,river,raft,mixer,raf=0,running=false,gas=false,left=false,right=false;
let progress=0.025,lateral=0,speed=0,obstacles=[],lastTime=0,finished=false,overlay=null;
const clamp=T.MathUtils.clamp;
function makeRiver(){
 const pts=[[-25,0,24],[-19,0,17],[-12,0,10],[-8,0,2],[-2,0,-5],[7,0,-11],[15,0,-15],[23,0,-23],[27,0,-31]];
 river=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p)),false,'centripetal');
 const verts=[],uv=[],idx=[],segments=360;
 for(let i=0;i<=segments;i++){const t=i/segments,p=river.getPointAt(t),tan=river.getTangentAt(t),side=new T.Vector3(-tan.z,0,tan.x).normalize(),width=4.2+Math.sin(t*Math.PI*8)*.22;
  for(const s of [-1,1]){const q=p.clone().addScaledVector(side,s*width);verts.push(q.x,-.13,q.z);uv.push(s===-1?0:1,t*18)}
  if(i<segments){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2)}
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();
 const water=new T.Mesh(geo,new T.MeshStandardMaterial({color:'#2799a5',roughness:.22,metalness:.08,side:T.DoubleSide}));water.receiveShadow=true;scene.add(water);
 const edgeMat=new T.MeshStandardMaterial({color:'#8bd6c7',roughness:.35,transparent:true,opacity:.48});
 for(const s of [-1,1]){const points=[];for(let i=0;i<=180;i++){const p=river.getPointAt(i/180),tan=river.getTangentAt(i/180),side=new T.Vector3(-tan.z,0,tan.x).normalize();points.push(p.clone().addScaledVector(side,s*4.16).setY(-.08))}
 const line=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),220,.045,6,false),edgeMat);scene.add(line)}
}
function createBanks(){
 const ground=new T.Mesh(new T.PlaneGeometry(240,240),F.material('#416b43'));ground.rotation.x=-Math.PI/2;ground.position.y=-.72;ground.receiveShadow=true;scene.add(ground);
 const sand=F.material('#a4a078');for(let i=0;i<70;i++){const t=.03+Math.random()*.94,p=river.getPointAt(t),tan=river.getTangentAt(t),side=new T.Vector3(-tan.z,0,tan.x).normalize(),sgn=Math.random()<.5?-1:1,d=4.8+Math.random()*2;const rock=new T.Mesh(new T.DodecahedronGeometry(.2+Math.random()*.4),sand);rock.position.set(p.x+side.x*sgn*d,-.48,p.z+side.z*sgn*d);rock.rotation.set(Math.random(),Math.random(),Math.random());rock.castShadow=true;scene.add(rock)}
}
function createObstacles(){
 const wood=F.material('#795338'),foam=F.material('#c6b27d');
 for(let i=0;i<9;i++){const t=.13+i*.082,p=river.getPointAt(t),tan=river.getTangentAt(t),side=new T.Vector3(-tan.z,0,tan.x).normalize(),offset=(i%2?1:-1)*2.35;
 const log=new T.Mesh(new T.CylinderGeometry(.2,.24,2.6,10),wood);log.rotation.z=Math.PI/2;log.rotation.y=Math.atan2(tan.x,tan.z);log.position.set(p.x+side.x*offset,.08,p.z+side.z*offset);log.castShadow=true;scene.add(log);obstacles.push({t,x:offset,hit:false,mesh:log});
 const buoy=new T.Mesh(new T.SphereGeometry(.24,12,10),foam);buoy.position.set(p.x-side.x*offset*.55,.25,p.z-side.z*offset*.55);scene.add(buoy)}
}
function init(){
 if(renderer)return;const host=$('game-world');if(!host)return;
 scene=new T.Scene();scene.background=new T.Color('#a9cbb6');scene.fog=new T.Fog('#a9cbb6',42,115);
 camera=new T.PerspectiveCamera(48,host.clientWidth/Math.max(1,host.clientHeight),.1,260);
 renderer=new T.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(w.devicePixelRatio||1,1.7));renderer.setSize(host.clientWidth,host.clientHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputEncoding=T.sRGBEncoding;host.appendChild(renderer.domElement);
 scene.add(new T.HemisphereLight('#e9fff0','#526b4b',1.65));const sun=new T.DirectionalLight('#fff1d4',2.1);sun.position.set(-14,24,12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-35;sun.shadow.camera.right=35;sun.shadow.camera.top=35;sun.shadow.camera.bottom=-35;scene.add(sun);
 makeRiver();createBanks();F.shared.createForest(scene,river);raft=F.shared.createRaft(scene,o=>{mixer=o.mixer});createObstacles();
 const finish=new T.Mesh(new T.TorusGeometry(4.3,.13,8,48),new T.MeshStandardMaterial({color:'#ffe39a',emissive:'#b48a32',emissiveIntensity:.4}));const fp=river.getPointAt(.965);finish.rotation.x=Math.PI/2;finish.position.set(fp.x,.35,fp.z);scene.add(finish);
 clock=new T.Clock();resize();w.addEventListener('resize',resize);
}
function resize(){if(!renderer)return;const host=$('game-world');camera.aspect=host.clientWidth/Math.max(1,host.clientHeight);camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight);renderer.setPixelRatio(Math.min(w.devicePixelRatio||1,1.7))}
function updateHud(){const fill=$('speed-fill');if(fill)fill.style.width=(speed/7*100)+'%';const hint=$('game-hint');if(hint&&!finished){const title=hint.querySelector('b'),sub=hint.querySelector('span');if(title)title.textContent=gas?'ТУРБО-ПУК!':'ПУСТИМ ПЛОТ В ПУТЬ';if(sub)sub.textContent='Поворот: A / D или стрелки · Ускорение: удерживай ПУК'} }
function endGame(win){finished=true;gas=false;running=false;if(overlay)overlay.remove();overlay=document.createElement('div');overlay.style.cssText='position:absolute;z-index:8;inset:0;display:grid;place-items:center;background:#06100dbb;backdrop-filter:blur(9px);padding:24px;text-align:center;color:#f1f5ed;font-family:Montserrat,sans-serif';overlay.innerHTML='<div style="max-width:380px"><div style="font-size:10px;letter-spacing:.25em;color:#a6ded2;font-weight:800">FRAGMENT.GAMES</div><h2 style="font-size:clamp(38px,9vw,62px);line-height:.95;margin:18px 0;font-weight:900">'+(win?'УРОВЕНЬ ПРОЙДЕН!':'ПЛОТ ЗАСТРЯЛ!')+'</h2><p style="color:#c1d0c8;line-height:1.7">'+(win?'Бегемот успешно добрался до финиша. Отличный сплав!':'Попробуй пройти маршрут ещё раз и держись ближе к середине реки.')+'</p><button id="retry-level" style="margin-top:18px;padding:15px 24px;background:#a6ded2;color:#09201a;border:0;font-weight:900;letter-spacing:.1em">ИГРАТЬ ЕЩЁ</button></div>'; $('level-one-screen').appendChild(overlay);$('retry-level').addEventListener('click',()=>{overlay.remove();overlay=null;reset();running=true;clock.getDelta();frame()})}
function reset(){progress=.025;lateral=0;speed=0;finished=false;obstacles.forEach(o=>o.hit=false);if(raft){raft.position.set(0,.25,0);raft.rotation.set(0,0,0)}}
function frame(){raf=requestAnimationFrame(frame);if(!running)return;const dt=Math.min(clock.getDelta(),.04);const target=gas?7:2.1;speed+=(target-speed)*Math.min(1,dt*(gas?3.5:1.5));const advance=(.009+speed*.0009)*dt*15;progress+=advance;
 lateral+=(Number(right)-Number(left))*dt*2.8;lateral*=Math.pow(.985,dt*60);lateral=clamp(lateral,-3.1,3.1);
 if(progress>=.975){progress=.975;updateHud();endGame(true);return}
 const p=river.getPointAt(progress),tan=river.getTangentAt(progress),side=new T.Vector3(-tan.z,0,tan.x).normalize();
 raft.position.set(p.x+side.x*lateral,.23+Math.sin(performance.now()*.003)*.055,p.z+side.z*lateral);raft.rotation.y=Math.atan2(tan.x,tan.z);raft.rotation.z=-lateral*.035+Math.sin(performance.now()*.0017)*.012;
 obstacles.forEach(o=>{if(!o.hit&&Math.abs(progress-o.t)<.009&&Math.abs(lateral-o.x)<1.25){o.hit=true;speed=Math.max(.7,speed*.48);lateral=clamp(lateral+(lateral>o.x?-.55:.55),-3.1,3.1)}});
 const cam=new T.Vector3(p.x-tan.x*9,10.2,p.z-tan.z*9+8);camera.position.lerp(cam,Math.min(1,dt*2));camera.lookAt(p.x+tan.x*4,.7,p.z+tan.z*4);
 if(mixer)mixer.update(dt*(gas?1.5:.7));updateHud();renderer.render(scene,camera)
}
function hold(id,set){const el=$(id);if(!el)return;const down=e=>{e.preventDefault();try{el.setPointerCapture(e.pointerId)}catch(_){}set(true);el.classList.add('active')},up=()=>{set(false);el.classList.remove('active')};el.addEventListener('pointerdown',down);['pointerup','pointercancel','lostpointercapture'].forEach(ev=>el.addEventListener(ev,up))}
let controlsBound=false;
function bindControls(){if(controlsBound)return;controlsBound=true;hold('fart-button',v=>gas=v);hold('steer-left',v=>left=v);hold('steer-right',v=>right=v);
 w.addEventListener('keydown',e=>{if(e.code==='Space'){gas=true;e.preventDefault()}if(e.code==='ArrowLeft'||e.code==='KeyA')left=true;if(e.code==='ArrowRight'||e.code==='KeyD')right=true});
 w.addEventListener('keyup',e=>{if(e.code==='Space')gas=false;if(e.code==='ArrowLeft'||e.code==='KeyA')left=false;if(e.code==='ArrowRight'||e.code==='KeyD')right=false});
}
F.levels.level01={start(){init();bindControls();reset();running=true;clock.getDelta();if(!raf)frame();},stop(){running=false;gas=left=right=false;const b=$('fart-button');if(b)b.classList.remove('active')}};
})(window);