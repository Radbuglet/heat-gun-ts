// @TODO make dev and prod modes!

const { src, dest, watch } = require("gulp");
const { series } = require("gulp");
const { join } = require("path");
const { spawn } = require("child_process");
const webpackStream = require("webpack-stream");
const HardSourceWebpackPlugin = require("hard-source-webpack-plugin");

const source_path = "src/";

let watch_process = null;

function build_client_platform(platform_name, output_folder_path) {
  return function wrapped__build_client_platform() {
    console.log("Building platform", platform_name, "...");

    const platform_path = join(source_path, platform_name);
    return src(join(platform_path, "src/entry.ts"))
      .pipe(
        webpackStream({
          stats: "errors-only",
          mode: "development",
          output: {
            filename: "bundle.js"
          },
          resolve: {
            extensions: [".ts", ".js", ".json"]
          },
          module: {
            rules: [{ test: /\.ts?$/, loader: "ts-loader" }]
          },
          plugins: [new HardSourceWebpackPlugin()]
        })
      )
      .pipe(dest(join(platform_path, output_folder_path)));
  };
}

module.exports.build_all_client_platforms = series(
  build_client_platform("platform-editor", "static"),
  build_client_platform("platform-game", "static")
);

module.exports.run_server = function(cb) {
  cb();
  if (watch_process !== null) {
    console.log("Killing previous process...");
    watch_process.kill();
    console.log("Killed previous process.");
  }

  console.log("\n\n");

  watch_process = spawn("node", ["src/platform-server/start.js"], {
    stdio: ["pipe", process.stdout, process.stderr]
  });
};

module.exports.build_and_run = series(
  module.exports.build_all_client_platforms,
  module.exports.run_server
);

module.exports.watch = function(cb) {
  watch(
    [
      "src/**/*.ts",
      "src/**/*.html",
      "src/**/*.hbs",
      "src/config/map_data.json"
    ],
    { events: "all", ignoreInitial: false },
    module.exports.build_and_run
  );
};
