/**
 * Base pagination metadata DTO
 * Provides standard pagination fields for API responses
 */
export class PaginationMeta {
	total!: number;
	page!: number;
	limit!: number;
	totalPages!: number;
	hasNext!: boolean;
	hasPrevious!: boolean;
}

/**
 * Generic paginated response DTO
 * Use this as base for paginated API responses
 */
export class PaginatedDto<T> {
	data!: T[];
	meta!: PaginationMeta;
}
