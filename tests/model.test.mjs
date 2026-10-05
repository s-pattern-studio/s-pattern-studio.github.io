import test from 'node:test';
import assert from 'node:assert/strict';
import { readRoute, localize, lightingAt, periodHour } from '../src/lib/model.ts';
import { en } from '../src/locales/en.ts';
import { zhTW } from '../src/locales/zh-TW.ts';

test('deep links preserve locale and section, invalid routes fall back safely', () => {
  assert.deepEqual(readRoute('#/en/books'), {locale:'en', section:'books'});
  assert.deepEqual(readRoute('#/zh-TW/memories','en'), {locale:'zh-TW', section:'memories'});
  assert.deepEqual(readRoute('#/fr/unknown','en'), {locale:'en', section:null});
  assert.deepEqual(readRoute('', 'invalid'), {locale:'zh-TW', section:null});
});
test('localized content falls back when a translation is absent', () => {
  assert.equal(localize({'zh-TW':'書單'},'en'),'書單');
  assert.equal(localize({'zh-TW':'書單',en:'Reading'},'en'),'Reading');
});
test('language dictionaries have matching complete keys', () => {
  function keys(obj,prefix=''){ return Object.entries(obj).flatMap(([key,value])=>typeof value==='object'?keys(value,`${prefix}${key}.`):[`${prefix}${key}`]).sort(); }
  assert.deepEqual(keys(zhTW),keys(en));
});
test('automatic light is continuous through midnight and all time boundaries', () => {
  for (const hour of [0,6,12,18,22,24]) {
    const before=lightingAt(hour-0.00001), after=lightingAt(hour+0.00001);
    for(const value of ['ambient','sun','lamp'])assert.ok(Math.abs(before[value]-after[value])<0.0001);
  }
  assert.deepEqual(lightingAt(24),lightingAt(0));
});
test('manual lighting ignores the device hour', () => {
  const local=new Date(2026,9,3,14,30);
  assert.equal(periodHour('auto',local),14.5);
  assert.equal(periodHour('night',local),23);
  assert.ok(lightingAt(periodHour('day',local)).sun>lightingAt(periodHour('night',local)).sun);
});
