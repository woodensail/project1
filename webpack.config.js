/**
 * Created by sail on 2016/4/22.
 */
var path = require('path');
var webpack = require('webpack');
var UglifyJsPlugin = webpack.optimize.UglifyJsPlugin;
var HtmlWebpackPlugin = require('html-webpack-plugin');
//require("babel-polyfill");
module.exports = {
	entry: {
		'index': './public-src/index'
	}, //入口文件输出配置
	output: {
		path: 'public', filename: '[name].bundle.js'//, publicPath: '/his/components/'
	}, module: {
		//加载器配置
		loaders: [{
			loader: 'babel-loader', test: /\.js$/, exclude: /node_modules/, query: {
				presets: ['es2015', 'stage-3']
			}
		},{test: require.resolve('jquery'), loader: 'expose?jQuery'},
			{
			test: /\.css$/, loader: 'style-loader!css-loader'
		}, {test: /\.(jpg|png|svg)$/, loader: "url?"}, {test: /\.(ttf|eot|woff|woff2)$/, loader: "file-loader"}]

	}, //其它解决方案配置
	resolve: {
		root: 'node_modules'
	}, plugins: [
		new HtmlWebpackPlugin({
			filename: 'index.html',
			template: 'public-src/index.html'
		}),
		//commonsPlugin,//new UglifyJsPlugin(),
		//new CopyWebpackPlugin([
		//    { from: dir_html } // to: output.path
		//]),
		// Avoid publishing files when compilation fails
		new webpack.NoErrorsPlugin()], stats: {
		// Nice colored output
		colors: true
	}//, Create source maps for the bundle
	//devtool: 'source-map'
};