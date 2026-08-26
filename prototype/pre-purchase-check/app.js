const state = {
  source: null,
  concern: null,
  ticker: null,
  beforeIntent: null,
  afterIntent: null,
};

const form = document.querySelector('#check-form');
const tickerInput = document.querySelector('#ticker');
const entry = document.querySelector('#entry');
const result = document.querySelector('#result');
const checks = document.querySelector('#checks');
const resultTicker = document.querySelector('#result-ticker');
const contextLine = document.querySelector('#context-line');
const detailToggle = document.querySelector('#detail-toggle');
const details = document.querySelector('#details');
const savedNote = document.querySelector('#saved-note');

const genericChecks = [
  {
    tone: 'warn',
    icon: '!',
    title: '価格に期待が入りすぎていないか',
    body: 'まず確認したいのは「良い会社か」ではなく「今の価格で買う理由が残っているか」です。直近の上昇、同業比較、利益成長との釣り合いを見ます。',
    foot: '実装時：株価推移・バリュエーション・同業比較を接続',
  },
  {
    tone: 'ok',
    icon: '↗',
    title: '話題が、本当に売上と利益へ落ちているか',
    body: 'テーマ名がIRに登場するだけでは不十分です。対象事業の売上寄与、利益率、受注・契約など「数字へ落ちた証拠」を優先します。',
    foot: '実装時：開示資料・セグメント情報・受注情報を接続',
  },
  {
    tone: 'unknown',
    icon: '?',
    title: '買いたくなった理由の反対側を1つ見たか',
    body: '買う理由が正しいとしても、何が起きたらその理由が崩れるのか。反証材料が未確認なら、いま最も価値があるのは追加の買い材料ではなく反対証拠です。',
    foot: '実装時：ユーザーの期待理由に対応した反証テンプレートを生成',
  },
];

function selectChip(button) {
  const group = button.closest('[data-group]');
  const key = group.dataset.group;
  group.querySelectorAll('.chip').forEach((chip) => chip.classList.remove('active'));
  button.classList.add('active');
  state[key] = button.dataset.value;
}

document.querySelectorAll('.chip').forEach((button) => {
  button.addEventListener('click', () => selectChip(button));
});

function renderChecks() {
  checks.innerHTML = genericChecks.map((item) => `
    <article class="check-card">
      <div class="status-dot ${item.tone}">${item.icon}</div>
      <div>
        <h4>${item.title}</h4>
        <p>${item.body}</p>
        <small>${item.foot}</small>
      </div>
    </article>
  `).join('');
}

function buildContextLine() {
  const parts = [];
  if (state.source) parts.push(`きっかけ：${state.source}`);
  if (state.concern) parts.push(`気になること：${state.concern}`);
  return parts.length ? parts.join(' ・ ') : 'まずは銘柄だけで開始。追加入力は不要です。';
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const ticker = tickerInput.value.trim();
  if (!ticker) return;

  state.ticker = ticker.toUpperCase();
  state.beforeIntent = null;
  state.afterIntent = null;
  resultTicker.textContent = state.ticker;
  contextLine.textContent = buildContextLine();
  renderChecks();

  document.querySelectorAll('#before-intent button, #after-intent button').forEach((button) => button.classList.remove('active'));
  savedNote.classList.add('hidden');
  details.classList.add('hidden');
  detailToggle.textContent = 'もう少し詳しく見る';
  result.classList.remove('hidden');
  requestAnimationFrame(() => result.scrollIntoView({ behavior: 'smooth', block: 'start' }));
});

function bindSingleSelect(containerId, stateKey, onSelect) {
  const container = document.querySelector(containerId);
  container.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => {
      container.querySelectorAll('button').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      state[stateKey] = button.dataset.value;
      onSelect?.();
    });
  });
}

bindSingleSelect('#before-intent', 'beforeIntent');
bindSingleSelect('#after-intent', 'afterIntent', saveSession);

function saveSession() {
  if (!state.ticker || !state.afterIntent) return;
  const key = 'glassbox-prepurchase-prototype-sessions';
  const sessions = JSON.parse(localStorage.getItem(key) || '[]');
  sessions.push({
    ticker: state.ticker,
    source: state.source,
    concern: state.concern,
    beforeIntent: state.beforeIntent,
    afterIntent: state.afterIntent,
    createdAt: new Date().toISOString(),
  });
  localStorage.setItem(key, JSON.stringify(sessions.slice(-100)));
  savedNote.classList.remove('hidden');
}

detailToggle.addEventListener('click', () => {
  const opening = details.classList.contains('hidden');
  details.classList.toggle('hidden');
  detailToggle.textContent = opening ? '詳細を閉じる' : 'もう少し詳しく見る';
});

function resetFlow() {
  state.ticker = null;
  state.beforeIntent = null;
  state.afterIntent = null;
  tickerInput.value = '';
  result.classList.add('hidden');
  entry.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => tickerInput.focus(), 300);
}

document.querySelector('#reset-top').addEventListener('click', resetFlow);
document.querySelector('#reset-bottom').addEventListener('click', resetFlow);
