const { dts } = require("esbuild-plugin-d.ts");
const { build } = require("esbuild");
const colors = require("colors");
const config = require("../package.json");

const isWatch = process.argv.findIndex(argItem => argItem === "--watch") >= 0;

if (!config.builderSettings) {
    throw new Error("Builder: No settings were found on the package.json!");
}

function runBuild(config) {
    build({
        ...config,
        plugins: [dts()],
        watch: isWatch
            ? {
                  onRebuild: function (err, res) {
                      if (err) {
                          return console.error(
                              `[${colors.red("BUILDER")}]: Error on listening`,
                              err,
                          );
                      }

                      console.log(
                          `[${colors.green("BUILDER")}]: Listened to changes.`,
                      );
                  },
              }
            : false,
    });
}

if (isWatch) {
    console.log(`[${colors.green("BUILDER")}]: Started listening to changes.`);
}

if (Array.isArray(config.builderSettings.options)) {
    config.builderSettings.options.map(function (c) {
        runBuild(c);
    });
} else {
    runBuild(config.builderSettings.options);
}
