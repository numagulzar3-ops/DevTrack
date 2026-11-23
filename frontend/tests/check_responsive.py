"""Exercise the built DevTrack UI without creating a production account."""

import os
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import expect, sync_playwright

DIST = Path(__file__).resolve().parents[1] / "dist"
ORIGIN = "https://devtrack.test/"
WIDTHS = (320, 360, 390, 430, 500, 760, 761, 900, 901, 1280)
LONG_PROJECT = "Mobile layout regression " + "ProjectWithoutSpaces" * 6
LONG_TASK = "Verify task wrapping " + "TaskWithoutSpaces" * 10


def check_viewport(playwright, width):
    executable = os.getenv("DEVTRACK_CHROMIUM_EXECUTABLE")
    options = {"executable_path": executable, "args": ["--single-process"]} if executable else {}
    with playwright.chromium.launch(**options) as browser:
        page = browser.new_page(
            viewport={"width": width, "height": 820},
            is_mobile=width <= 760,
            has_touch=width <= 760,
        )
        page_errors = []
        page.on("pageerror", lambda error: page_errors.append(str(error)))

        def serve(route):
            path = urlparse(route.request.url).path.lstrip("/") or "index.html"
            route.fulfill(path=DIST / path)

        def fits(label):
            scroll, viewport = page.evaluate(
                "[document.documentElement.scrollWidth, document.documentElement.clientWidth]"
            )
            assert scroll <= viewport + 1, (width, label, scroll, viewport)

        def navigate(label):
            if width <= 760:
                page.get_by_label("Workspace page").select_option(label)
            else:
                sidebar_label = "Kanban Board" if label == "Task Board" else label
                page.locator(".sidebar").get_by_role("button", name=sidebar_label).click()

        page.route(f"{ORIGIN}**", serve)
        page.goto(ORIGIN)
        demo = page.get_by_role("button", name="Try the demo workspace")
        expect(demo).to_be_visible()
        fits("sign-in")
        demo.click()
        expect(page.get_by_role("heading", name="Workspace overview")).to_be_visible()
        fits("overview")

        search = page.get_by_role("searchbox")
        search.fill("team handbook")
        page.locator(".workspace-search-results").get_by_role(
            "button", name="Launch a team handbook Project", exact=True
        ).click()
        title = page.locator(".detail-title h2")
        expect(title).to_have_text("Launch a team handbook")
        box = title.bounding_box()
        assert box["width"] >= 150, (width, box)
        if width <= 900:
            actions = page.locator(".project-detail-actions").bounding_box()
            assert actions["y"] >= box["y"] + box["height"], (width, box, actions)
        fits("project details")

        navigate("Overview")
        page.get_by_role("button", name="New project").click()
        page.get_by_label("Project name").fill(LONG_PROJECT)
        page.get_by_label("Description").fill("DescriptionWithoutSpaces" * 10)
        page.get_by_role("button", name="Create project", exact=True).click()
        expect(page.get_by_role("button", name=LONG_PROJECT)).to_be_visible()
        fits("overview with a long project name")
        page.get_by_role("button", name=LONG_PROJECT).click()
        expect(page.get_by_role("heading", name=LONG_PROJECT)).to_be_visible()
        expect(page.get_by_text("No tasks yet", exact=False)).to_be_visible()
        fits("long project title, description, and breadcrumb")

        page.get_by_role("button", name="Add task").click()
        dialog = page.get_by_role("dialog")
        expect(dialog).to_be_visible()
        dialog.get_by_label("Task title").fill(LONG_TASK)
        today = page.evaluate(
            """() => {
              const now = new Date();
              return [now.getFullYear(), now.getMonth() + 1, now.getDate()]
                .map((value, index) => index ? String(value).padStart(2, "0") : value).join("-");
            }"""
        )
        dialog.get_by_label("Due date").fill(today)
        fits("create task panel")
        dialog.get_by_role("button", name="Create task").click()
        expect(dialog).to_have_count(0)
        expect(page.locator(".deadline-task").get_by_text(LONG_TASK)).to_be_visible()
        fits("long task names in tasks, deadlines, and activity")

        page.get_by_role("button", name="Open project board").click()
        page.get_by_role("button", name=LONG_TASK).click()
        expect(dialog).to_be_visible()
        dialog.get_by_label("Status").select_option("in_progress")
        dialog.get_by_role("button", name="Save task").click()
        expect(dialog).to_have_count(0)
        fits("project board after task edit")

        for label in ("My Projects", "My Tasks", "Calendar", "Team Members", "Activity", "Settings"):
            navigate(label)
            if label == "Calendar":
                page.locator(".calendar-event").get_by_text(LONG_TASK, exact=True).click()
                expect(dialog).to_be_visible()
                dialog.get_by_role("button", name="Close task panel").click()
            fits(label)

        search.fill("missing project or task")
        expect(page.get_by_text("No matching projects or tasks.")).to_be_visible()
        fits("empty search results")
        assert not page_errors, page_errors
        print(f"{width}px responsive flows passed", flush=True)


if __name__ == "__main__":
    with sync_playwright() as playwright:
        for width in WIDTHS:
            check_viewport(playwright, width)
