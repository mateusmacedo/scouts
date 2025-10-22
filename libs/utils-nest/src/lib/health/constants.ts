/**
 * Constants for Health Check Module
 */

export const HEALTH_OPTIONS_TOKEN = 'HEALTH_OPTIONS_TOKEN';

export const DEFAULT_TIMEOUT = 3000;
export const DEFAULT_LIVENESS_ENDPOINT = '/health/live';
export const DEFAULT_READINESS_ENDPOINT = '/health/ready';

export const HEALTH_INDICATORS = {
	HTTP: 'HTTP_HEALTH_INDICATOR',
	MEMORY: 'MEMORY_HEALTH_INDICATOR',
	DISK: 'DISK_HEALTH_INDICATOR',
	CUSTOM: 'CUSTOM_HEALTH_INDICATOR',
} as const;
