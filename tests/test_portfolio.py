"""Browser regressions for the five-page portfolio and visualization lab.

Run with Playwright Python and an axe-core bundle:

    PORTFOLIO_AXE_PATH=/path/to/axe.min.js \
      python -m unittest discover -s tests -v

The suite starts its own loopback-only static server and blocks external
requests. It never contacts a deployment.
"""
import functools
import http.server
import os
from pathlib import Path
import re
import shutil
import threading
import unittest
import xml.etree.ElementTree as ET

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
AXE = os.environ.get("PORTFOLIO_AXE_PATH") or os.environ.get("YASIRLAB_AXE_PATH")
EMAIL = "codewithyazzy@gmail.com"
GITHUB = "https://github.com/CodeWithYazzy"
X_PROFILE = "https://x.com/codewithyazzy"
NAV = ["Home", "About", "Projects", "Visualize", "Contact"]
PAGES = [
    ("/", "Yasir Javed Khan", "Home", "https://yasirlab.in/"),
    ("/about.html", "Yasir Javed Khan", "About", "https://yasirlab.in/about"),
    (
        "/projects.html",
        "Projects coming soon.",
        "Projects",
        "https://yasirlab.in/projects",
    ),
    ("/visualize.html", "Visualize", "Visualize", "https://yasirlab.in/visualize"),
    ("/contact.html", "Let’s talk.", "Contact", "https://yasirlab.in/contact"),
]
OLD_PROJECT_NAMES = [
    "Iris Flower Classifier",
    "Calculator App",
    "House Price Predictor",
    "Heart Disease Predictor",
    "Sales Data Dashboard",
    "Sentiment Analysis",
    "Stock Predictor",
    "PyTorch Chatbot",
    "Digit Classifier",
    "Customer Segmentation",
    "NumPy Explorer",
    "Matplotlib Visualizer",
    "AI Assistant",
    "Portfolio Website",
    "PyTorch Classifier",
]


def browser_executable():
    configured = os.environ.get("CHROMIUM_PATH")
    if configured:
        return configured
    candidates = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        "/usr/bin/chromium",
        "/usr/bin/chromium-browser",
        "/usr/bin/google-chrome",
    ]
    for candidate in candidates:
        if Path(candidate).is_file():
            return candidate
    return shutil.which("chromium") or shutil.which("google-chrome")


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


class PortfolioTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = http.server.ThreadingHTTPServer(
            ("127.0.0.1", 0),
            functools.partial(QuietHandler, directory=str(ROOT)),
        )
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = f"http://127.0.0.1:{cls.server.server_port}"
        cls.playwright = sync_playwright().start()
        launch_options = {"headless": True, "args": ["--no-sandbox"]}
        executable = browser_executable()
        if executable:
            launch_options["executable_path"] = executable
        cls.browser = cls.playwright.chromium.launch(**launch_options)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()
        cls.server.shutdown()
        cls.server.server_close()

    def setUp(self):
        self.context = self.browser.new_context(
            viewport={"width": 1440, "height": 1000},
            color_scheme="light",
            reduced_motion="reduce",
        )
        self.page = self.context.new_page()
        self.errors = []
        self.page.on("pageerror", lambda error: self.errors.append(str(error)))
        self.context.route("https://**/*", lambda route: route.abort())

    def tearDown(self):
        self.context.close()
        self.assertEqual(self.errors, [], "Unexpected JavaScript errors")

    def goto(self, path="/"):
        response = self.page.goto(self.base + path)
        self.assertEqual(response.status, 200)
        self.page.wait_for_load_state("networkidle")

    def set_range(self, field_id, value):
        self.page.locator("#" + field_id).evaluate(
            """(el, value) => {
                el.value = value;
                el.dispatchEvent(new Event('input', { bubbles: true }));
            }""",
            str(value),
        )

    def test_each_page_has_exactly_five_navigation_items(self):
        for path, heading, active, _ in PAGES:
            with self.subTest(path=path):
                self.goto(path)
                desktop = [
                    text.strip()
                    for text in self.page.locator(".desktop-nav a").all_inner_texts()
                ]
                mobile = [
                    text.strip()
                    for text in self.page.locator("#mobileMenu a").all_inner_texts()
                ]
                self.assertEqual(desktop, NAV)
                self.assertEqual(mobile, NAV)
                self.assertEqual(self.page.locator("h1").count(), 1)
                self.assertIn(heading, self.page.locator("h1").inner_text())
                self.assertEqual(
                    self.page.locator(
                        f'.desktop-nav a[aria-current="page"]'
                    ).inner_text(),
                    active,
                )
                self.assertEqual(
                    self.page.locator(
                        f'#mobileMenu a[aria-current="page"]'
                    ).inner_text(),
                    active,
                )
                self.assertEqual(
                    self.page.locator('a[aria-current="page"]').count(),
                    2,
                )

    def test_home_has_hero_network_and_visualization_preview(self):
        self.goto("/")
        self.assertEqual(
            self.page.locator("h1").inner_text(), "Yasir Javed Khan"
        )
        self.assertEqual(
            self.page.locator(".button.primary").first.get_attribute("href"),
            "visualize.html",
        )
        self.assertEqual(
            self.page.locator(".button.secondary").first.get_attribute("href"),
            "about.html",
        )
        body = self.page.locator("body").inner_text().lower()
        self.assertNotIn("iris", body)
        self.assertNotIn("selected work", body)
        self.assertEqual(self.page.locator(".preview-card").count(), 3)
        anchors = self.page.locator(".preview-card").evaluate_all(
            "cards => cards.map(card => card.getAttribute('href'))"
        )
        self.assertEqual(
            anchors,
            [
                "visualize.html#neural-network",
                "visualize.html#gradient-descent",
                "visualize.html#k-means",
            ],
        )
        self.page.wait_for_timeout(150)
        painted = self.page.locator("#heroNetwork").evaluate(
            """canvas => {
                const data = canvas.getContext('2d').getImageData(
                    0, 0, canvas.width, canvas.height
                ).data;
                let count = 0;
                for (let i = 3; i < data.length; i += 4) {
                    if (data[i] > 0) count += 1;
                }
                return count;
            }"""
        )
        self.assertGreater(painted, 1000, "The hero network should be painted")

    def test_projects_page_is_coming_soon_without_invented_work(self):
        self.goto("/projects.html")
        body = self.page.locator("body").inner_text()
        self.assertIn("Projects coming soon", body)
        self.assertIn("I haven’t published any projects yet", body)
        self.assertEqual(self.page.locator("article").count(), 0)
        self.assertEqual(self.page.locator(".project-card").count(), 0)
        for name in OLD_PROJECT_NAMES:
            self.assertNotIn(name, body)
        self.assertNotIn("Iris", body)
        self.assertEqual(
            self.page.locator("main .button.primary").get_attribute("href"),
            "visualize.html",
        )

    def test_about_uses_only_verified_personal_details(self):
        self.goto("/about.html")
        body = self.page.locator("main").inner_text()
        self.assertIn("Yasir Javed Khan", body)
        self.assertIn("Mumbai", body)
        self.assertIn("AI, data science, and machine learning", body)
        portrait = self.page.locator('img[src="assets/portrait.webp"]')
        self.assertTrue(portrait.is_visible())
        self.assertIn("Portrait of Yasir Javed Khan", portrait.get_attribute("alt"))
        for unverified in [
            "student",
            "education",
            "work experience",
            "skills",
            "award",
            "achievement",
        ]:
            self.assertNotIn(unverified, body.lower())
        main = self.page.locator("main")
        self.assertEqual(
            main.locator(f'a[href="{GITHUB}"][target="_blank"]').count(),
            1,
        )
        self.assertEqual(
            main.locator(f'a[href="{X_PROFILE}"][target="_blank"]').count(),
            1,
        )

    def test_contact_has_confirmed_links_and_copy_feedback(self):
        self.context.grant_permissions(
            ["clipboard-read", "clipboard-write"], origin=self.base
        )
        self.goto("/contact.html")
        self.assertEqual(
            self.page.locator(".email-link").inner_text().strip(), EMAIL
        )
        self.assertEqual(
            self.page.locator(".email-link").get_attribute("href"),
            f"mailto:{EMAIL}",
        )
        self.assertEqual(
            self.page.locator(f'a[href="{GITHUB}"]').count(), 2
        )
        self.assertEqual(
            self.page.locator(f'a[href="{X_PROFILE}"]').count(), 2
        )
        self.page.locator("#copyEmail").click()
        self.page.wait_for_function(
            "document.querySelector('#toast').textContent.includes('copied')"
        )
        self.assertEqual(
            self.page.evaluate("navigator.clipboard.readText()"), EMAIL
        )

    def test_neural_network_trains_resets_and_steps(self):
        self.goto("/visualize.html")
        self.page.wait_for_function(
            "document.querySelector('#nnStatus').dataset.epoch === '0'"
        )
        initial = float(
            self.page.locator("#nnStatus").get_attribute("data-accuracy")
        )
        self.assertLess(initial, 0.8)
        self.page.locator("#nnRun").click()
        self.assertEqual(self.page.locator("#nnRun").inner_text().strip(), "Pause")
        self.page.wait_for_function(
            """() => {
                const status = document.querySelector('#nnStatus');
                return Number(status.dataset.epoch) > 100
                    && Number(status.dataset.accuracy) > 0.8;
            }""",
            timeout=20000,
        )
        self.page.locator("#nnRun").click()
        self.assertEqual(self.page.locator("#nnRun").inner_text().strip(), "Train")
        self.page.locator("#nnReset").click()
        self.assertEqual(
            self.page.locator("#nnStatus").get_attribute("data-epoch"), "0"
        )
        self.page.locator("#nnStep").click()
        self.assertEqual(
            self.page.locator("#nnStatus").get_attribute("data-epoch"), "10"
        )
        self.set_range("nnUnits", 3)
        self.assertEqual(
            self.page.locator("#nnStatus").get_attribute("data-epoch"), "0"
        )
        self.assertEqual(
            self.page.locator("#nnUnitsValue").inner_text(), "3"
        )

    def test_gradient_descent_steps_and_converges(self):
        self.goto("/visualize.html")
        self.page.wait_for_function(
            "document.querySelector('#gdStatus').dataset.x === '-2.0000'"
        )
        start_loss = float(self.page.locator("#gdStatus").get_attribute("data-loss"))
        for _ in range(3):
            self.page.locator("#gdStep").click()
        x_after = float(self.page.locator("#gdStatus").get_attribute("data-x"))
        loss_after = float(self.page.locator("#gdStatus").get_attribute("data-loss"))
        self.assertGreater(x_after, -1.5)
        self.assertLess(loss_after, start_loss)
        self.page.locator("#gdReset").click()
        self.assertAlmostEqual(
            float(self.page.locator("#gdStatus").get_attribute("data-x")), -2.0
        )
        self.set_range("gdLr", 0.4)
        self.page.locator("#gdRun").click()
        self.page.wait_for_function(
            "document.querySelector('#gdStatus').dataset.state.includes('Converged')",
            timeout=8000,
        )
        self.assertAlmostEqual(
            float(self.page.locator("#gdStatus").get_attribute("data-x")),
            1.4,
            places=1,
        )
        self.page.locator("#gdReset").click()
        self.page.select_option("#gdFunction", "double")
        self.assertEqual(
            self.page.locator("#gdStatus").get_attribute("data-function"), "double"
        )
        self.assertIn(
            "double well",
            self.page.locator("#gdCanvas").get_attribute("aria-label").lower(),
        )
        self.set_range("gdStart", 0)
        self.page.locator("#gdStep").click()
        self.assertIn(
            "local maximum",
            self.page.locator("#gdStatus").get_attribute("data-state").lower(),
        )

    def test_kmeans_converges_resets_and_changes_k(self):
        self.goto("/visualize.html")
        self.page.wait_for_function(
            "document.querySelector('#kmStatus').dataset.iteration === '0'"
        )
        self.assertEqual(
            self.page.locator("#kmLegend .legend-item").count(), 3
        )
        self.page.locator("#kmRun").click()
        self.page.wait_for_function(
            "document.querySelector('#kmStatus').dataset.state === 'converged'",
            timeout=6000,
        )
        self.assertGreaterEqual(
            int(self.page.locator("#kmStatus").get_attribute("data-iteration")), 1
        )
        self.assertGreater(
            float(self.page.locator("#kmStatus").get_attribute("data-inertia")), 0
        )
        labels = self.page.locator("#kmLegend .legend-item").all_inner_texts()
        self.assertEqual(len(labels), 3)
        for label in labels:
            self.assertRegex(label.strip(), r"^Cluster \d: \d+$")
        self.page.locator("#kmReset").click()
        self.assertEqual(
            self.page.locator("#kmStatus").get_attribute("data-iteration"), "0"
        )
        self.assertTrue(self.page.locator("#kmRun").is_enabled())
        self.set_range("kmK", 4)
        self.assertEqual(
            self.page.locator("#kmStatus").get_attribute("data-clusters"), "4"
        )
        self.assertEqual(
            self.page.locator("#kmLegend .legend-item").count(), 4
        )
        self.assertEqual(
            self.page.locator("#kmStatus").get_attribute("data-iteration"), "0"
        )

    def test_theme_choice_persists_across_pages(self):
        self.goto("/")
        self.assertEqual(
            self.page.evaluate("document.documentElement.dataset.theme"), "light"
        )
        self.page.locator(".theme-toggle").click()
        self.assertEqual(
            self.page.evaluate("document.documentElement.dataset.theme"), "dark"
        )
        self.assertEqual(
            self.page.evaluate("localStorage.getItem('theme')"), "dark"
        )
        self.assertEqual(
            self.page.locator('meta[name="theme-color"]').get_attribute("content"),
            "#000000",
        )
        self.goto("/about.html")
        self.assertEqual(
            self.page.evaluate("document.documentElement.dataset.theme"), "dark"
        )
        self.page.locator(".theme-toggle").click()
        self.goto("/contact.html")
        self.assertEqual(
            self.page.evaluate("document.documentElement.dataset.theme"), "light"
        )

    def test_mobile_menu_has_five_items_and_escape_closes_it(self):
        self.page.set_viewport_size({"width": 390, "height": 844})
        self.goto("/")
        self.assertFalse(self.page.locator(".desktop-nav").is_visible())
        self.assertTrue(self.page.locator("#hamburger").is_visible())
        self.page.locator("#hamburger").click()
        self.assertTrue(self.page.locator("#mobileMenu").is_visible())
        self.assertEqual(
            [
                text.strip()
                for text in self.page.locator("#mobileMenu a").all_inner_texts()
            ],
            NAV,
        )
        self.assertEqual(
            self.page.locator('#mobileMenu a[aria-current="page"]').inner_text(),
            "Home",
        )
        self.assertEqual(
            self.page.locator("#hamburger").get_attribute("aria-expanded"), "true"
        )
        self.page.keyboard.press("Escape")
        self.assertFalse(self.page.locator("#mobileMenu").is_visible())
        self.assertEqual(
            self.page.evaluate("document.activeElement.id"), "hamburger"
        )
        self.assertFalse(
            self.page.evaluate(
                "document.documentElement.scrollWidth > document.documentElement.clientWidth"
            )
        )

    def test_responsive_layouts_do_not_overflow(self):
        pages = PAGES + [("/404.html", "Page not found.", None, None)]
        for width in (320, 390, 768, 1440):
            self.page.set_viewport_size({"width": width, "height": 900})
            for path, heading, _, _ in pages:
                with self.subTest(width=width, path=path):
                    self.goto(path)
                    self.assertEqual(self.page.locator("h1").count(), 1)
                    self.assertIn(heading, self.page.locator("h1").inner_text())
                    overflow = self.page.evaluate(
                        "document.documentElement.scrollWidth > document.documentElement.clientWidth + 1"
                    )
                    self.assertFalse(overflow)

    def test_metadata_sitemap_and_internal_links(self):
        for path, _, _, canonical in PAGES:
            with self.subTest(path=path):
                self.goto(path)
                self.assertEqual(
                    self.page.locator('link[rel="canonical"]').get_attribute("href"),
                    canonical,
                )
                self.assertTrue(
                    self.page.locator('meta[name="description"]')
                    .get_attribute("content")
                    .strip()
                )
                self.assertEqual(
                    self.page.locator('meta[property="og:image"]').get_attribute(
                        "content"
                    ),
                    "https://yasirlab.in/assets/social-card.png",
                )
                hrefs = self.page.locator("a[href]").evaluate_all(
                    "links => links.map(link => link.getAttribute('href'))"
                )
                for href in hrefs:
                    self.assertNotIn("pages/", href)
                    if href.startswith(("http", "mailto:", "#")):
                        continue
                    target = href.split("#", 1)[0].split("?", 1)[0]
                    if target:
                        self.assertTrue(
                            (ROOT / target).is_file(),
                            f"Missing local link target: {target}",
                        )
        sitemap = ET.parse(ROOT / "sitemap.xml")
        namespace = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        locations = {
            node.text.strip()
            for node in sitemap.findall(".//s:loc", namespace)
        }
        self.assertEqual(
            locations,
            {
                "https://yasirlab.in/",
                "https://yasirlab.in/about",
                "https://yasirlab.in/projects",
                "https://yasirlab.in/visualize",
                "https://yasirlab.in/contact",
            },
        )
        robots = (ROOT / "robots.txt").read_text(encoding="utf-8")
        self.assertIn("Sitemap: https://yasirlab.in/sitemap.xml", robots)

    def test_core_content_without_javascript(self):
        context = self.browser.new_context(
            java_script_enabled=False,
            viewport={"width": 1440, "height": 1000},
        )
        page = context.new_page()
        try:
            page.goto(self.base + "/")
            self.assertTrue(
                page.get_by_role(
                    "heading", name="Yasir Javed Khan", exact=True
                ).is_visible()
            )
            self.assertTrue(
                page.get_by_role(
                    "link", name="Explore Visualizations", exact=True
                ).is_visible()
            )
            page.goto(self.base + "/visualize.html")
            self.assertTrue(
                page.get_by_role("heading", name="Visualize", exact=True).is_visible()
            )
            self.assertTrue(page.locator(".noscript-note").is_visible())
            page.goto(self.base + "/contact.html")
            self.assertTrue(
                page.locator(".email-link").get_attribute("href").startswith("mailto:")
            )
        finally:
            context.close()

    @unittest.skipUnless(AXE and Path(AXE).is_file(), "axe-core bundle not configured")
    def test_accessibility_audits_light_dark_and_mobile(self):
        def audit():
            self.page.add_script_tag(path=AXE)
            violations = self.page.evaluate(
                """async () => {
                    const result = await axe.run(document, {
                        runOnly: {
                            type: 'tag',
                            values: [
                                'wcag2a',
                                'wcag2aa',
                                'wcag21a',
                                'wcag21aa',
                                'best-practice'
                            ]
                        },
                        resultTypes: ['violations']
                    });
                    return result.violations.map(violation => ({
                        id: violation.id,
                        impact: violation.impact,
                        help: violation.help,
                        nodes: violation.nodes.map(node => ({
                            target: node.target,
                            summary: node.failureSummary
                        }))
                    }));
                }"""
            )
            self.assertEqual(violations, [], f"Axe violations on {self.page.url}")

        for path, _, _, _ in PAGES:
            with self.subTest(path=path, theme="light", width="desktop"):
                self.goto(path)
                audit()
            with self.subTest(path=path, theme="dark", width="desktop"):
                self.page.locator(".theme-toggle").click()
                audit()
            with self.subTest(path=path, theme="dark", width="mobile"):
                self.page.set_viewport_size({"width": 390, "height": 844})
                audit()

        self.page.set_viewport_size({"width": 390, "height": 844})
        self.goto("/")
        self.page.locator("#hamburger").click()
        audit()

    def test_no_old_demo_catalog_or_project_copy_survives(self):
        for path, _, _, _ in PAGES:
            with self.subTest(path=path):
                self.goto(path)
                body = self.page.locator("body").inner_text()
                self.assertNotIn("Iris", body)
                self.assertNotIn("Selected work", body)
                self.assertNotIn("All 15 projects", body)
                for name in OLD_PROJECT_NAMES:
                    self.assertNotIn(name, body)
                hrefs = " ".join(
                    self.page.locator("a[href]").evaluate_all(
                        "links => links.map(link => link.getAttribute('href'))"
                    )
                )
                self.assertNotIn("demo.html", hrefs)
                self.assertNotIn("all-projects", hrefs)
                self.assertNotIn("projects.json", hrefs)


if __name__ == "__main__":
    unittest.main()
