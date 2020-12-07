/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
    mount: {
        public: "/",
        src: "/_dist_",
    },
    plugins: [
        // renderer process
        ["@snowpack/plugin-typescript", { args: "--project tsconfig.json" }],
        // main process
        [
            "@snowpack/plugin-run-script",
            {
                cmd: "tsc --project tsconfig.main.json",
                watch: "tsc --watch --project tsconfig.main.json",
            },
        ],
        [
            "@snowpack/plugin-run-script",
            {
                cmd:
                    'echo run "yarn dev" to start the electron app and the dev server', // do not start electron when building for production
                watch: "electron . --dev --use-dev-server", // start electron in debug mode
            },
        ],
        "@snowpack/plugin-svelte",
        "@snowpack/plugin-dotenv",
        "@snowpack/plugin-postcss",
        [
            "@snowpack/plugin-webpack",
            {
                extendConfig: (config) => {
                    config.target = "electron-renderer";
                    return config;
                },
            },
        ],
    ],
    install: [
        /* ... */
    ],
    installOptions: {
        externalPackage: [
            // nodejs
            "assert",
            "buffer",
            "child_process",
            "crypto",
            "events",
            "fs",
            "http",
            "https",
            "os",
            "stream",
            "util",
            "url",
            "zlib",
        ],
    },
    devOptions: {
        open: "none",
        port: 8080,
        output: "stream",
    },
    buildOptions: {
        baseUrl: "./",
    },
    proxy: {
        /* ... */
    },
    exclude: [
        "**/node_modules/**/*",
        "**/__tests__/*",
        "**/*.@(spec|test).@(js|mjs)",
        "**/src/main/**/*",
    ],
    alias: {
        "@xmcl/core": "./src/alias/@xmcl/core",
        "@xmcl/installer": "./src/alias/@xmcl/installer",
        "@xmcl/user": "./src/alias/@xmcl/user",
        electron: "./src/alias/electron",
        "electron-store": "./src/alias/electron-store",
        mkdirp: "./src/alias/mkdirp",
        path: "./src/alias/path",
    },
};
