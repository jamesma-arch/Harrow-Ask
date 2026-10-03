import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateConfig, isReady, validUrl, rankedDepartments, buildPrompt } from '../ask-harrow-core.mjs';
const config = JSON.parse(fs.readFileSync(new URL('../ask-harrow.config.json', import.meta.url)));
test('default catalogue is valid and contains no fabricated connections', () => {
  const valid=validateConfig(config);
  assert.equal(valid.departments.length,12);
  assert.ok(valid.departments.every(d=>!isReady(d)&&!isReady(d,'task')));
});
test('shared notebook readiness needs an owner, sources, date and explicit confirmation', () => {
  const d={...config.departments[0],notebookUrl:'https://notebooklm.google.com/notebook/test',owner:'Owner',sources:[{title:'Procedure',url:'https://docs.google.com/document/d/test/edit'}],reviewed:'2026-10-03',confirmed:true};
  assert.ok(isReady(d));
  assert.ok(!isReady({...d,confirmed:false}));
  assert.ok(!isReady({...d,sources:[]}));
  assert.throws(()=>validateConfig({version:1,departments:[{...d,sources:[]}]}));
});
test('URL checks reject unsafe URLs and wrong tools', () => {
  for (const url of ['javascript:alert(1)','https://notebooklm.google.com.evil.test/notebook/a','https://user@notebooklm.google.com/notebook/a','https://notebooklm.google.com/'])assert.equal(validUrl(url,'notebook'),false);
  assert.equal(validUrl('https://gemini.google.com/gem/test','workflow'),true);
  assert.equal(validUrl('https://gemini.google.com/gem/test','notebook'),false);
});
test('topic matching suggests relevant departments without guessing an answer', () => {
  assert.equal(rankedDepartments(config.departments,'How do I request leave?')[0].department.id,'admin-hr');
  assert.equal(rankedDepartments(config.departments,'CCA cancelled for Year 3')[0].department.id,'ls-activities');
  assert.equal(rankedDepartments(config.departments,'ขอลางานอย่างไร')[0].department.id,'admin-hr');
  assert.ok(rankedDepartments(config.departments,'unmatchedxyz').every(x=>x.score===0));
  assert.ok(rankedDepartments(config.departments,'with something different').find(x=>x.department.id==='admin-it').score===0);
});
test('configuration import rejects duplicates, bad sources and impossible dates', () => {
  assert.throws(()=>validateConfig({version:1,departments:[config.departments[0],config.departments[0]]}));
  assert.throws(()=>validateConfig({version:1,departments:[{...config.departments[0],sources:[{title:'Test',url:'javascript:alert(1)'}]}]}));
  assert.throws(()=>validateConfig({version:1,departments:[{...config.departments[0],reviewed:'2026-02-31'}]}));
});
test('copied prompts require sources and use the selected language', () => {
  assert.match(buildPrompt('What next?','en'),/do not invent school procedures/);
  assert.match(buildPrompt('ทำอย่างไร','th'),/ตอบเป็นภาษาไทย/);
});
