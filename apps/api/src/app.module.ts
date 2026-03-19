import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // ── Config ──────────────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // ── Rate limiting ────────────────────────────────────────────────────────
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),

    // ── Core modules ─────────────────────────────────────────────────────────
    DatabaseModule,
    HealthModule,
  ],
})
export class AppModule {}
