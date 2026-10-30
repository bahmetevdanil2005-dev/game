(() => {
  const $ = id => document.getElementById(id);
  const splash = $('splash'), menu = $('main-menu'), game = $('game-screen'), modal = $('modal');
  const modalTitle = $('modal-title'), modalContent = $('modal-content');
  const showMenu = () => { splash.classList.add('out'); setTimeout(() => { splash.classList.add('hidden'); menu.classList.remove('hidden'); }, 850); };
  window.addEventListener('load', () => setTimeout(showMenu, 3300), { once:true });
  $('back-to-menu').addEventListener('click', () => { game.classList.add('hidden'); menu.classList.remove('hidden'); });
  const openStub = (title, body) => {
    modalTitle.textContent = title;
    modalContent.innerHTML = body;
    modal.classList.remove('hidden');
  };
  document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => {
    const action = button.dataset.action;
    if (action === 'single') {
      openStub('ОДИНОЧНАЯ ИГРА', '<p class="modal-copy">Одиночное приключение уже в планах. Игровой уровень и управление добавим следующим этапом.</p><span class="stage-chip">СКОРО · ЭТАП 02</span>');
    } else if (action === 'coop') {
      openStub('СОВМЕСТНАЯ ИГРА', '<p class="modal-copy">Выбери количество игроков. Пока это демонстрационная заглушка — режим подключим позже.</p><div class="choice-row"><button class="choice-button" data-players="2">2 ИГРОКА</button><button class="choice-button" data-players="3">3 ИГРОКА</button><button class="choice-button" data-players="4">4 ИГРОКА</button></div><p class="modal-copy" id="coop-feedback">Локальная и сетевая игра появятся на следующем этапе.</p>');
      modalContent.querySelectorAll('[data-players]').forEach(choice => choice.addEventListener('click', () => {
        modalContent.querySelector('#coop-feedback').textContent = choice.dataset.players + ' игрока(ов) выбрано. Режим пока находится в разработке.';
        modalContent.querySelectorAll('[data-players]').forEach(x => x.classList.toggle('selected', x === choice));
      }));
    } else if (action === 'shop') {
      openStub('МАГАЗИН', '<p class="modal-copy">Здесь появятся персонажи, облики и улучшения. Магазин пока закрыт — берегём карманные деньги.</p><span class="stage-chip">СКОРО</span>');
    } else if (action === 'settings') {
      openStub('НАСТРОЙКИ', '<div class="setting-row"><span>Звуковые эффекты</span><button class="toggle" type="button" aria-pressed="true" aria-label="Переключить звук"></button></div><div class="setting-row"><span>Музыка</span><button class="toggle" type="button" aria-pressed="true" aria-label="Переключить музыку"></button></div><div class="setting-row"><span>Вибрация</span><button class="toggle" type="button" aria-pressed="true" aria-label="Переключить вибрацию"></button></div><p class="modal-copy">Переключатели пока демонстрационные. Сохранение настроек подключим позже.</p>');
      modalContent.querySelectorAll('.toggle').forEach(toggle => toggle.addEventListener('click', () => toggle.setAttribute('aria-pressed', toggle.getAttribute('aria-pressed') !== 'true' ? 'true' : 'false')));
    }
  }));
  const closeModal = () => modal.classList.add('hidden');
  $('modal-close').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

})();