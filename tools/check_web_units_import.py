"""Verify input-unit changes preserve physical results and exercise import conflicts."""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT = Path('qa-results/release-1.23/complete-flows'); OUT.mkdir(parents=True, exist_ok=True)
URL = os.environ.get('ROTOR_WEB_URL', 'http://127.0.0.1:8080/')
KEY = 'rotorcalculator_rotors_v2'
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width':1440,'height':960})
    page.on('dialog', lambda d: d.accept())
    page.goto(URL,wait_until='networkidle')
    page.locator('[data-page="geometry"]').click()
    baseline = page.locator('.result-row[data-key="T"] .result-val').inner_text()
    count = 0
    for control in ['unit-rpm-nom','unit-radius','unit-chord-root','unit-chord-tip','unit-theta-root','unit-theta-tip','unit-twist','unit-lift-slope','unit-disk-area','unit-blade-area-ref','unit-blade-area']:
        page.locator('#'+control).click()
        options = page.locator('#options-selector-list .option-label').all_inner_texts()
        page.keyboard.press('Escape')
        for option in options:
            page.locator('#'+control).click()
            page.locator('#options-selector-list .option-label').filter(has_text=option).filter(visible=True).first.click()
            assert page.locator('.result-row[data-key="T"] .result-val').inner_text() == baseline, (control,option)
            count += 1
    saved = page.evaluate(f"JSON.parse(localStorage.getItem('{KEY}'))")
    assert len(saved) == 6
    for i, rotor in enumerate(saved):
        page.locator('#active-rotor-bar').click()
        page.locator('#rotor-manager-list .rotor-manager-info').nth(i).click()
        assert float(page.locator('#inp-radius').input_value()) > 0
        assert rotor['name'] in page.locator('#display-active-rotor-name').inner_text()
    fixture = OUT/'import-conflict-fixture.json'
    imported = json.loads(json.dumps(saved))
    imported[0]['geom']['radius'] = 9.123
    fixture.write_text(json.dumps(imported),encoding='utf-8')
    for mode in ['cancel','skip','replace','rename']:
        page.locator('#file-import-input').set_input_files(str(fixture))
        page.locator('#modal-import-conflict.open').wait_for()
        page.locator('#btn-import-'+mode).click()
        page.wait_for_function("!document.querySelector('#modal-import-conflict').classList.contains('open')")
        library = page.evaluate(f"JSON.parse(localStorage.getItem('{KEY}'))")
        if mode in ['cancel','skip']:
            assert library == saved, mode
        elif mode == 'replace':
            assert len(library) == 6 and library[0]['geom']['radius'] == 9.123
        else:
            assert len(library) == 12
            assert len({r['name'].lower() for r in library}) == 12
    browser.close()
print(f'PASS: {count} geometry unit selections preserve thrust; all six presets and Cancel/Skip/Replace/Rename imports exercised')
