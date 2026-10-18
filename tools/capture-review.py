"""Capture the real packaged UI. Run the loopback preview first; no provider requests."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/screenshots/after'
OUT.mkdir(parents=True,exist_ok=True)
def settle(page):
    page.wait_for_timeout(1000)
    for y in range(0,page.evaluate('document.documentElement.scrollHeight'),650):
        page.evaluate('(y)=>window.scrollTo({top:y,behavior:"instant"})',y)
        page.wait_for_timeout(70)
    page.evaluate('window.scrollTo({top:0,behavior:"instant"})')
    page.wait_for_timeout(750)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    for name,width,height in [('desktop',1440,1000),('tablet',768,1024),('mobile',390,844)]:
        for theme in ['light','dark']:
            context=browser.new_context(viewport={'width':width,'height':height},color_scheme=theme)
            context.route('https://**/*',lambda route:route.abort())
            page=context.new_page();page.goto('http://127.0.0.1:8766/');settle(page)
            page.screenshot(path=str(OUT/f'home-{theme}-{name}.png'))
            page.screenshot(path=str(OUT/f'home-{theme}-{name}-full.png'),full_page=True)
            if name=='desktop' and theme=='light':
                for section in ['projects','lab','contact']:
                    page.evaluate('(id)=>window.scrollTo({top:document.getElementById(id).offsetTop-90,behavior:"instant"})',section)
                    page.wait_for_timeout(800)
                    page.screenshot(path=str(OUT/f'{section}-light-desktop.png'))
                page.goto('http://127.0.0.1:8766/pages/all-projects.html');settle(page)
                page.screenshot(path=str(OUT/'gallery-light-desktop.png'),full_page=True)
                page.goto('http://127.0.0.1:8766/pages/demo.html?project=Iris%20Flower%20Classifier');page.locator('#runDemo').click();page.locator('#irisDemo').wait_for(state='visible');page.wait_for_timeout(500)
                page.screenshot(path=str(OUT/'iris-light-desktop.png'),full_page=True)
            context.close()
    browser.close()
print('Captured both themes at desktop, tablet and mobile, plus project/lab/contact/gallery/demo views.')
