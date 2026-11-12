(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const taskNames = {
    find: 'Определить, кому продавать дальше',
    grow: 'Развить выбранное направление продаж',
    repair: 'Найти, как быстрее доводить сделки до оплаты'
  };
  let selectedSituation = '';
  function selectSituation(value) {
    if (!Object.hasOwn(taskNames, value)) return;
    Object.keys(taskNames).forEach(key => { byId('route-' + key).hidden = key !== value; });
    byId('selected-task').textContent = taskNames[value];
    selectedSituation = taskNames[value];
    const body = 'Здравствуйте, Сергей!\n\nЗадача: ' + taskNames[value] + '.\nНаш сайт: \nЧто продаём: \n\nХочу обсудить первые шаги.';
    byId('email-cta').href = 'mailto:ceo@comlead.pro?subject=' + encodeURIComponent('ComLead: ' + taskNames[value]) + '&body=' + encodeURIComponent(body);
    calculate();
  }
  document.querySelectorAll('input[name="situation"]').forEach(input => {
    input.addEventListener('change', () => { if (input.checked) selectSituation(input.value); });
  });


  const rates = {
    small: { appointed: 7000, primary: 12000, final: 18000, minLtv: 1000000, minCheck: 100000 },
    medium: { appointed: 10000, primary: 17000, final: 27000, minLtv: 1500000, minCheck: 100000 },
    large: { appointed: 14000, primary: 24000, final: 41000, minLtv: 2000000, minCheck: 100000 },
    enterprise: { appointed: 20000, primary: 34000, final: 61000, minLtv: 3000000, minCheck: 500000 }
  };
  const rub = value => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value) + ' ₽';
  const percent = value => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(value) + '%';
  const set = (id, value) => { byId(id).textContent = value; };
  const num = id => {
    const value = byId(id).value.replace(/\s/g, '').replace(',', '.');
    return /^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value) ? Number(value) : NaN;
  };
  const moneyInputs = [byId('calc-check'), byId('calc-ltv')];
  function formatMoneyInput(input) {
    const value = input.value;
    const raw = value.replace(/\s/g, '');
    if (!/^-?\d*(?:[.,]\d*)?$/.test(raw)) return;
    const caret = input.selectionStart;
    const significantBefore = value.slice(0, caret ?? value.length).replace(/\s/g, '').length;
    const [integer, fraction] = raw.replace('.', ',').split(',');
    const formatted = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (fraction === undefined ? '' : ',' + fraction);
    if (formatted === value) return;
    input.value = formatted;
    if (document.activeElement !== input || caret === null) return;
    let position = 0, seen = 0;
    while (position < formatted.length && seen < significantBefore) {
      if (!/\s/.test(formatted[position])) seen++;
      position++;
    }
    input.setSelectionRange(position, position);
  }
  moneyInputs.forEach(input => {
    input.addEventListener('beforeinput', event => {
      const start = input.selectionStart, end = input.selectionEnd;
      if (start === null || start !== end) return;
      if (event.inputType === 'deleteContentBackward' && start > 1 && input.value[start - 1] === ' ') input.setSelectionRange(start - 2, start);
      if (event.inputType === 'deleteContentForward' && input.value[start] === ' ') input.setSelectionRange(start, start + 2);
    });
    input.addEventListener('input', () => formatMoneyInput(input));
    formatMoneyInput(input);
  });
  const validInteger = (v, max) => Number.isInteger(v) && v >= 0 && v <= max;
  // Same effective rule as the Google Sheets calculator: per first payment only.
  const commissionAmount = check => Math.max(40000, check * 0.015);
  const feePercent = fee => {
    const value = fee * 100;
    const rounded = Math.round(value * 100) / 100;
    return (Math.abs(value - rounded) > 0.000001 ? '≈ ' : '') + new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(rounded) + '%';
  };
  const word = (n, forms) => forms[n % 100 >= 11 && n % 100 <= 14 ? 2 : n % 10 === 1 ? 0 : n % 10 >= 2 && n % 10 <= 4 ? 1 : 2];
  let scenario = 'base';
  const count = value => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(value);
  function applyScenario() {
    const packages = num('calc-meetings') / 10;
    if (!Number.isSafeInteger(packages) || packages < 1) return;
    if (scenario === 'custom') return;
    byId('calc-finals').value = String(packages * (scenario === 'base' ? 3 : 2));
    byId('calc-deals').value = String(packages * (scenario === 'base' ? 1 : 0.5));
  }
  function calculate() {
    const format = byId('calc-format').value;
    const full = format === 'full';
    const rate = rates[byId('calc-segment').value];
    const meetings = num('calc-meetings'), check = num('calc-check'), ltv = num('calc-ltv');
    const finals = num('calc-finals'), deals = num('calc-deals');
    const formatDescriptions = {
      appointed: 'Назначаем встречи. Проводит ваша команда.',
      primary: 'Назначаем и проводим первичные встречи.',
      full: 'Ведём весь цикл до первой оплаты.'
    };
    set('calc-format-description', formatDescriptions[format] || 'Выберите тариф.');
    byId('flow-diagram').classList.toggle('client-led', !full);
    byId('calc-finals').max = String(meetings);
    byId('calc-deals').max = String(Number.isFinite(finals) ? finals : 0);
    set('target-check', rate ? 'Целевой первый чек — от ' + rub(rate.minCheck) + '.' : 'Выберите сегмент.');
    set('target-ltv', rate ? 'Годовой LTV клиента — от ' + rub(rate.minLtv) + '.' : '');
    const warnings = {
      'check-warning': rate && check > 0 && check < rate.minCheck ? 'Ниже ориентира для выбранного сегмента — ' + rub(rate.minCheck) + '. Обсудим экономику и формат.' : '',
      'ltv-warning': ltv < check ? 'Годовой LTV не может быть меньше первого чека.' : rate && ltv > 0 && ltv < rate.minLtv ? 'Ниже целевого LTV для выбранного сегмента — ' + rub(rate.minLtv) + ' за год. Обсудим экономику.' : ''
    };
    for (const [id, message] of Object.entries(warnings)) {
      set(id, message);
      byId(id).hidden = !message;
    }
    let error = '';
    if (!rate || !['full', 'appointed', 'primary'].includes(format)) error = 'Выберите формат и сегмент.';
    else if (!Number.isSafeInteger(meetings) || meetings < 10 || meetings % 10 !== 0) error = 'Укажите количество встреч, кратное 10.';
    else if (!Number.isFinite(check) || check <= 0 || !Number.isFinite(ltv) || ltv <= 0) error = 'Укажите положительный первый чек и годовой LTV.';
    else if (ltv < check) error = 'Годовой LTV включает первый чек и не может быть меньше него.';
    else if (!validInteger(finals, meetings) || (!Number.isFinite(deals) || deals < 0 || deals > finals)) error = 'Финальных встреч не может быть больше первичных, а покупателей с оплатой — больше финальных встреч.';
    byId('calc-error').hidden = !error;
    set('calc-error', error);
    byId('economics-output').hidden = Boolean(error);
    byId('scenario-payments').setAttribute('aria-pressed', String(scenario === 'base'));
    byId('scenario-no-payments').setAttribute('aria-pressed', String(scenario === 'cautious'));
    byId('contact-calculation').hidden = Boolean(error);
    if (error) return;
    set('scenario-explanation', scenario === 'cautious' ? '0,5 оплаты на 10 встреч — среднее ожидание: одна оплата на 20 встреч.' : scenario === 'custom' ? 'Ваш сценарий. Финальные встречи проходят с частью тех же покупателей.' : 'На каждые 10 встреч — 3 финальные и 1 первая оплата. Это допущение для расчёта.');
    
    const unit = format === 'appointed' ? rate.appointed : rate.primary;
    const base = meetings * unit;
    const feePerDeal = commissionAmount(check);
    const finalCost = full ? finals * rate.final : 0;
    const feeCost = full ? deals * feePerDeal : 0;
    const total = base + finalCost + feeCost;
    set('scenario-summary', meetings + ' → ' + finals + ' → ' + count(deals));
    set('conversion-final', '↓ ' + percent(finals / meetings * 100));
    set('conversion-paid', '↓ ' + (finals ? percent(deals / finals * 100) : '—'));
    set('funnel-title', 'Прогноз по сценарию');
    set('funnel-context', full ? 'Веду переговоры до первой оплаты' : 'Сделки закрывает ваша команда');
    set('result-heading', 'Итого по прогнозу');
    set('funnel-primary-count', meetings);
    document.querySelector('.shape-first > span').textContent = word(meetings, ['встреча', 'встречи', 'встреч']);
    set('funnel-primary-label', format === 'appointed' ? 'Назначенные встречи · ICP Fit' : 'Первичные встречи · ICP Fit');
    set('funnel-primary-note', format === 'appointed' ? 'Проводит ваша команда' : 'Назначаю и провожу');
    set('funnel-primary-cost', rub(base));
    set('funnel-primary-rate', rub(unit));
    set('funnel-final-count', finals);
    set('funnel-final-note', full ? 'Подтверждены бюджет, участники покупки, потребность и срок' : 'Ваша команда подтверждает бюджет, участников покупки, потребность и срок');
    set('funnel-final-cost', full ? rub(finalCost) : '—');
    set('funnel-final-rate', full ? rub(rate.final) : '—');
    set('funnel-final-rate-unit', full ? 'за встречу' : 'Ваша команда');
    document.querySelector('.shape-final > span').textContent = word(finals, ['встреча', 'встречи', 'встреч']);
    set('funnel-paid-count', count(deals));
    document.querySelector('.shape-paid > span').textContent = Number.isInteger(deals) ? word(deals, ['оплата', 'оплаты', 'оплат']) : 'оплаты';
    set('funnel-paid-label', full ? 'Комиссия с первых оплат' : 'Закрытие сделок');
    set('funnel-paid-note', full ? 'Только с первого чека каждого покупателя' : 'До первой оплаты ведёт ваша команда');
    set('funnel-paid-rate', full ? feePercent(feePerDeal / check) : '—');
    set('funnel-paid-rate-unit', full ? rub(feePerDeal) + ' с первого чека' : 'Ваша команда');
    set('funnel-paid-cost', full ? rub(feeCost) : '—');
    set('budget-label', full ? 'За всю воронку' : 'Пакет: ' + meetings + ' ' + word(meetings, format === 'appointed' ? ['назначенная встреча', 'назначенные встречи', 'назначенных встреч'] : ['первичная встреча', 'первичные встречи', 'первичных встреч']));
    set('calc-total', rub(total));
    const timing = 'На старте — ' + rub(base) + ' за пакет из ' + meetings + ' ' + word(meetings, ['встречи', 'встреч', 'встреч']) + '. Разработка стратегии — 0 ₽, входит в первый пакет.';
    set('budget-timing', timing + (full ? ' Ещё ' + rub(finalCost + feeCost) + ' по сценарию: финальные встречи ' + rub(finalCost) + ', комиссия ' + rub(feeCost) + '.' : ''));
    set('first-revenue', rub(deals * check));
    set('year-revenue', rub(deals * ltv - total));
    const clientCount = count(deals) + ' ' + (Number.isInteger(deals) ? word(deals, ['клиент', 'клиента', 'клиентов']) : 'клиента');
    set('first-revenue-formula', clientCount + ' × ' + rub(check));
    set('year-revenue-formula', clientCount + ' × ' + rub(ltv) + ' LTV − ' + rub(total) + ' на ComLead');
    set('first-balance', rub(deals * check - total));
    set('year-gross', rub(deals * ltv));
    byId('year-revenue').classList.toggle('is-negative', deals * ltv - total < 0);
    set('annual-share', deals > 0 ? percent(total / (deals * ltv) * 100) : 'Нет оплат');
    const tariff = byId('calc-format').selectedOptions[0].textContent;
    const summary = 'Тариф «' + tariff + '» · ' + meetings + ' встреч · чек ' + rub(check) + ' · LTV ' + rub(ltv);
    const costs = 'Расходы на ComLead ' + rub(total) + ' · доля в годовой выручке ' + (deals > 0 ? percent(total / (deals * ltv) * 100) : '—');
    set('contact-inputs', summary);
    set('contact-costs', costs);
    byId('send-calculation').href = 'https://t.me/SergeySolodyankin?text=' + encodeURIComponent(
      'Здравствуйте, Сергей! Хочу обсудить расчёт ComLead.\n' + (selectedSituation ? 'Задача: ' + selectedSituation + '\n' : '') + summary + '\nКому продаём: ' + byId('calc-segment').selectedOptions[0].textContent + '\n' + costs + '\nСценарий: ' + meetings + ' → ' + finals + ' → ' + count(deals) + '\nПервые оплаты: ' + rub(deals * check) + '\nВыручка за 12 месяцев после расходов на ComLead: ' + rub(deals * ltv - total)
    );
    set('economics-note', deals === 0 ? 'В этом сценарии первые оплаты и годовая выручка равны нулю. Отрицательный итог показывает расходы на ComLead без поступлений от покупателей.' : 'Число встреч и оплат — сценарий для расчёта, а не обещание результата. Срок получения денег зависит от цикла сделки.');
  }
  byId('economics-form').addEventListener('submit', event => event.preventDefault());
  byId('scenario-no-payments').addEventListener('click', () => {
    scenario = 'cautious';
    applyScenario();
    calculate();
  });
  byId('scenario-payments').addEventListener('click', () => {
    scenario = 'base';
    applyScenario();
    calculate();
  });
  byId('calc-meetings').addEventListener('input', applyScenario);
  for (const id of ['calc-finals', 'calc-deals']) {
    byId(id).addEventListener('input', () => { scenario = 'custom'; });
  }
  document.querySelectorAll('.economics-form input').forEach(input => input.addEventListener('input', calculate));
  document.querySelectorAll('.economics-form select').forEach(input => input.addEventListener('change', calculate));
  document.querySelectorAll('[data-format]').forEach(link => link.addEventListener('click', () => {
    byId('calc-format').value = link.dataset.format;
    if (link.dataset.example === 'minimum') {
      byId('calc-segment').value = 'small';
      byId('calc-meetings').value = '10';
      byId('calc-check').value = '100 000';
      byId('calc-ltv').value = '1 000 000';
      byId('calc-finals').value = '3';
      byId('calc-deals').value = '1';
      scenario = 'base';
    }
    calculate();
  }));
  calculate();

  const mobileNav = document.querySelector('.mobile-nav');
  document.querySelectorAll('.mobile-menu a').forEach(link => link.addEventListener('click', () => mobileNav.removeAttribute('open')));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') mobileNav.removeAttribute('open'); });
  document.addEventListener('click', event => { if (!mobileNav.contains(event.target)) mobileNav.removeAttribute('open'); });
})();
