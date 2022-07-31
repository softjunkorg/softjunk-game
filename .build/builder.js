const { dtsPlugin } = require("esbuild-plugin-d.ts");
const { build } = require("esbuild");
const colors = require("colors");
const config = require("../builder.json");

const isWatch = process.argv.findIndex((argItem) => argItem === "--watch") >= 0;

if (isWatch) {
    console.log(`[${colors.green("BUILDER")}]: Started listening to changes.`);
}

build({
    ...config,
    plugins: [dtsPlugin()],
    watch: isWatch
        ? {
              onRebuild: (err, res) => {
                  if (err) {
                      return console.error(
                          `[${colors.red("BUILDER")}]: Error on listening`,
                          err
                      );
                  }

                  console.log(
                      `[${colors.green("BUILDER")}]: Listened to changes.`
                  );
              },
          }
        : false,
});
