import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getDatabaseConfig } from '../config/database.config';

/**
 * Database module. Registers TypeORM with PostgreSQL.
 * Uses ConfigService so variables come from .env loaded by ConfigModule (correct load order).
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
