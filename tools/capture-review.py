"""Capture the five-page portfolio with real browser-rendered experiment output."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/screenshots/five-page'
BASE=os.environ.get('YASIRLAB_PREVIEW_URL','http://127.0.0.1:8766')
OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    for width,name in [(1440,'desktop'),(768,'tablet'),(390,'mobile')]:
        for theme in ['dark','light']:
            page=browser.new_page(viewport={'width':width,'height':1000 if width==1440 else 900},reduced_motion='reduce')
            page.add_init_script('localStorage.setItem("theme",'+repr(theme)+')')
            page.route('https://**/*',lambda route:route.abort())
            page.goto(BASE+'/');page.wait_for_timeout(300)
            page.screenshot(path=str(OUT/f'home-{name}-{theme}.png'),full_page=True)
            if width==1440 and theme=='dark':
                for filename in ['about','projects','contact']:
                    page.goto(BASE+'/'+filename+'.html');page.wait_for_timeout(200);page.screenshot(path=str(OUT/f'{filename}-desktop.png'),full_page=True)
            if name in ['desktop','mobile'] and theme=='dark':
                for tab in ['gradient','clustering','network']:
                    page.goto(BASE+'/visualize.html#'+tab)
                    if tab=='gradient':page.locator('#gradientStep').click()
                    if tab=='clustering':
                        for _ in range(4):page.locator('#clusterStep').click()
                    if tab=='network':page.locator('.network-node').first.click()
                    page.evaluate('document.activeElement.blur();scrollTo({top:0,behavior:"instant"})')
                    page.wait_for_timeout(200)
                    page.screenshot(path=str(OUT/f'visualize-{tab}-{name}.png'),full_page=True)
            page.close()
    browser.close()
print('Saved portfolio/experiment screenshots in docs/screenshots/five-page/.')
