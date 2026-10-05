import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
const source=await readFile(new URL('../public/tutorial.js',import.meta.url),'utf8');
function screen({department=false,language='en',width=1200,height=800}={}){
  const dom=new JSDOM(html,{runScripts:'outside-only'}),w=dom.window,d=w.document;
  w.innerWidth=width;w.innerHeight=height;
  const tour=d.getElementById('tour');tour.showModal=()=>{tour.open=true;};tour.close=()=>{tour.open=false;tour.dispatchEvent(new w.Event('close'));};
  d.getElementById('notebook-panel').hidden=!department;d.getElementById('staff-chat').hidden=department;
  d.getElementById('connection-note').hidden=false;
  d.getElementById('conversation').innerHTML='<article class="message">Hello</article>';
  d.getElementById('notebook-list').innerHTML='<article class="notebook-card"><h3>CCA</h3></article>';
  for(const e of d.querySelectorAll('body *'))e.getBoundingClientRect=()=>({left:20,right:300,top:80,bottom:140,width:280,height:60});
  const card=d.getElementById('tour-card');Object.defineProperty(card,'offsetWidth',{get:()=>Math.min(340,width-24)});Object.defineProperty(card,'offsetHeight',{get:()=>240});
  const setup=w.Function(source.replace('export function','function')+';return setupTutorial;')();
  setup({getLanguage:()=>language});return {dom,w,d,tour,click:id=>d.getElementById(id).click()};
}
test('chat guide supports next/back, keyboard finish, replay and focus restoration without network actions',()=>{
  const s=screen();s.d.getElementById('guide').focus();s.click('guide');assert.equal(s.tour.open,true);assert.match(s.d.getElementById('guide-heading').textContent,/School access/);assert.equal(s.d.getElementById('tour-back').disabled,true);
  s.click('finish-tour');assert.match(s.d.getElementById('guide-heading').textContent,/Ask your question/);s.click('tour-back');assert.match(s.d.getElementById('tour-progress').textContent,/1 \/ 6/);
  for(let i=0;i<6;i++)s.tour.dispatchEvent(new s.w.KeyboardEvent('keydown',{key:'ArrowRight'}));
  assert.equal(s.tour.open,false);assert.equal(s.d.activeElement.id,'guide');s.click('guide');assert.match(s.d.getElementById('tour-progress').textContent,/1 \/ 6/);s.click('close-tour');assert.equal(s.tour.open,false);s.dom.window.close();
});
test('department guide explains sync ownership, failures and separate NotebookLM refresh',()=>{
  const s=screen({department:true});s.click('guide');assert.match(s.d.getElementById('tour-progress').textContent,/1 \/ 4/);s.click('finish-tour');s.click('finish-tour');assert.match(s.d.getElementById('guide-body').textContent,/Continue sync/);assert.match(s.d.getElementById('guide-body').textContent,/previous successful/);s.click('finish-tour');assert.match(s.d.getElementById('guide-body').textContent,/NotebookLM sources separately/);s.dom.window.close();
});
test('Thai guide uses Thai navigation and narrow-screen card does not cover the highlighted target',()=>{
  const s=screen({language:'th',width:390,height:700});s.click('guide');assert.match(s.d.getElementById('guide-heading').textContent,/โรงเรียน/);assert.equal(s.d.getElementById('finish-tour').textContent,'ถัดไป');
  const card=s.d.getElementById('tour-card'),spot=s.d.getElementById('tour-spotlight');assert.ok(parseFloat(card.style.top)>=parseFloat(spot.style.top)+parseFloat(spot.style.height));assert.ok(parseFloat(card.style.left)>=12);assert.ok(parseFloat(card.style.left)+parseFloat(card.style.width)<=378);s.dom.window.close();
});
