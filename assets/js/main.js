(() => {
  const $ = id => document.getElementById(id);
  const splash = $('splash'), menu = $('main-menu'), game = $('game-screen'), modal = $('modal');
  const modalTitle = $('modal-title'), modalContent = $('modal-content');
  const showMenu = () => { splash.classList.add('out'); setTimeout(() => { splash.classList.add('hidden'); menu.classList.remove('hidden'); }, 850); };
  window.addEventListener('load', () => setTimeout(showMenu, 3300), { once:true });
  $('play-button').addEventListener('click', () => { menu.classList.add('hidden'); game.classList.remove('hidden'); });
  $('back-to-menu').addEventListener('click', () => { game.classList.add('hidden'); menu.classList.remove('hidden'); });
  const closeModal = () => modal.classList.add('hidden');
  $('modal-close').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  document.querySelectorAll('[data-panel]').forEach(button => button.addEventListener('click', () => {
    const panel = button.dataset.panel;
    if (panel === 'howto') {
      modalTitle.textContent = 'КАК ИГРАТЬ';
      modalContent.innerHTML = '<p class="modal-copy">Управляй бегемотом, держи курс по реке и используй его главный талант — мощный пук. Чем точнее выберешь момент, тем дальше продвинешься. Подробное управление появится вместе с первым игровым уровнем.</p>';
    } else {
      modalTitle.textContent = 'НАСТРОЙКИ';
      modalContent.innerHTML = '<div class="setting-row"><span>Звуковые эффекты</span><button class="toggle" type="button" aria-pressed="true" aria-label="Переключить звук"></button></div><div class="setting-row"><span>Вибрация</span><button class="toggle" type="button" aria-pressed="true" aria-label="Переключить вибрацию"></button></div><p class="modal-copy">Настройки сохраняются в этой сессии. Игровые параметры добавим на следующем этапе.</p>';
      modalContent.querySelectorAll('.toggle').forEach(toggle => toggle.addEventListener('click', () => toggle.setAttribute('aria-pressed', toggle.getAttribute('aria-pressed') !== 'true' ? 'true' : 'false')));
    }
    modal.classList.remove('hidden');
  }));
})();