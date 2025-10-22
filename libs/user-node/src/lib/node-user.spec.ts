import { nodeUser } from './user-node';

describe('nodeUser', () => {
	it('should return the expected string value', () => {
		expect(nodeUser()).toEqual('user-node');
	});
});
