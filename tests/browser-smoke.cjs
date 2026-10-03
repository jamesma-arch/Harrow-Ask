/* Run with Playwright installed. Optional BROWSER_EXECUTABLE_PATH selects an existing Chromium. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE_PATH?{executablePath:process.env.BROWSER_EXECUTABLE_PATH,args:['--no-sandbox','--no-zygote','--single-process','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}: {})});
 try {
 const context=await browser.newContext({viewport:{width:1440,height:1050}});
 const page=await context.newPage(), errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('http://ask.test/**', async route=>{
  const url=new URL(route.request().url()), filename=path.join(__dirname,'..',url.pathname==='/'?'index.html':url.pathname);
  const ext=path.extname(filename),types={'.html':'text/html','.js':'application/javascript','.mjs':'application/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2'};
  await route.fulfill({body:fs.readFileSync(filename),contentType:types[ext]||'text/plain'});
 });
 await page.goto('http://ask.test/');await page.waitForSelector('.card');
 assert.equal(await page.locator('.card').count(),12);
 await page.locator('button[data-area="upper-school"]').click();assert.equal(await page.locator('.card').count(),4);
 await page.locator('button[data-area="all"]').click();
 await page.locator('#department-search').fill('transport');assert.equal(await page.locator('.card').count(),1);
 await page.locator('#department-search').fill('');
 await page.locator('#question').fill('How do I request leave?');
 await page.getByRole('button',{name:'Find the right help',exact:true}).click();
 assert.match(await page.locator('.result').first().innerText(),/HR & Staff Support/);
 await page.locator('.result').first().click();assert.equal(await page.getByRole('button',{name:'Open notebook',exact:true}).isDisabled(),true);
 await page.getByRole('button',{name:'Close',exact:true}).click();
 await page.locator('[data-lang="th"]').click();assert.equal(await page.locator('html').getAttribute('lang'),'th');
 await page.reload();await page.waitForSelector('.card');assert.equal(await page.locator('html').getAttribute('lang'),'th');
 await page.locator('[data-lang="en"]').click();
 await page.locator('.tour-launch').click();
 for(let i=0;i<7;i++){assert.equal(await page.locator('#tour-dialog').evaluate(el=>el.open),true);await page.locator('[data-tour-next]').click();}
 assert.equal(await page.locator('#tour-dialog').evaluate(el=>el.open),false);
 await page.locator('.tour-launch').click();await page.keyboard.press('Escape');await page.waitForSelector('#tour-dimmer',{state:'detached'});assert.equal(await page.locator('#tour-dimmer').count(),0);
 await page.locator('button[data-nav="setup"]').click();
 await page.locator('#setup-owner').fill('Test owner');await page.locator('#setup-notebook').fill('https://notebooklm.google.com/notebook/test-notebook');await page.locator('#setup-reviewed').fill('2026-10-03');await page.locator('#setup-sources').fill('Test source | https://docs.google.com/document/d/test/edit');await page.locator('[name="confirmed"]').check();
 await page.getByRole('button',{name:'Save local preview',exact:true}).click();assert.equal(await page.locator('.draft-banner').count(),1);
 await page.locator('button[data-nav="home"]').click();await page.locator('[data-detail="ls-activities"]').first().click();assert.equal(await page.getByRole('link',{name:'Open notebook',exact:true}).getAttribute('href'),'https://notebooklm.google.com/notebook/test-notebook');
 await page.locator('[data-mode="task"]').last().click();assert.equal(await page.getByRole('button',{name:'Open task helper',exact:true}).isDisabled(),true);
 await page.getByRole('button',{name:'Close',exact:true}).click();
 await page.locator('[data-star="ls-activities"]').click();await page.locator('button[data-nav="saved"]').click();assert.equal(await page.locator('.card').count(),1);
 await page.reload();await page.waitForSelector('.card');assert.equal(await page.locator('.card').count(),1);assert.equal(await page.locator('.draft-banner').count(),1);
 await page.locator('button[data-nav="setup"]').click();
 const downloadEvent=page.waitForEvent('download');await page.locator('[data-export]').click();const download=await downloadEvent;
 const exported=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.equal(exported.departments[0].confirmed,true);
 page.once('dialog',d=>d.accept());await page.locator('[data-reset]').first().click();assert.equal(await page.locator('.draft-banner').count(),0);
 await page.locator('#config-import').setInputFiles({name:'config.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(exported))});await page.waitForSelector('.draft-banner');
 await page.locator('#config-import').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"version":7}')});await page.waitForFunction(()=>document.querySelector('#notice').textContent.includes('Could not import'));
 assert.equal(await page.locator('.draft-banner').count(),1);
 await page.setViewportSize({width:390,height:844});await page.locator('button[data-nav="home"]').click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.locator('.tour-launch').click();const rect=await page.locator('#tour-dialog').boundingBox();assert.ok(rect.x>=0&&rect.x+rect.width<=390);await page.keyboard.press('Escape');
 assert.deepEqual(errors,[]);
 console.log('Browser smoke checks passed: routing, filters, readiness, task separation, languages, tutorial, local configuration, import/export, favourites and mobile layout.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
