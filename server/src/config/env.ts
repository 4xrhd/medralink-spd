import { z } from 'zod';

/**
 * Startup configuration check. The server refuses to boot with settings that would make it
 * insecure (a short or missing JWT secret, open CORS) or that cannot work (postgres without a URL).
 */
const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(5000),
    DB_DIALECT: z.enum(['sqlite', 'postgres']).default('sqlite'),
    DATABASE_URL: z.string().url().optional(),
    JWT_SECRET: z.string().optional(),
    CORS_ORIGIN: z.string().optional(),
  })
  .superRefine((env, ctx) => {
    if (env.DB_DIALECT === 'postgres' && !env.DATABASE_URL) {
      ctx.addIssue({ code: 'custom', path: ['DATABASE_URL'], message: 'is required when DB_DIALECT=postgres' });
    }
    if (env.NODE_ENV !== 'production') return;
    if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
      ctx.addIssue({ code: 'custom', path: ['JWT_SECRET'], message: 'must be at least 32 characters in production' });
    }
    const origins = (env.CORS_ORIGIN ?? '').split(',').map((o) => o.trim()).filter(Boolean);
    if (origins.length === 0 || origins.includes('*')) {
      ctx.addIssue({ code: 'custom', path: ['CORS_ORIGIN'], message: 'must list the allowed origins in production (no *)' });
    }
  });

export type AppEnv = z.infer<typeof envSchema>;

export function validateEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const problems = result.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ');
    throw new Error(`Invalid server configuration: ${problems}`);
  }
  return result.data;
}
