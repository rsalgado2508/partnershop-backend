import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  appConfigValidationSchema,
  databaseConfig,
  cognitoConfig,
} from './config';
import { AuthModule } from './auth/auth.module';
import { OrdenesModule } from './modules/ordenes/ordenes.module';
import { CategoriasNovedadModule } from './modules/categorias-novedad/categorias-novedad.module';
import { NovedadesModule } from './modules/novedades/novedades.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, cognitoConfig],
      validationSchema: appConfigValidationSchema,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        autoLoadEntities: true,
        synchronize: false,
        logging: configService.get<string>('APP_ENV') === 'development',
      }),
    }),
    AuthModule,
    OrdenesModule,
    CategoriasNovedadModule,
    NovedadesModule,
    HealthModule,
  ],
})
export class AppModule {}
