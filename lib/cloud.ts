// @ts-nocheck — geometry ported 1:1 from the original hand-tuned script; the exported API below is typed.
// Point clouds of a sport motorcycle and a sedan, shared by the hero scan, the inspection scan
// and the small previews in cards. Built once, on the client, from a seeded random so every
// visitor sees the same shapes.

export type Shape = { pos: Float32Array; br: Float32Array; col: Uint8Array; tags: { t: string; a: number[] }[]; checks: number[][] };


export const TAU = Math.PI * 2;
export const COL = ["#F3F6FA", "#D9E8FF", "#FF5446", "#BFD6FF", "#4DA3FF", "#3550E0"]; // 4, 5: M livery blues
export const D = 4.4, PIV = 0.5;

function rng(seed){let a=seed>>>0;return function(){a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
let R = rng(20261020);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];

/* ---------- point-cloud builder ---------- */
class Cloud{
  constructor(){this.p=[];}
  add(x,y,z,b,c){this.p.push([x,y,z,b===undefined?.7:b,c||0]);}
  torus(cx,cy,cz,Ro,ro,n,b){for(let i=0;i<n;i++){const t=R()*TAU,f=R()*TAU,rr=Ro+ro*Math.cos(f);this.add(cx+rr*Math.cos(t),cy+rr*Math.sin(t),cz+ro*Math.sin(f),b*(.7+.3*Math.cos(f)));}}
  ring(cx,cy,cz,r,n,b,zs){for(let i=0;i<n;i++){const t=R()*TAU;this.add(cx+r*Math.cos(t),cy+r*Math.sin(t),cz+(R()*2-1)*(zs||0),b);}}
  annulus(cx,cy,cz,r0,r1,n,b){for(let i=0;i<n;i++){const r=Math.sqrt(r0*r0+(r1*r1-r0*r0)*R()),t=R()*TAU;this.add(cx+r*Math.cos(t),cy+r*Math.sin(t),cz,b);}}
  spokes(cx,cy,cz,r0,r1,k,n,b,ph){for(let s=0;s<k;s++){const a=ph+s*TAU/k;for(let i=0;i<n;i++){const r=r0+(r1-r0)*R();this.add(cx+r*Math.cos(a),cy+r*Math.sin(a),cz+(R()-.5)*.01,b);}}}
  line(a,e,n,b){for(let i=0;i<n;i++){const t=R();this.add(a[0]+(e[0]-a[0])*t+(R()-.5)*.004,a[1]+(e[1]-a[1])*t+(R()-.5)*.004,a[2]+(e[2]-a[2])*t+(R()-.5)*.004,b);}}
  cyl(a,e,r,n,b){const d=[e[0]-a[0],e[1]-a[1],e[2]-a[2]],L=Math.hypot(d[0],d[1],d[2]),dn=d.map(v=>v/L),h=Math.abs(dn[1])<.9?[0,1,0]:[1,0,0];let u=cross(dn,h);const ul=Math.hypot(u[0],u[1],u[2]);u=u.map(v=>v/ul);const v=cross(dn,u);for(let i=0;i<n;i++){const t=R(),q=R()*TAU,cq=Math.cos(q)*r,sq=Math.sin(q)*r;this.add(a[0]+d[0]*t+u[0]*cq+v[0]*sq,a[1]+d[1]*t+u[1]*cq+v[1]*sq,a[2]+d[2]*t+u[2]*cq+v[2]*sq,b);}}
  ellip(c,rx,ry,rz,n,b,keep,col){let k=0,tries=0;while(k<n&&tries<n*14){tries++;const u=R()*2-1,t=R()*TAU,s=Math.sqrt(1-u*u);const x=c[0]+rx*s*Math.cos(t),y=c[1]+ry*u,z=c[2]+rz*s*Math.sin(t);if(keep&&!keep(x,y,z))continue;this.add(x,y,z,b,col);k++;}}
  box(c,sx,sy,sz,n,b){const A=[sy*sz,sx*sz,sx*sy],T=A[0]+A[1]+A[2];for(let i=0;i<n;i++){const r=R()*T,sg=R()<.5?-.5:.5;let x=(R()-.5)*sx,y=(R()-.5)*sy,z=(R()-.5)*sz;if(r<A[0])x=sg*sx;else if(r<A[0]+A[1])y=sg*sy;else z=sg*sz;this.add(c[0]+x,c[1]+y,c[2]+z,b);}}
}

/* BMW M 1000 RR (2025+) silhouette, metres, front = +x, ground y = 0.
   Fully faired superbike: pointed nose with a central intake and slim LEDs, tall bubble screen,
   M winglets on the front fairing, M livery stripes, high sharp tail with a hanging plate holder,
   carbon wheels, underslung swingarm and the angled Akrapovič silencer on the right. */
function moto(){
  const C=new Cloud(),F=[.71,.30,0],B=[-.71,.30,0];
  const lerp=(a,b,t)=>a+(b-a)*t;
  /* loft: shell through cross-sections [x, yBottom, yTop, halfWidth]; flat-sided superellipse, narrower at the top */
  const loft=(S,n,b,keep,colFn,pw=.42)=>{
    const L=[];let tot=0;for(let i=0;i<S.length-1;i++){const d=Math.abs(S[i+1][0]-S[i][0]);L.push(d);tot+=d;}
    let k=0,tries=0;
    while(k<n&&tries<n*6){tries++;
      let r=R()*tot,i=0;while(i<L.length-1&&r>L[i]){r-=L[i];i++;}
      const t=L[i]?r/L[i]:0,a=S[i],e=S[i+1];
      const x=lerp(a[0],e[0],t),y0=lerp(a[1],e[1],t),y1=lerp(a[2],e[2],t),w=lerp(a[3],e[3],t);
      const q=R()*TAU,c=Math.cos(q),sn=Math.sin(q),v=Math.sign(sn)*Math.pow(Math.abs(sn),pw);
      const y=(y0+y1)/2+(y1-y0)/2*v,z=w*(1-.28*Math.max(0,v))*Math.sign(c)*Math.pow(Math.abs(c),pw);
      if(keep&&!keep(x,y,z))continue;
      const cc=colFn?colFn(x,y,z):0;C.add(x,y,z,cc?1:b,cc);k++;
    }
  };
  /* M livery on the fairing sides: light blue, dark blue and red stripes rising towards the tank */
  const livery=(x,y,z)=>{
    if(x<.08||x>.68||Math.abs(z)<.11)return 0;
    const o=y-(.3+(x-.1)*.62);
    return o>0&&o<.05?4:o>=.05&&o<.09?5:o>=.09&&o<.14?2:0;
  };

  /* wheels: 120/70 front, 200/55 rear, carbon rims with 10 spokes, discs and calipers */
  C.torus(F[0],F[1],F[2],.248,.052,900,1);
  C.torus(B[0],B[1],B[2],.235,.09,1050,1);
  C.ring(F[0],F[1],0,.2,150,.55,.03); C.ring(B[0],B[1],0,.2,150,.55,.05);
  C.spokes(F[0],F[1],0,.035,.2,10,10,.45,.1); C.spokes(B[0],B[1],0,.035,.2,10,10,.45,.4);
  C.annulus(F[0],F[1],.072,.11,.16,170,.75); C.annulus(F[0],F[1],-.072,.11,.16,170,.75);
  C.annulus(B[0],B[1],-.1,.07,.1,70,.6);
  for(const s of [1,-1]) C.box([F[0]-.1,F[1]+.11,.085*s],.05,.09,.03,40,.9);
  /* front mudguard hugging the tyre */
  for(let i=0;i<150;i++){const a=.35+R()*1.45;C.add(F[0]+.315*Math.cos(a),F[1]+.315*Math.sin(a),(R()*2-1)*.06,.6);}

  /* upside-down fork, clamps, clip-ons */
  for(const s of [1,-1]){
    C.cyl([F[0],F[1],.085*s],[.51,.9,.085*s],.026,140,.8);
    C.cyl([.52,.88,.1*s],[.47,.86,.26*s],.014,40,.75);
  }
  C.box([.5,.91,0],.08,.03,.2,50,.7);

  /* front fairing: pointed nose with a central intake, flat sides, lower fairing behind the wheel; open window over the frame */
  const keepFront=(x,y,z)=>!(x>.84&&Math.abs(z)<.05&&y>.69&&y<.82)&&!(Math.abs(z)>.1&&x>-.02&&x<.26&&y>.6&&y<.8);
  loft([[.97,.76,.8,.02],[.9,.69,.86,.08],[.8,.62,.92,.15],[.68,.58,.96,.2],[.57,.54,.97,.22],
        [.47,.36,.95,.225],[.38,.18,.9,.22],[.24,.15,.86,.2],[.1,.16,.84,.18],[-.04,.24,.8,.15],[-.1,.32,.78,.13]],
       1900,.55,keepFront,livery);
  /* fuel tank hump between the fairing and the seat */
  loft([[.5,.86,.96,.12],[.36,.84,1.0,.17],[.18,.82,1.0,.18],[.02,.8,.94,.16],[-.08,.8,.87,.13]],800,.6,(x,y)=>y>.83);
  /* aluminium frame spars seen through the window */
  for(const s of [1,-1]){C.cyl([.42,.9,.13*s],[-.06,.62,.14*s],.025,160,.85);C.cyl([.24,.62,.12*s],[.0,.68,.13*s],.02,60,.6);}
  /* bright feature lines: they carry the silhouette, the surfaces only fill it */
  const poly=(P,n,b,col)=>{const L=[];let tot=0;for(let i=0;i<P.length-1;i++){const d=Math.hypot(P[i+1][0]-P[i][0],P[i+1][1]-P[i][1],P[i+1][2]-P[i][2]);L.push(d);tot+=d;}
    for(let k=0;k<n;k++){let r=R()*tot,i=0;while(i<L.length-1&&r>L[i]){r-=L[i];i++;}const t=L[i]?r/L[i]:0,a=P[i],e=P[i+1];
      C.add(lerp(a[0],e[0],t)+(R()-.5)*.004,lerp(a[1],e[1],t)+(R()-.5)*.004,lerp(a[2],e[2],t)+(R()-.5)*.004,b,col||0);}};
  for(const s of [1,-1]){
    const S=(P)=>P.map(p=>[p[0],p[1],p[2]*s]);
    poly(S([[.97,.79,.02],[.88,.85,.1],[.76,.9,.16],[.6,.92,.21],[.46,.88,.22]]),160,1);              /* upper fairing edge */
    poly(S([[.97,.76,.02],[.86,.67,.1],[.66,.58,.2],[.5,.52,.22],[.42,.3,.22],[.32,.16,.2],[.1,.15,.18],[-.1,.3,.13]]),300,1); /* lower outline */
    poly(S([[-.1,.31,.13],[-.03,.58,.15],[.04,.8,.16]]),80,.9);                                       /* rear edge of the side panel */
    for(const [o,c] of [[0,4],[.05,5],[.09,2],[.14,2]]) poly(S([[.66,.65+o,.215],[.1,.3+o,.19]]),110,1,c);   /* M stripes, high at the nose */
    poly(S([[.36,.86,.17],[.18,.86,.18],[.02,.82,.16],[-.08,.81,.13]]),110,.95);                       /* tank lower edge */
    poly(S([[-.1,.63,.13],[-.4,.72,.115],[-.66,.85,.075],[-.9,.975,.012]]),170,1);                    /* tail underside */
    poly(S([[-.12,.85,.13],[-.4,.93,.11],[-.66,.99,.07],[-.9,1.025,.012]]),170,1);                     /* tail top edge */
    poly(S([[.82,.6,.21],[.57,.62,.33],[.57,.53,.335],[.8,.54,.33],[.82,.6,.21]]),120,1);             /* winglet outline */
  }
  poly([[.55,.97,0],[.36,1.0,0],[.16,1.0,0],[0,.94,0],[-.08,.87,0]],120,1);                          /* tank spine */
  /* slim LED headlights either side of the intake */
  for(const s of [1,-1]) C.line([.92,.74,.045*s],[.84,.7,.12*s],70,1);
  C.line([.95,.775,-.025],[.95,.775,.025],14,1);

  /* tall bubble screen, raked back */
  for(let i=0;i<340;i++){const u=R(),v=R()*2-1,x=lerp(.86,.55,u),y=lerp(.88,1.13,Math.pow(u,.75))-.035*v*v,w=lerp(.06,.16,u);C.add(x,y,v*w,.4);}

  /* M winglets: curved blades with end plates on the lower front fairing */
  for(const s of [1,-1]){
    for(let i=0;i<170;i++){const u=R(),x=lerp(.84,.56,u),z=s*lerp(.2,.33,R()),y=.6+.05*u-.02*Math.abs(z-.26*s)*8;C.add(x,y,z,.9);}
    for(let i=0;i<70;i++){const u=R();C.add(lerp(.8,.57,u),lerp(.53,.63,R()),s*.335,.85);}
  }
  /* mirrors on stalks */
  for(const s of [1,-1]){C.line([.62,.96,.2*s],[.6,1.0,.3*s],18,.6);C.ellip([.6,1.0,.33*s],.05,.022,.04,60,.75);}

  /* seat, high sharp tail, tail light, hanging plate holder */
  for(let i=0;i<420;i++){const u=R(),x=lerp(-.02,-.4,u),w=.13*(1-.25*u),z=(R()*2-1)*w;C.add(x,.84-.02*u-.5*z*z,z,.7);}
  loft([[-.1,.62,.86,.13],[-.4,.71,.94,.115],[-.66,.84,1.0,.075],[-.9,.97,1.03,.012]],1000,.58,null,(x,y,z)=>x<-.3&&x>-.6&&Math.abs(z)>.07&&y>.86&&y<.9?4:0);
  C.ellip([-.86,.985,0],.02,.012,.05,60,1,null,2);
  C.line([-.72,.9,0],[-.86,.72,0],40,.6);
  C.box([-.875,.66,0],.012,.11,.17,90,.6);

  /* underslung swingarm, chain, rearsets */
  for(const s of [1,-1]){
    C.cyl([-.12,.43,.11*s],[B[0],B[1],.11*s],.032,190,.75);
    C.line([-.16,.37,.1*s],[-.6,.27,.1*s],60,.55);
    C.cyl([-.2,.45,.2*s],[-.24,.4,.22*s],.012,24,.7);
    C.line([-.17,.5,.19*s],[-.27,.38,.2*s],20,.55);
  }
  C.line([-.08,.4,-.13],[B[0],B[1]+.05,-.13],70,.45); C.line([-.08,.32,-.13],[B[0],B[1]-.05,-.13],70,.45);

  /* Akrapovič: link pipe under the engine, short silencer angled up on the right */
  C.cyl([.3,.13,.1],[-.12,.3,.19],.04,160,.6);
  C.cyl([-.14,.31,.2],[-.56,.56,.24],.065,420,.82);
  C.ring(-.57,.565,.24,.058,40,.95,.0);

  return {C,tags:[],checks:[[.1,.4,.2],[.6,.62,.09],[.71,.3,.1],[.45,1.0,0]]};
}

/* sedan, scaled units, front = +x */
function car(){
  const C=new Cloud();
  const kn=[[1.24,.27],[1.21,.34],[1.15,.39],[1.0,.425],[.70,.45],[.45,.475],[.30,.56],[.16,.65],[.05,.705],[-.10,.73],[-.32,.735],[-.52,.70],[-.72,.635],[-.92,.56],[-1.06,.51],[-1.16,.49],[-1.21,.45],[-1.24,.33]];
  const yt=x=>{if(x>=kn[0][0])return kn[0][1];for(let i=1;i<kn.length;i++){if(x>=kn[i][0]){const x0=kn[i-1][0],y0=kn[i-1][1],x1=kn[i][0],y1=kn[i][1];return y1+(y0-y1)*(x-x1)/(x0-x1);}}return kn[kn.length-1][1];};
  const yb=x=>.10+Math.max(0,x-.98)*.22+Math.max(0,-.98-x)*.28;
  const belt=x=>Math.min(yt(x),.50-x*.012);
  const wl=x=>.47*(1-.38*Math.pow(Math.min(1,Math.abs(x)/1.24),5));
  const gh=x=>yt(x)>belt(x)+.012;
  const gw=(y,x)=>.43-.13*Math.min(1,Math.max(0,(y-belt(x))/.23));
  const W=[[.76,.185],[-.78,.185]];
  const arch=(x,y,r)=>W.some(w=>(x-w[0])*(x-w[0])+(y-w[1])*(y-w[1])<r*r);
  const side=()=>R()<.5?-1:1;
  let k;
  k=0;while(k<1500){const x=-1.24+2.48*R(),y0=yb(x),y1=belt(x),y=y0+(y1-y0)*R();if(arch(x,y,.215))continue;const h=(y1-y0)/2||1,m=(y-(y0+y1)/2)/h;C.add(x,y,side()*wl(x)*(1-.06*m*m),.48+.16*R());k++;}
  k=0;while(k<620){const x=-1.24+2.48*R();if(gh(x))continue;const w=wl(x),z=(R()*2-1)*w;C.add(x,yt(x)-.035*(z/w)*(z/w),z,.72);k++;}
  k=0;while(k<200){const x=-1.0+1.42*R();if(!gh(x))continue;C.add(x,belt(x),side()*(.43+(wl(x)-.43)*R()),.62);k++;}
  k=0;while(k<640){const x=-1.0+1.42*R();if(!gh(x))continue;const b0=belt(x),b1=yt(x),y=b0+(b1-b0)*R(),edge=(b1-y<.014||y-b0<.012)?.85:.26;C.add(x,y,side()*gw(y,x),edge);k++;}
  k=0;while(k<760){const x=-1.0+1.42*R();if(!gh(x))continue;const y=yt(x),hw=gw(y,x),z=(R()*2-1)*hw;let b=.7;if(x>.06)b=.24;else if(x<-.32)b=.3;C.add(x,y-.02*(z/hw)*(z/hw),z,b);k++;}
  for(const s of [1,-1]){
    k=0;while(k<220){const x=-1.18+2.36*R(),y=.37-x*.02;if(arch(x,y,.235))continue;C.add(x,y,s*wl(x),.9);k++;}
    C.line([-.55,.115,s*.462],[.52,.115,s*.462],90,.55);
    C.line([.34,.14,s*.468],[.34,.49,s*.468],30,.35);
    C.line([-.38,.14,s*.468],[-.38,.505,s*.468],30,.35);
    for(const w of W){
      for(let i=0;i<80;i++){const a=-.02+R()*(Math.PI+.04);C.add(w[0]+.215*Math.cos(a),w[1]+.215*Math.sin(a),s*wl(w[0])*.99,.85);}
      C.torus(w[0],w[1],s*.43,.145,.042,300,.9);
      C.ring(w[0],w[1],s*.465,.11,60,.6,.004);
      C.spokes(w[0],w[1],s*.47,.02,.11,5,10,.5,R()*TAU);
    }
    C.ellip([.36,.53,s*.50],.05,.03,.045,40,.7);
    for(let i=0;i<70;i++){const t=R();C.add(1.17-.10*t,.385+.02*t+(R()-.5)*.012,s*(.40-.14*t),1,1);}
  }
  for(let i=0;i<300;i++){const z=(R()*2-1)*.44;C.add(1.235-.08*(z/.47)*(z/.47),.16+R()*.18,z,.5);}
  for(let i=0;i<260;i++){const z=(R()*2-1)*.44;C.add(-1.235+.06*(z/.47)*(z/.47),.16+R()*.29,z,.48);}
  for(let i=0;i<160;i++){const z=(R()*2-1)*.44;C.add(-1.228+.05*(z/.47)*(z/.47),.44+(R()-.5)*.016,z,1,2);}
  return {C,tags:[],
    checks:[[.85,.45,0],[-.05,.32,.47],[.76,.185,.45],[.36,.50,.18]]};
}

function finalize(obj,len,N){
  const P=obj.C.p;let x0=1e9,x1=-1e9,y0=1e9,z0=1e9,z1=-1e9;
  for(const p of P){if(p[0]<x0)x0=p[0];if(p[0]>x1)x1=p[0];if(p[1]<y0)y0=p[1];if(p[2]<z0)z0=p[2];if(p[2]>z1)z1=p[2];}
  const s=len/(x1-x0),mx=(x0+x1)/2,mz=(z0+z1)/2;
  const T=p=>[(p[0]-mx)*s,(p[1]-y0)*s,(p[2]-mz)*s];
  for(let i=P.length-1;i>0;i--){const j=(R()*(i+1))|0,t=P[i];P[i]=P[j];P[j]=t;}
  const Q=P.slice(0,N);
  while(Q.length<N){const q=P[(R()*P.length)|0];Q.push([q[0]+(R()-.5)*.006,q[1]+(R()-.5)*.006,q[2]+(R()-.5)*.006,q[3],q[4]]);}
  Q.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  const pos=new Float32Array(N*3),br=new Float32Array(N),col=new Uint8Array(N);
  for(let i=0;i<N;i++){const t=T(Q[i]);pos[i*3]=t[0];pos[i*3+1]=t[1];pos[i*3+2]=t[2];br[i]=Q[i][3];col[i]=Q[i][4];}
  return {pos,br,col,tags:obj.tags.map(g=>({t:g.t,a:T(g.a)})),checks:(obj.checks||[]).map(T)};
}

let cache: { SH: Shape[]; FLOOR: number[][]; N: number; R: () => number } | null = null;

/** Build (once) and return both shapes and the floor rings. */
export function getClouds() {
  if (cache) return cache;
  const N = typeof window !== "undefined" && window.innerWidth < 760 ? 3800 : 6000;
  const SH = [finalize(moto(), 2.35, N), finalize(car(), 2.6, N)];
  const FLOOR: number[][] = [];
  for (let k = 0; k < 9; k++) { const r = .5 + k * .14, n = 56 + k * 12; for (let i = 0; i < n; i++) { const a = i / n * TAU + k * .37; FLOOR.push([Math.cos(a) * r, 0, Math.sin(a) * r, .18 * (1 - k / 11)]); } }
  for (let i = 0; i < 72; i++) { const a = i / 72 * TAU, major = i % 6 === 0; for (let j = 0; j < (major ? 8 : 4); j++) { const r = 1.68 + j * (major ? .016 : .012); FLOOR.push([Math.cos(a) * r, 0, Math.sin(a) * r, major ? .34 : .2]); } }
  cache = { SH, FLOOR, N, R };
  return cache;
}

/** Static preview of a shape on a small canvas (cards, phone feed). */
export function drawMini(cnv: HTMLCanvasElement, shape: "moto" | "car", yw: number) {
  const { SH, FLOOR, N } = getClouds();
  const shp = SH[shape === "car" ? 1 : 0];
  const r = cnv.getBoundingClientRect(); if (!r.width) return;
  const d = Math.min(2, window.devicePixelRatio || 1); cnv.width = Math.round(r.width * d); cnv.height = Math.round(r.height * d);
  const c = cnv.getContext("2d"); if (!c) return;
  c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, r.width, r.height);
  const f = Math.min(r.width * 1.3, r.height * 2.3), cx = r.width / 2, cy = r.height * .56, cyw = Math.cos(yw), syw = Math.sin(yw), cp = Math.cos(.2), sp = Math.sin(.2);
  const pr = (x: number, y: number, z: number) => { const X = x * cyw + z * syw, Zr = -x * syw + z * cyw, Y = y - PIV, Y2 = Y * cp + Zr * sp, Z2 = Zr * cp - Y * sp, k = f / (Z2 + D); return [cx + X * k, cy - Y2 * k, Z2]; };
  c.fillStyle = COL[0];
  for (let i = 0; i < FLOOR.length; i += 2) { const p = FLOOR[i], q = pr(p[0], p[1], p[2]); c.globalAlpha = p[3]; c.fillRect(q[0] - .5, q[1] - .5, 1, 1); }
  let last = -1;
  for (let i = 0; i < N; i += 2) {
    const q = pr(shp.pos[i * 3], shp.pos[i * 3 + 1], shp.pos[i * 3 + 2]), b = shp.br[i], cc = shp.col[i];
    if (cc !== last) { c.fillStyle = COL[cc]; last = cc; }
    c.globalAlpha = Math.min(1, b * (.3 + .8 * Math.min(1, Math.max(.12, .55 - q[2] * .42))));
    const s = (.7 + b * .7) * (D / (q[2] + D)); c.fillRect(q[0] - s / 2, q[1] - s / 2, s, s);
  }
  c.globalAlpha = 1;
}

export const prefersReduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const finePointer = () => typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;
