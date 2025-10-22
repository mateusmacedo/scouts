export default {
	displayName: 'bff-nest',
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
	coverageDirectory: '../../coverage/apps/bff-nest',
	maxWorkers: '50%',
	cache: true,
};
