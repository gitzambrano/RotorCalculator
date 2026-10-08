"""Capture the actual installed APK and web at equivalent content viewports."""
import asyncio, io, json, os, re, subprocess, sys, time, xml.etree.ElementTree as ET
from pathlib import Path
from PIL import Image
from playwright.async_api import async_playwright

ADB='C:/Android/platform-tools/adb.exe'; PACKAGE='flightdyn.rotorcalculator'
OUT=Path('scratch/qa-results/release-1.23/comparison');OUT.mkdir(parents=True,exist_ok=True)
def adb(*args):
    return subprocess.run([ADB,'-s',os.environ.get("ANDROID_SERIAL", "emulator-5554"),*args],capture_output=True,check=True).stdout
def nodes():
    for attempt in range(5):
        adb('shell','rm','-f','/data/local/tmp/release-ui.xml')
        adb('shell','uiautomator','dump','/data/local/tmp/release-ui.xml')
        try:return list(ET.fromstring(adb('shell','cat','/data/local/tmp/release-ui.xml')).iter('node'))
        except (ET.ParseError,subprocess.CalledProcessError):time.sleep(.5)
    raise RuntimeError('Could not read APK UI')
def bounds(n):return tuple(map(int,re.findall(r'\d+',n.get('bounds'))))
def click(text, ns=None):
    n=next((n for n in ns or nodes() if n.get('text','').casefold()==text.casefold()),None)
    if n is None:raise AssertionError('APK control missing: '+text)
    x1,y1,x2,y2=bounds(n);adb('shell','input','tap',str((x1+x2)//2),str((y1+y2)//2));time.sleep(.35)
def set_theme(theme):
    click('⋮');click('Settings')
    ns=nodes();button=next(n for n in ns if n.get('text') in ['DARK','LIGHT','MIDNIGHT'])
    click(button.get('text'),ns);click({'dark':'Dark','light':'Light','midnight':'Midnight Blue'}[theme]);click('×')
def capture(name, density):
    ns=nodes();raw=Image.open(io.BytesIO(adb('exec-out','screencap','-p')))
    raw.save(OUT/(name+'-apk-raw.png'))
    group=next(n for n in ns if n.get('class')=='android.view.ViewGroup' and bounds(n)[1]>0 and bounds(n)[3]-bounds(n)[1]>raw.height*.65)
    box=bounds(group);crop=raw.crop(box);size=(round(crop.width*160/density),round(crop.height*160/density))
    crop.resize(size,Image.Resampling.LANCZOS).save(OUT/(name+'-apk.png'))
    (OUT/(name+'-nodes.json')).write_text(json.dumps([n.attrib for n in ns],ensure_ascii=False),encoding='utf-8')
    return size

CONFIGS=[('320',540,0,1),('360',480,0,1),('393',440,0,1),('412',420,0,1),('600',288,0,1),('768',225,0,1),('320-font130',540,0,1.3),('phone-landscape',440,1,1),('tablet-landscape',225,1,1)]
async def main():
    summary=[]
    async with async_playwright() as p:
      browser=await p.chromium.launch()
      try:
        for theme in ['dark','light','midnight']:
          adb('shell','wm','density','420');adb('shell','settings','put','system','font_scale','1.0')
          adb('shell','settings','put','system','user_rotation','0')
          adb('shell','am','force-stop',PACKAGE);adb('shell','am','start','-n',PACKAGE+'/.main');time.sleep(1.5)
          set_theme(theme)
          print('THEME',theme,flush=True)
          for label,density,rotation,font in CONFIGS:
            adb('shell','wm','density',str(density));adb('shell','settings','put','system','font_scale',str(font))
            adb('shell','settings','put','system','accelerometer_rotation','0');adb('shell','settings','put','system','user_rotation',str(rotation))
            adb('shell','am','force-stop',PACKAGE);adb('shell','am','start','-n',PACKAGE+'/.main');time.sleep(1.1)
            context=await browser.new_context()
            await context.add_init_script(f'localStorage.setItem("rotor_theme", "{theme}")')
            page=await context.new_page();await page.goto(os.environ.get('ROTOR_WEB_URL','http://127.0.0.1:8080/'))
            await page.wait_for_selector('.app-shell')
            for section in ['geometry','conditions','results']:
              click(section.upper());name=f'{theme}-{label}-{section}'
              size=capture(name,density);await page.set_viewport_size(dict(zip(['width','height'],size)))
              await page.locator('[data-page="'+section+'"]').click()
              if font!=1:await page.add_style_tag(content=f'.row-label-btn,.row-input,.row-unit-btn,.result-label,.result-val,.result-unit {{font-size: {16*font}px !important}}')
              await page.wait_for_timeout(300);await page.screenshot(path=str(OUT/(name+'-web.png')))
              a=Image.open(OUT/(name+'-apk.png'));b=Image.open(OUT/(name+'-web.png'))
              pair=Image.new('RGB',(a.width+b.width,a.height),'#000');pair.paste(a,(0,0));pair.paste(b,(a.width,0));pair.save(OUT/(name+'-pair.png'))
              summary.append({'theme':theme,'size':label,'page':section,'viewport':size})
            # Inspect real sweep and menu sheets, not only top-level pages.
            click('OPEN PARAMETER SWEEP');name=f'{theme}-{label}-sweep';capture(name,density)
            await page.locator('#btn-open-sweep').click();await page.wait_for_timeout(350);await page.screenshot(path=str(OUT/(name+'-web.png')))
            click('×');await page.locator('[data-close="modal-sweep"]').click()
            click('⋮');name=f'{theme}-{label}-menu';capture(name,density)
            await page.locator('#btn-main-menu').click();await page.wait_for_timeout(350);await page.screenshot(path=str(OUT/(name+'-web.png')))
            click('×');await context.close()
            print('CAPTURED',theme,label,flush=True)
      finally:
        adb('shell','wm','density','reset');adb('shell','settings','put','system','font_scale','1.0');adb('shell','settings','put','system','user_rotation','0')
        adb('shell','am','force-stop',PACKAGE);adb('shell','am','start','-n',PACKAGE+'/.main')
        await browser.close()
    (OUT/'manifest.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
async def refresh_web():
    """Re-render the final web build against the saved native screenshots."""
    records=json.loads((OUT/'manifest.json').read_text(encoding='utf-8'))
    async with async_playwright() as p:
      browser=await p.chromium.launch()
      for theme,label in dict.fromkeys((r['theme'],r['size']) for r in records):
        size=next(r['viewport'] for r in records if r['theme']==theme and r['size']==label)
        ctx=await browser.new_context(viewport=dict(zip(['width','height'],size)))
        ns=json.loads((OUT/f'{theme}-{label}-conditions-nodes.json').read_text(encoding='utf-8'))
        texts=[n.get('text') for n in ns]
        inflow='drees' if 'Drees' in texts else 'uniform' if 'Uniform' in texts else 'coleman_simple' if 'Coleman' in texts else 'coleman_feingold'
        await ctx.add_init_script(f'localStorage.setItem("rotor_theme","{theme}");localStorage.setItem("rotorcalc_active_cond",JSON.stringify({{inflowModel:"{inflow}"}}));')
        page=await ctx.new_page();await page.goto(os.environ.get('ROTOR_WEB_URL','http://127.0.0.1:8080/'));await page.wait_for_selector('.app-shell');await page.evaluate('document.fonts.ready')
        if label=='320-font130':
          await page.evaluate('document.documentElement.style.setProperty("--engineering-font-scale","1.3");window.dispatchEvent(new Event("resize"))')
        for section in ['geometry','conditions','results','sweep','menu']:
          name=f'{theme}-{label}-{section}'
          if section in ['geometry','conditions','results']:await page.locator(f'[data-page="{section}"]').click()
          elif section=='sweep':await page.locator('#btn-open-sweep').click()
          else:
            await page.locator('[data-close="modal-sweep"]').click();await page.locator('#btn-main-menu').click()
          await page.wait_for_timeout(350);await page.screenshot(path=str(OUT/(name+'-web.png')))
          a=Image.open(OUT/(name+'-apk.png'));b=Image.open(OUT/(name+'-web.png'))
          pair=Image.new('RGB',(a.width+b.width,a.height),'#000');pair.paste(a,(0,0));pair.paste(b,(a.width,0));pair.save(OUT/(name+'-pair.png'))
        await ctx.close();print('REFRESHED',theme,label,flush=True)
      await browser.close()
asyncio.run(refresh_web() if '--web-only' in sys.argv else main())
