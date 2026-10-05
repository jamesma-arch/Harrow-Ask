import test from 'node:test';
import assert from 'node:assert/strict';
import {demoAnswer,demoSources} from '../public/demo-notebook.js';
test('demo answers cite an actual labelled sample and disclaim school policy',()=>{for(const topic of ['attendance','cover','QA observation']){const answer=demoAnswer(topic);assert.equal(answer.supported,true);assert.match(answer.text,/EXAMPLE ONLY/);assert(demoSources.some(s=>s.id===answer.citations[0].sourceId));}});
test('unsupported demo questions have no fabricated answer or citation',()=>{const answer=demoAnswer('What is the school budget?');assert.equal(answer.supported,false);assert.deepEqual(answer.citations,[]);});
test('demo follow-up and Thai queries stay within sample sources',()=>{assert.equal(demoAnswer('What next?','en',[{role:'user',text:'cover request'}]).citations[0].sourceId,'demo-cover');assert.match(demoAnswer('เช็กชื่ออย่างไร?','th').text,/ตัวอย่างเท่านั้น/);});
