import { applyDecorators, Type } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

/**
 * Applies standard HTTP response decorators (200, 400, 401, 500)
 *
 * @param type - Response type for success (200) response
 * @param status - Success status code (default: 200)
 *
 * @example
 * ```typescript
 * @Get()
 * @ApiStandardResponse(UserDto)
 * findAll() {
 *   // ...
 * }
 * ```
 */
export function ApiStandardResponse<T>(type: Type<T>, status = 200) {
	return applyDecorators(
		ApiResponse({
			status,
			type,
			description: 'Success',
		}),
		ApiResponse({
			status: 400,
			description: 'Bad Request',
		}),
		ApiResponse({
			status: 401,
			description: 'Unauthorized',
		}),
		ApiResponse({
			status: 500,
			description: 'Internal Server Error',
		})
	);
}
