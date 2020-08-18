import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default {
  input: "src/index.js",
  output: {
    dir: "lib",
    format: "cjs",
  },
  plugins: [resolve(), commonjs()],
  external: ["readline", "events", "fs", "path", "os", "tty"],
};
