"""Compare built web popups with real APK captures at equal content dimensions."""
import os
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright

OUT = Path('scratch/qa-results/release-1.23/popups-final')
URL = os.environ.get('ROTOR_WEB_URL', 'http://127.0.0.1:8080/')
with sync_playwright() as p:
    browser = p.chromium.launch()
    for theme in ['dark', 'light', 'midnight']:
        native = Image.open(OUT / f'{theme}-393-settings-apk.png')
        context = browser.new_context(viewport={'width': native.width, 'height': native.height})
        context.add_init_script(f"localStorage.setItem('rotor_theme','{theme}')")
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(URL, wait_until='networkidle')
        for action, label, modal in [('settings','settings','modal-settings'), ('units','converter','modal-unit-converter'), ('about','about','modal-about'), ('privacy','privacy','modal-privacy')]:
            page.locator('#btn-main-menu').click()
            page.locator(f'[data-action="{action}"]').click()
            page.locator(f'#{modal}.open').wait_for()
            if label == 'settings':
                for title in page.locator('.settings-row-title').all():
                    assert title.evaluate('e=>e.scrollWidth <= e.clientWidth+1'), title.inner_text()
                assert page.locator('#btn-setting-import').is_visible()
                assert page.locator('#btn-setting-export').is_visible()
            if label == 'privacy':
                frame = page.frame_locator('#privacy-iframe')
                assert 'Privacy Policy' in frame.locator('h1').inner_text()
            page.wait_for_timeout(350)
            name = f'{theme}-393-{label}'
            page.screenshot(path=str(OUT / (name+'-web.png')))
            a = Image.open(OUT / (name+'-apk.png'))
            b = Image.open(OUT / (name+'-web.png'))
            pair = Image.new('RGB',(a.width+b.width,max(a.height,b.height)))
            pair.paste(a,(0,0)); pair.paste(b,(a.width,0)); pair.save(OUT / (name+'-pair.png'))
            page.keyboard.press('Escape')
        assert not errors, errors
        context.close()
    browser.close()
print('PASS: Settings complete labels, converter, About and full Privacy modal in three themes; 12 APK/web popup pairs captured')
