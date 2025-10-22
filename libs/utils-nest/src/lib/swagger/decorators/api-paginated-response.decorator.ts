import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { PaginatedDto } from '../dto/paginated.dto';

/**
 * Applies paginated response decorator with proper schema
 *
 * @param type - Type of items in the paginated response
 *
 * @example
 * ```typescript
 * @Get()
 * @ApiPaginatedResponse(UserDto)
 * findAll() {
 *   // ...
 * }
 * ```
 */
export function ApiPaginatedResponse<T>(type: Type<T>) {
	return applyDecorators(
		ApiExtraModels(PaginatedDto),
		ApiOkResponse({
			schema: {
				allOf: [
					{ $ref: getSchemaPath(PaginatedDto) },
					{
						properties: {
							data: {
								type: 'array',
								items: { $ref: getSchemaPath(type) },
							},
						},
					},
				],
			},
		})
	);
}
