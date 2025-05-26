import { createRoute, z } from '@hono/zod-openapi';
import { ErrorSchema, SuccessResponseSchema } from '../config/openapi';

type RouteResponse = {
    description: string;
    schema: z.ZodType<any>;
};

type RouteConfig = {
    method: 'get' | 'post' | 'put' | 'delete' | 'patch';
    path: string;
    tags: string[];
    summary: string;
    description?: string;
    requireAuth?: boolean;
    requestBody?: z.ZodType<any>;
    responses: Record<string, RouteResponse>;
};

/**
 * Create a standard OpenAPI route
 */
export const createOpenApiRoute = (options: RouteConfig) => {
    // Add default error response
    const fullResponses: Record<string, RouteResponse> = {
        ...options.responses,
        '400': {
            description: 'Bad Request',
            schema: ErrorSchema,
        },
    };

    // Add auth error responses if required
    if (options.requireAuth) {
        fullResponses['401'] = {
            description: 'Unauthorized',
            schema: ErrorSchema,
        };
    }

    // Create route configuration
    const routeConfig: any = {
        method: options.method,
        path: options.path,
        tags: options.tags,
        summary: options.summary,
        description: options.description || options.summary,
        responses: Object.entries(fullResponses).reduce((acc, [code, response]) => {
            acc[code] = {
                description: response.description,
                content: {
                    'application/json': {
                        schema: response.schema,
                    },
                },
            };
            return acc;
        }, {} as Record<string, any>),
    };

    // Add request body if provided
    if (options.requestBody) {
        routeConfig.request = {
            body: {
                content: {
                    'application/json': {
                        schema: options.requestBody,
                    },
                },
            },
        };
    }

    return createRoute(routeConfig);
}; 