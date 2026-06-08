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

// ===== mobile menu (clip-path circle) =====
const burger=document.getElementById('burger');
const mobileMenu=document.getElementById('mobileMenu');
const mClose=document.getElementById('mClose');
if(burger&&mobileMenu){
  function openMenu(){mobileMenu.classList.remove('closing');mobileMenu.classList.add('open');document.body.classList.add('menu-open');burger.setAttribute('aria-expanded','true');}
  function closeMenu(){
    mobileMenu.classList.add('closing');
    mobileMenu.classList.remove('open');
    document.body.classList.remove('menu-open');
    burger.setAttribute('aria-expanded','false');
    setTimeout(()=>mobileMenu.classList.remove('closing'),500);
  }
  burger.addEventListener('click',()=>{mobileMenu.classList.contains('open')?closeMenu():openMenu();});
  mClose&&mClose.addEventListener('click',closeMenu);
  document.querySelectorAll('.mobile-menu a.m-link, .mobile-menu .m-foot a').forEach(l=>l.addEventListener('click',closeMenu));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&mobileMenu.classList.contains('open'))closeMenu();});
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

// ===== process: sequential ring spin, loops 1->4->1 continuous =====
const steps=[...document.querySelectorAll('.pr-step')];
if(steps.length){
  let active=0;
  function cycle(){
    steps.forEach((s,idx)=>{
      s.classList.remove('spin');
      if(idx<active)s.classList.add('done');else s.classList.remove('done');
    });
    if(active>=steps.length){ // reset and restart from step 1
      steps.forEach(s=>s.classList.remove('done','spin'));
      active=0;
    }
    void steps[active].offsetWidth; // reflow to restart animation
    steps[active].classList.add('spin');
    active++;
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

// ===== work slider: full item move per click + drag =====
(function(){
  const vp=document.getElementById('wkViewport');
  const track=document.getElementById('wkTrack');
  if(!vp||!track)return;
  const cards=[...track.querySelectorAll('.wk-card')];
  let index=0,max=0,pos=0;
  function step(){const c=track.querySelector('.wk-card');const gap=20;return c?c.getBoundingClientRect().width+gap:340;}
  function maxIndex(){
    const total=track.scrollWidth;
    const visible=vp.clientWidth;
    return Math.max(0,Math.ceil((total-visible)/step()));
  }
  function go(i){
    max=maxIndex();
    index=Math.max(0,Math.min(max,i));
    pos=-index*step();
    // clamp so last move doesn't overscroll past content
    const limit=Math.min(0,vp.clientWidth-track.scrollWidth);
    pos=Math.max(limit,pos);
    track.classList.remove('dragging');
    track.style.transform=`translateX(${pos}px)`;
  }
  go(0);
  window.addEventListener('resize',()=>go(index));
  const next=document.getElementById('wkNext'),prev=document.getElementById('wkPrev');
  next&&next.addEventListener('click',()=>go(index+1));
  prev&&prev.addEventListener('click',()=>go(index-1));
  // drag
  let down=false,sx=0,sp=0,moved=false;
  vp.addEventListener('pointerdown',(e)=>{down=true;moved=false;sx=e.clientX;sp=pos;track.classList.add('dragging');vp.classList.add('drag');vp.setPointerCapture(e.pointerId);});
  vp.addEventListener('pointermove',(e)=>{if(!down)return;const dx=e.clientX-sx;if(Math.abs(dx)>4)moved=true;const limit=Math.min(0,vp.clientWidth-track.scrollWidth);track.style.transform=`translateX(${Math.max(limit,Math.min(0,sp+dx))}px)`;});
  function up(){if(!down)return;down=false;vp.classList.remove('drag');
    // snap to nearest item
    const cur=-parseFloat((track.style.transform.match(/-?[\d.]+/)||[0])[0])||0;
    go(Math.round(cur/step()));
  }
  vp.addEventListener('pointerup',up);vp.addEventListener('pointercancel',up);vp.addEventListener('pointerleave',up);
  // prevent link click after drag
  track.querySelectorAll('.wk-shot').forEach(a=>a.addEventListener('click',(e)=>{if(moved){e.preventDefault();}}));
})();