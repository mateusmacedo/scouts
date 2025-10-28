export default {
	displayName: '@scouts/user-node',
	preset: '../../jest.preset.js',
	testEnvironment: 'node',
	transform: {
		'^.+\\.[tj]s$': [
			'@swc/jest',
			{
				jsc: {
					parser: { syntax: 'typescript', decorators: true },
					transform: { decoratorMetadata: true },
					target: 'es2021',
				},
				module: { type: 'commonjs' },
			},
		],
	},
	moduleFileExtensions: ['ts', 'js', 'html'],
	coverageDirectory: '../../coverage/libs/user-node',
};
