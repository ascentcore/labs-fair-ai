const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const type = 'new'

module.exports = {
    mode: 'development',
    entry: {
        sample1: `./src/samples/sample1.js`,
        sample2: `./src/samples/sample2.js`,
    },
    devtool: 'inline-source-map',
    plugins: [
        new HtmlWebpackPlugin({
            title: 'Development',
            template: `src/${type}/index.html`,
        }),
    ],
    devServer: {
        compress: true,
        port: 9000,
        static: {
            directory: path.join(__dirname, 'assets'),
        },
    },
    module: {
        rules: [
            {
                test: /\.(gif|png|jpe?g)$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[name].[ext]',
                            outputPath: 'assets/images/',
                        },
                    },
                ],
            },
            {
                test: /\.html$/,
                use: ['html-loader'],
            },
        ],
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'docs'),
    },
    optimization: {
        runtimeChunk: 'single',
    },
}
