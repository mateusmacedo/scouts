const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

module.exports = {
	output: {
		path: join(__dirname, '../../dist/apps/bff-nest'),
	},
	plugins: [
		new NxAppWebpackPlugin({
			target: 'node',
			compiler: 'tsc',
			main: './src/main.ts',
			tsConfig: './tsconfig.app.json',
			assets: ['./src/assets'],
			optimization: true,
			outputHashing: 'none',
			generatePackageJson: true,
		}),
	],
};
