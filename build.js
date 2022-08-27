const esbuild = require("esbuild");
const { dtsPlugin } = require("esbuild-plugin-d.ts");
const fs = require("fs");

const production =
    process.argv.findIndex(argItem => argItem === "--mode=production") >= 0;

const onRebuild = context => {
    return async (err, res) => {
        if (err) {
            return console.error(`[${context}]: Rebuild failed`, err);
        }

        console.log(`[${context}]: Rebuild succeeded, warnings:`, res.warnings);
    };
};

esbuild
    .build({
        bundle: true,
        entryPoints: ["./src/index.ts"],
        format: "cjs",
        minify: true,
        outdir: "./dist",
        platform: "node",
        target: ["node16"],
        plugins: [dtsPlugin()],
        watch: production
            ? false
            : {
                  onRebuild: onRebuild("code"),
              },
    })
    .then(() => console.log(`[code]: Built successfully!`))
    .catch(() => process.exit(1));
