import { nodeUser } from './node-user';

describe('nodeUser', () => {
	it('should return the expected string value', () => {
		expect(nodeUser()).toEqual('user-node');
	});
});
