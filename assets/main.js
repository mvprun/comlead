(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const taskNames = {
    find: 'Определить, кому продавать дальше',
    grow: 'Развить выбранное направление продаж',
    repair: 'Выяснить, почему не закрываются сделки'
  };
  function selectSituation(value) {
    if (!Object.hasOwn(taskNames, value)) return;
    Object.keys(taskNames).forEach(key => { byId('route-' + key).hidden = key !== value; });
    byId('selected-task').textContent = taskNames[value];
    const subject = 'ComLead: ' + taskNames[value];
    const body = 'Здравствуйте, Сергей!\n\nЗадача: ' + taskNames[value] + '.\nНаш сайт: \nЧто продаём: \n\nХочу обсудить первые шаги.';
    byId('email-cta').href = 'mailto:sergey@mvprunner.ru?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }
  document.querySelectorAll('input[name="situation"]').forEach(input => {
    input.addEventListener('change', () => { if (input.checked) selectSituation(input.value); });
  });
  selectSituation('find');

  const rub = value => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value) + ' ₽';
  function calculate() {
    const a = Number(byId('check').value), m = Number(byId('margin').value), n = Number(byId('months').value);
    const rawFee = byId('fee').value, f = Number(rawFee), total = byId('calc-total'), detail = byId('calc-detail');
    if (rawFee === '') {
      total.textContent = 'Укажите комиссию';
      detail.textContent = 'Введите согласованную или рассматриваемую ставку. 0 — расчёт без комиссии.';
      return;
    }
    if (byId('check').value === '' || byId('margin').value === '' || byId('months').value === '' ||
        ![a, m, n, f].every(Number.isFinite) || !(a > 0 && m > 0 && m <= 100 && n >= 1 && n <= 36 && Number.isInteger(n) && f >= 0 && f <= 100)) {
      total.textContent = 'Проверьте вводные';
      detail.textContent = 'Нужны положительный чек, маржинальность до 100%, от 1 до 36 целых месяцев и комиссия от 0 до 100%.';
      return;
    }
    const budget = 150000 * n, unit = a * (m - f) / 100;
    if (unit <= 0) {
      total.textContent = 'Экономика не сходится';
      detail.textContent = 'Комиссия равна маржинальности или превышает её. После исполнения и комиссии средств на покрытие фикса не остаётся.';
      return;
    }
    const count = Math.ceil(budget / unit), pct = count % 100;
    const word = pct >= 11 && pct <= 14 ? 'покупателей' : count % 10 === 1 ? 'покупатель' : count % 10 >= 2 && count % 10 <= 4 ? 'покупателя' : 'покупателей';
    total.textContent = count + ' ' + word;
    detail.textContent = 'Фикс за ' + n + ' мес. — ' + rub(budget) + '. С продажи после исполнения и комиссии остаётся ' + rub(unit) + '. Выручка на пороге окупаемости — ' + rub(count * a) + '.';
  }
  document.querySelectorAll('.inputs input').forEach(input => input.addEventListener('input', calculate));
  calculate();

  const mobileNav = document.querySelector('.mobile-nav');
  document.querySelectorAll('.mobile-menu a').forEach(link => link.addEventListener('click', () => mobileNav.removeAttribute('open')));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') mobileNav.removeAttribute('open'); });
  document.addEventListener('click', event => { if (!mobileNav.contains(event.target)) mobileNav.removeAttribute('open'); });
})();
