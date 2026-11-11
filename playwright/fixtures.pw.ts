import { readdirSync } from "node:fs"
import { join, posix } from "node:path"
import { expect, test } from "@playwright/test"

const REPO_ROOT = join(import.meta.dirname, "..")
const EXAMPLES_DIR = join(REPO_ROOT, "examples")

function discoverFixturePaths(dir: string, prefix = "examples"): string[] {
  const entries = readdirSync(dir, { withFileTypes: true })
  const results: string[] = []

  for (const entry of entries) {
    const relPath = posix.join(prefix, entry.name)
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...discoverFixturePaths(fullPath, relPath))
    } else if (entry.isFile() && entry.name.endsWith(".fixture.tsx")) {
      results.push(relPath)
    }
  }

  return results.sort()
}

function buildRendererUrl(fixturePath: string): string {
  const encodedId = encodeURIComponent(JSON.stringify({ path: fixturePath }))
  return `/renderer.html?fixtureId=${encodedId}&locked=true`
}

const fixturePaths = discoverFixturePaths(EXAMPLES_DIR)

test("discovers all cosmos stories and matches exported manifest", async ({
  request,
}) => {
  expect(fixturePaths.length).toBeGreaterThanOrEqual(36)

  const response = await request.get("/cosmos.fixtures.json")
  expect(response.ok()).toBe(true)

  const manifest = (await response.json()) as {
    fixtures: Array<{ filePath: string; rendererUrl: string }>
  }
  const manifestPaths = manifest.fixtures.map((f) => f.filePath).sort()
  expect(manifestPaths).toEqual(fixturePaths)
})

test("cosmos playground shell loads and renders selected story", async ({
  page,
}) => {
  const pageErrors: string[] = []
  page.on("pageerror", (error) => {
    pageErrors.push(error.message)
  })

  await page.goto("/")
  const firstStoryLink = page.getByRole("link", {
    name: "example1-resistor-and-capacitor",
  })
  await expect(firstStoryLink).toBeVisible()
  await firstStoryLink.click()
  await expect(
    page.frameLocator("iframe").locator("#root svg").first(),
  ).toBeVisible()
  expect(pageErrors).toEqual([])
})

for (const fixturePath of fixturePaths) {
  test(`story renders cleanly: ${fixturePath}`, async ({ page }) => {
    const pageErrors: string[] = []
    page.on("pageerror", (error) => {
      pageErrors.push(error.message)
    })

    await page.goto(buildRendererUrl(fixturePath))

    const rootChildren = page.locator("#root > *")
    await expect(rootChildren.first()).toBeVisible()

    // Wait for async circuit compilation / SPICE simulation stories to settle
    await expect(
      page.getByText("Loading and simulating circuit..."),
    ).toBeHidden({ timeout: 45_000 })
    await expect(page.getByText("Loading circuit...")).toBeHidden({
      timeout: 30_000,
    })

    // Ensure no conversion or simulation fallback error UI is shown
    await expect(page.getByText("Circuit Conversion Error")).toHaveCount(0)
    await expect(page.getByText("Failed to render SVG")).toHaveCount(0)
    await expect(page.getByText("Failed to load circuit")).toHaveCount(0)

    if (fixturePath.endsWith("example16-no-analog-simulation.fixture.tsx")) {
      await expect(page.getByText("No Simulation Found")).toBeVisible()
    } else {
      const simulationImg = page.locator('#root img[alt="Circuit Simulation"]')
      if ((await simulationImg.count()) > 0) {
        await expect(simulationImg.first()).toBeVisible()
        const naturalWidth = await simulationImg
          .first()
          .evaluate((img: HTMLImageElement) => img.naturalWidth)
        expect(naturalWidth).toBeGreaterThan(0)
      } else {
        const schematicSvg = page.locator("#root svg").first()
        await expect(schematicSvg).toBeVisible()
        const box = await schematicSvg.boundingBox()
        expect(box).not.toBeNull()
        expect(box!.width).toBeGreaterThan(0)
        expect(box!.height).toBeGreaterThan(0)
      }
    }

    expect(pageErrors).toEqual([])
  })
}

test("interactive story: click-to-interact overlay unlocks viewer", async ({
  page,
}) => {
  const pageErrors: string[] = []
  page.on("pageerror", (error) => {
    pageErrors.push(error.message)
  })

  await page.goto(
    buildRendererUrl("examples/example6-click-to-interact.fixture.tsx"),
  )

  const overlay = page.getByText("Click to Interact")
  await expect(overlay).toBeVisible()
  await overlay.locator("..").dispatchEvent("click")
  await expect(overlay).toBeHidden()
  await expect(page.locator("#root svg").first()).toBeVisible()
  expect(pageErrors).toEqual([])
})

test("interactive story: controller buttons switch schematic sheets", async ({
  page,
}) => {
  const pageErrors: string[] = []
  page.on("pageerror", (error) => {
    pageErrors.push(error.message)
  })

  await page.goto(
    buildRendererUrl(
      "examples/example37-schematic-viewer-controller.fixture.tsx",
    ),
  )

  const focusU2Button = page.getByRole("button", { name: "Focus U2" })
  await expect(focusU2Button).toBeVisible()
  await focusU2Button.click()

  await expect(page.locator("#root svg").first()).toBeVisible()
  expect(pageErrors).toEqual([])
})
