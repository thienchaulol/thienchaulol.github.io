/* Light / dark theme. Loaded in <head> without defer so a saved
   choice is applied before the page paints (no white flash). */
(function(){
  var root=document.documentElement;
  var KEY='theme';
  try{
    var saved=localStorage.getItem(KEY);
    if(saved==='light'||saved==='dark')root.setAttribute('data-theme',saved);
  }catch(e){/* storage blocked: follow the device setting */}

  var mq=window.matchMedia?window.matchMedia('(prefers-color-scheme: dark)'):null;
  function current(){
    var t=root.getAttribute('data-theme');
    if(t==='light'||t==='dark')return t;
    return mq&&mq.matches?'dark':'light';
  }

  function sync(){
    var dark=current()==='dark';
    var btns=document.querySelectorAll('.theme-toggle');
    for(var i=0;i<btns.length;i++){
      btns[i].setAttribute('aria-label',dark?'Switch to light mode':'Switch to dark mode');
      btns[i].title=dark?'Light mode':'Dark mode';
    }
    var meta=document.querySelector('meta[name="theme-color"]');
    if(meta){
      var paper=getComputedStyle(root).getPropertyValue('--paper').trim();
      if(paper)meta.setAttribute('content',paper);
    }
  }

  function toggle(){
    var next=current()==='dark'?'light':'dark';
    function apply(){root.setAttribute('data-theme',next);sync()}
    var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(document.startViewTransition&&!reduce)document.startViewTransition(apply);else apply();
    try{localStorage.setItem(KEY,next)}catch(e){}
  }

  document.addEventListener('click',function(e){
    if(e.target.closest&&e.target.closest('.theme-toggle'))toggle();
  });
  if(mq){
    if(mq.addEventListener)mq.addEventListener('change',sync);
    else if(mq.addListener)mq.addListener(sync);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync);else sync();
})();
