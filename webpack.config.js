const HtmlWebpackPlugin = require('html-webpack-plugin')

const CopyPlugin = require("copy-webpack-plugin");

var config = {
    entry: {
        tchatReact: "./build/tchat/client/renduTchat.js",
        accueilReact: "./build/accueil/renduAccueil.js",
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
        extensions: [".ts", ".tsx", ".js", ".json"]
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
        new CopyPlugin({
            patterns: [
                {from: "config.json"},
            ],
        }),
    ]
};

module.exports = config;