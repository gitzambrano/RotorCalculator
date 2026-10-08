"""Browser parity checks. Serve docs at 127.0.0.1:8080 before running."""
import asyncio, zipfile
from pathlib import Path
from playwright.async_api import async_playwright

OUT=Path('scratch/output/playwright'); OUT.mkdir(parents=True,exist_ok=True)
async def main():
  async with async_playwright() as p:
    browser=await p.chromium.launch()
    page=await browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('dialog',lambda d:d.accept())
    await page.goto('http://127.0.0.1:8080/')
    await page.wait_for_selector('.app-shell')
    assert await page.locator('.version-badge').inner_text()=='v1.23'
    await page.locator('#inp-radius').fill('9')
    await page.reload()
    assert float(await page.locator('#inp-radius').input_value())==9
    await page.locator('#btn-geom-save').click()
    # Deleting the active rotor in the manager must discard its own draft.
    await page.locator('#inp-radius').fill('9.5')
    assert await page.evaluate('JSON.parse(localStorage.getItem("rotorcalculator_geometry_draft")).baseId === (localStorage.getItem("rotorcalculator_active_rotor_id") || "preset-uh60")')
    await page.locator('#active-rotor-bar').click()
    await page.locator('#rotor-manager-list .active [data-act="delete"]').click()
    await page.locator('[data-close="modal-rotor-manager"]').click()
    selected_name = await page.locator('#display-active-rotor-name').inner_text()
    selected_radius = await page.locator('#inp-radius').input_value()
    await page.reload()
    assert await page.locator('#display-active-rotor-name').inner_text() == selected_name
    assert await page.locator('#inp-radius').input_value() == selected_radius
    assert float(selected_radius) != 9.5
    # All coupled geometry rows must accept edits.
    for id in ['drv-taper','drv-sigma-geom','drv-sigma-thrust','drv-disk-area','drv-blade-area-ref','drv-blade-area','drv-twist']:
      el=page.locator('#'+id)
      assert await el.evaluate('el=>el.tagName')=='INPUT',id
    await page.locator('[data-page="conditions"]').click()
    await page.locator('#inp-temperature').fill('0')
    await page.locator('#inp-altitude').fill('500')
    await page.reload()
    await page.locator('[data-page="conditions"]').click()
    assert float(await page.locator('#inp-temperature').input_value())==0
    assert float(await page.locator('#inp-altitude').input_value())==500
    # Desktop hover help and click popup.
    await page.locator('[data-key="h"].row-label-btn').hover()
    await page.wait_for_selector('#tooltip-popover.visible')
    assert 'Altitude' in await page.locator('#tooltip-popover').inner_text()
    await page.locator('[data-key="h"].row-label-btn').click()
    await page.wait_for_selector('#modal-result-tooltip.open')
    await page.locator('[data-close="modal-result-tooltip"]').click()
    # The mobile menu uses the native five-row bottom sheet; data stays in Settings.
    await page.set_viewport_size({'width':320,'height':668})
    await page.locator('#btn-main-menu').click()
    assert await page.locator('#main-popup-menu .popup-menu-item:visible').count() == 5
    assert await page.locator('#main-popup-menu .menu-item-title').all_inner_texts() == ['Physics & Equations','Unit Converter','Settings','About','Privacy']
    menu_box = await page.locator('#main-popup-menu').bounding_box()
    assert menu_box and abs(menu_box['x']) < 1 and abs(menu_box['width']-320) < 1 and abs(menu_box['y']+menu_box['height']-668) < 1
    await page.screenshot(path=str(OUT/'mobile-menu-320.png'))
    await page.locator('#btn-menu-close').click()
    assert await page.locator('#main-menu-backdrop').is_hidden()
    await page.locator('#btn-main-menu').click()
    await page.keyboard.press('Escape')
    assert await page.locator('#main-popup-menu').is_hidden()
    await page.set_viewport_size({'width':1440,'height':900})
    await page.locator('#btn-main-menu').click()
    await page.locator('[data-action="settings"]').click()
    async with page.expect_download() as dl: await page.locator('#btn-setting-export').click()
    backup=await dl.value;await backup.save_as(OUT/'rotors-backup.txt')
    assert 'ROTORCALC' in (OUT/'rotors-backup.txt').read_text()
    async with page.expect_download() as dl: await page.locator('a[download="rotorcalculator-offline.zip"]').click()
    bundle=await dl.value;await bundle.save_as(OUT/'offline.zip')
    with zipfile.ZipFile(OUT/'offline.zip') as z:
      assert z.testzip() is None
      z.extractall(OUT/'offline')
    await page.locator('[data-close="modal-settings"]').click()
    # Roundtrip APK-compatible database through the browser file chooser.
    await page.locator('#file-import-input').set_input_files(str(OUT/'rotors-backup.txt'))
    await page.wait_for_selector('#modal-import-conflict.open')
    await page.locator('#btn-import-rename').click()
    await page.locator('[data-page="results"]').click()
    # Reopening Sweep must still produce exactly one redraw per interaction.
    for _ in range(3):
      await page.locator('#btn-open-sweep').click()
      await page.locator('[data-close="modal-sweep"]').click()
    await page.locator('#btn-open-sweep').click()
    await page.wait_for_selector('#modal-sweep.open')
    await page.locator('#sweep-canvas').evaluate('canvas => { const ctx=canvas.getContext("2d"); const fill=ctx.fillRect.bind(ctx); window.sweepRedraws=0; ctx.fillRect=(...args)=>{ if(args[0]===0 && args[1]===0) window.sweepRedraws++; return fill(...args); }; }')
    await page.locator('#sweep-canvas').click(position={'x':150,'y':100})
    assert await page.evaluate('window.sweepRedraws') == 1
    for kind in ['csv','png']:
      async with page.expect_download() as dl: await page.locator('#btn-sweep-export-'+kind).click()
      download=await dl.value;await download.save_as(OUT/('sweep.'+kind))
      assert (OUT/('sweep.'+kind)).stat().st_size>100
    await page.locator('[data-close="modal-sweep"]').click()
    # Theme parity and result-row contextual help.
    for theme in ['light','midnight','dark']:
      await page.locator('#btn-main-menu').click()
      await page.locator('[data-action="settings"]').click()
      await page.locator('#btn-setting-theme').click()
      await page.locator('.option-item',has_text={'light':'Light','midnight':'Midnight','dark':'Dark'}[theme]).click()
      assert await page.evaluate('document.documentElement.dataset.theme')==theme
      await page.locator('[data-close="modal-settings"]').click()
      await page.wait_for_timeout(350)
      await page.screenshot(path=str(OUT/f'theme-{theme}.png'))
    await page.locator('.result-label[data-key="T"]').hover()
    await page.wait_for_selector('#tooltip-popover.visible')
    await page.locator('.result-label[data-key="T"]').click()
    await page.wait_for_selector('#modal-result-tooltip.open')
    await page.locator('[data-close="modal-result-tooltip"]').click()
    # 9 target viewports and 130% text scaling; inspect every page, no clipped units.
    for width,height in [(320,640),(360,800),(393,852),(412,915),(600,960),(768,1024),(852,393),(1024,768),(1920,1080)]:
      await page.set_viewport_size({'width':width,'height':height})
      for scale in [1,1.3]:
        await page.evaluate('(scale)=>document.documentElement.style.zoom=scale',scale)
        for name in ['geometry','conditions','results']:
          await page.locator('[data-page="'+name+'"]').click()
          assert await page.evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth+1'),(width,name)
          clipped=await page.locator('#page-'+name+' .row-unit-btn, #page-'+name+' .result-unit').evaluate_all('els=>els.filter(e=>{let r=e.getBoundingClientRect();let p=e.closest(".engineering-row,.result-row").getBoundingClientRect();return r.right>p.right+1}).map(e=>e.textContent)')
          assert not clipped,(width,name,clipped)
          await page.wait_for_timeout(300)
          await page.screenshot(path=str(OUT/f'{width}-{height}-{scale}-{name}.png'))
    assert not errors,errors
    await page.evaluate('document.documentElement.style.zoom=1')
    await page.evaluate('navigator.serviceWorker.ready')
    await page.context.set_offline(True)
    await page.reload()
    await page.wait_for_selector('.app-shell')
    await page.locator('[data-page="results"]').click()
    assert await page.locator('.result-val').first.inner_text()!='---'
    await page.context.set_offline(False)
    offline=await browser.new_page()
    await offline.goto((OUT/'offline/index.html').resolve().as_uri())
    await offline.wait_for_selector('.app-shell')
    await offline.locator('[data-page="results"]').click()
    assert await offline.locator('.result-val').first.inner_text()!='---'
    await browser.close()
    print('PASS: draft/session, editable geometry, desktop help, database roundtrip, CSV/PNG/ZIP, three themes, offline HTML/PWA, 54 responsive page screenshots; no JS errors')
asyncio.run(main())
