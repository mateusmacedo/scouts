import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

/**
 * Applies common error response decorators (400, 401, 403, 404, 500)
 *
 * @example
 * ```typescript
 * @Get()
 * @ApiErrorResponses()
 * findOne() {
 *   // ...
 * }
 * ```
 */
export function ApiErrorResponses() {
	return applyDecorators(
		ApiResponse({
			status: 400,
			description: 'Bad Request',
		}),
		ApiResponse({
			status: 401,
			description: 'Unauthorized',
		}),
		ApiResponse({
			status: 403,
			description: 'Forbidden',
		}),
		ApiResponse({
			status: 404,
			description: 'Not Found',
		}),
		ApiResponse({
			status: 500,
			description: 'Internal Server Error',
		})
	);
}
