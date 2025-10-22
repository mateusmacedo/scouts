import { PaginatedDto, PaginationMeta } from './paginated.dto';

describe('PaginationMeta', () => {
	describe('class structure', () => {
		test('should have all required properties', () => {
			const meta = new PaginationMeta();

			// Verify that properties exist
			expect(meta).toHaveProperty('total');
			expect(meta).toHaveProperty('page');
			expect(meta).toHaveProperty('limit');
			expect(meta).toHaveProperty('totalPages');
			expect(meta).toHaveProperty('hasNext');
			expect(meta).toHaveProperty('hasPrevious');
		});

		test('should allow assignment of numeric values', () => {
			const meta = new PaginationMeta();

			meta.total = 100;
			meta.page = 1;
			meta.limit = 10;
			meta.totalPages = 10;

			expect(meta.total).toBe(100);
			expect(meta.page).toBe(1);
			expect(meta.limit).toBe(10);
			expect(meta.totalPages).toBe(10);
		});

		test('should allow assignment of boolean values', () => {
			const meta = new PaginationMeta();

			meta.hasNext = true;
			meta.hasPrevious = false;

			expect(meta.hasNext).toBe(true);
			expect(meta.hasPrevious).toBe(false);
		});
	});

	describe('realistic scenarios', () => {
		test('first page', () => {
			const meta = new PaginationMeta();
			meta.total = 50;
			meta.page = 1;
			meta.limit = 10;
			meta.totalPages = 5;
			meta.hasNext = true;
			meta.hasPrevious = false;

			expect(meta.page).toBe(1);
			expect(meta.hasNext).toBe(true);
			expect(meta.hasPrevious).toBe(false);
		});

		test('middle page', () => {
			const meta = new PaginationMeta();
			meta.total = 50;
			meta.page = 3;
			meta.limit = 10;
			meta.totalPages = 5;
			meta.hasNext = true;
			meta.hasPrevious = true;

			expect(meta.page).toBe(3);
			expect(meta.hasNext).toBe(true);
			expect(meta.hasPrevious).toBe(true);
		});

		test('last page', () => {
			const meta = new PaginationMeta();
			meta.total = 50;
			meta.page = 5;
			meta.limit = 10;
			meta.totalPages = 5;
			meta.hasNext = false;
			meta.hasPrevious = true;

			expect(meta.page).toBe(5);
			expect(meta.hasNext).toBe(false);
			expect(meta.hasPrevious).toBe(true);
		});

		test('no data', () => {
			const meta = new PaginationMeta();
			meta.total = 0;
			meta.page = 1;
			meta.limit = 10;
			meta.totalPages = 0;
			meta.hasNext = false;
			meta.hasPrevious = false;

			expect(meta.total).toBe(0);
			expect(meta.totalPages).toBe(0);
			expect(meta.hasNext).toBe(false);
			expect(meta.hasPrevious).toBe(false);
		});
	});
});

describe('PaginatedDto', () => {
	describe('generic structure', () => {
		test('should have data and meta properties', () => {
			const dto = new PaginatedDto<string>();

			expect(dto).toHaveProperty('data');
			expect(dto).toHaveProperty('meta');
		});

		test('should allow assignment of data array', () => {
			const dto = new PaginatedDto<string>();
			const testData = ['item1', 'item2', 'item3'];

			dto.data = testData;

			expect(dto.data).toEqual(testData);
			expect(dto.data).toHaveLength(3);
		});

		test('should allow assignment of meta', () => {
			const dto = new PaginatedDto<number>();
			const meta = new PaginationMeta();
			meta.total = 100;
			meta.page = 1;
			meta.limit = 10;
			meta.totalPages = 10;
			meta.hasNext = true;
			meta.hasPrevious = false;

			dto.meta = meta;

			expect(dto.meta).toBe(meta);
			expect(dto.meta.total).toBe(100);
		});
	});

	describe('different generic types', () => {
		test('should work with strings', () => {
			const dto = new PaginatedDto<string>();
			const data = ['test1', 'test2'];
			const meta = new PaginationMeta();

			dto.data = data;
			dto.meta = meta;

			expect(dto.data).toEqual(['test1', 'test2']);
			expect(dto.meta).toBe(meta);
		});

		test('should work with numbers', () => {
			const dto = new PaginatedDto<number>();
			const data = [1, 2, 3, 4, 5];
			const meta = new PaginationMeta();

			dto.data = data;
			dto.meta = meta;

			expect(dto.data).toEqual([1, 2, 3, 4, 5]);
			expect(dto.meta).toBe(meta);
		});

		test('should work with complex objects', () => {
			interface User {
				id: number;
				name: string;
				email: string;
			}

			const dto = new PaginatedDto<User>();
			const data: User[] = [
				{ id: 1, name: 'João', email: 'joao@test.com' },
				{ id: 2, name: 'Maria', email: 'maria@test.com' },
			];
			const meta = new PaginationMeta();

			dto.data = data;
			dto.meta = meta;

			expect(dto.data).toHaveLength(2);
			expect(dto.data[0].name).toBe('João');
			expect(dto.data[1].name).toBe('Maria');
		});
	});

	describe('usage scenarios', () => {
		test('empty array', () => {
			const dto = new PaginatedDto<string>();
			const meta = new PaginationMeta();
			meta.total = 0;
			meta.page = 1;
			meta.limit = 10;
			meta.totalPages = 0;
			meta.hasNext = false;
			meta.hasPrevious = false;

			dto.data = [];
			dto.meta = meta;

			expect(dto.data).toEqual([]);
			expect(dto.data).toHaveLength(0);
			expect(dto.meta.total).toBe(0);
		});

		test('multiple elements', () => {
			const dto = new PaginatedDto<{ id: number; value: string }>();
			const data = [
				{ id: 1, value: 'first' },
				{ id: 2, value: 'second' },
				{ id: 3, value: 'third' },
			];
			const meta = new PaginationMeta();
			meta.total = 3;
			meta.page = 1;
			meta.limit = 10;
			meta.totalPages = 1;
			meta.hasNext = false;
			meta.hasPrevious = false;

			dto.data = data;
			dto.meta = meta;

			expect(dto.data).toHaveLength(3);
			expect(dto.data[0].value).toBe('first');
			expect(dto.data[2].value).toBe('third');
			expect(dto.meta.total).toBe(3);
		});

		test('complete composition with PaginationMeta', () => {
			const dto = new PaginatedDto<{ id: number }>();
			const data = [{ id: 1 }, { id: 2 }];
			const meta = new PaginationMeta();
			meta.total = 25;
			meta.page = 2;
			meta.limit = 10;
			meta.totalPages = 3;
			meta.hasNext = true;
			meta.hasPrevious = true;

			dto.data = data;
			dto.meta = meta;

			// Validate data
			expect(dto.data).toHaveLength(2);
			expect(dto.data[0].id).toBe(1);

			// Validate meta
			expect(dto.meta.total).toBe(25);
			expect(dto.meta.page).toBe(2);
			expect(dto.meta.limit).toBe(10);
			expect(dto.meta.totalPages).toBe(3);
			expect(dto.meta.hasNext).toBe(true);
			expect(dto.meta.hasPrevious).toBe(true);
		});
	});
});
