"""Five-page portfolio and educational experiment regressions. External calls are mocked."""
import functools
import http.server
import os
from pathlib import Path
import threading
import unittest
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
AXE=os.environ.get('YASIRLAB_AXE_PATH')
PAGES=['/','/about.html','/projects.html','/visualize.html','/contact.html']
class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*_):pass
class PortfolioTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(QuietHandler,directory=str(ROOT)))
        threading.Thread(target=cls.server.serve_forever,daemon=True).start()
        cls.base=f'http://127.0.0.1:{cls.server.server_port}'
        cls.playwright=sync_playwright().start()
        cls.browser=cls.playwright.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
    @classmethod
    def tearDownClass(cls):
        cls.browser.close();cls.playwright.stop();cls.server.shutdown();cls.server.server_close()
    def setUp(self):
        self.context=self.browser.new_context(viewport={'width':1440,'height':1000},reduced_motion='reduce')
        self.page=self.context.new_page();self.errors=[]
        self.page.on('pageerror',lambda error:self.errors.append(str(error)))
        self.context.route('https://**/*',lambda route:route.abort())
        self.context.route('**/api/contact-config',lambda route:route.fulfill(json={'enabled':False}))
    def tearDown(self):
        self.context.close();self.assertEqual(self.errors,[])
    def goto(self,path='/'):
        response=self.page.goto(self.base+path)
        if response:self.assertEqual(response.status,200)
        self.page.wait_for_load_state('networkidle')
    def test_five_pages_navigation_and_honest_projects(self):
        for path in PAGES:
            self.goto(path)
            nav=self.page.locator('.site-nav')
            self.assertEqual(nav.locator('a').all_inner_texts(),['Home','About','Projects','Visualize','Contact'])
            self.assertEqual(nav.locator('[aria-current=page]').count(),1)
            self.assertEqual(self.page.locator('main').count(),1)
            self.assertEqual(self.page.locator('h1').count(),1)
        self.goto('/projects.html')
        self.assertEqual(self.page.locator('h1').inner_text(),'Projects Coming Soon')
        self.assertIn("I'm currently learning, experimenting, and building. Exciting projects will appear here soon.",self.page.locator('body').inner_text())
        self.assertEqual(self.page.locator('.project-card').count(),0)
        self.page.get_by_role('link',name='Explore Visualizations').click()
        self.page.wait_for_url('**/visualize.html')
    def test_home_preview_is_real_and_can_pause_and_replay(self):
        self.goto();self.assertEqual(self.page.locator('#homeLoss').inner_text(),'5.7600')
        self.page.locator('#homeRun').click();self.page.wait_for_timeout(450)
        self.assertGreater(int(self.page.locator('#homeStep').inner_text()),0)
        self.assertLess(float(self.page.locator('#homeLoss').inner_text()),5.76)
        self.page.locator('#homeRun').click();step=self.page.locator('#homeStep').inner_text();self.page.wait_for_timeout(250)
        self.assertEqual(self.page.locator('#homeStep').inner_text(),step)
    def test_gradient_math_reset_and_divergence(self):
        self.goto('/visualize.html')
        self.page.locator('#gradientStep').click()
        self.assertAlmostEqual(float(self.page.locator('#gradientX').inner_text()),2.28,places=4)
        self.assertAlmostEqual(float(self.page.locator('#gradientLoss').inner_text()),5.1984,places=4)
        self.page.locator('#gradientReset').click();self.assertEqual(self.page.locator('#gradientIteration').inner_text(),'0')
        self.page.locator('#learningRate').fill('1.2')
        self.page.locator('#gradientStep').click();self.page.locator('#gradientStep').click()
        self.assertIn('unstable',self.page.locator('#gradientStatus').inner_text())
        self.assertGreater(float(self.page.locator('#gradientLoss').inner_text()),25)
        self.page.locator('#gradientReset').click();self.assertEqual(self.page.locator('#learningRate').input_value(),'0.12')
    def test_kmeans_iterations_points_and_reset(self):
        self.goto('/visualize.html#clustering')
        self.assertTrue(self.page.locator('#panel-clustering').is_visible())
        self.page.locator('#clusterStep').click();previous=float(self.page.locator('#clusterLoss').inner_text())
        for _ in range(5):
            self.page.locator('#clusterStep').click();value=float(self.page.locator('#clusterLoss').inner_text());self.assertLessEqual(value,previous+.01);previous=value
        self.page.locator('#pointX').fill('40');self.page.locator('#pointY').fill('70');self.page.locator('#addPoint').click()
        self.assertEqual(self.page.locator('#clusterPoints').inner_text(),'37')
        self.assertEqual(self.page.locator('#clusterIteration').inner_text(),'0')
        self.page.locator('#pointX').fill('101');self.page.locator('#addPoint').click()
        self.assertIn('0 to 100',self.page.locator('#clusterStatus').inner_text())
        self.assertEqual(self.page.locator('#clusterPoints').inner_text(),'37')
        self.page.locator('#clusterReset').click();self.assertEqual(self.page.locator('#clusterPoints').inner_text(),'36')
    def test_network_architecture_parameter_counts_and_keyboard_selection(self):
        self.goto('/visualize.html#network')
        self.assertEqual(self.page.locator('#networkParameters').inner_text(),'46')
        self.page.locator('#hiddenLayers').fill('1')
        self.assertEqual(self.page.locator('#networkWeights').inner_text(),'20')
        self.assertEqual(self.page.locator('#networkBiases').inner_text(),'6')
        self.assertEqual(self.page.locator('#networkParameters').inner_text(),'26')
        first=self.page.locator('.network-node').first;first.focus();self.page.keyboard.press('Enter')
        self.assertIn('0 incoming, 4 outgoing',self.page.locator('#networkStatus').inner_text())
        self.assertEqual(self.page.locator('.network-edge.is-connected').count(),4)
        self.assertEqual(self.page.locator('.network-node[aria-pressed=true]').count(),1)
        self.page.locator('#networkReset').click();self.assertEqual(self.page.locator('#networkParameters').inner_text(),'46')
    def test_tabs_keyboard_and_runs_stop_on_navigation(self):
        self.goto('/visualize.html');self.page.locator('#gradientRun').click();self.page.wait_for_timeout(220)
        self.page.locator('#tab-gradient').focus();self.page.keyboard.press('ArrowRight')
        self.assertTrue(self.page.locator('#panel-clustering').is_visible())
        step=self.page.locator('#gradientIteration').inner_text();self.page.wait_for_timeout(350)
        self.assertEqual(self.page.locator('#gradientIteration').inner_text(),step)
        self.assertEqual(self.page.locator('#gradientRun').inner_text(),'Run')
        self.page.keyboard.press('End');self.assertTrue(self.page.locator('#panel-network').is_visible())
        self.page.keyboard.press('Home');self.assertTrue(self.page.locator('#panel-gradient').is_visible())
    def test_theme_persistence_storage_failure_and_mobile_menu(self):
        self.goto();self.assertEqual(self.page.locator('html').get_attribute('data-theme'),'dark')
        self.page.locator('.theme-toggle').click();self.goto('/about.html')
        self.assertEqual(self.page.locator('html').get_attribute('data-theme'),'light')
        self.page.set_viewport_size({'width':390,'height':844});button=self.page.locator('#hamburger');button.focus();self.page.keyboard.press('Enter')
        self.assertEqual(button.get_attribute('aria-expanded'),'true')
        self.page.keyboard.press('Tab');self.assertTrue(self.page.locator('#mobileMenu a').first.evaluate('(e)=>e===document.activeElement'))
        self.page.keyboard.press('Escape');self.assertTrue(button.evaluate('(e)=>e===document.activeElement'))
        button.click();self.page.locator('#mobileMenu a[href="/projects.html"]').click();self.page.wait_for_url('**/projects.html')
        self.assertTrue(self.page.locator('#mobileMenu').is_hidden())
        self.context.add_init_script('Object.defineProperty(window,"localStorage",{get(){throw new Error("Storage denied")}})')
        self.goto('/');self.page.locator('.theme-toggle').click()
        self.assertEqual(self.page.locator('html').get_attribute('data-theme'),'light')
    def test_responsive_layouts_and_seo(self):
        for width in [320,375,390,768,1024,1440,1920]:
            self.page.set_viewport_size({'width':width,'height':900})
            for path in PAGES:
                with self.subTest(width=width,path=path):
                    self.goto(path)
                    self.assertFalse(self.page.evaluate('document.documentElement.scrollWidth>innerWidth'))
                    self.assertTrue(self.page.locator('meta[name=description]').get_attribute('content'))
                    self.assertTrue(self.page.locator('link[rel=canonical]').get_attribute('href').startswith('https://yasirlab.in/'))
            for tab in ['clustering','network']:
                self.goto('/visualize.html#'+tab)
                self.assertFalse(self.page.evaluate('document.documentElement.scrollWidth>innerWidth'))
    def test_without_javascript_no_fake_contact_or_missing_core_content(self):
        context=self.browser.new_context(java_script_enabled=False);page=context.new_page()
        try:
            page.goto(self.base+'/projects.html');self.assertEqual(page.locator('h1').inner_text(),'Projects Coming Soon')
            page.goto(self.base+'/about.html');self.assertIn('Class 10',page.locator('body').inner_text())
            page.goto(self.base+'/contact.html');self.assertTrue(page.locator('#contactForm').is_hidden());self.assertTrue(page.get_by_role('link',name='codewithyazzy@gmail.com').is_visible())
            page.goto(self.base+'/visualize.html');self.assertIn('need JavaScript',page.locator('noscript').inner_text())
        finally:context.close()
    def test_reduced_motion_and_retired_gallery(self):
        self.goto('/projects.html');self.assertEqual(self.page.locator('.code-cursor').evaluate('(e)=>getComputedStyle(e).animationName'),'none')
        self.goto('/pages/all-projects.html');self.page.wait_for_url('**/projects.html')
    def audit_axe(self):
        self.assertTrue(AXE and Path(AXE).is_file(),'Set YASIRLAB_AXE_PATH; audit must not silently skip')
        self.page.add_script_tag(path=AXE)
        findings=self.page.evaluate("async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','best-practice']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))")
        self.assertEqual(findings,[])
    def test_axe_all_pages_and_experiment_tabs_both_themes(self):
        for width in [390,1440]:
            self.page.set_viewport_size({'width':width,'height':950})
            for theme in ['dark','light']:
                for path in PAGES+['/visualize.html#clustering','/visualize.html#network']:
                    with self.subTest(width=width,theme=theme,path=path):
                        self.goto(path);self.page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme);self.audit_axe()
    def mock_contact(self, response_status=200, response_body=None):
        for pattern in ["**/api/contact-config", "**/api/contact", "https://challenges.cloudflare.com/**"]:
            self.context.unroute(pattern)
        self.context.route('**/api/contact-config', lambda route: route.fulfill(json={'enabled': True, 'siteKey': 'test-public-key'}))
        self.context.route('https://challenges.cloudflare.com/**', lambda route: route.fulfill(content_type='application/javascript', body="window.turnstile={render:(el,o)=>{window.testChallenge=o;setTimeout(()=>o.callback('mock-token'),10);return 'mock-widget'},reset:()=>setTimeout(()=>window.testChallenge.callback('fresh-mock-token'),10)}"))
        self.submissions = []
        def submit(route):
            self.submissions.append(route.request.post_data_json)
            route.fulfill(status=response_status, json=response_body or {'ok':True})
        self.context.route('**/api/contact', submit)

    def fill_contact(self):
        for field,value in {'name':'A visitor','email':'visitor@example.com','subject':'A project question','message':'Please tell me more about the project learning goals.'}.items():
            self.page.locator('#'+field).fill(value)

    def test_contact_validation_submission_and_success_mocked(self):
        self.mock_contact()
        self.goto('/contact.html')
        self.page.locator('#contactForm button[type=submit]').click()
        self.assertEqual(self.page.locator('[aria-invalid="true"]').count(),4)
        self.audit_axe()
        self.assertTrue(self.page.locator('#name').evaluate('(e)=>e===document.activeElement'))
        self.fill_contact()
        self.page.locator('#contactForm button[type=submit]').click()
        self.page.locator('#contactSuccess').wait_for(state='visible')
        self.assertEqual(len(self.submissions),1)
        self.assertEqual(self.submissions[0]['email'],'visitor@example.com')
        self.assertTrue(self.submissions[0]['idempotencyKey'])
        self.assertEqual(self.page.locator('#message').input_value(),'')
        self.assertIn('accepted for delivery',self.page.locator('#formStatus').inner_text())
        self.audit_axe()
        self.page.locator('#contactAgain').click()
        self.assertTrue(self.page.locator('#name').is_visible())

    def test_contact_errors_preserve_input_and_retry_identity_mocked(self):
        for status in [400,403,409,429,503]:
            with self.subTest(status=status):
                self.mock_contact(status, {'ok':False})
                self.goto('/contact.html?case='+str(status));self.fill_contact()
                self.page.locator('#contactForm button[type=submit]').click()
                self.page.wait_for_function('document.querySelector("#contactForm").dataset.state === "error"')
                self.assertIn('learning goals',self.page.locator('#message').input_value())
                self.assertFalse(self.page.locator('#contactForm button[type=submit]').is_disabled())
                key=self.submissions[-1]['idempotencyKey']
                self.page.locator('#contactForm button[type=submit]').click()
                self.page.wait_for_function('document.querySelector("#contactForm").dataset.state === "error"')
                self.assertEqual(self.submissions[-1]['idempotencyKey'],key)
                self.assertFalse(self.page.locator('#contactSuccess').is_visible())

    def test_contact_disabled_without_server_configuration(self):
        self.context.route('**/api/contact-config',lambda route:route.fulfill(json={'enabled':False}))
        self.goto('/contact.html')
        self.assertTrue(self.page.locator('#contactForm').is_hidden())
        self.assertIn('not currently available',self.page.locator('#contactAvailability').inner_text())
        self.assertTrue(self.page.locator('.contact-email').is_visible())

    def test_contact_duplicate_clicks_send_once_mocked(self):
        self.mock_contact()
        self.goto('/contact.html');self.fill_contact()
        self.page.evaluate("document.querySelector('#contactForm').requestSubmit();document.querySelector('#contactForm').requestSubmit()")
        self.page.locator('#contactSuccess').wait_for(state='visible')
        self.assertEqual(len(self.submissions),1)

    def test_contact_loading_network_failure_and_safe_retry_mocked(self):
        self.mock_contact()
        self.context.unroute('**/api/contact')
        pending=[]
        self.context.route('**/api/contact',lambda route:pending.append(route))
        self.goto('/contact.html');self.fill_contact()
        self.page.locator('#contactForm button[type=submit]').click()
        self.page.wait_for_timeout(100)
        self.assertEqual(len(pending),1)
        self.assertEqual(self.page.locator('#contactForm').get_attribute('aria-busy'),'true')
        self.assertTrue(self.page.locator('#contactForm button[type=submit]').is_disabled())
        first=pending[0].request.post_data_json
        pending[0].abort()
        self.page.wait_for_function('document.querySelector("#contactForm").dataset.state === "error"')
        self.assertIn('may have been accepted',self.page.locator('#formStatus').inner_text())
        self.assertIn('learning goals',self.page.locator('#message').input_value())
        self.page.locator('#contactForm button[type=submit]').click()
        self.page.wait_for_timeout(100)
        self.assertEqual(len(pending),2)
        self.assertEqual(pending[1].request.post_data_json['idempotencyKey'],first['idempotencyKey'])
        pending[1].fulfill(json={'ok':True})
        self.page.locator('#contactSuccess').wait_for(state='visible')


if __name__=='__main__':unittest.main()
