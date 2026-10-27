// Browser acceptance checks for real unit modal interactions and immediate result conversion.
// Requires: npm install --no-save --no-package-lock playwright && npx playwright install chromium
import assert from "node:assert/strict";
import { chromium } from "playwright";

const host = process.env.ROTOR_SMOKE_URL || "http://127.0.0.1:4173/";
const browser = await chromium.launch({ headless: true });
const errors = [];
const parseValue = raw => Number(raw.replace(/[\u2000-\u200f\u202f\s]/g, "").replace(/,/g, ""));
const near = (a,b,fraction=.003) => Math.abs(a-b) <= fraction*Math.max(1,Math.abs(b));
async function selectUnit(page, key, id) {
  await page.locator(`#page-results .result-row[data-key="${key}"] .result-unit`).click();
  await page.locator("#modal-options-selector").waitFor({state:"visible"});
  await page.locator(`#options-selector-list .option-item[data-option-id="${id}"]`).click();
  await page.locator("#modal-options-selector").waitFor({state:"hidden"});
}
async function resetAll(page, choice) {
  await page.locator("#btn-main-menu").click();
  await page.locator('#main-popup-menu [data-action="settings"]').click();
  await page.locator("#modal-settings").waitFor({state:"visible"});
  await page.locator("#btn-setting-units").click();
  await page.locator(`#options-selector-list [data-option-id="${choice}"]`).click();
  await page.locator('#modal-settings [data-close="modal-settings"]').last().click();
}
try {
  for (const width of [360, 412, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 850 }, locale:"en-US" });
    const page = await context.newPage();
    page.on("pageerror", err => errors.push(`${width}: ${err.message}`));
    await page.goto(host, {waitUntil:"networkidle",timeout:30000});
    await page.locator('.tab-btn[data-page="results"]').click();
    const row = key => page.locator(`#page-results .result-row[data-key="${key}"]`);
    const unit = key => row(key).locator(".result-unit");
    const val = async key => parseValue(await row(key).locator(".result-val").innerText());
    const before = await val("T");
    assert.ok(Number.isFinite(before) && before > 0, `Expected positive initial thrust at width=${width}; got ${before}`);
    assert.equal((await unit("T").innerText()).trim(), "N");
    const styleBefore = await unit("T").evaluate(el => ({
      background:getComputedStyle(el).backgroundColor,
      border:getComputedStyle(el).border,
      font:getComputedStyle(el).fontFamily
    }));
    await selectUnit(page,"T","kgf");
    assert.equal((await unit("T").innerText()).trim(), "kgf");
    assert.ok(near(await val("T"),before/9.80665),`kgf conversion must be immediate; width=${width}`);
    assert.equal((await unit("H").innerText()).trim(), "N", "Independent units must not change neighbor");
    assert.equal(await page.locator("#modal-result-tooltip").isVisible(),false,"Unit picker must not show contextual help");
    const styleAfter = await unit("T").evaluate(el => ({
      background:getComputedStyle(el).backgroundColor,
      border:getComputedStyle(el).border,
      font:getComputedStyle(el).fontFamily
    }));
    assert.deepEqual(styleAfter,styleBefore,"Unit label should remain visually unchanged");

    await page.reload({waitUntil:"networkidle"});
    await page.locator('.tab-btn[data-page="results"]').click();
    assert.equal((await unit("T").innerText()).trim(),"kgf","Per-result override must persist");
    assert.ok(near(await val("T"),before/9.80665),"Persisted value must match physical conversion");
    await selectUnit(page,"p","psi");
    assert.equal((await unit("p").innerText()).trim(),"psi");
    assert.equal((await unit("T").innerText()).trim(),"kgf");

    await resetAll(page,"imperial");
    await page.locator('.tab-btn[data-page="results"]').click();
    assert.equal((await unit("T").innerText()).trim(),"lbf");
    assert.equal((await unit("p").innerText()).trim(),"inHg");
    assert.ok(near(await val("T"),before*0.224808943),"Imperial force conversion mismatch");
    await page.locator('.tab-btn[data-page="conditions"]').click();
    assert.equal((await page.locator("#unit-altitude").innerText()).trim(),"ft");
    assert.equal((await page.locator("#unit-temperature").innerText()).trim(),"°F");

    // Prescribed thrust in kgf uses the existing unit modal in Conditions.
    await page.locator("#btn-trim-mode").click();
    await page.locator('#options-selector-list [data-option-id="rpm_thrust"]').click();
    await page.locator("#unit-operating-2").click();
    await page.locator('#options-selector-list [data-option-id="kgf"]').click();
    assert.equal((await page.locator("#unit-operating-2").innerText()).trim(),"kgf");

    await resetAll(page,"si");
    await page.locator('.tab-btn[data-page="conditions"]').click();
    assert.equal((await page.locator("#unit-altitude").innerText()).trim(),"m");
    assert.equal((await page.locator("#unit-temperature").innerText()).trim(),"°C");
    assert.equal((await page.locator("#unit-operating-2").innerText()).trim(),"N");
    await page.locator('.tab-btn[data-page="results"]').click();
    assert.equal((await unit("T").innerText()).trim(),"N");
    assert.equal((await unit("p").innerText()).trim(),"hPa");
    assert.ok(near(await val("T"),before),"Round-trip result changed underlying calculations");
    await context.close();
    console.log(`PASS browser units: ${width}px, immediate conversion, persistence, two resets, thrust kgf, visual parity`);
  }
  assert.deepEqual(errors,[],"Uncaught browser errors");
} finally {
  await browser.close();
}
