var path = require("path");
var webpack = require("webpack");
var IS_PROD = true;
var IS_TEST = false;
var IS_BETA = false;

var recompileFunction = function() {
    this.plugin('watch-run', function(watching, callback) {
        console.log();
        console.log('Recompiling assets starting ' + new Date()
                .timeNow() + "...");
        callback();
    })
};


    var definePluginConstants = {
    __DEV__: !IS_PROD,
    __BETA__: IS_BETA,
    __TEST__: IS_TEST,
    __VERSION__: JSON.stringify(require("./package.json").sdkVersion),
};

var config = {
    target: 'web',
    /*
     * app.ts represents the entry point to your web application. Webpack will
     * recursively go through every "require" statement in app.ts and
     * efficiently build out the application's dependency tree.
     */
    entry: ["./src/entry.ts"],
    devtool: 'source-map',

    /*
     * The combination of path and filename tells Webpack what name to give to
     * the final bundled JavaScript file and where to store this file.
     */
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "typescript-bundle.js"
    },

    /*
     * resolve lets Webpack now in advance what file extensions you plan on
     * "require"ing into the web application, and allows you to drop them
     * in your code.
     */
    resolve: {
        extensions: ["", ".ts", ".tsx", ".js"]
    },

    module: {
        /*
         * Each loader needs an associated Regex test that goes through each
         * of the files you've included (or in this case, all files but the
         * ones in the excluded directories) and finds all files that pass
         * the test. Then it will apply the loader to that file. I haven't
         * installed ts-loader yet, but will do that shortly.
         */
        loaders: [
            {
                test: /\.(t|j)sx?$/,
                loader: 'awesome-typescript-loader',
                exclude: /node_modules/
            },
            {
                test: /\.scss$/,
                loaders: ["style", "css", "autoprefixer-loader", "sass"]
            }
        ]
    },plugins: [
        new webpack.ProvidePlugin({
            'fetch': 'imports?this=>global!exports?global.fetch!whatwg-fetch'
        }),
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.DefinePlugin(definePluginConstants),
        recompileFunction
    ]
};

module.exports = config;