/* /next: Ask-back review. Five states, no backend: each state is a preset model; answering,
   resolving and merging change the model and the page re-renders from it. */
(() => {
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clone = o => JSON.parse(JSON.stringify(o));
const YOU = 'mara-k';
const PEOPLE = { 'mara-k': 205, 'devon-o': 28, 'priya-s': 330 };
const DOC = 'docs/decisions/0482-webhook-retries.md';

/* ---------- icons ---------- */
const I = {
  agent: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="2.5" y="4.5" width="11" height="8" rx="2"/><path d="M8 2v2.5M6 8.5h.01M10 8.5h.01" stroke-linecap="round"/></svg>',
  check: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  chev: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 4l4 4-4 4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  commit: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="8" cy="8" r="2.5"/><path d="M1 8h4.5M10.5 8H15"/></svg>',
  lock: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="4" y="9" width="12" height="8" rx="2"/><path d="M7 9V6.5a3 3 0 0 1 6 0V9"/></svg>',
  split: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M10 3v5M10 8l-5 5M10 8l5 5M5 13v4M15 13v4"/></svg>',
  merge: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="6" cy="4.5" r="2"/><circle cx="6" cy="15.5" r="2"/><circle cx="14" cy="10" r="2"/><path d="M6 6.5v7M6 6.5c0 3 3 3.5 6 3.5"/></svg>',
  ok: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 10.5l3.2 3.2L15 6.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  flag: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 14V2.5h8l-1.5 3 1.5 3h-8"/></svg>',
};
const av = (who, sm) => who === 'relay'
  ? `<span class="av agent${sm ? ' sm' : ''}" aria-hidden="true">${I.agent}</span>`
  : `<span class="av${sm ? ' sm' : ''}" style="--h:${PEOPLE[who]}" aria-hidden="true">${who.slice(0, 1).toUpperCase()}${who.split('-')[1].toUpperCase()}</span>`;

/* ---------- the questions ---------- */
const DEF = {
  q1: {
    n: 'Q1', topic: 'Retry ceiling', title: 'How many attempts before a delivery is given up?',
    file: 'src/webhooks/retry.ts', start: 12, hl: [0],
    code: ['export const MAX_ATTEMPTS = 8;', 'const BASE_DELAY_MIN = 5;', '', 'export function nextDelay(attempt: number) {', '  return BASE_DELAY_MIN * 2 ** (attempt - 1); // minutes', '}'],
    why: 'docs/webhooks.md says failed webhooks are retried “for up to 3 days”. With this backoff, 8 attempts stop after about 21 hours. One of the two is wrong, and I can’t tell which.',
    options: [
      { id: 'a', label: 'Keep 8 attempts and change the docs to “about 21 hours”', short: '8 attempts; docs changed to about 21 hours', sub: 'One line in docs/webhooks.md.', suggested: true },
      { id: 'b', label: 'Raise to 10 attempts (about 3.5 days)', short: '10 attempts, about 3.5 days', sub: 'Matches the docs. A dead delivery shows up 2.5 days later.' },
    ],
  },
  q2: {
    n: 'Q2', topic: 'Event ID on retry', title: 'Should a retry send the same event ID as the first try?',
    file: 'src/webhooks/deliver.ts', start: 41, hl: [2],
    code: ['const headers = {', "  'Ledger-Signature': sign(body, endpoint.secret),", "  'Ledger-Event-Id': attempt.id, // new id per attempt", "  'Ledger-Attempt': String(attempt.number),", '};'],
    why: 'Right now every attempt gets a new ID. Two partners in tests/fixtures/partners.json de-duplicate on this header, so they would process a retried event twice.',
    options: [
      { id: 'a', label: 'Reuse the original event ID', short: 'Reuse the original event ID', sub: 'Retries become safe to de-duplicate. One line changes.', suggested: true, impact: '<b>deliver.ts:43</b> and the log index in <b>src/logs/search.ts</b>' },
      { id: 'b', label: 'Keep a new ID per attempt', short: 'New event ID per attempt', sub: 'Add a changelog note: partners must de-duplicate on the payload.', impact: 'No code. <b>CHANGELOG.md</b> gets a warning for partners.' },
    ],
  },
  q3: {
    n: 'Q3', topic: 'Who hears about give-ups', title: 'When a delivery is given up, who hears about it?',
    file: 'src/webhooks/retry.ts', start: 58, hl: [2],
    code: ['if (attempt.number >= MAX_ATTEMPTS) {', '  await markDead(delivery);', '  // TODO(relay): who gets told?', '  return;', '}'],
    why: 'Today nobody does. The delivery turns red in the dashboard, which is easy to miss for a week.',
    options: [
      { id: 'a', label: 'Email the account owner, at most once a day', short: 'Daily email to the account owner', sub: 'Uses the existing digest mailer.', suggested: true },
      { id: 'b', label: 'Dashboard only, as now', short: 'Dashboard only', sub: 'No new email.' },
      { id: 'c', label: 'Email, and pause the endpoint after 20 dead deliveries in a day', short: 'Email, pause after 20 dead a day', sub: 'Stops hammering a dead server. Needs a “resume” button.' },
    ],
  },
  q1b: {
    n: 'Q1', topic: 'Retry ceiling (asked again)', title: 'The ceiling now comes from config and defaults to 10. Is 10 right, and can accounts change it?',
    file: 'src/webhooks/retry.ts', start: 12, hl: [0], at: '7f03b1d',
    code: ['export const MAX_ATTEMPTS = config.webhooks.maxAttempts ?? 10;', 'const BASE_DELAY_MIN = 5;'],
    why: 'Commit 7f03b1d by @devon-o rewrote this line. Your earlier answer was about the old code, so I haven’t carried it over.',
    options: [
      { id: 'a', label: 'Default 10, not changeable per account', short: 'Default 10, internal config only', sub: 'Matches the docs. Config stays internal.', suggested: true },
      { id: 'b', label: 'Default 8, not changeable per account', short: 'Default 8, internal config only', sub: 'Keeps your earlier answer. The docs still need fixing.' },
      { id: 'c', label: 'Default 10, accounts can set 3 to 12', short: 'Default 10, accounts set 3 to 12', sub: 'Needs a settings field and validation.' },
    ],
  },
  q4: {
    n: 'Q4', topic: 'Retries while an endpoint is down', title: 'If an endpoint is down for hours, should its retries be spread out or paused?',
    file: 'src/webhooks/retry.ts', start: 15, hl: [1],
    code: ['export function nextDelay(attempt: number) {', '  return BASE_DELAY_MIN * 2 ** (attempt - 1); // no jitter', '}'],
    why: 'Added by @priya-s. Deliveries that failed in the same minute retry in the same minute, so a server coming back gets all of them at once.',
    options: [
      { id: 'a', label: 'Pause the endpoint after 5 failures in a row, then probe every 10 minutes', short: 'Pause after 5 failures, probe every 10 min', sub: 'A recovering server gets one request, not thousands.', suggested: true },
      { id: 'b', label: 'Add random jitter of ±20% to each delay', short: '±20% jitter', sub: 'Spreads the load. Doesn’t reduce it.' },
      { id: 'c', label: 'Leave it as it is', short: 'Leave as is', sub: 'The reason goes in the decision log.' },
    ],
  },
};

/* ---------- the agent log: collapsed by default, which is the point ---------- */
const LOG = [
  '09:38:11  task      Retry failed webhook deliveries with backoff (issue #471)',
  '09:38:11  plan      find send path > add retry state > schedule retries > tests',
  '09:38:12  read      src/webhooks/deliver.ts  212 lines',
  '09:38:12  read      src/webhooks/queue.ts  96 lines',
  '09:38:13  read      src/db/schema/deliveries.sql  41 lines',
  '09:38:13  read      docs/webhooks.md  "retried for up to 3 days"',
  '09:38:14  note      docs promise 3 days. no retry code exists yet.',
  '09:38:15  search    "Ledger-Event-Id"  4 matches in 3 files',
  '09:38:15  read      tests/fixtures/partners.json  2 partners de-dupe on Ledger-Event-Id',
  '09:38:16  note      new id per attempt breaks their de-dupe. intended? unknown.',
  '09:38:18  edit      deliveries.sql  +attempt_number +next_attempt_at +dead_at',
  '09:38:19  run       migrate:test  ok  0.8s',
  '09:38:21  write     src/webhooks/retry.ts  new file, 74 lines',
  '09:38:21  choose    MAX_ATTEMPTS = 8, delay 5 min doubling, last try at ~21h',
  '09:38:22  note      21h is not 3 days. asking (Q1).',
  '09:38:24  edit      deliver.ts  wrap send() in an attempt record',
  '09:38:24  edit      deliver.ts  add Ledger-Attempt header',
  '09:38:25  choose    Ledger-Event-Id = attempt.id (new per attempt). asking (Q2).',
  '09:38:27  edit      queue.ts  pick up rows where next_attempt_at <= now()',
  '09:38:29  write     retry.ts  markDead() on final failure',
  '09:38:29  note      nobody is told when a delivery dies. asking (Q3).',
  '09:38:31  run       test src/webhooks  31 passed, 2 failed',
  '09:38:31  fail      retry.test.ts > stops after MAX_ATTEMPTS  expected 8 calls, got 9',
  '09:38:32  fail      deliver.test.ts > signs body  snapshot: header order',
  '09:38:34  edit      retry.ts  off by one: attempt.number starts at 1',
  '09:38:35  edit      __snapshots__/deliver.test.ts.snap  header order',
  '09:38:37  run       test src/webhooks  33 passed',
  '09:38:39  write     tests/webhooks/retry.schedule.test.ts  15 cases',
  '09:38:44  run       test  48 passed  6.2s',
  '09:38:45  run       lint  ok',
  '09:38:45  run       typecheck  ok',
  '09:38:46  diff      3 files  +142 -18',
  '09:38:47  review    3 choices made without enough information',
  '09:38:47  review    retry timing while an endpoint is down: implementation detail, skip',
  '09:38:48  ask       Q1 retry ceiling, Q2 event id on retry, Q3 who hears about give-ups',
  '09:38:48  push      relay/webhook-retries  4 commits',
  '09:38:49  pr        #482 opened, waiting on 3 answers',
];
const SKIP_LINE = LOG.findIndex(l => l.includes('implementation detail')) + 1;
const LOG_MORE = {
  answered: ['09:47:10  answer    Q1 by mara-k', '09:49:31  answer    Q2 by devon-o', '09:50:02  answer    Q3 by mara-k', '09:50:03  ready     3 of 3 answered. merge unblocked.'],
  conflict: ['09:47:10  answer    Q1 by mara-k', '09:47:52  answer    Q2 by mara-k: reuse original id', '09:49:31  answer    Q2 by devon-o: new id per attempt', '09:49:31  hold      answers disagree. not choosing. merge stays blocked.', '09:50:40  answer    Q3 by devon-o'],
  stale: ['09:47:10  answer    Q1 by mara-k', '09:49:31  answer    Q2 by devon-o', '09:50:02  answer    Q3 by mara-k', '09:52:03  event     7f03b1d by devon-o touches retry.ts:12', '09:52:04  check     Q1 points at retry.ts:12, which changed. marking outdated.', '09:52:04  ask       Q1 again, with the new code'],
  overconfident: ['09:47:10  answer    Q1 by mara-k', '09:49:31  answer    Q2 by devon-o', '09:50:02  answer    Q3 by mara-k', '09:55:20  flag      priya-s: missed question (retry timing during an outage)', '09:55:21  record    miss M1. rule added to .relay/ask-rules.yml', '09:55:21  ask       Q4, written by priya-s'],
};

const CAPTION = {
  waiting: 'The agent has finished. Instead of a summary it asks three questions, each with the code it points to and a suggested answer. Answer them to unlock the merge.',
  answered: 'Each answer becomes a logged decision with a name on it, and the merge button unlocks.',
  conflict: 'Two reviewers answered Q2 differently. The agent shows both answers and what each would change. It doesn’t pick a side.',
  stale: 'A new commit changed the line Q1 was about. The old question is marked outdated and the agent asks again.',
  overconfident: 'The agent skipped a question it should have asked. A reviewer flags it, and the miss is recorded as a rule for next time.',
};

/* ---------- presets ---------- */
function preset(s) {
  const q = id => { const o = clone(DEF[id]); o.id = id; o.status = 'open'; o.answer = null; o.draft = o.options.find(x => x.suggested).id; return o; };
  const ans = (o, opt, by) => Object.assign(o, { status: 'answered', answer: { opt, by }, draft: opt });
  const m = { s, items: [{ t: 'agent' }], merged: false, logOpen: false, requested: false, misses: [], log: LOG.concat(LOG_MORE[s] || []), newFrom: LOG.length };
  const Q = id => ({ t: 'q', q: q(id) });
  if (s === 'waiting') m.items.push(Q('q1'), Q('q2'), Q('q3'));
  if (s === 'answered') m.items.push({ t: 'q', q: ans(q('q1'), 'a', 'mara-k') }, { t: 'q', q: ans(q('q2'), 'a', 'devon-o') }, { t: 'q', q: ans(q('q3'), 'a', 'mara-k') });
  if (s === 'conflict') {
    const c = q('q2');
    c.status = 'conflict';
    c.answers = [
      { by: 'mara-k', opt: 'a', note: 'Two partners de-dupe on this header. Reusing it is the whole fix.' },
      { by: 'devon-o', opt: 'b', note: 'Our own log search treats the event ID as unique per request. Reusing it breaks that.' },
    ];
    m.items.push({ t: 'q', q: ans(q('q1'), 'a', 'mara-k') }, { t: 'q', q: c }, { t: 'q', q: ans(q('q3'), 'a', 'devon-o') });
  }
  if (s === 'stale') {
    const old = ans(q('q1'), 'a', 'mara-k');
    old.status = 'stale';
    m.items.push({ t: 'q', q: old }, { t: 'q', q: ans(q('q2'), 'a', 'devon-o') }, { t: 'q', q: ans(q('q3'), 'a', 'mara-k') },
      { t: 'commit', by: 'devon-o', sha: '7f03b1d', msg: 'Read retry ceiling from config' },
      { t: 'note', text: '7f03b1d changed the line Q1 points to. I’ve marked Q1 outdated and asked again below. @mara-k’s earlier answer stays in the log but isn’t applied.' },
      Q('q1b'));
  }
  if (s === 'overconfident') {
    m.items.push({ t: 'q', q: ans(q('q1'), 'a', 'mara-k') }, { t: 'q', q: ans(q('q2'), 'a', 'devon-o') }, { t: 'q', q: ans(q('q3'), 'a', 'mara-k') },
      { t: 'flag' }, { t: 'reply' }, Object.assign(Q('q4'), {}));
    m.items[m.items.length - 1].q.status = 'added';
    m.misses.push({ id: 'M1', topic: 'Retry timing during an outage', by: 'priya-s', note: 'Rule added to .relay/ask-rules.yml' });
  }
  return m;
}

/* ---------- rendering ---------- */
const KW = /('[^']*'|\/\/.*$|\b(?:export|const|let|await|async|return|if|function|new|number)\b|\b\d+\b)/g;
const hlCode = line => esc(line).replace(KW, t =>
  t.startsWith("'") ? `<span class="c-str">${t}</span>` : t.startsWith('//') ? `<span class="c-com">${t}</span>`
    : /^\d/.test(t) ? `<span class="c-num">${t}</span>` : `<span class="c-kw">${t}</span>`);

const codeBlock = q => `<div class="code">
  <div class="code-h"><b>${esc(q.file)}</b><span class="at">${q.at ? 'at ' + q.at + ' · ' : ''}L${q.start}${q.code.length > 1 ? '–' + (q.start + q.code.length - 1) : ''}</span></div>
  <pre aria-label="Code from ${esc(q.file)}">${q.code.map((l, i) => `<span class="row${q.hl.includes(i) ? ' hl' : ''}"><span class="n">${q.start + i}</span><span>${hlCode(l) || ' '}</span></span>`).join('')}</pre>
</div>`;

const optOf = (q, id) => q.options.find(o => o.id === id);
const shortOf = (q, a) => a.opt === 'other' ? a.text : optOf(q, a.opt).short;
const questions = m => m.items.filter(i => i.t === 'q').map(i => i.q);
const live = m => questions(m).filter(q => q.status !== 'stale');

function qOpen(q, m) {
  const name = 'ans-' + q.id;
  const opts = q.options.map(o => `<label class="opt"><input type="radio" name="${name}" value="${o.id}"${q.draft === o.id ? ' checked' : ''}>
    <span class="opt-l">${esc(o.label)}${o.suggested ? '<span class="sug">Suggested</span>' : ''}</span><span class="opt-s">${esc(o.sub)}</span></label>`).join('');
  const other = `<label class="opt"><input type="radio" name="${name}" value="other"${q.draft === 'other' ? ' checked' : ''}>
    <span class="opt-l">Something else</span><span class="opt-s">Write it. relay will ask a follow-up if it needs one.</span></label>
    <div class="other${q.draft === 'other' ? ' open' : ''}"><div><label class="sr-only" for="txt-${q.id}">Your answer to ${q.n}</label>
    <textarea id="txt-${q.id}" rows="2" placeholder="Your answer"${q.draft === 'other' ? '' : ' tabindex="-1"'}>${esc(q.otherText || '')}</textarea>
    ${q.err ? `<p class="err" id="err-${q.id}">${esc(q.err)}</p>` : ''}</div></div>`;
  const added = q.status === 'added';
  return `<article class="q" data-status="${q.status}" id="card-${q.id}">
  <header class="q-h"><span class="q-n">${q.n}</span><h4 class="q-t" tabindex="-1">${esc(q.title)}</h4>
    <span class="chip ${added ? 'chip-bad' : 'chip-warn'}">${added ? 'Added by a reviewer' : 'Needs your answer'}</span></header>
  ${q.at ? `<p class="q-sub">Asked again after ${q.at}</p>` : ''}
  <div class="q-body">
    ${codeBlock(q)}
    <p class="why"><b>Why I’m asking.</b> ${esc(q.why)}</p>
    <fieldset class="opts"><legend class="sr-only">Your answer to ${q.n}</legend>${opts}${other}</fieldset>
    <div class="q-act"><button type="button" class="btn btn-primary" data-act="answer" data-q="${q.id}">Log answer</button><span class="hint">Answering as @${YOU}</span></div>
  </div>
</article>`;
}

function qDone(q, m) {
  const a = q.answer;
  const dissent = a.dissent ? `<span class="dissent">@${a.dissent.by} answered “${esc(optOf(q, a.dissent.opt).short)}”. Their reason is kept: “${esc(a.dissent.note)}”</span>` : '';
  return `<article class="q${q.flash ? ' flash' : ''}" data-status="answered" id="card-${q.id}">
  <header class="q-h"><span class="q-n ok">${I.check}<span class="sr-only">${q.n}</span></span><h4 class="q-t" tabindex="-1">${esc(q.title)}</h4><span class="chip chip-ok">Decided</span></header>
  <div class="dec"><span class="dec-k">Decision</span><span class="dec-v">${esc(shortOf(q, a))}</span><span class="by">${av(a.by, 1)}@${a.by}</span>
    ${m.merged ? '' : `<button type="button" class="link" data-act="change" data-q="${q.id}" aria-label="Change the answer to ${q.n}">Change</button>`}${dissent}</div>
</article>`;
}

function qStale(q) {
  return `<article class="q" data-status="stale" id="card-${q.id}">
  <header class="q-h"><span class="q-n">${q.n}</span><h4 class="q-t" tabindex="-1">${esc(q.title)}</h4><span class="chip chip-plain">Outdated</span></header>
  <p class="stale-note">Asked at a41c9e2. The code changed in 7f03b1d. @${q.answer.by}’s answer, “${esc(shortOf(q, q.answer))}”, was not carried over.</p>
</article>`;
}

function qConflict(q, m) {
  const sides = q.answers.map(a => {
    const o = optOf(q, a.opt);
    return `<div class="ans"><div class="ans-h">${av(a.by, 1)}<b>@${a.by}</b> answered</div>
      <p class="ans-v">${esc(o.short)}</p><blockquote>${esc(a.note)}</blockquote>
      <p class="impact">Changes: ${o.impact}</p>
      <button type="button" class="btn" data-act="use" data-q="${q.id}" data-by="${a.by}">Go with @${a.by}</button></div>`;
  }).join('');
  return `<article class="q" data-status="conflict" id="card-${q.id}">
  <header class="q-h"><span class="q-n">${q.n}</span><h4 class="q-t" tabindex="-1">${esc(q.title)}</h4><span class="chip chip-bad">Answers disagree</span></header>
  <div class="q-body">
    ${codeBlock(q)}
    <p class="why"><b>Two answers.</b> I haven’t picked one, because each changes different code. Either of you can switch, or the code owner can decide. Whichever answer loses stays in the log with its reason.</p>
    <div class="split">${sides}</div>
    <div class="q-act">${m.requested
      ? `<span class="chip chip-plain">Waiting on @priya-s</span><span class="hint">Merge stays blocked until this is settled.</span>`
      : `<button type="button" class="btn" data-act="owner" data-q="${q.id}">Ask @priya-s (code owner) to decide</button>`}</div>
  </div>
</article>`;
}

function agentCard(m) {
  const n = m.log.length;
  return `<div class="tl" style="--i:0">${av('relay')}<div class="box">
  <div class="box-h"><b>relay</b><span class="lbl">Agent</span><span>finished the task · 12 min ago</span></div>
  <div class="box-b">
    <p>Done. Retries are in and the tests pass. Three choices in this PR are yours to make, not mine, so I’m asking instead of summarising. Each one has a suggested answer.</p>
    <ul class="stats"><li>${I.check}48 tests passed</li><li>3 files</li><li><span class="add">+142</span><span class="del">−18</span></li></ul>
    <button type="button" class="logbtn" data-act="log" aria-expanded="${m.logOpen}" aria-controls="agentLog">${I.chev}Read the full agent log <span class="muted">(${n} lines)</span></button>
    <div class="log${m.logOpen ? ' open' : ''}" id="agentLog"><div${m.logOpen ? '' : ' inert'}>
      <pre tabindex="0" aria-label="Agent log">${m.log.map((l, i) => `<span class="ln${m.s === 'overconfident' && i === SKIP_LINE - 1 ? ' mark' : ''}${i >= m.newFrom ? ' new' : ''}">${esc(l)}</span>`).join('')}</pre>
      <p class="log-note">Everything the agent did, in order. You shouldn’t need this to review.</p>
    </div></div>
  </div></div></div>`;
}

function item(it, m, i) {
  if (it.t === 'agent') return agentCard(m);
  if (it.t === 'commit') return `<div class="ev" style="--i:${i}"><span class="ic">${I.commit}</span>${av(it.by, 1)}<b>@${it.by}</b> pushed <code>${it.sha}</code> ${esc(it.msg)}</div>`;
  if (it.t === 'note') return `<div class="ev note" style="--i:${i}"><span class="ic">${I.agent}</span><span class="ev-t"><b>relay</b> ${esc(it.text)}</span></div>`;
  if (it.t === 'flag') return `<div class="tl" style="--i:${i}">${av('priya-s')}<div class="box">
    <div class="box-h"><b>priya-s</b><span class="lbl">Code owner</span><span>commented · 6 min ago</span><span class="chip chip-bad">${I.flag}Flagged: missed question</span></div>
    <div class="box-b"><p>relay didn’t ask what happens when an endpoint is down for hours. Deliveries that failed together retry together, so a server coming back gets hit with all of them at once. That’s a product choice, not a detail. It’s line ${SKIP_LINE} of the agent log, where nobody would see it.</p></div></div></div>`;
  if (it.t === 'reply') return `<div class="tl rule" style="--i:${i}">${av('relay')}<div class="box">
    <div class="box-h"><b>relay</b><span class="lbl">Agent</span><span>replied · 6 min ago</span><span class="chip chip-done">Miss recorded</span></div>
    <div class="box-b"><p>Agreed. I treated retry timing as an implementation detail, and I should have asked. I’ve logged this as a miss, asked it below as Q4, and added a rule so this repo always gets this question:</p>
    <pre># .relay/ask-rules.yml
- when: a change touches retry, backoff or queue timing
  ask:  what happens when the receiver is down for hours
  from: missed in #482, flagged by @priya-s</pre></div></div></div>`;
  const q = it.q;
  const card = q.status === 'answered' ? qDone(q, m) : q.status === 'stale' ? qStale(q) : q.status === 'conflict' ? qConflict(q, m) : qOpen(q, m);
  return `<div class="tl-in" style="animation:tlin .45s var(--ease) both;animation-delay:${i * 45}ms">${card}</div>`;
}

function mergeState(m) {
  const qs = live(m), done = qs.filter(q => q.status === 'answered').length, total = qs.length;
  if (m.merged) return { k: 'merged', icon: I.merge, h: 'Merged', p: `${total} decisions committed to ${DOC}.`, done, total };
  const conflict = qs.find(q => q.status === 'conflict');
  if (conflict) return { k: 'conflict', icon: I.split, h: `Blocked: answers to ${conflict.n} disagree`, p: 'relay won’t choose between reviewers. One of you switches, or the code owner decides.', done, total };
  const left = total - done;
  if (left) {
    const added = qs.find(q => q.status === 'added'), again = qs.find(q => q.at && q.status === 'open');
    const p = added ? 'A reviewer added a question the agent should have asked. It blocks like any other.'
      : again ? 'Q1 was asked again after new commits. Earlier answers don’t carry over to changed code.'
      : 'relay won’t mark this ready until the questions above are answered.';
    return { k: 'blocked', icon: I.lock, h: `Waiting on ${left} ${left === 1 ? 'answer' : 'answers'}`, p, done, total };
  }
  return { k: 'ready', icon: I.ok, h: 'Ready to merge', p: `${total} decisions logged. They’re committed to ${DOC} with the merge.`, done, total };
}

function mergeBox(m, i) {
  const st = mergeState(m);
  const pct = st.total ? Math.round(st.done / st.total * 100) : 0;
  return `<div class="mb" data-k="${st.k}" style="animation:tlin .45s var(--ease) both;animation-delay:${i * 45}ms">
  <span class="mb-ic">${st.icon}</span>
  <div><h4>${st.h}</h4><p>${esc(st.p)}</p>
    ${st.k === 'merged' ? '' : `<div class="meter" role="progressbar" aria-label="Questions answered" aria-valuemin="0" aria-valuemax="${st.total}" aria-valuenow="${st.done}" aria-valuetext="${st.done} of ${st.total} answered"><span style="width:${m.prevPct == null ? pct : m.prevPct}%" data-pct="${pct}"></span></div>`}</div>
  ${st.k === 'merged' ? '' : `<button type="button" class="btn btn-primary${m.justUnlocked ? ' unlocked' : ''}" data-act="merge"${st.k === 'ready' ? '' : ' disabled'}>Squash and merge</button>`}
</div>`;
}

function side(m) {
  const qs = questions(m);
  const count = who => qs.filter(q => q.status === 'answered' && q.answer.by === who).length + qs.filter(q => q.answers && q.answers.some(a => a.by === who)).length;
  const rv = who => {
    let st = count(who) ? `${count(who)} answered` : 'Not yet';
    if (who === 'priya-s') st = m.misses.length ? 'Flagged a miss' : m.requested ? 'Asked to decide' : 'Code owner';
    return `<li class="rv-row">${av(who, 1)}<b>${who}</b>${who === YOU ? '<span class="muted">(you)</span>' : ''}<span class="st">${st}</span></li>`;
  };
  const decided = qs.filter(q => q.status === 'answered');
  const log = decided.length ? decided.map((q, i) => `<li${q.flash ? ' class="flash"' : ''}><span class="id">D${i + 1}</span><span class="t">${esc(q.topic)}</span>
    <span class="v">${esc(shortOf(q, q.answer))} <small>· @${q.answer.by}</small></span></li>`).join('')
    : '<li class="empty">Nothing decided yet. Answers land here.</li>';
  const misses = m.misses.length ? `<section class="ss"><h4>Misses</h4><ol class="declog miss">${m.misses.map(x => `<li><span class="id">${x.id}</span><span class="t">${esc(x.topic)} · @${x.by}</span><span class="v">${esc(x.note)}</span></li>`).join('')}</ol>
    <p class="side-note">Misses are counted per repo, so you can see whether the agent asks better over time.</p></section>` : '';
  return `<section class="ss"><h4>Reviewers</h4><ul>${['mara-k', 'devon-o', 'priya-s'].map(rv).join('')}</ul></section>
  <section class="ss"><h4>Decision log</h4><ol class="declog">${log}</ol><p class="side-note">Committed with the merge to <code>${DOC}</code></p></section>
  ${misses}
  <section class="ss"><h4>Labels</h4><div class="glabels"><span class="glabel">webhooks</span><span class="glabel">agent-authored</span></div></section>`;
}

/* ---------- state + events ---------- */
const pr = document.getElementById('pr'), tl = document.getElementById('timeline'), sd = document.getElementById('side');
const cap = document.getElementById('caption'), say = document.getElementById('announce'), stateEl = document.getElementById('prState');
let M;

function render() {
  tl.innerHTML = M.items.map((it, i) => item(it, M, i)).join('') + mergeBox(M, M.items.length);
  sd.innerHTML = side(M);
  stateEl.textContent = M.merged ? 'Merged' : 'Open';
  stateEl.classList.toggle('merged', M.merged);
  // only animate entry on a state switch, not on every answer
  if (!M.fresh) $$('.tl,.ev,.mb,.tl-in', tl).forEach(e => { e.style.animation = 'none'; });
  M.fresh = false;
  questions(M).forEach(q => { q.flash = false; });
  M.justUnlocked = false;
  // the meter grows from where it was
  const bar = $('.meter span', tl);
  if (bar) { bar.getBoundingClientRect(); bar.style.width = bar.dataset.pct + '%'; M.prevPct = +bar.dataset.pct; }
}

const sw = document.getElementById('switcher'), ind = $('.nx-ind', sw), tabs = $$('[role=radio]', sw);
function moveInd(instant) {
  const b = tabs.find(t => t.getAttribute('aria-checked') === 'true');
  if (!b) return;
  ind.classList.toggle('instant', !!instant);
  ind.style.width = b.offsetWidth + 'px'; ind.style.height = b.offsetHeight + 'px';
  ind.style.transform = `translate(${b.offsetLeft}px,${b.offsetTop}px)`;
}
function markTab(s) {
  tabs.forEach(t => { const on = t.dataset.s === s; t.setAttribute('aria-checked', on); t.tabIndex = on ? 0 : -1; });
  moveInd();
}
function setCaption(text) {
  cap.classList.add('fade');
  setTimeout(() => { cap.textContent = text; cap.classList.remove('fade'); }, 160);
}
function go(s, first) {
  const prev = M && M.prevPct; M = preset(s); M.fresh = true; M.prevPct = prev;
  markTab(s);
  if (first) { cap.textContent = CAPTION[s]; render(); return; }
  setCaption(CAPTION[s]);
  pr.classList.add('swap');
  setTimeout(() => { render(); pr.classList.remove('swap'); }, 140);
  try { history.replaceState(null, '', s === 'waiting' ? location.pathname : '#' + s); } catch (e) {}
}

const find = id => questions(M).find(q => q.id === id);
function focusAfter(id) {
  const next = live(M).find(q => q.status !== 'answered');
  const el = next ? $(`#card-${next.id} .q-t`) : $('.mb .btn:not(:disabled)') || $(`#card-${id} .q-t`);
  if (el) { el.focus({ preventScroll: true }); el.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }
}
function afterDecision(q, msg) {
  const before = mergeState(M).k;
  q.flash = true;
  const st = mergeState(M);
  if (st.k === 'ready' && before !== 'ready') M.justUnlocked = true;
  render();
  say.textContent = `${msg} ${st.done} of ${st.total} answered.${st.k === 'ready' ? ' Merge unlocked.' : ''}`;
  if (st.k === 'ready' && M.s === 'waiting') {
    M.s = 'answered'; markTab('answered');
    setCaption('All three answered. Each one is now a logged decision with your name on it, and the merge button is unlocked.');
  }
  focusAfter(q.id);
}

pr.addEventListener('change', e => {
  const r = e.target.closest('input[type=radio]');
  if (!r) return;
  const q = find(r.name.slice(4));
  q.draft = r.value; q.err = null;
  const card = r.closest('.q'), box = $('.other', card), ta = $('textarea', card);
  box.classList.toggle('open', r.value === 'other');
  ta.tabIndex = r.value === 'other' ? 0 : -1;
  if (r.value === 'other') setTimeout(() => ta.focus(), 120);
});
pr.addEventListener('input', e => { if (e.target.tagName === 'TEXTAREA') find(e.target.id.slice(4)).otherText = e.target.value; });

pr.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (!b || b.disabled) return;
  const act = b.dataset.act, q = b.dataset.q && find(b.dataset.q);
  if (act === 'log') {
    M.logOpen = !M.logOpen;
    b.setAttribute('aria-expanded', M.logOpen);
    const log = document.getElementById('agentLog');
    log.classList.toggle('open', M.logOpen);
    log.firstElementChild.inert = !M.logOpen;
    if (M.logOpen && M.s === 'overconfident') setTimeout(() => { const mk = $('.ln.mark', log); if (mk) mk.parentNode.scrollTop = mk.offsetTop - 120; }, 50);
  }
  if (act === 'answer') {
    if (q.draft === 'other' && !(q.otherText || '').trim()) {
      q.err = 'Write an answer, or pick one of the options.';
      render();
      const ta = document.getElementById('txt-' + q.id);
      ta.setAttribute('aria-describedby', 'err-' + q.id); ta.setAttribute('aria-invalid', 'true'); ta.focus();
      return;
    }
    q.status = 'answered';
    q.answer = { opt: q.draft, by: YOU, text: (q.otherText || '').trim().slice(0, 90) };
    afterDecision(q, `${q.n} decided: ${shortOf(q, q.answer)}.`);
  }
  if (act === 'change') {
    q.status = q.id === 'q4' ? 'added' : 'open';
    if (q.answer.opt === 'other') q.otherText = q.answer.text;
    q.draft = q.answer.opt; q.answer = null;
    if (M.s === 'answered') { M.s = 'waiting'; markTab('waiting'); setCaption(CAPTION.waiting); }
    render();
    say.textContent = `${q.n} reopened. The merge is blocked again.`;
    const r = $(`#card-${q.id} input:checked`); if (r) r.focus();
  }
  if (act === 'use') {
    const win = q.answers.find(a => a.by === b.dataset.by), lose = q.answers.find(a => a.by !== b.dataset.by);
    q.status = 'answered'; q.answer = { opt: win.opt, by: win.by, dissent: lose }; q.draft = win.opt;
    afterDecision(q, `${q.n} settled with @${win.by}’s answer. @${lose.by}’s reason is kept in the log.`);
  }
  if (act === 'owner') {
    M.requested = true; render();
    say.textContent = 'Asked @priya-s to decide. The merge stays blocked.';
    const h = $(`#card-${q.id} .q-t`); if (h) h.focus();
  }
  if (act === 'merge') {
    M.merged = true; render();
    say.textContent = `Merged. Decisions committed to ${DOC}.`;
    const h = $('.mb h4'); if (h) { h.tabIndex = -1; h.focus(); }
  }
});

