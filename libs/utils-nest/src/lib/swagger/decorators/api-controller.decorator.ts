import { applyDecorators, Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

/**
 * Combines @Controller and @ApiTags decorators
 * Use this instead of @Controller when you want to add API tags
 *
 * @param path - Controller route path
 * @param tags - API tags for Swagger documentation
 *
 * @example
 * ```typescript
 * @ApiController('users', 'User Management')
 * export class UserController {
 *   // ...
 * }
 * ```
 */
export function ApiController(path: string, ...tags: string[]) {
	return applyDecorators(Controller(path), ApiTags(...tags));
}
