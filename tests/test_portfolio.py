"""Browser regressions for the portfolio.

Run with Playwright Python and a local axe-core bundle:

    PORTFOLIO_AXE_PATH=/path/to/axe.min.js \
      python -m unittest discover -s tests -v

The suite starts its own loopback-only static server. It never contacts
GitHub or a deployment; external requests are blocked except for the
explicit fixtures used by the preview-runner test.
"""
import functools
import http.server
import json
import os
from pathlib import Path
import shutil
import threading
import unittest

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
AXE = os.environ.get("PORTFOLIO_AXE_PATH") or os.environ.get("YASIRLAB_AXE_PATH")


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
            reduced_motion="reduce",
        )
        self.page = self.context.new_page()
        self.errors = []
        self.page.on("pageerror", lambda error: self.errors.append(str(error)))
        # Exercise the bundled site, never a remote repository or deployment.
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

    def test_without_javascript_keeps_core_content_and_email_available(self):
        context = self.browser.new_context(java_script_enabled=False)
        page = context.new_page()
        try:
            page.goto(self.base)
            self.assertTrue(
                page.get_by_role("heading", name="Yasir Javed Khan", exact=True).is_visible()
            )
            self.assertTrue(page.locator("#about").is_visible())
            self.assertTrue(page.locator("#work").is_visible())
            self.assertTrue(
                page.locator("a.contact-email").get_attribute("href").startswith("mailto:")
            )
            self.assertEqual(page.locator(".work-row").count(), 4)
            self.assertTrue(page.locator("a[href='pages/all-projects.html']").first.is_visible())
            self.assertEqual(page.locator("#projectModal").count(), 0)
        finally:
            context.close()

    def test_homepage_structure_and_selected_work(self):
        self.goto()
        self.assertEqual(self.page.locator("h1").count(), 1)
        self.assertEqual(
            self.page.locator("h1").inner_text(), "Yasir Javed Khan"
        )
        for section in ["#work", "#about", "#contact"]:
            self.assertTrue(self.page.locator(section).is_visible())
        self.assertEqual(self.page.locator(".work-row").count(), 4)
        self.assertEqual(
            self.page.locator(".work-title").first.inner_text(),
            "Iris Flower Classifier",
        )
        demo_link = self.page.locator(".work-row").first.get_attribute("href")
        self.assertIn("pages/demo.html?project=Iris%20Flower%20Classifier", demo_link)
        self.assertIn("All 15 projects", self.page.locator("#work").inner_text())
        self.assertIsNone(
            self.page.locator("script[type='application/ld+json']").evaluate(
                "el => JSON.parse(el.textContent).jobTitle || null"
            )
        )

    def test_gallery_filters_search_empty_and_reset(self):
        self.goto("/pages/all-projects.html")
        self.assertEqual(self.page.locator(".project-card").count(), 15)
        self.assertEqual(
            self.page.locator("#projectCount").inner_text().strip(), "15 projects"
        )
        self.page.locator('[data-filter="Web"]').click()
        self.assertEqual(self.page.locator(".project-card").count(), 2)
        self.assertIn(
            "2 projects", self.page.locator("#projectCount").inner_text()
        )
        self.page.locator("#projectSearch").fill("calculator")
        self.assertEqual(self.page.locator(".project-card").count(), 1)
        self.page.locator("#projectSearch").fill("no-such-project")
        self.assertTrue(self.page.locator("#projectEmpty").is_visible())
        self.assertEqual(self.page.locator(".project-card").count(), 0)
        self.page.locator("#resetFilters").click()
        self.assertEqual(self.page.locator(".project-card").count(), 15)
        self.assertEqual(
            self.page.locator('[data-filter="All"]').get_attribute("aria-pressed"),
            "true",
        )
        self.assertEqual(self.page.locator("#projectSearch").input_value(), "")
        self.assertTrue(
            self.page.locator("#projectSearch").evaluate(
                "(el) => el === document.activeElement"
            )
        )

    def test_archive_cards_expose_status_category_copy_and_links(self):
        self.goto("/pages/all-projects.html")
        cards = self.page.locator(".project-card")
        self.assertEqual(cards.count(), 15)
        for index in range(cards.count()):
            card = cards.nth(index)
            self.assertTrue(card.locator(".project-status").inner_text().strip())
            self.assertTrue(card.locator(".project-category").inner_text().strip())
            self.assertTrue(card.locator(".project-title").inner_text().strip())
            self.assertTrue(card.locator(".project-desc").inner_text().strip())
            self.assertTrue(card.locator(".project-tech").inner_text().strip())
            actions = card.locator(".project-actions a")
            self.assertGreaterEqual(actions.count(), 1)
            for action_index in range(actions.count()):
                self.assertTrue(actions.nth(action_index).get_attribute("href"))
        self.assertEqual(self.page.get_by_text("Try the demo").count(), 2)
        self.assertEqual(self.page.get_by_text("Visit the site").count(), 1)
        target = self.page.locator("#projectSearch")
        self.assertTrue(target.is_visible())

    def test_hero_iris_demo_predicts_all_three_species(self):
        self.goto()
        species = self.page.locator("#demoSpecies")
        self.assertEqual(species.inner_text(), "Setosa")
        self.assertEqual(self.page.locator("#demoSlOut").inner_text(), "5.1 cm")

        for values, expected in [
            (["6.0", "2.2", "4.0", "1.0"], "Versicolor"),
            (["6.3", "3.3", "6.0", "2.5"], "Virginica"),
        ]:
            for field_id, value in zip(
                ["demoSl", "demoSw", "demoPl", "demoPw"], values
            ):
                self.set_range(field_id, value)
            self.assertEqual(species.inner_text(), expected)
            self.assertIn(expected, self.page.locator("#demoAnnounce").inner_text())

        self.set_range("demoPl", "6.0")
        self.assertEqual(species.inner_text(), "Virginica")
        self.assertIn(
            "is-winner",
            self.page.locator("#demoBarVirginica").get_attribute("class"),
        )
        percentages = [
            int(self.page.locator("#" + element).inner_text().rstrip("%"))
            for element in ["demoPctSetosa", "demoPctVersicolor", "demoPctVirginica"]
        ]
        self.assertAlmostEqual(sum(percentages), 100, delta=2)

    def test_themes_system_changes_persistence_and_cross_tab_sync(self):
        self.page.emulate_media(color_scheme="dark")
        self.goto()
        self.assertEqual(self.page.locator("html").get_attribute("data-theme"), "dark")
        self.assertIsNone(self.page.evaluate('localStorage.getItem("theme")'))
        self.page.emulate_media(color_scheme="light")
        self.page.wait_for_function(
            'document.documentElement.dataset.theme === "light"'
        )
        other = self.context.new_page()
        other.goto(self.base + "/pages/all-projects.html")
        self.page.locator(".theme-toggle").click()
        other.wait_for_function(
            'document.documentElement.dataset.theme === "dark"'
        )
        self.page.reload()
        self.assertEqual(self.page.locator("html").get_attribute("data-theme"), "dark")
        self.goto("/pages/demo.html?project=Calculator%20App")
        self.assertEqual(
            self.page.locator(".theme-toggle").get_attribute("aria-pressed"), "true"
        )
        self.page.locator(".theme-toggle").click()
        self.assertEqual(self.page.locator("html").get_attribute("data-theme"), "light")
        self.assertEqual(
            self.page.locator(".theme-toggle").get_attribute("aria-pressed"), "false"
        )

    def test_storage_denied_does_not_break_theme_or_site(self):
        self.context.add_init_script(
            'Object.defineProperty(window, "localStorage", { get() { throw new Error("Storage unavailable"); } })'
        )
        self.page.emulate_media(color_scheme="dark")
        self.goto()
        self.assertEqual(self.page.locator("html").get_attribute("data-theme"), "dark")
        self.page.locator(".theme-toggle").click()
        self.assertEqual(self.page.locator("html").get_attribute("data-theme"), "light")

    def test_mobile_menu_keyboard_anchor_and_resize(self):
        self.page.set_viewport_size({"width": 390, "height": 844})
        self.goto()
        button = self.page.locator("#hamburger")
        button.focus()
        self.page.keyboard.press("Enter")
        self.assertEqual(button.get_attribute("aria-expanded"), "true")
        self.page.keyboard.press("Tab")
        self.assertTrue(
            self.page.locator("#mobileMenu a")
            .first.evaluate("(el) => el === document.activeElement")
        )
        self.page.keyboard.press("Escape")
        self.assertTrue(button.evaluate("(el) => el === document.activeElement"))
        self.assertFalse(self.page.locator("#mobileMenu").is_visible())
        button.click()
        self.page.locator('#mobileMenu a[href="#work"]').click()
        self.assertFalse(self.page.locator("#mobileMenu").is_visible())
        self.assertTrue(self.page.url.endswith("#work"))
        self.assertEqual(self.page.evaluate("document.activeElement.id"), "work")
        button.click()
        self.page.set_viewport_size({"width": 1000, "height": 900})
        self.assertFalse(self.page.locator("#mobileMenu").is_visible())

    def test_copy_email_offers_feedback(self):
        self.goto("/#contact")
        self.page.locator("#copyEmail").click()
        toast = self.page.locator("#toast")
        self.assertTrue(toast.evaluate("(el) => el.classList.contains('show')"))
        self.assertIn("email", toast.inner_text().lower())

    def test_calculator_arithmetic_and_error_handling_offline(self):
        self.goto("/pages/demo.html?project=Calculator%20App")
        self.page.locator("#runDemo").click()
        self.page.locator("#calculatorDemo").wait_for(state="visible")
        self.assertTrue(self.page.locator("#pipeline").is_hidden())
        for key in ["2", "+", "3", "*", "4", "="]:
            self.page.locator(f'[data-calc="{key}"]').click()
        self.assertEqual(self.page.locator("#calculatorDisplay").input_value(), "14")
        self.page.locator('[data-calc="clear"]').click()
        for key in ["1", "/", "0", "="]:
            self.page.locator(f'[data-calc="{key}"]').click()
        self.assertIn("Cannot divide by zero", self.page.locator("#status").inner_text())
        self.assertEqual(self.page.evaluate('evaluateLocally("(2+3)^2")'), 25)
        self.assertEqual(
            self.page.evaluate(
                '(() => { try { evaluateLocally("alert(1)") } catch (e) { return e.message } })()'
            ),
            "Enter a valid expression.",
        )

    def test_iris_page_predicts_three_species_and_rejects_empty_input(self):
        self.goto("/pages/demo.html?project=Iris%20Flower%20Classifier")
        self.page.locator("#runDemo").click()
        self.page.locator("#irisDemo").wait_for(state="visible")
        self.assertTrue(self.page.locator("#pipeline").is_hidden())
        self.assertEqual(
            self.page.title(), "Iris Flower Classifier — Yasir Javed Khan"
        )
        self.assertIn("Setosa", self.page.locator("#irisResult").inner_text())
        for values, species in [
            ([6.0, 2.2, 4.0, 1.0], "Versicolor"),
            ([6.3, 3.3, 6.0, 2.5], "Virginica"),
        ]:
            for field, value in zip(["Sl", "Sw", "Pl", "Pw"], values):
                self.page.locator("#iris" + field).fill(str(value))
            self.assertIn(species, self.page.locator("#irisResult").inner_text())
        self.page.locator("#irisSl").fill("")
        self.assertIn(
            "four positive", self.page.locator("#irisResult").inner_text()
        )
        self.assertIn(
            "inference, not measured accuracy",
            self.page.locator("#irisDemo .demo-note").inner_text(),
        )

    def test_runner_static_sandbox_and_python_unavailable_fixture(self):
        # Explicit fixtures, not claims about live GitHub availability.
        self.goto("/pages/demo.html?project=Portfolio%20Website")
        detected = self.page.evaluate(
            'GithubDemoRunner.detectProjectType(["index.html", "tools/sync-catalog.py", "tests/test_portfolio.py"])'
        )
        self.assertEqual(
            detected["type"],
            "A",
            "Python test/tooling files must not turn a static website into a Python application",
        )
        detected = self.page.evaluate(
            'GithubDemoRunner.detectProjectType(["index.html", "requirements.txt", "app.py"])'
        )
        self.assertEqual(
            detected["type"],
            "E",
            "A real Python runtime manifest still requires Python",
        )
        self.context.unroute("https://**/*")
        self.context.route(
            "https://api.github.com/**",
            lambda route: route.fulfill(
                json={"tree": [{"path": "index.html", "type": "blob"}]}
            ),
        )
        self.context.route(
            "https://raw.githubusercontent.com/**",
            lambda route: route.fulfill(
                body='<h1>Fixture</h1><button onclick="this.textContent=\'It works\'">Run fixture</button>',
                content_type="text/html",
            ),
        )
        self.goto("/pages/demo.html?project=Portfolio%20Website")
        self.page.locator("#runDemo").click()
        frame = self.page.frame_locator("#demoFrame")
        frame.get_by_role("button", name="Run fixture").click()
        self.assertEqual(frame.get_by_role("button").inner_text(), "It works")
        self.assertNotIn(
            "allow-same-origin",
            self.page.locator("#demoFrame").get_attribute("sandbox"),
        )
        self.assertTrue(self.page.locator("#pipeline").is_hidden())
        self.context.route(
            "https://api.github.com/**",
            lambda route: route.fulfill(
                json={
                    "tree": [
                        {"path": "sales-dashboard/src/analysis.py", "type": "blob"}
                    ]
                }
            ),
        )
        self.goto("/pages/demo.html?project=Sales%20Data%20Dashboard")
        self.page.locator("#runDemo").click()
        self.page.locator("#errorPanel").wait_for(state="visible")
        self.assertIn("Python required", self.page.locator("#errorPanel").inner_text())
        self.assertTrue(self.page.locator("#pipeline").is_hidden())

    def test_bundled_catalog_fallback_when_json_unavailable(self):
        self.context.route("**/assets/projects.json", lambda route: route.abort())
        self.goto("/pages/all-projects.html")
        self.assertEqual(self.page.locator(".project-card").count(), 15)
        self.goto("/pages/demo.html?project=Calculator%20App")
        self.page.locator("#runDemo").click()
        self.page.locator("#calculatorDemo").wait_for(state="visible")

    def test_file_protocol_catalog_fallback(self):
        try:
            self.page.goto((ROOT / "pages/all-projects.html").as_uri())
        except Exception as error:
            if "ERR_BLOCKED_BY_ADMINISTRATOR" in str(error):
                self.skipTest(
                    "Managed Chromium policy prohibits file:// navigation; HTTP fallback is tested separately."
                )
            raise
        self.page.wait_for_function(
            'document.querySelectorAll(".project-card").length === 15'
        )
        self.page.goto((ROOT / "pages/demo.html").as_uri() + "?project=Calculator%20App")
        self.page.locator("#runDemo").click()
        self.page.locator("#calculatorDemo").wait_for(state="visible")

    def test_responsive_layouts_and_seo(self):
        for width in [320, 390, 768, 1440]:
            self.page.set_viewport_size({"width": width, "height": 900})
            for path in [
                "/",
                "/pages/all-projects.html",
                "/pages/demo.html?project=Iris%20Flower%20Classifier",
                "/404.html",
            ]:
                with self.subTest(width=width, path=path):
                    self.goto(path)
                    self.assertFalse(
                        self.page.evaluate(
                            "document.documentElement.scrollWidth > innerWidth"
                        ),
                        "Horizontal overflow",
                    )
                    self.assertEqual(self.page.locator("main").count(), 1)
                    self.assertEqual(self.page.locator("h1").count(), 1)
                    self.assertTrue(
                        self.page.locator("meta[name=description]").get_attribute(
                            "content"
                        )
                    )
                    self.assertTrue(
                        self.page.locator("link[rel=canonical]")
                        .get_attribute("href")
                        .startswith("https://yasirlab.in/")
                    )
        self.goto()
        schema = json.loads(
            self.page.locator('script[type="application/ld+json"]').inner_text()
        )
        self.assertEqual(schema["@type"], "Person")
        self.assertNotIn("jobTitle", schema)
        body = self.page.locator("body").inner_text().lower()
        for claim in ["years of experience", "award-winning", "certified"]:
            self.assertNotIn(claim, body)

    def test_axe_accessibility_pages_themes_and_demos(self):
        self.assertTrue(
            AXE and Path(AXE).is_file(),
            "Set PORTFOLIO_AXE_PATH to the axe-core bundle; the audit must not be silently skipped.",
        )
        paths = [
            "/",
            "/pages/all-projects.html",
            "/pages/demo.html?project=Iris%20Flower%20Classifier",
            "/404.html",
        ]
        for width in [390, 1440]:
            self.page.set_viewport_size({"width": width, "height": 900})
            for theme in ["light", "dark"]:
                for path in paths:
                    with self.subTest(width=width, theme=theme, path=path):
                        self.goto(path)
                        self.page.evaluate(
                            "(theme) => { document.documentElement.dataset.theme = theme }",
                            theme,
                        )
                        if "demo.html" in path:
                            self.page.locator("#runDemo").click()
                            self.page.locator("#irisDemo").wait_for(state="visible")
                        if path == "/" and width == 390:
                            self.page.locator("#hamburger").click()
                        self.audit_axe()
                self.goto()
                self.page.evaluate(
                    "(theme) => { document.documentElement.dataset.theme = theme }",
                    theme,
                )
                self.page.locator("#copyEmail").click()
                self.audit_axe()

    def audit_axe(self):
        self.page.add_script_tag(path=AXE)
        violations = self.page.evaluate(
            """async () => {
                const result = await axe.run(document, {
                    runOnly: {
                        type: 'tag',
                        values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice']
                    }
                });
                return result.violations.map((violation) => ({
                    id: violation.id,
                    impact: violation.impact,
                    nodes: violation.nodes.map((node) => node.target)
                }));
            }"""
        )
        self.assertEqual(violations, [])


if __name__ == "__main__":
    unittest.main()
