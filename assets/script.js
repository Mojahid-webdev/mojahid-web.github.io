// ===== scroll header =====
const nav=document.getElementById('nav');
function onScroll(){if(window.scrollY>40)nav.classList.add('scrolled');else nav.classList.remove('scrolled');}
window.addEventListener('scroll',onScroll,{passive:true});onScroll();

// ===== mouse-follow hero glow + subtle parallax on decorative glows =====
const glow=document.getElementById('heroGlow');
const hero=document.getElementById('home');
const hoverable=window.matchMedia('(hover:hover)').matches;
if(glow&&hero&&hoverable){
  hero.addEventListener('mousemove',(e)=>{
    const r=hero.getBoundingClientRect();
    const x=((e.clientX-r.left)/r.width)*100;
    const y=((e.clientY-r.top)/r.height)*100;
    glow.style.left=(38+x*0.24)+'%';
    glow.style.top=(40+y*0.28)+'%';
  });
  hero.addEventListener('mouseleave',()=>{glow.style.left='50%';glow.style.top='54%';});
}
// parallax decorative section glows on scroll
const decoGlows=[...document.querySelectorAll('.sec-glow')];
if(decoGlows.length){
  let ticking=false;
  window.addEventListener('scroll',()=>{
    if(ticking)return;ticking=true;
    requestAnimationFrame(()=>{
      const vh=window.innerHeight;
      decoGlows.forEach(g=>{
        const r=g.getBoundingClientRect();
        const prog=(r.top+r.height/2-vh/2)/vh; // -1..1
        g.style.transform=`translateY(${prog*-30}px)`;
      });
      ticking=false;
    });
  },{passive:true});
}

// ===== custom cursor =====
if(window.matchMedia('(hover:hover) and (pointer:fine)').matches){
  const dot=document.getElementById('cur'),ring=document.getElementById('curRing');
  let rx=0,ry=0,dx=0,dy=0;
  window.addEventListener('mousemove',(e)=>{dx=e.clientX;dy=e.clientY;dot.style.left=dx+'px';dot.style.top=dy+'px';});
  (function follow(){rx+=(dx-rx)*.18;ry+=(dy-ry)*.18;ring.style.left=rx+'px';ring.style.top=ry+'px';requestAnimationFrame(follow);})();
  document.querySelectorAll('a,button,.abtn,.wk-arrow').forEach(el=>{
    el.addEventListener('mouseenter',()=>ring.classList.add('hover'));
    el.addEventListener('mouseleave',()=>ring.classList.remove('hover'));
  });
}

// ===== mobile menu =====
const burger=document.getElementById('burger');
if(burger){
  burger.addEventListener('click',()=>{const o=document.body.classList.toggle('menu-open');burger.setAttribute('aria-expanded',o);});
  document.querySelectorAll('.mob-nav a, .mob-cta').forEach(l=>l.addEventListener('click',()=>{document.body.classList.remove('menu-open');burger.setAttribute('aria-expanded','false');}));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.body.classList.remove('menu-open');burger.setAttribute('aria-expanded','false');}});
}

// ===== scroll reveal (once) + counters + process ring trigger =====
const counters=new Set();
function animateCount(el){
  if(counters.has(el))return;counters.add(el);
  const target=parseFloat(el.dataset.count);
  const suffix=el.dataset.suffix||'';
  const isFloat=String(el.dataset.count).includes('.');
  const dur=1400;const start=performance.now();
  function tick(now){
    const p=Math.min((now-start)/dur,1);
    const eased=1-Math.pow(1-p,3);
    const val=target*eased;
    el.textContent=(isFloat?val.toFixed(1):Math.round(val))+suffix;
    if(p<1)requestAnimationFrame(tick);else el.textContent=(isFloat?target.toFixed(1):target)+suffix;
  }
  requestAnimationFrame(tick);
}

const io=new IntersectionObserver((entries)=>{
  entries.forEach(en=>{
    if(en.isIntersecting){
      en.target.classList.add('in');
      en.target.querySelectorAll&&en.target.querySelectorAll('[data-count]').forEach(animateCount);
      if(en.target.hasAttribute('data-count'))animateCount(en.target);
      io.unobserve(en.target);
    }
  });
},{threshold:.18,rootMargin:'0px 0px -40px 0px'});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
// standalone counters not inside .reveal
document.querySelectorAll('[data-count]').forEach(el=>{if(!el.closest('.reveal'))io.observe(el);});

// ===== process: sequential ring spin =====
const steps=[...document.querySelectorAll('.pr-step')];
if(steps.length){
  let active=0;
  function cycle(){
    steps.forEach((s,idx)=>{
      s.classList.remove('spin');
      if(idx<active)s.classList.add('done');else s.classList.remove('done');
    });
    void steps[active].offsetWidth; // reflow to restart animation
    steps[active].classList.add('spin');
    active++;
    if(active>steps.length){active=0;steps.forEach(s=>s.classList.remove('done','spin'));void steps[0].offsetWidth;steps[0].classList.add('spin');active=1;}
  }
  const prIO=new IntersectionObserver((e)=>{
    if(e[0].isIntersecting){cycle();setInterval(cycle,1850);prIO.disconnect();}
  },{threshold:.3});
  prIO.observe(document.querySelector('.pr-rail'));
}

// ===== FAQ accordion =====
document.querySelectorAll('.faq-q').forEach(q=>{
  q.addEventListener('click',()=>{
    const item=q.closest('.faq-item');
    const ans=item.querySelector('.faq-a');
    const open=item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(o=>{o.classList.remove('open');o.querySelector('.faq-a').style.maxHeight=null;});
    if(!open){item.classList.add('open');ans.style.maxHeight=ans.scrollHeight+'px';}
  });
});

// ===== work slider: drag + arrows =====
(function(){
  const vp=document.getElementById('wkViewport');
  const track=document.getElementById('wkTrack');
  if(!vp||!track)return;
  let pos=0,max=0;
  function bounds(){max=Math.max(0,track.scrollWidth-vp.clientWidth);}
  function setX(x){pos=Math.max(-max,Math.min(0,x));track.style.transform=`translateX(${pos}px)`;}
  bounds();window.addEventListener('resize',()=>{bounds();setX(pos);});
  function step(){const card=track.querySelector('.wk-card');const gap=20;return card?card.getBoundingClientRect().width+gap:340;}
  const next=document.getElementById('wkNext'),prev=document.getElementById('wkPrev');
  next&&next.addEventListener('click',()=>setX(pos-step()));
  prev&&prev.addEventListener('click',()=>setX(pos+step()));
  // drag
  let down=false,sx=0,sp=0,moved=false;
  vp.addEventListener('pointerdown',(e)=>{down=true;moved=false;sx=e.clientX;sp=pos;vp.classList.add('drag');vp.setPointerCapture(e.pointerId);});
  vp.addEventListener('pointermove',(e)=>{if(!down)return;const dx=e.clientX-sx;if(Math.abs(dx)>4)moved=true;setX(sp+dx);});
  function up(){down=false;vp.classList.remove('drag');}
  vp.addEventListener('pointerup',up);vp.addEventListener('pointercancel',up);vp.addEventListener('pointerleave',up);
  // prevent link click after drag
  track.querySelectorAll('.wk-shot').forEach(a=>a.addEventListener('click',(e)=>{if(moved){e.preventDefault();}}));
})();