/* switcher: radio group with roving focus, plus number keys anywhere outside a text field */
sw.addEventListener('click', e => { const b = e.target.closest('[role=radio]'); if (b && b.getAttribute('aria-checked') !== 'true') go(b.dataset.s); });
sw.addEventListener('keydown', e => {
  const i = tabs.indexOf(document.activeElement);
  if (i < 0) return;
  const map = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
  let j = null;
  if (e.key in map) j = (i + map[e.key] + tabs.length) % tabs.length;
  if (e.key === 'Home') j = 0;
  if (e.key === 'End') j = tabs.length - 1;
  if (j === null) return;
  e.preventDefault(); tabs[j].focus(); go(tabs[j].dataset.s);
});
document.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  const n = Number(e.key);
  if (n >= 1 && n <= 5 && tabs[n - 1].getAttribute('aria-checked') !== 'true') go(tabs[n - 1].dataset.s);
});
addEventListener('resize', () => moveInd(true));
addEventListener('hashchange', () => { const s = location.hash.slice(1) || 'waiting'; if (CAPTION[s] && s !== M.s) go(s); });
if (document.fonts) document.fonts.ready.then(() => moveInd(true));

/* theme: the site's toggle, remembered across pages */
const root = document.documentElement, tb = document.getElementById('themeBtn');
const syncTheme = () => tb.setAttribute('aria-label', root.dataset.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
tb.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
  syncTheme();
});
syncTheme();

const start = location.hash.slice(1);
go(CAPTION[start] ? start : 'waiting', true);
moveInd(true);
})();
