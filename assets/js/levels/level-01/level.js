(function(w){
'use strict';
const F=w.FragmentGame,T=F.THREE,$=id=>document.getElementById(id),clamp=T.MathUtils.clamp;
let renderer,scene,camera,clock,river,raft,hippo,pivot,mixer,raf=0,running=false,gas=false,left=false,right=false,progress=.012,angle=0,angularVelocity=0,x=0,z=0,vx=0,vz=0,idx=0,finished=false,overlay=null,elapsed=0,emit=0;
const R=1.2,HP=1.13,segments=700,obstacles=[];
const vec=(x,y,z)=>new T.Vector3(x,y,z);
function point(t){return river.getPointAt(clamp(t,0,1))}
function tangent(t){return river.getTangentAt(clamp(t,0,1))}
function frameAt(t){const p=point(t),d=tangent(t),n=vec(-d.z,0,d.x).normalize();return{p,d,n}}
function makeRiver(){
 const pts=[[-25,0,24],[-19,0,17],[-12,0,10],[-8,0,2],[-2,0,-5],[7,0,-11],[15,0,-15],[23,0,-23],[27,0,-31],[20,0,-42],[4,0,-50],[-10,0,-62],[-5,0,-78],[14,0,-92],[34,0,-105],[43,0,-122],[28,0,-140],[8,0,-153],[12,0,-172],[30,0,-190],[49,0,-204]];
 river=new T.CatmullRomCurve3(pts.map(p=>vec(...p)),false,'centripetal');
 const v=[],uv=[],ix=[],width=6.2;
 for(let i=0;i<=segments;i++){const t=i/segments,{p,n}=frameAt(t);for(const s of[-1,1]){const q=p.clone().addScaledVector(n,s*width);v.push(q.x,-.15,q.z);uv.push(s===-1?0:1,t*30)}if(i<segments){const a=i*2;ix.push(a,a+1,a+2,a+1,a+3,a+2)}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();
 const water=new T.Mesh(g,new T.MeshStandardMaterial({color:'#24545a',roughness:.42,metalness:.03,side:T.DoubleSide}));water.receiveShadow=true;scene.add(water);
 const bank=F.material('#263b30');const ground=new T.Mesh(new T.PlaneGeometry(700,700),bank);ground.rotation.x=-Math.PI/2;ground.position.set(5,-1.5,-80);ground.receiveShadow=true;scene.add(ground);
 for(const s of[-1,1]){const arr=[];for(let i=0;i<=180;i++){const {p,n}=frameAt(i/180);arr.push(p.clone().addScaledVector(n,s*6.15).setY(-.08))}scene.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(arr),220,.07,7,false),F.material('#527d75')))}
}
function createRaft(){
 raft=new T.Group();scene.add(raft);
 const wood=F.material('#72543b'),dark=F.material('#493629'),rimMat=F.material('#9a8967');
 // Круглый плот из коротких деревянных сегментов, с круглой окантовкой
 for(let i=0;i<12;i++){const a=i/12*Math.PI*2,plank=new T.Mesh(new T.BoxGeometry(.32,.28,2.12),i%2?wood:dark);plank.position.set(Math.cos(a)*.02,.02,Math.sin(a)*.02);plank.rotation.y=a;plank.castShadow=plank.receiveShadow=true;raft.add(plank)}
 const ring=new T.Mesh(new T.TorusGeometry(R,.09,8,48),rimMat);ring.rotation.x=Math.PI/2;ring.position.y=.17;ring.castShadow=true;raft.add(ring);
 const foam=new T.Mesh(new T.TorusGeometry(1.62,.045,6,40),new T.MeshBasicMaterial({color:'#c1d2c9',transparent:true,opacity:.24}));foam.rotation.x=Math.PI/2;foam.position.y=.02;raft.add(foam);
}
function createHippo(){
 pivot=new T.Group();scene.add(pivot);
 if(T.GLTFLoader){new T.GLTFLoader().load('assets/models/BegemotAnim.glb',g=>{
  hippo=g.scene;hippo.scale.setScalar(.72);hippo.rotation.y=Math.PI;
  hippo.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
  pivot.add(hippo);
  if(g.animations&&g.animations.length){mixer=new T.AnimationMixer(hippo);const a=mixer.clipAction(g.animations[0]);a.play();a.paused=true;mixer.timeScale=0}
 },undefined,()=>fallbackHippo())}else fallbackHippo();
}
function fallbackHippo(){if(hippo)return;hippo=new T.Group();const m=F.material('#657574'),light=F.material('#929d94'),dark=F.material('#172322');const b=new T.Mesh(new T.SphereGeometry(.72,20,16),m);b.scale.set(1.1,.9,1.1);hippo.add(b);const sn=new T.Mesh(new T.SphereGeometry(.43,18,14),light);sn.position.set(0,-.12,.62);sn.scale.set(1,.7,.7);hippo.add(sn);for(const s of[-1,1]){const e=new T.Mesh(new T.SphereGeometry(.12,12,10),dark);e.position.set(s*.3,.48,.4);hippo.add(e)}pivot.add(hippo)}
function createScenery(){F.shared.createForest(scene,river)}
function createObstacles(){const wood=F.material('#49392e');for(let i=0;i<11;i++){const t=.09+i*.073,{p,d,n}=frameAt(t),off=(i%2?1:-1)*3.1;const log=new T.Mesh(new T.CylinderGeometry(.22,.25,2.6,10),wood);log.rotation.z=Math.PI/2;log.rotation.y=Math.atan2(d.x,d.z);log.position.copy(p).addScaledVector(n,off);log.position.y=.02;log.castShadow=true;scene.add(log);obstacles.push({t,off,hit:false})}}
function init(){if(renderer)return;const host=$('game-world');if(!host)return;scene=new T.Scene();scene.background=new T.Color('#596b60');scene.fog=new T.Fog('#596b60',45,145);camera=new T.PerspectiveCamera(52,host.clientWidth/Math.max(1,host.clientHeight),.1,400);renderer=new T.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(w.devicePixelRatio||1,1.7));renderer.setSize(host.clientWidth,host.clientHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputEncoding=T.sRGBEncoding;host.appendChild(renderer.domElement);scene.add(new T.HemisphereLight('#aebdb0','#303b32',.95));const sun=new T.DirectionalLight('#d4d0b8',1.15);sun.position.set(-14,24,12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-35;sun.shadow.camera.right=35;sun.shadow.camera.top=35;sun.shadow.camera.bottom=-35;scene.add(sun);makeRiver();createScenery();createRaft();createHippo();createObstacles();const fp=point(.975),finish=new T.Mesh(new T.TorusGeometry(4.5,.13,8,48),new T.MeshStandardMaterial({color:'#b8a77b',emissive:'#65583a',emissiveIntensity:.18}));finish.rotation.x=Math.PI/2;finish.position.copy(fp);finish.position.y=.1;scene.add(finish);clock=new T.Clock();resize();w.addEventListener('resize',resize)}
function resize(){if(!renderer)return;const host=$('game-world');camera.aspect=host.clientWidth/Math.max(1,host.clientHeight);camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight);renderer.setPixelRatio(Math.min(w.devicePixelRatio||1,1.7))}
function nearest(){let best=1e9,bi=idx;for(let j=Math.max(0,idx-24);j<=Math.min(segments,idx+50);j++){const p=point(j/segments),d=(p.x-x)**2+(p.z-z)**2;if(d<best){best=d;bi=j}}idx=bi;progress=idx/segments;return Math.sqrt(best)}
function setCharacters(dt){const {p,d}=frameAt(progress);raft.position.set(x,.06+Math.sin(elapsed*2)*.025,z);raft.rotation.y=Math.atan2(d.x,d.z);raft.rotation.z=clamp(-((vx*d.x+vz*d.z)*.012),-.12,.12);
 // Персонаж перемещается по окружности плота, держась за его внешний край; нижняя часть корпуса погружена в воду.
 pivot.position.set(x+Math.cos(angle)*HP,-.12+Math.sin(elapsed*2.2)*.025,z+Math.sin(angle)*HP);
 pivot.rotation.set(0,angle+Math.PI/2,0);
 if(mixer){mixer.timeScale=gas?1.45:0;if(gas)mixer.update(dt)}
}
function updateHud(){const fill=$('speed-fill');if(fill)fill.style.width=(Math.hypot(vx,vz)/9*100)+'%';const hint=$('game-hint');if(hint&&!finished){const title=hint.querySelector('b'),sub=hint.querySelector('span');if(title)title.textContent=gas?'ТУРБО-ПУК!':'ПУСТИМ ПЛОТ В ПУТЬ';if(sub)sub.textContent=gas?'Бегемот работает — плот движется!':'Плот стоит. Двигай бегемота по кругу и удерживай ПУК.'}}
function endGame(win){finished=true;gas=false;running=false;if(raf){cancelAnimationFrame(raf);raf=0}if(overlay)overlay.remove();overlay=document.createElement('div');overlay.style.cssText='position:absolute;z-index:8;inset:0;display:grid;place-items:center;background:#06100dbb;backdrop-filter:blur(9px);padding:24px;text-align:center;color:#f1f5ed;font-family:Montserrat,sans-serif';overlay.innerHTML='<div style="max-width:380px"><div style="font-size:10px;letter-spacing:.25em;color:#a6ded2;font-weight:800">FRAGMENT.GAMES</div><h2 style="font-size:clamp(38px,9vw,62px);line-height:.95;margin:18px 0;font-weight:900">'+(win?'УРОВЕНЬ ПРОЙДЕН!':'ПЛОТ ЗАСТРЯЛ!')+'</h2><p style="color:#c1d0c8;line-height:1.7">'+(win?'Бегемот добрался до финиша!':'Попробуй ещё раз и держись на реке.')+'</p><button id="retry-level" style="margin-top:18px;padding:15px 24px;background:#a6ded2;color:#09201a;border:0;font-weight:900">ИГРАТЬ ЕЩЁ</button></div>';$('level-one-screen').appendChild(overlay);$('retry-level').addEventListener('click',()=>{overlay.remove();overlay=null;reset();running=true;clock.getDelta();frame()})}
function reset(){progress=.012;idx=Math.round(progress*segments);const p=point(progress);x=p.x;z=p.z;vx=vz=0;angle=Math.atan2(-tangent(progress).z,-tangent(progress).x);angularVelocity=0;gas=false;left=right=false;finished=false;elapsed=0;obstacles.forEach(o=>o.hit=false);if(raft)raft.position.set(x,.06,z)}
function step(dt){
 angularVelocity+=((Number(right)-Number(left))*2.7-angularVelocity)*Math.min(1,dt*9);angle+=angularVelocity*dt;
 const thrust=gas?10.5:0;
 if(gas){const dirX=Math.cos(angle),dirZ=Math.sin(angle);vx+=dirX*thrust*dt;vz+=dirZ*thrust*dt}
 // Инерция сохраняется после отпускания кнопки, без пука собственного движения нет.
 const drag=Math.exp(-.22*dt);vx*=drag;vz*=drag;
 const sp=Math.hypot(vx,vz);if(sp>10){vx*=10/sp;vz*=10/sp}
 x+=vx*dt;z+=vz*dt;
 const dist=nearest(),{p,n}=frameAt(progress),lat=(x-p.x)*n.x+(z-p.z)*n.z;
 if(Math.abs(lat)>5.35){vx-=n.x*lat*2.8*dt;vz-=n.z*lat*2.8*dt;x-=n.x*(Math.abs(lat)-5.35)*Math.sign(lat)*.35;z-=n.z*(Math.abs(lat)-5.35)*Math.sign(lat)*.35}
 obstacles.forEach(o=>{if(!o.hit&&Math.abs(progress-o.t)<.012&&Math.abs(lat-o.off)<1.05){o.hit=true;vx*=.55;vz*=.55}});
 if(progress>=.975){endGame(true);return}
}
function frame(){if(!running){raf=0;return}raf=requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.04);elapsed+=dt;if(running){step(dt);setCharacters(dt);const {p,d}=frameAt(progress),sp=Math.hypot(vx,vz),target=new T.Vector3(x-d.x*10,7.5+sp*.16,z-d.z*10+5);camera.position.lerp(target,Math.min(1,dt*3));camera.lookAt(x+d.x*2,.1,z+d.z*2);if(gas){emit+=dt*35;if(mixer)mixer.update(0)}updateHud();renderer.render(scene,camera)}}
function hold(id,set){const el=$(id);if(!el)return;const down=e=>{e.preventDefault();try{el.setPointerCapture(e.pointerId)}catch(_){}set(true);el.classList.add('active')},up=()=>{set(false);el.classList.remove('active')};el.addEventListener('pointerdown',down);['pointerup','pointercancel','lostpointercapture'].forEach(ev=>el.addEventListener(ev,up))}
let controlsBound=false;
function bindControls(){if(controlsBound)return;controlsBound=true;hold('fart-button',v=>gas=v);hold('steer-left',v=>left=v);hold('steer-right',v=>right=v);w.addEventListener('keydown',e=>{if(e.code==='Space'){gas=true;e.preventDefault()}if(e.code==='ArrowLeft'||e.code==='KeyA')left=true;if(e.code==='ArrowRight'||e.code==='KeyD')right=true});w.addEventListener('keyup',e=>{if(e.code==='Space')gas=false;if(e.code==='ArrowLeft'||e.code==='KeyA')left=false;if(e.code==='ArrowRight'||e.code==='KeyD')right=false});}
F.levels.level01={start(){init();bindControls();reset();running=true;clock.getDelta();if(!raf)frame()},stop(){running=false;if(raf){cancelAnimationFrame(raf);raf=0}gas=left=right=false;const b=$('fart-button');if(b)b.classList.remove('active')}};
})(window);