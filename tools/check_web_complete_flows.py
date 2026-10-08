"""Exercise the complete results/sweep catalogs and Android quick-converter UI."""
import csv, json, os, math
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path('scratch/qa-results/release-1.23/complete-flows')
OUT.mkdir(parents=True, exist_ok=True)
URL = os.environ.get('ROTOR_WEB_URL', 'http://127.0.0.1:8080/')
report = {'url': URL, 'result_help': [], 'sweep_parameters': [], 'conversions': [], 'families': [], 'axes': [], 'ranges': []}
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': 1440, 'height': 960}, accept_downloads=True)
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('dialog', lambda dialog: dialog.accept())
    page.goto(URL, wait_until='networkidle')
    page.locator('[data-page="results"]').click()
    labels = page.locator('button.result-label')
    assert labels.count() == 65, labels.count()
    for i in range(labels.count()):
        label = labels.nth(i)
        key = label.get_attribute('data-key')
        label.click()
        assert 'open' in page.locator('#modal-result-tooltip').get_attribute('class'), key
        assert page.locator('#result-tooltip-title').inner_text().strip(), key
        assert page.locator('#result-tooltip-desc').inner_text().strip(), key
        page.keyboard.press('Escape')
        page.wait_for_function("!document.querySelector('#modal-result-tooltip').classList.contains('open')")
        report['result_help'].append(key)
    page.locator('#btn-open-sweep').click()
    params = page.locator('#sweep-select-param option').evaluate_all('(options)=>options.map(o=>o.value)')
    assert len(params) == 61
    for key in params:
        page.locator('#sweep-select-param').select_option(key)
        with page.expect_download() as event:
            page.locator('#btn-sweep-export-csv').click()
        download = event.value
        target = OUT / f'{key}.csv'
        download.save_as(target)
        lines = [line for line in target.read_text(encoding='utf-8-sig').splitlines() if line and not line.startswith('#')]
        assert len(lines) == 26, (key, len(lines))
        assert next(csv.reader([lines[0]]))[0] == 'μ_x [-]', (key, lines[0])
        report['sweep_parameters'].append(key)
    for family in ['0', '1', '2', '3', '4']:
        page.locator('#sweep-select-family').select_option(family)
        if family in ['1', '2', '3']:
            page.locator('#btn-sweep-values').click()
            page.locator('#inp-sweep-values').fill('0.0123')
            page.locator('#btn-sweep-values-save').click()
            with page.expect_download() as event: page.locator('#btn-sweep-export-csv').click()
            target = OUT / f'family-{family}.csv'
            event.value.save_as(target)
            header = [line for line in target.read_text(encoding='utf-8-sig').splitlines() if line and not line.startswith('#')][0]
            assert len(next(csv.reader([header]))) == 2, header
        report['families'].append(family)
    for axis in ['mu', 'vx', 'muLam']:
        page.locator('#sweep-select-xaxis').select_option(axis)
        report['axes'].append(axis)
    for value in page.locator('#sweep-select-maxmu option').evaluate_all('(options)=>options.map(o=>o.value)'):
        page.locator('#sweep-select-maxmu').select_option(value)
        report['ranges'].append(value)
    with page.expect_download() as event: page.locator('#btn-sweep-export-png').click()
    event.value.save_as(OUT / 'sweep.png')
    assert (OUT / 'sweep.png').read_bytes().startswith(b'\x89PNG\r\n\x1a\n')
    page.keyboard.press('Escape')
    page.locator('#btn-main-menu').click()
    page.locator('[data-action="units"]').click()
    factors = [1.34102209, 1/1.34102209, 1/9.80665, 9.80665, .224808943, 1/.224808943, 1/1.852, 1.852, 1/3.6, 3.6, 3.280839895, 1/3.280839895, 1/25.4, 25.4]
    for i, factor in enumerate(factors):
        page.locator('#quick-converter-mode').click()
        assert page.locator('#options-selector-list .option-item').count() == 14
        page.locator('#options-selector-list .option-item').nth(i).click()
        page.locator('#quick-converter-input').fill('123.45')
        value = float(page.locator('#quick-converter-result').inner_text().split()[0])
        assert abs(value - 123.45*factor) <= .000051, (i, value)
        page.locator('#quick-converter-swap').click()
        value = float(page.locator('#quick-converter-result').inner_text().split()[0])
        assert abs(value - 123.45*factors[i ^ 1]) <= .000051, (i, value)
        report['conversions'].append(i)
    page.keyboard.press('Escape')
    page.locator('[data-page="geometry"]').click()
    name = page.locator('#display-active-rotor-name').inner_text()
    page.locator('#btn-geom-copy').click()
    page.locator('#name-dialog-cancel').click()
    assert page.locator('#display-active-rotor-name').inner_text() == name
    page.locator('#btn-geom-copy').click()
    page.locator('#name-dialog-input').fill('QA independent copy')
    page.locator('#modal-name-input button[type="submit"]').click()
    assert 'QA independent copy' in page.locator('#display-active-rotor-name').inner_text()
    page.reload(wait_until='networkidle')
    assert 'QA independent copy' in page.locator('#display-active-rotor-name').inner_text()
    page.set_viewport_size({'width': 393, 'height': 852})
    page.locator('#active-rotor-bar').click()
    choices = page.locator('#options-selector-list').inner_text()
    assert 'NEW ROTOR' in choices and 'RENAME CURRENT ROTOR' in choices
    page.keyboard.press('Escape')
    page.screenshot(path=str(OUT / 'mobile-geometry.png'))
    assert not errors, errors
    report['runtime_errors'] = errors
    (OUT / 'evidence.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    browser.close()
print('PASS: 65 result help dialogs, 61 sweep CSV quantities, 5 families, 3 axes, ranges, PNG, 14 converters+Swap, copy cancellation/persistence, mobile rotor picker')
