const HtmlWebpackPlugin = require('html-webpack-plugin')

const CopyPlugin = require("copy-webpack-plugin");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin")

var config = {
    entry: {
        tchatReact: "./build/tchat/client/renduTchat.js",
        accueilReact: "./build/accueil/client/accueil/renduAccueil.js",
        connexionReact: "./build/accueil/client/connexion/renduConnexion.js",
        distributionReact:"./build/distribution/client/renduDistribution.js"
    }, // Les clés remplacent name ci-dessous.
    output: {
        path: __dirname + "/build",
        filename: "[name].client.js",
        publicPath: "/", // added to the js name when injected in the HTML
        pathinfo: false
    },
    // Enable sourcemaps for debugging webpack's output.
    devtool: "source-map",
    mode: "production",
    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".tsx", ".js", ".json"],
        //https://stackoverflow.com/questions/64557638/how-to-polyfill-node-core-modules-in-webpack-5
        fallback: {
            "fs": false,
            "child_process":false,
            "net": false,
            "assert": false,
            "querystring": false,
            "crypto": false,
        }
    },
    module: {
        rules: [
            // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
            {test: /\.tsx?$/, loader: "awesome-typescript-loader"},

            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            {enforce: "pre", test: /\.js$/, loader: "source-map-loader"}
        ]
    },
    optimization: {
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: 'Tchat v1',
            template: 'site/interfaceTemplate.html',
            filename: "interfaceTchat.html", // output file name
            chunks: ['tchatReact'] // to inject in the body
        }),
        new HtmlWebpackPlugin({
            title: 'Accueil',
            template: 'site/interfaceTemplate.html',
            filename: "interfaceAccueil.html",
            chunks: ['accueilReact']
        }),
        new HtmlWebpackPlugin({
            title: 'Connexion',
            template: 'site/interfaceTemplate.html',
            filename: "interfaceConnexion.html",
            chunks: ['connexionReact']
        }),
        new HtmlWebpackPlugin({
            title: 'Distribution',
            template: 'site/interfaceTemplate.html',
            filename: "interfaceDistribution.html",
            chunks: ['distributionReact']
        }),
        new CopyPlugin({
            patterns: [
                {from: "config.json"},
            ],
        }),
        new NodePolyfillPlugin()
    ],

};

module.exports = config;