import { cpSync, existsSync, mkdtempSync, rmSync, symlinkSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

const packageDirectory = path.resolve(import.meta.dirname, "..")
const stagingDirectory = mkdtempSync(
  path.join(tmpdir(), "schematic-viewer-build-"),
)
const circuitToSvgPackagePath = Bun.resolveSync(
  "circuit-to-svg/package.json",
  packageDirectory,
)
const circuitToSvgPackageDirectory = path.dirname(circuitToSvgPackagePath)
const dependenciesDirectory = path.dirname(circuitToSvgPackageDirectory)

try {
  if (!existsSync(path.join(circuitToSvgPackageDirectory, "dist/index.d.ts"))) {
    const circuitToSvgBuildResult = Bun.spawnSync({
      cmd: [
        "bun",
        path.join(
          circuitToSvgPackageDirectory,
          "scripts/prepare-git-dependency.ts",
        ),
      ],
      cwd: circuitToSvgPackageDirectory,
      stdout: "inherit",
      stderr: "inherit",
    })
    if (circuitToSvgBuildResult.exitCode !== 0) {
      throw new Error(
        `Unable to prepare circuit-to-svg dependency (exit ${circuitToSvgBuildResult.exitCode})`,
      )
    }
  }

  cpSync(
    path.join(packageDirectory, "lib"),
    path.join(stagingDirectory, "lib"),
    { recursive: true },
  )
  cpSync(
    path.join(packageDirectory, "tsconfig.json"),
    path.join(stagingDirectory, "tsconfig.json"),
  )
  cpSync(
    path.join(packageDirectory, "package.json"),
    path.join(stagingDirectory, "package.json"),
  )
  symlinkSync(
    dependenciesDirectory,
    path.join(stagingDirectory, "node_modules"),
    "dir",
  )

  const buildResult = Bun.spawnSync({
    cmd: [
      "bunx",
      "tsup-node",
      path.join(stagingDirectory, "lib/index.ts"),
      "--dts",
      "--format",
      "esm",
      "--sourcemap",
      "--tsconfig",
      path.join(stagingDirectory, "tsconfig.json"),
      "--out-dir",
      path.join(packageDirectory, "dist"),
    ],
    cwd: stagingDirectory,
    stdout: "inherit",
    stderr: "inherit",
  })

  if (buildResult.exitCode !== 0) {
    throw new Error(
      `Unable to prepare schematic-viewer package (exit ${buildResult.exitCode})`,
    )
  }
} finally {
  rmSync(stagingDirectory, { recursive: true, force: true })
}
