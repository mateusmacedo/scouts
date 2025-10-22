const nxPreset = require('@nx/jest/preset').default;

module.exports = {
	...nxPreset,
	maxWorkers: '50%',
	cache: true,
	cacheDirectory: '<rootDir>/node_modules/.cache/jest',
	testTimeout: 10000,
};
