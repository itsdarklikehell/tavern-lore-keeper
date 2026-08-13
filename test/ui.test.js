// UI tests for The Tavern Lore Keeper — jsdom-driven.
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

let pass = 0, fail = 0;
function ok(cond, name) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ FAIL: ' + name); }
}

function makeDom() {
  const consoleErrors = [];
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    url: 'http://localhost/',
    pretendToBeVisual: true,
    beforeParse(window) {
      window.matchMedia = window.matchMedia || function () {
        return { matches: false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){}, dispatchEvent(){ return false; } };
      };
      window.addEventListener('error', e => consoleErrors.push(String(e.message || e.error)));
    },
  });
  return { dom, consoleErrors };
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('— initial state —');
  let { dom, consoleErrors } = makeDom();
  let { document } = dom.window;
  ok(document.querySelectorAll('.gen-btn[data-gen]').length === 4, 'four generator buttons');
  ok(document.getElementById('offeringBtn') !== null, 'offering button exists');
  ok(document.querySelector('.gen-btn.selected').dataset.gen === 'tavern', 'tavern selected by default');
  await sleep(60);
  ok(document.getElementById('card').classList.contains('shown'), 'first paint shows a card');
  ok(document.getElementById('cardKind').textContent === 'a tavern', 'first card is a tavern');

  console.log('— generator switching —');
  document.querySelector('.gen-btn[data-gen="rumor"]').click();
  await sleep(60);
  ok(document.getElementById('cardKind').textContent === 'a rumor', 'rumor card shows');
  ok(document.getElementById('cardTitle').textContent === 'They say…', 'rumor title');
  ok(document.getElementById('cardBody').textContent.startsWith('They say '), 'rumor body');

  document.querySelector('.gen-btn[data-gen="patron"]').click();
  await sleep(60);
  ok(document.getElementById('cardKind').textContent === 'a mysterious patron', 'patron card shows');
  ok(document.getElementById('cardBody').textContent.startsWith('Secret: '), 'patron reveals secret');

  document.querySelector('.gen-btn[data-gen="item"]').click();
  await sleep(60);
  ok(document.getElementById('cardKind').textContent === 'a cursed item', 'item card shows');
  ok(document.getElementById('cardBody').textContent.startsWith('It '), 'item has curse');

  console.log('— switching back to tavern —');
  document.querySelector('.gen-btn[data-gen="tavern"]').click();
  await sleep(60);
  ok(document.getElementById('cardKind').textContent === 'a tavern', 'back to tavern');
  ok(document.querySelector('.gen-btn.selected').dataset.gen === 'tavern', 'selection follows');

  console.log('— the evening\u2019s offering —');
  document.getElementById('offeringBtn').click();
  await sleep(60);
  const spread = document.getElementById('spread');
  ok(spread.classList.contains('show'), 'spread shows');
  ok(spread.querySelectorAll('.spread-item').length === 4, 'four spread items');
  const kinds = Array.from(spread.querySelectorAll('.spread-kind')).map(e => e.textContent);
  ok(kinds.includes('a tavern') && kinds.includes('a rumor') && kinds.includes('a patron') && kinds.includes('a cursed item'), 'all four kinds present');
  ok(!document.getElementById('card').classList.contains('shown'), 'single card hides during spread');

  console.log('— zero console errors —');
  ok(consoleErrors.length === 0, 'no console errors: ' + (consoleErrors.length ? consoleErrors.join(' | ') : 'clean'));

  console.log('');
  console.log(`RESULT: ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => {
  console.error('TEST CRASH:', e);
  process.exit(2);
});
