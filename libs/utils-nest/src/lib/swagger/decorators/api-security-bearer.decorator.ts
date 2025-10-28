import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';

/**
 * Applies Bearer authentication decorators
 * Shortcut for @ApiBearerAuth() with unauthorized response
 *
 * @example
 * ```typescript
 * @Get()
 * @ApiSecurityBearer()
 * findAll() {
 *   // ...
 * }
 * ```
 */
export function ApiSecurityBearer() {
	return applyDecorators(
		ApiBearerAuth(),
		ApiUnauthorizedResponse({
			description: 'Unauthorized',
		})
	);
}
