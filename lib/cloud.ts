// @ts-nocheck — geometry ported 1:1 from the original hand-tuned script; the exported API below is typed.
// Point clouds of a sport motorcycle and a sedan, shared by the hero scan, the inspection scan
// and the small previews in cards. Built once, on the client, from a seeded random so every
// visitor sees the same shapes.

export type Shape = { pos: Float32Array; br: Float32Array; col: Uint8Array; tags: { t: string; a: number[] }[]; checks: number[][] };


export const TAU = Math.PI * 2;
export const COL = ["#F3F6FA", "#D9E8FF", "#FF5446", "#BFD6FF"];
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

/* sport motorcycle, metres, front = +x */
function moto(){
  const C=new Cloud(),F=[.70,.31,0],B=[-.72,.31,0];
  C.torus(F[0],F[1],F[2],.27,.055,560,.95);
  C.torus(B[0],B[1],B[2],.27,.08,680,.95);
  C.ring(F[0],F[1],0,.215,150,.5,.02); C.ring(B[0],B[1],0,.215,150,.5,.03);
  C.spokes(F[0],F[1],0,.04,.215,6,14,.4,.25); C.spokes(B[0],B[1],0,.04,.215,6,14,.4,.6);
  C.annulus(F[0],F[1],.078,.115,.165,170,.75); C.annulus(F[0],F[1],-.078,.115,.165,170,.75);
  C.annulus(B[0],B[1],-.105,.075,.105,80,.6);
  for(let i=0;i<120;i++){const a=.2+R()*1.5;C.add(F[0]+.34*Math.cos(a),F[1]+.34*Math.sin(a),(R()*2-1)*.06,.6);}
  for(const s of [1,-1]){
    C.cyl([.70,.31,.085*s],[.50,.88,.085*s],.024,120,.8);
    C.cyl([.46,.87,.11*s],[.41,.85,.33*s],.014,50,.75);
    C.cyl([.48,.88,.11*s],[-.18,.62,.13*s],.03,170,.72);
    C.cyl([-.18,.48,.12*s],[-.72,.31,.12*s],.028,150,.72);
    C.line([-.12,.45,.13*s],[-.12,.45,.25*s],14,.6);
  }
  C.box([.49,.90,0],.09,.035,.23,60,.7);
  C.ellip([.56,.84,0],.17,.15,.17,560,.85,x=>x>.47);
  C.ellip([.71,.83,0],.022,.032,.085,90,1,null,1);
  C.ellip([.46,1.0,0],.11,.07,.12,140,.45,(x,y)=>y>.985&&x>.40);
  C.ellip([.20,.90,0],.27,.12,.165,760,.85,(x,y)=>y>.83);
  C.ellip([.32,.62,0],.30,.22,.175,700,.62,(x,y,z)=>Math.abs(z)>.12&&x>.06&&y>.47&&x<.40+(y-.47)*.9);
  C.ellip([.14,.34,0],.30,.10,.15,260,.5,(x,y)=>y<.36);
  C.box([.08,.46,0],.40,.30,.24,420,.5);
  C.box([.20,.64,0],.18,.14,.26,140,.5);
  C.cyl([-.14,.72,0],[-.30,.43,0],.03,60,.55);
  for(let i=0;i<120;i++){const a=1.25+R()*.95;C.add(B[0]+.33*Math.cos(a),B[1]+.33*Math.sin(a),(R()*2-1)*.07,.55);}
  for(let i=0;i<380;i++){const u=R(),x=-.44+.38*u,w=.14*(1-.2*(1-u)),z=(R()*2-1)*w;C.add(x,.84+.04*(1-u)-.6*z*z,z,.65);}
  for(let i=0;i<640;i++){const s=R(),x=-.38-.54*s,w=.15*(1-.6*s),top=.89+.12*s,bot=top-.17*(1-.3*s);
    if(R()<.62){C.add(x,bot+(top-bot)*R(),(R()<.5?-1:1)*w,.72);}else{const z=(R()*2-1)*w;C.add(x,top-.35*z*z,z,.8);}}
  C.ellip([-.925,.975,0],.014,.022,.06,70,1,null,2);
  C.cyl([-.02,.30,.11],[-.50,.56,.17],.055,300,.68);
  return {C,tags:[{t:"Подвеска",a:[.60,.60,.09]},{t:"Двигатель",a:[.06,.40,.13]},{t:"Шины и диски",a:[-.72,.64,0]},{t:"Пластик и ЛКП",a:[.24,1.02,0]}],
    checks:[[.08,.46,.14],[.34,.68,.17],[.70,.31,.10],[.50,.95,0]]};
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
  return {C,tags:[{t:"Кузов и ЛКП",a:[.72,.46,0]},{t:"Оптика",a:[1.14,.39,.34]},{t:"Салон",a:[-.15,.73,0]},{t:"Ходовая",a:[-.78,.185,.46]}],
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
