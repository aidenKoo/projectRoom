import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from './common/cache/cache.module';
import { UsersModule } from './users/users.module';
import { ProfilesModule } from './profiles/profiles.module';
import { ProfilesPrivateModule } from './profiles-private/profiles-private.module';
import { PhotosModule } from './photos/photos.module';
import { PreferencesModule } from './preferences/preferences.module';
import { FeedModule } from './feed/feed.module';
import { SwipesModule } from './swipes/swipes.module';
import { MatchesModule } from './matches/matches.module';
import { MessagesModule } from './messages/messages.module';
import { CodesModule } from './codes/codes.module';
import { ReferralsModule } from './referrals/referrals.module';
import { SurveyOptionsModule } from './survey-options/survey-options.module';
import { MatchModule } from './match/match.module';
import { ConversationsModule } from './conversations/conversations.module';
import { AdminModule } from './admin/admin.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    CacheModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USER'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // Use migrations in production
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    ProfilesModule,
    ProfilesPrivateModule,
    PhotosModule,
    PreferencesModule,
    FeedModule,
    SwipesModule,
    MatchesModule,
    MessagesModule,
    CodesModule,
    ReferralsModule,
    SurveyOptionsModule,
    MatchModule,
    ConversationsModule,
    AdminModule,
    StorageModule,
  ],
})
export class AppModule {}
