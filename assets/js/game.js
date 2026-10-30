(() => {
 'use strict';
 const host=document.getElementById('game-world');
 if(!host||!window.THREE)return;
 const T=window.THREE;
 let renderer,scene,camera,clock,mixer,hippoAction,raft,raftGroup,riverCurve,trackFrame;
 let raf=0,active=false,loaded=false,progress=0,lateral=0,speed=0,steer=0,gas=false;
 const keys={left:false,right:false};
 const $=id=>document.getElementById(id);
 function mat(color,roughness=1){return new T.MeshStandardMaterial({color,roughness})}
 function makeTree(x,z,scale=1){
  const group=new T.Group();group.position.set(x,0,z);group.scale.setScalar(scale);
  const trunk=new T.Mesh(new T.CylinderGeometry(.18,.28,2.2,7),mat('#594637'));trunk.position.y=1.1;group.add(trunk);
  for(let i=0;i<3;i++){const crown=new T.Mesh(new T.ConeGeometry(1.05-i*.13,2.1,8),mat(i%2?'#315e49':'#3d7354'));crown.position.y=2.5+i*.72;crown.rotation.y=i*.8;group.add(crown)}
  scene.add(group);
 }
 function makeRock(x,z,s){const m=new T.Mesh(new T.DodecahedronGeometry(s,0),mat('#52645c'));m.position.set(x,s*.55,z);m.rotation.set(.3,.7,.2);scene.add(m)}
 function createScene(){
  scene=new T.Scene();scene.background=new T.Color('#91b7a4');scene.fog=new T.FogExp2('#91b7a4',.012);
  camera=new T.PerspectiveCamera(48,host.clientWidth/host.clientHeight,.1,250);camera.position.set(0,10,18);camera.lookAt(0,1,0);
  renderer=new T.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.setSize(host.clientWidth,host.clientHeight);renderer.outputEncoding=T.sRGBEncoding;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;host.appendChild(renderer.domElement);
  scene.add(new T.HemisphereLight('#e5fff0','#3c594a',1.65));
  const sun=new T.DirectionalLight('#fff1d4',2.2);sun.position.set(-8,18,10);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun);
  const ground=new T.Mesh(new T.PlaneGeometry(180,180),mat('#345d43'));ground.rotation.x=-Math.PI/2;ground.position.y=-.65;ground.receiveShadow=true;scene.add(ground);
  // Elevated, sweeping river ribbon: broad curved waterway across a forest clearing.
  const pts=[new T.Vector3(-16,.1,15),new T.Vector3(-10,.15,8),new T.Vector3(-5,.25,1),new T.Vector3(2,.3,-5),new T.Vector3(9,.2,-9),new T.Vector3(17,.12,-15)];
  riverCurve=new T.CatmullRomCurve3(pts);riverCurve.curveType='catmullrom';riverCurve.tension=.45;
  const riverGeo=new T.TubeGeometry(riverCurve,180,3.25,16,false);const water=new T.Mesh(riverGeo,new T.MeshStandardMaterial({color:'#347f88',roughness:.24,metalness:.12}));water.scale.y=.42;water.position.y=.18;water.receiveShadow=true;scene.add(water);
  // Bright surface strip and banks.
  const surface=new T.Mesh(new T.TubeGeometry(riverCurve,180,2.95,16,false),new T.MeshStandardMaterial({color:'#55b7b1',roughness:.22,metalness:.08,transparent:true,opacity:.78}));surface.scale.y=.42;surface.position.y=.24;scene.add(surface);
  for(let i=0;i<58;i++){
   const t=(i/57),p=riverCurve.getPoint(t),tan=riverCurve.getTangent(t),side=new T.Vector3(-tan.z,0,tan.x);
   for(const sign of [-1,1]){const offset=side.clone().multiplyScalar(sign*(4.5+Math.random()*3));const x=p.x+offset.x,z=p.z+offset.z;makeTree(x,z,.7+Math.random()*.65)}
  }
  for(let i=0;i<30;i++){const t=Math.random(),p=riverCurve.getPoint(t),tan=riverCurve.getTangent(t),side=new T.Vector3(-tan.z,0,tan.x);makeRock(p.x+side.x*(Math.random()>.5?4:-4),p.z+side.z*(Math.random()>.5?4:-4),.25+Math.random()*.5)}
  // Atmospheric canopy silhouettes in the distance.
  const sunDisk=new T.Mesh(new T.SphereGeometry(2.2,20,16),new T.MeshBasicMaterial({color:'#f6dca0'}));sunDisk.position.set(-13,14,-28);scene.add(sunDisk);
  createRaft();
  window.addEventListener('resize',resize);
 }
 function createRaft(){
  raftGroup=new T.Group();scene.add(raftGroup);
  raft=new T.Group();raftGroup.add(raft);
  const wood=mat('#9a6840'),dark=mat('#62442f');
  const deck=new T.Mesh(new T.BoxGeometry(3.2,.28,2.2),wood);deck.position.y=.38;deck.castShadow=true;deck.receiveShadow=true;raft.add(deck);
  for(let i=0;i<7;i++){const plank=new T.Mesh(new T.BoxGeometry(.42,.31,2.28),i%2?wood:dark);plank.position.set(-1.38+i*.46,.4,0);plank.castShadow=true;raft.add(plank)}
  for(const x of [-1.52,1.52])for(const z of [-.95,.95]){const rope=new T.Mesh(new T.CylinderGeometry(.045,.045,.42,8),mat('#d2b17c'));rope.position.set(x,.66,z);raft.add(rope)}
  // Model anchor. If loading fails, a cute low-poly hippo stand-in keeps the level playable.
  const fallback=new T.Group();const body=new T.Mesh(new T.SphereGeometry(.78,20,16),mat('#8b9ca0'));body.scale.set(1.15,.9,1);body.position.set(0,1.45,-.1);fallback.add(body);
  const muzzle=new T.Mesh(new T.SphereGeometry(.48,16,12),mat('#b6c3c0'));muzzle.scale.set(1,.7,.7);muzzle.position.set(0,1.28,.58);fallback.add(muzzle);
  for(const x of [-.38,.38]){const eye=new T.Mesh(new T.SphereGeometry(.12,12,10),mat('#172323'));eye.position.set(x,1.88,.42);fallback.add(eye)}
  for(const x of [-.35,.35]){const ear=new T.Mesh(new T.SphereGeometry(.18,12,10),mat('#829397'));ear.position.set(x,2.05,-.2);fallback.add(ear)}
  raft.add(fallback);window.hippoFallback=fallback;
  if(T.GLTFLoader){
   new T.GLTFLoader().load('assets/models/BegemotAnim.glb',g=>{
    const model=g.scene;model.scale.setScalar(.85);model.position.set(0,.55,0);model.rotation.y=Math.PI;
    model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.material){o.material.side=T.DoubleSide}}});
    raft.remove(fallback);raft.add(model);window.hippoFallback=null;
    if(g.animations&&g.animations.length){mixer=new T.AnimationMixer(model);hippoAction=mixer.clipAction(g.animations[0]);hippoAction.reset();hippoAction.setLoop(T.LoopRepeat,Infinity);hippoAction.play()}
    loaded=true;
   },undefined,err=>{console.warn('Hippo GLB load failed; using fallback',err);});
  }
 }
 function resize(){if(!renderer)return;const w=host.clientWidth,h=host.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);renderer.setPixelRatio(Math.min(devicePixelRatio,1.8))}
 function setActive(on){active=on;if(on){if(!renderer)createScene();if(!raf)animate()}else{gas=false;speed=0;const b=$('fart-button');if(b)b.classList.remove('active')}}
 function animate(){
  raf=requestAnimationFrame(animate);if(!active)return;
  const dt=Math.min(clock?clock.getDelta():.016,.05);if(!clock)clock=new T.Clock();
  const accelerating=gas;
  const target=accelerating?7.5:1.25;speed+= (target-speed)*Math.min(1,dt*(accelerating?2.8:1.4));
  if(accelerating)progress+=dt*speed*.014;else progress+=dt*.0018;
  lateral+=( (keys.left?-1:0)+(keys.right?1:0) )*dt*2.1;lateral*=Math.pow(.96,dt*60);lateral=T.MathUtils.clamp(lateral,-1.65,1.65);
  const t=(progress%0.78)/0.78,p=riverCurve.getPointAt(t),tan=riverCurve.getTangentAt(t),side=new T.Vector3(-tan.z,0,tan.x);
  raftGroup.position.set(p.x+side.x*lateral,p.y+.45,p.z+side.z*lateral);raftGroup.rotation.y=Math.atan2(tan.x,tan.z);raftGroup.rotation.z=-lateral*.08+Math.sin(performance.now()*.0015)*.018;raftGroup.rotation.x=Math.sin(performance.now()*.0018)*.018;
  // Camera follows the raft while looking ahead along the curved river.
  const look=p.clone().add(tan.clone().multiplyScalar(4));camera.position.lerp(new T.Vector3(p.x-tan.x*8,10.5,p.z-tan.z*8+8),Math.min(1,dt*1.5));camera.lookAt(look.x,look.y,look.z);
  if(mixer)mixer.update(dt*(gas?1.25:.45));
  const fill=$('speed-fill');if(fill)fill.style.width=(speed/8*100)+'%';
  renderer.render(scene,camera);
 }
 window.startRiverLevel=()=>setActive(true);window.stopRiverLevel=()=>setActive(false);
 function hold(id,fn){const el=$(id);if(!el)return;el.addEventListener('pointerdown',e=>{e.preventDefault();el.setPointerCapture?.(e.pointerId);fn(true);el.classList.add('active')});['pointerup','pointercancel','lostpointercapture'].forEach(ev=>el.addEventListener(ev,()=>{fn(false);el.classList.remove('active')}))}
 hold('fart-button',v=>gas=v);hold('steer-left',v=>keys.left=v);hold('steer-right',v=>keys.right=v);
 window.addEventListener('keydown',e=>{if(e.code==='Space'){gas=true;e.preventDefault()}if(e.code==='ArrowLeft'||e.code==='KeyA')keys.left=true;if(e.code==='ArrowRight'||e.code==='KeyD')keys.right=true});
 window.addEventListener('keyup',e=>{if(e.code==='Space')gas=false;if(e.code==='ArrowLeft'||e.code==='KeyA')keys.left=false;if(e.code==='ArrowRight'||e.code==='KeyD')keys.right=false});
 const back=$('level-one-back');if(back)back.addEventListener('click',()=>setActive(false));
})();