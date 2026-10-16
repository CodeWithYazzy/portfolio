"""Browser regressions. Run with Playwright Python and a local axe-core bundle.
YASIRLAB_AXE_PATH=/path/to/axe.min.js python3 -m unittest discover -s tests -v
The suite starts its own loopback-only static server and never requires GitHub.
"""
import functools
import http.server
import json
import os
from pathlib import Path
import threading
import unittest
from urllib.parse import unquote
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
AXE = os.environ.get('YASIRLAB_AXE_PATH')

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass

class PortfolioTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(ROOT)))
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = f'http://127.0.0.1:{cls.server.server_port}'
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'), headless=True, args=['--no-sandbox'])

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()
        cls.server.shutdown()
        cls.server.server_close()

    def setUp(self):
        self.context = self.browser.new_context(viewport={'width': 1440, 'height': 1000}, reduced_motion='reduce')
        self.page = self.context.new_page()
        self.errors = []
        self.page.on('pageerror', lambda error: self.errors.append(str(error)))
        # These tests exercise the bundled site, never a remote repository or a live deployment.
        self.context.route('https://**/*', lambda route: route.abort())

    def tearDown(self):
        self.context.close()
        self.assertEqual(self.errors, [], 'Unexpected JavaScript errors')

    def goto(self, path='/'):
        response = self.page.goto(self.base + path)
        self.assertEqual(response.status, 200)
        self.page.wait_for_load_state('networkidle')

    def test_without_javascript_keeps_core_content_and_email_available(self):
        context = self.browser.new_context(java_script_enabled=False)
        page = context.new_page()
        try:
            page.goto(self.base)
            self.assertTrue(page.get_by_role('heading', name='Curiosity. In progress.').is_visible())
            self.assertTrue(page.locator('#about').is_visible())
            self.assertTrue(page.locator('a.contact-email').get_attribute('href').startswith('mailto:'))
            self.assertTrue(page.locator('#contactForm button[type=submit]').is_disabled())
        finally:
            context.close()

    def test_gallery_filters_search_empty_and_reset(self):
        self.goto('/pages/all-projects.html')
        self.assertEqual(self.page.locator('.project-card').count(), 15)
        self.page.locator('[data-filter="Web"]').click()
        self.assertEqual(self.page.locator('.project-card').count(), 2)
        self.page.locator('#projectSearch').fill('calculator')
        self.assertEqual(self.page.locator('.project-card').count(), 1)
        self.page.locator('#projectSearch').fill('no-such-project')
        self.assertTrue(self.page.locator('#projectEmpty').is_visible())
        self.page.locator('#resetFilters').click()
        self.assertEqual(self.page.locator('.project-card').count(), 15)
        self.assertEqual(self.page.locator('[data-filter="All"]').get_attribute('aria-pressed'), 'true')

    def test_project_dialog_keyboard_and_navigation(self):
        self.goto()
        self.assertEqual(self.page.locator('.project-card').count(), 3)
        trigger = self.page.get_by_role('button', name='Explore demo: Iris Flower Classifier', exact=True)
        trigger.focus()
        self.page.keyboard.press('Enter')
        self.assertTrue(self.page.locator('#projectModal').is_visible())
        self.assertIn('performance benchmark', self.page.locator('#modalLimitations').inner_text())
        self.assertIn('Iris%20Flower%20Classifier', self.page.locator('#modalDemo').get_attribute('href'))
        for _ in range(8):
            self.page.keyboard.press('Tab')
            self.assertTrue(self.page.evaluate('document.querySelector("#projectModal").contains(document.activeElement)'))
        self.page.keyboard.press('Escape')
        self.assertTrue(trigger.evaluate('(e)=>e===document.activeElement'))
        trigger.click()
        self.page.locator('#modalDemo').click()
        self.page.wait_for_url('**/pages/demo.html?project=*')
        self.assertEqual(self.page.locator('#projectTitle').inner_text(), 'Iris Flower Classifier')

    def test_six_lab_concepts_are_unrun_and_dialogs_restore_focus(self):
        self.goto()
        for i in range(6):
            trigger = self.page.locator(f'[data-lab="{i}"]')
            trigger.click()
            self.assertTrue(self.page.locator('#labModal').is_visible())
            self.assertIn('Not run.', self.page.locator('#labModalBody').inner_text())
            self.page.keyboard.press('Escape')
            self.assertTrue(trigger.evaluate('(e)=>e===document.activeElement'))

    def test_themes_system_changes_persistence_and_cross_tab_sync(self):
        self.page.emulate_media(color_scheme='dark')
        self.goto()
        self.assertEqual(self.page.locator('html').get_attribute('data-theme'), 'dark')
        self.assertIsNone(self.page.evaluate('localStorage.getItem("theme")'))
        self.page.emulate_media(color_scheme='light')
        self.page.wait_for_function('document.documentElement.dataset.theme === "light"')
        other = self.context.new_page()
        other.goto(self.base + '/pages/all-projects.html')
        self.page.locator('.theme-toggle').click()
        other.wait_for_function('document.documentElement.dataset.theme === "dark"')
        self.page.reload()
        self.assertEqual(self.page.locator('html').get_attribute('data-theme'), 'dark')
        self.goto('/pages/demo.html?project=Calculator%20App')
        self.assertEqual(self.page.locator('.theme-toggle').get_attribute('aria-pressed'), 'true')
        self.page.locator('.theme-toggle').click()
        self.assertEqual(self.page.locator('html').get_attribute('data-theme'), 'light')

    def test_storage_denied_does_not_break_theme_or_site(self):
        self.context.add_init_script('Object.defineProperty(window,"localStorage",{get(){throw new Error("Storage unavailable")}})')
        self.page.emulate_media(color_scheme='dark')
        self.goto()
        self.assertEqual(self.page.locator('html').get_attribute('data-theme'), 'dark')
        self.page.locator('.theme-toggle').click()
        self.assertEqual(self.page.locator('html').get_attribute('data-theme'), 'light')

    def test_mobile_menu_keyboard_anchor_and_resize(self):
        self.page.set_viewport_size({'width': 390, 'height': 844})
        self.goto()
        button = self.page.locator('#hamburger')
        button.focus()
        self.page.keyboard.press('Enter')
        self.assertEqual(button.get_attribute('aria-expanded'), 'true')
        self.page.keyboard.press('Tab')
        self.assertTrue(self.page.locator('#mobileMenu a').first.evaluate('(e)=>e===document.activeElement'))
        self.page.keyboard.press('Escape')
        self.assertTrue(button.evaluate('(e)=>e===document.activeElement'))
        button.click()
        self.page.locator('#mobileMenu a[href="#lab"]').click()
        self.assertFalse(self.page.locator('#mobileMenu').is_visible())
        self.assertTrue(self.page.url.endswith('#lab'))
        self.assertTrue(self.page.locator('#lab').evaluate('(e)=>e===document.activeElement'))
        button.click()
        self.page.set_viewport_size({'width': 1000, 'height': 900})
        self.assertFalse(self.page.locator('#mobileMenu').is_visible())

    def test_contact_validation_email_draft_preserves_message(self):
        self.goto('/#contact')
        self.page.locator('#contactForm button[type=submit]').click()
        self.assertEqual(self.page.locator('[aria-invalid="true"]').count(), 4)
        self.assertTrue(self.page.locator('#name').evaluate('(e)=>e===document.activeElement'))
        self.page.locator('#name').fill('A visitor')
        self.page.locator('#email').fill('invalid')
        self.page.locator('#subject').fill('A & B?')
        self.page.locator('#message').fill('Hi')
        self.page.locator('#contactForm button[type=submit]').click()
        self.assertIn('valid email', self.page.locator('#emailError').inner_text())
        self.assertIn('10 characters', self.page.locator('#messageError').inner_text())
        self.page.locator('#email').fill('visitor@example.com')
        self.page.locator('#message').fill('A useful project idea to discuss.')
        cdp = self.context.new_cdp_session(self.page)
        cdp.send('Page.enable')
        navigations = []
        cdp.on('Page.windowOpen', lambda event: navigations.append(event['url']))
        self.page.locator('#contactForm button[type=submit]').click()
        self.page.wait_for_timeout(200)
        draft = next(url for url in navigations if url.startswith('mailto:'))
        self.assertIn('subject=A%20%26%20B%3F', draft)
        self.assertIn('visitor@example.com', unquote(draft))
        self.assertEqual(self.page.locator('#message').input_value(), 'A useful project idea to discuss.')
        self.assertIn('Finish sending', self.page.locator('#formStatus').inner_text())

    def test_calculator_arithmetic_and_error_handling_offline(self):
        self.goto('/pages/demo.html?project=Calculator%20App')
        self.page.locator('#runDemo').click()
        self.page.locator('#calculatorDemo').wait_for(state='visible')
        for key in ['2', '+', '3', '*', '4', '=']:
            self.page.locator(f'[data-calc="{key}"]').click()
        self.assertEqual(self.page.locator('#calculatorDisplay').input_value(), '14')
        self.page.locator('[data-calc="clear"]').click()
        for key in ['1', '/', '0', '=']:
            self.page.locator(f'[data-calc="{key}"]').click()
        self.assertIn('Cannot divide by zero', self.page.locator('#status').inner_text())
        self.assertEqual(self.page.evaluate('evaluateLocally("(2+3)^2")'), 25)
        self.assertEqual(self.page.evaluate('(()=>{try{evaluateLocally("alert(1)")}catch(e){return e.message}})()'), 'Enter a valid expression.')

    def test_iris_three_species_and_invalid_input_offline(self):
        self.goto('/pages/demo.html?project=Iris%20Flower%20Classifier')
        self.page.locator('#runDemo').click()
        self.page.locator('#irisDemo').wait_for(state='visible')
        self.assertIn('Setosa', self.page.locator('#irisResult').inner_text())
        for values, species in [([6.0,2.2,4.0,1.0], 'Versicolor'),([6.3,3.3,6.0,2.5], 'Virginica')]:
            for field,value in zip(['Sl','Sw','Pl','Pw'],values):
                self.page.locator('#iris'+field).fill(str(value))
            self.assertIn(species, self.page.locator('#irisResult').inner_text())
        self.page.locator('#irisSl').fill('')
        self.assertIn('four positive', self.page.locator('#irisResult').inner_text())

    def test_runner_static_sandbox_and_python_unavailable_fixture(self):
        # Explicit fixtures, not claims about live GitHub availability.
        self.goto('/pages/demo.html?project=Portfolio%20Website')
        detected = self.page.evaluate('GithubDemoRunner.detectProjectType(["index.html", "tools/sync-catalog.py", "tests/test_portfolio.py"])')
        self.assertEqual(detected['type'], 'A', 'Python test/tooling files must not turn a static website into a Python application')
        detected = self.page.evaluate('GithubDemoRunner.detectProjectType(["index.html", "requirements.txt", "app.py"])')
        self.assertEqual(detected['type'], 'E', 'A real Python runtime manifest still requires Python')
        self.context.unroute('https://**/*')
        self.context.route('https://api.github.com/**', lambda route: route.fulfill(json={'tree':[{'path':'index.html','type':'blob'}]}))
        self.context.route('https://raw.githubusercontent.com/**', lambda route: route.fulfill(body='<h1>Fixture</h1><button onclick="this.textContent=\'It works\'">Run fixture</button>',content_type='text/html'))
        self.goto('/pages/demo.html?project=Portfolio%20Website')
        self.page.locator('#runDemo').click()
        frame = self.page.frame_locator('#demoFrame')
        frame.get_by_role('button',name='Run fixture').click()
        self.assertEqual(frame.get_by_role('button').inner_text(), 'It works')
        self.assertNotIn('allow-same-origin', self.page.locator('#demoFrame').get_attribute('sandbox'))
        self.context.route('https://api.github.com/**', lambda route: route.fulfill(json={'tree':[{'path':'sales-dashboard/src/analysis.py','type':'blob'}]}))
        self.goto('/pages/demo.html?project=Sales%20Data%20Dashboard')
        self.page.locator('#runDemo').click()
        self.page.locator('#errorPanel').wait_for(state='visible')
        self.assertIn('Python required', self.page.locator('#errorPanel').inner_text())

    def test_bundled_catalog_fallback_when_json_unavailable(self):
        self.context.route('**/assets/projects.json', lambda route: route.abort())
        self.goto('/pages/all-projects.html')
        self.assertEqual(self.page.locator('.project-card').count(), 15)
        self.goto('/pages/demo.html?project=Calculator%20App')
        self.page.locator('#runDemo').click()
        self.page.locator('#calculatorDemo').wait_for(state='visible')

    def test_file_protocol_catalog_fallback(self):
        try:
            self.page.goto((ROOT / 'pages/all-projects.html').as_uri())
        except Exception as error:
            if 'ERR_BLOCKED_BY_ADMINISTRATOR' in str(error):
                self.skipTest('Managed Chromium policy prohibits file:// navigation; HTTP fallback is tested separately.')
            raise
        self.page.wait_for_function('document.querySelectorAll(".project-card").length === 15')
        self.page.goto((ROOT / 'pages/demo.html').as_uri()+'?project=Calculator%20App')
        self.page.locator('#runDemo').click()
        self.page.locator('#calculatorDemo').wait_for(state='visible')

    def test_responsive_layouts_and_seo(self):
        for width in [320,390,768,1440]:
            self.page.set_viewport_size({'width':width,'height':900})
            for path in ['/', '/pages/all-projects.html', '/pages/demo.html?project=Iris%20Flower%20Classifier','/404.html']:
                with self.subTest(width=width,path=path):
                    self.goto(path)
                    self.assertFalse(self.page.evaluate('document.documentElement.scrollWidth > innerWidth'), 'Horizontal overflow')
                    self.assertEqual(self.page.locator('main').count(),1)
                    self.assertEqual(self.page.locator('h1').count(),1)
                    self.assertTrue(self.page.locator('meta[name=description]').get_attribute('content'))
                    self.assertTrue(self.page.locator('link[rel=canonical]').get_attribute('href').startswith('https://yasirlab.in/'))
        self.goto()
        schema=json.loads(self.page.locator('script[type="application/ld+json"]').inner_text())
        self.assertNotIn('jobTitle', schema)
        self.assertNotIn('97%', self.page.locator('body').inner_text())

    def test_axe_accessibility_pages_themes_and_dialogs(self):
        self.assertTrue(AXE and Path(AXE).is_file(), 'Set YASIRLAB_AXE_PATH to the axe-core bundle; audit must not be silently skipped.')
        for width in [390,1440]:
            self.page.set_viewport_size({'width':width,'height':900})
            for theme in ['light','dark']:
                for path in ['/', '/pages/all-projects.html', '/pages/demo.html?project=Calculator%20App','/404.html']:
                    with self.subTest(width=width,theme=theme,path=path):
                        self.goto(path)
                        self.page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme)
                        if 'demo.html' in path:
                            self.page.locator('#runDemo').click()
                            self.page.locator('#calculatorDemo').wait_for(state='visible')
                        self.audit_axe()
                self.goto()
                self.page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme)
                self.page.locator('[data-lab="0"]').click()
                self.audit_axe()
                self.page.keyboard.press('Escape')
                self.page.get_by_role('button', name='Explore demo: Iris Flower Classifier', exact=True).click()
                self.audit_axe()
        self.goto('/pages/demo.html?project=Iris%20Flower%20Classifier')
        self.page.locator('#runDemo').click()
        self.page.locator('#irisDemo').wait_for(state='visible')
        self.audit_axe()

    def audit_axe(self):
        self.page.add_script_tag(path=AXE)
        violations=self.page.evaluate('''async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','best-practice']}});return r.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)}))}''')
        self.assertEqual(violations, [])

if __name__ == '__main__':
    unittest.main()
