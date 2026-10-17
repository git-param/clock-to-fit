/*
 * Clock To Fit — real WebGL scene using locally bundled Three.js r160.
 * Procedural geometry is intentionally stylised and replaceable with GLB models.
 * All materials/geometry are local; WebGL failure preserves the food photograph.
 */
(() => {
  'use strict';
  const canvas = document.getElementById('food-scene');
  const wrap = document.getElementById('scene-wrap');
  const tossButton = document.getElementById('toss');
  const sceneButtons = [...document.querySelectorAll('[data-scene]')];
  const status = document.getElementById('scene-status');
  const help = document.getElementById('scene-help');
  let renderer;
  function showFallback() {
    wrap.classList.remove('scene-ready');
    canvas.hidden = true;
    canvas.tabIndex = -1;
    canvas.setAttribute('aria-hidden','true');
    tossButton.disabled = true;
    sceneButtons.forEach((button) => { button.disabled = true; });
    help.textContent = 'Real menu photograph · move to tilt';
  }
  if (!window.THREE) { showFallback(); return; }
  const T = window.THREE;
  try {
    renderer = new T.WebGLRenderer({ canvas, alpha:true, antialias:devicePixelRatio < 2, powerPreference:'low-power' });
  } catch { showFallback(); return; }
  try {
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6));
    renderer.setClearColor(0x000000,0);
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.22;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(36,1,.1,60);
    camera.position.set(0,7.9,7.7);
    camera.lookAt(0,.2,0);
    scene.add(new T.HemisphereLight(0xfff8e7,0xa5b36b,2.8));
    const sun = new T.DirectionalLight(0xfff3d9,4.2);
    sun.position.set(-4,8,5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024,1024);
    Object.assign(sun.shadow.camera,{left:-5,right:5,top:5,bottom:-5,near:1,far:20});
    sun.shadow.bias = -.0004;
    sun.shadow.normalBias = .025;
    scene.add(sun);
    const rimLight = new T.DirectionalLight(0xffffff,1.3);
    rimLight.position.set(4,3,-4);
    scene.add(rimLight);
    const root = new T.Group();
    root.rotation.set(.1,-.35,-.08);
    scene.add(root);
    const ground = new T.Mesh(new T.PlaneGeometry(20,20),new T.ShadowMaterial({opacity:.14}));
    ground.rotation.x = -Math.PI/2;
    ground.position.y = -1.35;
    ground.receiveShadow = true;
    scene.add(ground);

    let seed = 6248;
    function random() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
    const mat = (color, roughness=.7) => new T.MeshStandardMaterial({color,roughness,metalness:0});
    const materials = {
      bowl:mat('#eee7d6',.42), rim:mat('#fff9e7',.36), rice:mat('#cfb47a'),
      paneer:mat('#f3d28b',.68), grill:mat('#9b562c',.8), red:mat('#d83e20',.3),
      redInner:mat('#f56836',.4), bean:mat('#682d28',.38), corn:mat('#f4c235',.4),
      green:mat('#39783b',.65), lightGreen:mat('#75a745',.62), leafVein:mat('#b7c87a',.8),
      crust:mat('#be7832',.82), bread:mat('#d9a24f',.7), cheese:mat('#edce81',.65),
      sauce:mat('#bc4b2f',.6), purple:mat('#8f5973',.45), olive:mat('#283929',.5),
      lime:mat('#58842c',.6), limeInside:mat('#cbd77b',.58), seed:mat('#e6c589',.7)
    };
    const sphereGeo = new T.SphereGeometry(1,16,12);
    const grainGeo = new T.SphereGeometry(1,7,5);
    function mesh(geometry, material, parent, position=[0,0,0], scale) {
      const m = new T.Mesh(geometry,material);
      m.position.set(...position);
      if (scale) m.scale.set(...scale);
      m.castShadow = true;
      m.receiveShadow = true;
      parent.add(m);
      return m;
    }
    function ball(parent,material,position,scale) { return mesh(sphereGeo,material,parent,position,scale); }
    const leafGeo = new T.SphereGeometry(1,16,8);
    const pos = leafGeo.attributes.position;
    for(let i=0;i<pos.count;i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      pos.setXYZ(i,x*(1+.12*Math.sin(z*18)),y*.10 + .18*z*z,z*1.8);
    }
    leafGeo.computeVertexNormals();
    function leaf(parent,position,scale=.3,rotation=0) {
      const group = new T.Group();
      group.position.set(...position);
      group.rotation.y = rotation;
      group.rotation.z = (random()-.5)*.45;
      parent.add(group);
      mesh(leafGeo,random()>.35 ? materials.green : materials.lightGreen,group,[0,0,0],[scale,scale,scale]);
      const curve = new T.QuadraticBezierCurve3(new T.Vector3(0,.01,-scale*1.6),new T.Vector3(0,.05,0),new T.Vector3(0,.07,scale*1.6));
      mesh(new T.TubeGeometry(curve,8,.008,4,false),materials.leafVein,group);
      return group;
    }
    function tomato(parent,position,size=.21) {
      const g = new T.Group(); g.position.set(...position); parent.add(g);
      ball(g,materials.red,[0,0,0],[size,size*.85,size]);
      const top = new T.Group(); top.position.y=size*.81; g.add(top);
      for(let i=0;i<5;i++){
        const tip=mesh(new T.ConeGeometry(size*.14,size*.75,3),materials.green,top);
        tip.rotation.z=Math.PI/2;tip.rotation.y=i*Math.PI*2/5;
        tip.position.set(Math.cos(i*Math.PI*2/5)*size*.2,0,Math.sin(i*Math.PI*2/5)*size*.2);
      }
      return g;
    }
    const tossables = [];
    function track(object,amount=1) {
      object.userData.home = object.position.clone();
      object.userData.spin = object.rotation.clone();
      object.userData.phase = random();
      object.userData.amount = amount;
      tossables.push(object);
      return object;
    }
    function grains(parent,material,count,config) {
      const inst = new T.InstancedMesh(grainGeo,material,count);
      const dummy = new T.Object3D();
      for(let i=0;i<count;i++){
        const a = config.start + random()*config.arc;
        const r = Math.sqrt(random())*config.radius;
        dummy.position.set(Math.cos(a)*r,config.y + random()*.12,Math.sin(a)*r);
        dummy.rotation.set(random(),random()*6.28,random());
        const s = .75+random()*.5;
        dummy.scale.set(config.scale[0]*s,config.scale[1]*s,config.scale[2]*s);
        dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix);
      }
      inst.instanceMatrix.needsUpdate=true; inst.castShadow=true;inst.receiveShadow=true;parent.add(inst);
      return inst;
    }
    const bowl = new T.Group(); root.add(bowl);
    const profile = [[0,-1.02],[.65,-1.02],[.94,-.98],[1.23,-.79],[1.48,-.49],[1.71,-.12],[1.86,.28],[1.89,.47],[1.82,.53],[1.75,.45],[1.61,.04],[1.39,-.32],[1.15,-.55],[.87,-.70],[0,-.72]].map(([r,y])=>new T.Vector2(r,y));
    mesh(new T.LatheGeometry(profile,80),materials.bowl,bowl);
    const rim=mesh(new T.TorusGeometry(1.84,.055,12,80),materials.rim,bowl,[0,.48,0]);rim.rotation.x=Math.PI/2;
    const foot=mesh(new T.CylinderGeometry(.78,.78,.09,48),materials.bowl,bowl,[0,-1.04,0]);
    ball(bowl,materials.rice,[0,-.04,0],[1.69,.48,1.69]);
    const food=new T.Group();bowl.add(food);
    grains(food,materials.rice,420,{start:0,arc:Math.PI*2,radius:1.65,y:.28,scale:[.052,.038,.105]});
    const cornGroup=new T.Group();food.add(cornGroup);track(cornGroup,.34);
    grains(cornGroup,materials.corn,85,{start:.15,arc:1.1,radius:1.55,y:.43,scale:[.09,.08,.09]});
    const beanGroup=new T.Group();food.add(beanGroup);track(beanGroup,.42);
    grains(beanGroup,materials.bean,55,{start:3.5,arc:1.25,radius:1.5,y:.44,scale:[.12,.08,.075]});
    for(let i=0;i<14;i++){
      const a=1.6+random()*1.4, r=.8+random()*.7;
      track(leaf(food,[Math.cos(a)*r,.43+random()*.15,Math.sin(a)*r],.22+random()*.14,a),.7);
    }
    for(let i=0;i<8;i++){
      const a=4.9+random()*.9,r=.8+random()*.68;
      track(tomato(food,[Math.cos(a)*r,.56,Math.sin(a)*r],.18+random()*.05),.8);
    }
    for(let i=0;i<8;i++){
      const cube=new T.Group();cube.position.set((random()-.5)*1.45,.61+random()*.16,(random()-.5)*1.25);
      cube.rotation.set(random()*.3,random()*Math.PI,random()*.2);food.add(cube);track(cube,1);
      mesh(new T.BoxGeometry(.36,.32,.36),materials.paneer,cube);
      for(let k=0;k<3;k++)mesh(new T.BoxGeometry(.28,.007,.016),materials.grill,cube,[0,.163,(k-1)*.075]);
    }
    for(let i=0;i<3;i++){
      const onion=mesh(new T.TorusGeometry(.22+i*.055,.018,6,26,Math.PI*1.7),materials.purple,food,[-.85+i*.12,.64,.3+i*.12]);
      onion.rotation.set(Math.PI/2,.2,random());track(onion,.7);
    }
    // Stylised lime wheel resting against the bowl.
    const limeGroup=new T.Group();limeGroup.position.set(-1.1,.62,-.66);limeGroup.rotation.set(.8,.1,-.35);food.add(limeGroup);
    const limeOuter=mesh(new T.CylinderGeometry(.39,.39,.1,36),materials.lime,limeGroup);
    mesh(new T.CylinderGeometry(.35,.35,.108,36),materials.limeInside,limeGroup);
    for(let i=0;i<8;i++){
      const line=mesh(new T.BoxGeometry(.012,.01,.31),materials.rim,limeGroup,[Math.sin(i*Math.PI/4)*.15,.06,Math.cos(i*Math.PI/4)*.15]);line.rotation.y=i*Math.PI/4;
    }
    track(limeGroup,1);

    const pizza = new T.Group();root.add(pizza);pizza.visible=true;bowl.visible=false;
    mesh(new T.CylinderGeometry(1.94,1.94,.13,80),materials.bread,pizza,[0,-.2,0]);
    const crust=mesh(new T.TorusGeometry(1.79,.16,14,80),materials.crust,pizza,[0,-.10,0]);crust.rotation.x=Math.PI/2;
    mesh(new T.CylinderGeometry(1.70,1.70,.03,64),materials.sauce,pizza,[0,-.04,0]);
    mesh(new T.CylinderGeometry(1.65,1.65,.045,64),materials.cheese,pizza,[0,-.015,0]);
    for(let i=0;i<15;i++){
      const a=i*2.399963,r=Math.sqrt((i+1)/15)*1.4;
      const x=Math.cos(a)*r,z=Math.sin(a)*r;
      if(i%3===0)track(tomato(pizza,[x,.14,z],.18),.8);
      else if(i%3===1)track(leaf(pizza,[x,.1,z],.20,a),.7);
      else {const olive=mesh(new T.TorusGeometry(.105,.043,8,16),materials.olive,pizza,[x,.1,z]);olive.rotation.x=Math.PI/2;track(olive,.6);}
    }
    for(let i=0;i<12;i++){
      const a=random()*Math.PI*2,r=Math.sqrt(random())*1.4;
      const paneer=mesh(new T.BoxGeometry(.21,.13,.21),materials.paneer,pizza,[Math.cos(a)*r,.12,Math.sin(a)*r]);paneer.rotation.y=a;track(paneer,.8);
    }
    for(let i=0;i<4;i++){
      const onion=mesh(new T.TorusGeometry(.2,.017,6,24,Math.PI*1.5),materials.purple,pizza,[Math.cos(i*1.8)*.85,.11,Math.sin(i*1.8)*.85]);onion.rotation.set(Math.PI/2,0,i);track(onion,.6);
    }
    grains(pizza,materials.corn,40,{start:0,arc:Math.PI*2,radius:1.48,y:.05,scale:[.055,.055,.07]});

    // A few oversized floating ingredients make the scene spill out of its frame.
    const floaters = new T.Group();scene.add(floaters);
    const floatingA=leaf(floaters,[-2.48,1.16,-.3],.36,-.7);
    floatingA.rotation.z=.5;
    const floatingB=tomato(floaters,[2.36,1.05,.6],.27);
    const floatingC=leaf(floaters,[1.88,1.9,-1.2],.3,.9);
    const floatingD=leaf(floaters,[-2.15,-.27,1.65],.23,.7);
    [floatingA,floatingB,floatingC,floatingD].forEach((o,i)=>{o.userData.home=o.position.clone();o.userData.phase=i;});

    let photoMode=true;
    let active='pizza', paused=document.documentElement.classList.contains('motion-paused');
    let visible=true, disposed=false, frame=0, lastTime=0, elapsed=0;
    let yaw=-.35, targetYaw=-.35, tilt=.1, targetTilt=.1, pointerDown=false, pointerId=null, lastX=0;
    let tossStart=-99;
    const prefersReduced=window.matchMedia('(prefers-reduced-motion: reduce)');
    function draw(now) {
      frame=0;
      if(disposed)return;
      const dt=lastTime ? Math.min((now-lastTime)/1000,.05) : 0;lastTime=now;
      if(!paused)elapsed+=dt;
      const smooth=paused ? 1 : 1-Math.exp(-dt*8);
      yaw+=(targetYaw-yaw)*smooth;tilt+=(targetTilt-tilt)*smooth;
      root.rotation.y=yaw+(!paused&&!pointerDown?Math.sin(elapsed*.24)*.09:0);
      root.rotation.x=tilt;
      root.position.y=!paused ? Math.sin(elapsed*.85)*.045 : 0;
      const t=(elapsed-tossStart)/1.45;
      const tossing=!paused&&t>=0&&t<=1;
      tossables.forEach((o)=>{
        const h=o.userData.home,phase=o.userData.phase,amount=o.userData.amount;
        const arc=tossing ? Math.sin(t*Math.PI)*amount : 0;
        o.position.set(h.x + arc*(phase-.5)*.7,h.y+arc*(.9+phase*.8),h.z+arc*(.5-phase)*.55);
        o.rotation.x=o.userData.spin.x+arc*(phase-.5)*1.8;
        o.rotation.z=o.userData.spin.z+arc*(phase-.5)*1.3;
      });
      floaters.children.forEach((o,i)=>{
        o.position.y=o.userData.home.y+(!paused ? Math.sin(elapsed*.9+i*1.7)*.15 : 0);
        if(!paused)o.rotation.y+=dt*(i%2?-.12:.12);
      });
      renderer.render(scene,camera);
      if(!paused&&!photoMode&&visible&&!document.hidden)frame=requestAnimationFrame(draw);
    }
    function requestDraw(){if(!frame&&!disposed){lastTime=0;frame=requestAnimationFrame(draw);}}
    function resize(){
      const w=wrap.clientWidth,h=wrap.clientHeight;
      if(!w||!h)return;
      renderer.setSize(w,h,false);camera.aspect=w/h;
      // Fit the food, rather than cropping the bowl, in tall mobile viewports.
      camera.fov=camera.aspect<.9?42:36;
      camera.updateProjectionMatrix();requestDraw();
    }
    const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(wrap);resize();
    const visibilityObserver=new IntersectionObserver((entries)=>{
      visible=entries[0].isIntersecting;
      if(visible)requestDraw();else if(frame){cancelAnimationFrame(frame);frame=0;lastTime=0;}
    },{rootMargin:'100px'});visibilityObserver.observe(wrap);
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden&&frame){cancelAnimationFrame(frame);frame=0;lastTime=0;}
      else if(visible)requestDraw();
    });
    window.addEventListener('ctf:view',(event)=>{photoMode=event.detail.photoMode;if(photoMode&&frame){cancelAnimationFrame(frame);frame=0;}else if(!photoMode)requestDraw();});
    window.addEventListener('ctf:motion',(event)=>{paused=event.detail.paused;tossStart=-99;requestDraw();});
    function toss(){
      if(paused||prefersReduced.matches){
        targetYaw+=Math.PI/3;
        status.textContent='Dish rotated. Motion is paused.';
      }else{tossStart=elapsed;status.textContent='Ingredients tossed.';}
      requestDraw();
    }
    tossButton.addEventListener('click',toss);tossButton.disabled=false;
    sceneButtons.forEach((button)=>button.addEventListener('click',()=>{
      active=button.dataset.scene;bowl.visible=active==='bowl';pizza.visible=active==='pizza';
      tossStart=-99;targetYaw=-.35;
      sceneButtons.forEach((b)=>b.setAttribute('aria-pressed',String(b===button)));
      canvas.setAttribute('aria-label',`Interactive illustrative ${active}. Drag horizontally or use left and right arrow keys to rotate. Press Space to toss the ingredients.`);
      status.textContent=active==='bowl'?'3D bowl selected.':'3D pizza selected.';
      requestDraw();
    }));
    canvas.addEventListener('pointerdown',(e)=>{
      if(e.button!==0||pointerId!==null)return;
      pointerDown=true;pointerId=e.pointerId;lastX=e.clientX;
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove',(e)=>{
      if(pointerDown&&e.pointerId===pointerId){targetYaw+=(e.clientX-lastX)*.009;lastX=e.clientX;requestDraw();}
      else if(e.pointerType==='mouse'&&!paused){const rect=canvas.getBoundingClientRect();targetTilt=.1+((e.clientY-rect.top)/rect.height-.5)*.12;}
    });
    function endDrag(e){if(e.pointerId!==pointerId)return;pointerDown=false;pointerId=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);}
    canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);canvas.addEventListener('lostpointercapture',()=>{pointerDown=false;pointerId=null;});
    canvas.addEventListener('pointerleave',()=>{targetTilt=.1;});
    canvas.addEventListener('keydown',(e)=>{
      if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();targetYaw+=e.key==='ArrowLeft'?-.3:.3;requestDraw();}
      if(e.code==='Space'){e.preventDefault();toss();}
    });
    canvas.addEventListener('webglcontextlost',(e)=>{
      e.preventDefault();disposed=true;if(frame)cancelAnimationFrame(frame);showFallback();
      resizeObserver.disconnect();visibilityObserver.disconnect();
    });
    // Render successfully before removing the static fallback.
    renderer.render(scene,camera);
    wrap.classList.add('scene-ready');
    requestDraw();
    window.addEventListener('pagehide',(event)=>{
      if(event.persisted)return;
      disposed=true;cancelAnimationFrame(frame);resizeObserver.disconnect();visibilityObserver.disconnect();
      const geometrySet=new Set(),materialSet=new Set();
      scene.traverse((object)=>{if(object.geometry)geometrySet.add(object.geometry);if(object.material)materialSet.add(object.material);});
      geometrySet.forEach((geometry)=>geometry.dispose());materialSet.forEach((material)=>material.dispose());renderer.dispose();
    });
  } catch (error) {
    console.warn('Clock To Fit: 3D unavailable; showing the image fallback.',error);
    renderer?.dispose();showFallback();
  }
})();
