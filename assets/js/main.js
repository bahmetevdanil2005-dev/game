(() => {
 const $=id=>document.getElementById(id),splash=$('splash'),menu=$('main-menu'),modal=$('modal'),levels=$('levels-screen'),levelOne=$('level-one-screen');
 const modalTitle=$('modal-title'),modalContent=$('modal-content'),screens=[menu,levels,levelOne];
 const showScreen=screen=>screens.forEach(item=>item.classList.toggle('hidden',item!==screen));
 const showMenu=()=>{splash.classList.add('out');setTimeout(()=>{splash.classList.add('hidden');showScreen(menu)},850)};
 window.addEventListener('load',()=>setTimeout(showMenu,3300),{once:true});
 const openStub=(title,body)=>{modalTitle.textContent=title;modalContent.innerHTML=body;modal.classList.remove('hidden')};
 const grid=$('levels-grid');
 for(let n=1;n<=30;n++){
  const btn=document.createElement('button');btn.className='level-card '+(n===1?'level-card-open':'level-card-locked');btn.type='button';
  btn.innerHTML='<span class="level-card-number">'+String(n).padStart(2,'0')+'</span><span class="level-card-stars">☆ ☆ ☆</span><span class="level-card-status">'+(n===1?'НАЧАТЬ':'СКОРО')+'</span>';
  btn.addEventListener('click',()=>{if(n===1)showScreen(levelOne);else openStub('УРОВЕНЬ '+String(n).padStart(2,'0'),'<p class="modal-copy">Этот этап пока закрыт. Сначала подготовим первый уровень, а затем постепенно откроем остальные.</p><span class="stage-chip">СКОРО · В РАЗРАБОТКЕ</span>')});
  grid.appendChild(btn);
 }
 $('levels-back').addEventListener('click',()=>showScreen(menu));$('level-one-back').addEventListener('click',()=>showScreen(levels));
 document.querySelectorAll('[data-action]').forEach(btn=>btn.addEventListener('click',()=>{
  const a=btn.dataset.action;
  if(a==='single')showScreen(levels);
  else if(a==='coop'){openStub('СОВМЕСТНАЯ ИГРА','<p class="modal-copy">Выбери количество игроков. Совместный режим пока находится в разработке.</p><div class="choice-row"><button class="choice-button" data-players="2">2 ИГРОКА</button><button class="choice-button" data-players="3">3 ИГРОКА</button><button class="choice-button" data-players="4">4 ИГРОКА</button></div><p class="modal-copy" id="coop-feedback">Выбери состав команды.</p>');modalContent.querySelectorAll('[data-players]').forEach(c=>c.addEventListener('click',()=>{modalContent.querySelector('#coop-feedback').textContent='Выбрано игроков: '+c.dataset.players+'. Совместный режим появится позже.';modalContent.querySelectorAll('[data-players]').forEach(x=>x.classList.toggle('selected',x===c))}))}
  else if(a==='shop')openStub('МАГАЗИН','<p class="modal-copy">Здесь появятся персонажи, облики и улучшения. Магазин пока закрыт.</p><span class="stage-chip">СКОРО</span>');
  else if(a==='settings'){openStub('НАСТРОЙКИ','<div class="setting-row"><span>Звуковые эффекты</span><button class="toggle" aria-pressed="true"></button></div><div class="setting-row"><span>Музыка</span><button class="toggle" aria-pressed="true"></button></div><div class="setting-row"><span>Вибрация</span><button class="toggle" aria-pressed="true"></button></div><p class="modal-copy">Переключатели пока демонстрационные.</p>');modalContent.querySelectorAll('.toggle').forEach(t=>t.addEventListener('click',()=>t.setAttribute('aria-pressed',t.getAttribute('aria-pressed')!=='true'?'true':'false')))}
 }));
 const close=()=>modal.classList.add('hidden');$('modal-close').addEventListener('click',close);modal.addEventListener('click',e=>{if(e.target===modal)close()});document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
})();