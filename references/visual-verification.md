# Visual Verification for Web/Frontend Changes

## When to verify
Any change the user would see in a browser:
- HTML, CSS, JSX, TSX, Vue, Svelte file edits
- Component styling, layout, or content changes
- Adding/removing UI elements

## Steps
1. Launch the dev server (use `webapp-testing` skill's `with_server.py` or the project's dev command)
2. Write a Playwright script (see template below)
3. Run locally (Playwright needs local browser)
4. Read the screenshot using the Read tool to visually confirm
5. If it didn't render correctly: fix and re-verify. Do NOT claim it's done

## Playwright verify script template
```python
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 720})
    page.goto("http://localhost:PORT")  # adjust port
    page.wait_for_load_state("networkidle")
    page.screenshot(path="/tmp/verify-change.png", full_page=True)
    # Check specific elements exist:
    # assert page.locator("text=Expected Text").is_visible()
    browser.close()
```
