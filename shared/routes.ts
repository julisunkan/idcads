import { z } from 'zod';
import { insertCardSchema, insertSettingsSchema, cards, settings } from './schema';

// Error Schemas
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// API Contract
export const api = {
  cards: {
    create: {
      method: 'POST' as const,
      path: '/api/cards',
      input: insertCardSchema,
      responses: {
        201: z.custom<typeof cards.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/cards',
      responses: {
        200: z.array(z.custom<typeof cards.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/cards/:id',
      responses: {
        200: z.custom<typeof cards.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/cards/:id/status',
      input: z.object({ status: z.enum(['VALID', 'REVOKED', 'EXPIRED']) }),
      responses: {
        200: z.custom<typeof cards.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    verify: {
      method: 'GET' as const,
      path: '/api/verify/:idNumber',
      responses: {
        200: z.object({
          fullName: z.string(),
          country: z.string(),
          status: z.string(),
          idNumber: z.string(),
        }),
        404: errorSchemas.notFound,
      },
    },
  },
  settings: {
    get: {
      method: 'GET' as const,
      path: '/api/settings',
      responses: {
        200: z.custom<typeof settings.$inferSelect>(),
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/settings',
      input: insertSettingsSchema.partial(),
      responses: {
        200: z.custom<typeof settings.$inferSelect>(),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type CreateCardInput = z.infer<typeof api.cards.create.input>;
export type UpdateStatusInput = z.infer<typeof api.cards.updateStatus.input>;
export type UpdateSettingsInput = z.infer<typeof api.settings.update.input>;
