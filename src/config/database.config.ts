import { ConfigService } from '@nestjs/config';

/**
 * Database connection configuration for TypeORM.
 * Uses ConfigService so .env is loaded by ConfigModule before this runs (recommended in NestJS).
 */
export const getDatabaseConfig = (configService: ConfigService) => ({
  type: 'postgres' as const,
  host: configService.get<string>('DB_HOST', 'localhost'),
  port: parseInt(configService.get<string>('DB_PORT', '5432'), 10),
  username: configService.get<string>('DB_USERNAME', 'postgres'),
  password: configService.get<string>('DB_PASSWORD', 'postgres'),
  database: configService.get<string>('DB_DATABASE', 'task_management'),
  autoLoadEntities: true,
  synchronize: configService.get<string>('NODE_ENV') !== 'production',
  logging: configService.get<string>('NODE_ENV') === 'development',
});
