/**
 * Environment variables validation and export.
 * Centralizes env access and provides defaults for local development.
 */
export const envConfig = () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
});
