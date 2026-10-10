import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"

const packageDirectory = resolve(import.meta.dir, "..")
const packageJson = await Bun.file(
  join(packageDirectory, "package.json"),
).json()
const temporaryDirectory = await mkdtemp(
  join(tmpdir(), "schematic-viewer-package-"),
)

const run = (arguments_: string[], cwd: string) => {
  const result = Bun.spawnSync([process.execPath, ...arguments_], {
    cwd,
    stdout: "inherit",
    stderr: "inherit",
  })
  if (result.exitCode !== 0)
    throw new Error(`Package consumer command failed: ${arguments_.join(" ")}`)
}

try {
  run(["pm", "pack", "--destination", temporaryDirectory], packageDirectory)
  const archiveName = (await readdir(temporaryDirectory)).find((name) =>
    name.endsWith(".tgz"),
  )
  if (!archiveName)
    throw new Error("Packing the package did not create an archive")

  await writeFile(
    join(temporaryDirectory, "package.json"),
    JSON.stringify({
      private: true,
      type: "module",
      dependencies: {
        "@tscircuit/schematic-viewer": `file:./${archiveName}`,
        react: packageJson.devDependencies.react,
        tscircuit: packageJson.devDependencies.tscircuit,
        typescript: packageJson.peerDependencies.typescript,
        "@types/react": packageJson.devDependencies["@types/react"],
      },
    }),
  )
  await writeFile(
    join(temporaryDirectory, "consume.tsx"),
    `import type { ComponentProps } from "react"
import { SchematicViewer, useSchematicViewerController } from "@tscircuit/schematic-viewer"

const props: ComponentProps<typeof SchematicViewer> = {
  circuitJson: [],
  platformConfig: { platformFetch: globalThis.fetch },
}
const viewer = <SchematicViewer {...props} />
if (viewer.type !== SchematicViewer || typeof useSchematicViewerController !== "function") {
  throw new Error("The public package entry did not provide the viewer exports")
}
if (!import.meta.resolve("@tscircuit/schematic-viewer").endsWith("/dist/index.js")) {
  throw new Error("The public package entry did not resolve to the built JavaScript")
}
`,
  )
  await writeFile(
    join(temporaryDirectory, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        target: "ESNext",
        module: "ESNext",
        moduleResolution: "bundler",
        jsx: "react-jsx",
        strict: true,
        skipLibCheck: true,
        noEmit: true,
      },
      include: ["consume.tsx"],
    }),
  )

  run(["install", "--ignore-scripts"], temporaryDirectory)
  run(["run", "consume.tsx"], temporaryDirectory)
  run(["x", "--no-install", "tsc", "--noEmit"], temporaryDirectory)
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true })
}
