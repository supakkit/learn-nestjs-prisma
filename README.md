# Building a REST API with NestJS and Prisma
เนื้อหาหลักจาก: https://www.prisma.io/blog/nestjs-prisma-rest-api-7D056s1BmOL0

## Create the project & set up Prisma and Swagger
### ขั้นตอนการ set up Prisma
install Prisma:
```shell
npm install -D prisma
```
- โดยเป็น Prisma version 6.19.0
- เดิมทีมันถูกติดตั้งด้วย version 7.0.0 แต่เนื่องจากมี vulnerability warning จึงรัน `npm audit fix --force` เพื่อแก้ปัญหา มันจึงถูกอัปเดทมาเป็น version 6.19.0
- โดย Prisma แต่ละ version ใหญ่ มีการตั้งค่าที่แตกต่างกัน

เริ่มต้นใช้งาน Prisma:
```shell
npx prisma init
```
โดยขั้นตอนนี้มันจะสร้างไฟล์ `prisma.config.ts`, `.env`, `prisma/schema.prisma` ขึ้นมาให้ และแนะนำขั้นตอนต่อไปดังนี้:

1. Install `dotenv`, and add `import "dotenv/config";` to your `prisma.config.ts` file to load environment variables from `.env`.
2. Run prisma dev to start a local Prisma Postgres server.
3. Define models in the schema.prisma file.
4. Run prisma migrate dev to migrate your local Prisma Postgres database.

ซึ่งเราจะเริ่มด้วยติดตั้ง `dotenv`:
```shell
npm i dotenv
```

แล้ว import มันใน `prisma.config.ts`:
```
import "dotenv/config";
```

จากนั้นใน `.env` จะมี dummy `DATABASE_URL` environment variable อยู่ ให้แทนที่ด้วย connecting string ของเราเข้าไป:
```
DATABASE_URL="postgres://myuser:mypassword@localhost:5432/median-db"
```

ต่อมา เราจะลบการกำหนดปลายทางของ `generated` folder ที่กำหนดใน `schema.prisma` file ออก จะทำให้ `generator client` มีลักษณะดังนี้:
```
generator client {
  provider = "prisma-client-js"
}
```
จากนั้นใน `schema.prisma` file เดียวกันนี้ กำหนด models ของเรา:
```
model Article {
  id          Int      @id @default(autoincrement())
  title       String   @unique
  description String?
  body        String
  published   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

จากนั้นรัน migrations เพื่อสร้าง table จริงๆ (จาก model ที่กำหนด) ใน database ขึ้นมา:
```shell
npx prisma migrate dev --name init
```
จะได้ผลลัพธ์ในลักษณะนี้:
```
The following migration(s) have been created and applied from new schema changes:

prisma/migrations/
  └─ 20251125040938_init/
    └─ migration.sql

Your database is now in sync with your schema.

Running generate... (Use --skip-generate to skip the generators)

✔ Generated Prisma Client (v6.19.0) to ./prisma/generated in 45ms
```

ต่อมาจะทำการเพิ่มข้อมูลเข้าไปใน database เพื่อใช้เป็นข้อมูลเริ่มต้น
เริ่มจากสร้าง seed file ที่ `prisma/seed.ts`:
```shell
touch prisma/seed.ts
```

จากนั้นภายใน seed file ใส่ code ด้านล่างนี้ลงไป:
```ts
import { PrismaClient } from '@prisma/client';

// initialize Prisma Client
const prisma = new PrismaClient();

async function main() {
  // create two dummy articles
  const post1 = await prisma.article.upsert({
    where: { title: 'Prisma Adds Support for MongoDB' },
    update: {},
    create: {
      title: 'Prisma Adds Support for MongoDB',
      body: 'Support for MongoDB has been one of the most requested features since the initial release of...',
      description:
        "We are excited to share that today's Prisma ORM release adds stable support for MongoDB!",
      published: false,
    },
  });

  const post2 = await prisma.article.upsert({
    where: { title: "What's new in Prisma? (Q1/22)" },
    update: {},
    create: {
      title: "What's new in Prisma? (Q1/22)",
      body: 'Our engineers have been working hard, issuing new releases with many improvements...',
      description:
        'Learn about everything in the Prisma ecosystem and community from January to March 2022.',
      published: true,
    },
  });

  console.log({ post1, post2 });
}

// execute the main function
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // close Prisma Client at the end
    await prisma.$disconnect();
  });
```

ต่อมา เราจะเพิ่มคำสั่งเพื่อใช้ในการเรียกใช้เพื่อ seed data เข้าไปใน database โดยเพิ่มใน `prisma.config.ts` ที่ `migrations` property ดังนี้:
```ts
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node prisma/seed.ts',
  },
  engine: 'classic',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
```

สุดท้ายรันคำสั่งการ seed data ด้วย:
```shell
npx prisma db seed
```

จะได้ผลลัพธ์ดังนี้:
```
Running seed command `ts-node prisma/seed.ts` ...
{
  post1: {
    id: 1,
    title: 'Prisma Adds Support for MongoDB',
    description: "We are excited to share that today's Prisma ORM release adds stable support for MongoDB!",
    body: 'Support for MongoDB has been one of the most requested features since the initial release of...',
    published: false,
    createdAt: 2025-11-25T04:27:17.556Z,
    updatedAt: 2025-11-25T04:27:17.556Z
  },
  post2: {
    id: 2,
    title: "What's new in Prisma? (Q1/22)",
    description: 'Learn about everything in the Prisma ecosystem and community from January to March 2022.',
    body: 'Our engineers have been working hard, issuing new releases with many improvements...',
    published: true,
    createdAt: 2025-11-25T04:27:17.564Z,
    updatedAt: 2025-11-25T04:27:17.564Z
  }
}

🌱  The seed command has been executed.
```

ต่อมาสร้าง Prisma service เพื่อเรียกใช้งานใน application
ใช้ Nest CLI ในการช่วยสร้างไฟล์ service และ module:
```shell
npx nest generate module prisma
npx nest generate service prisma
```
จากนั้นใน `prisma.service.ts` file ให้ export class `PrismaService` ที่ extends จาก `PrismaClient` ดังนี้:
```ts
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {}
```


สุดท้าย export `PrismaService` ออกไปเพื่อให้สามารถนำไปใช้งานใน module อื่นๆ ได้ โดยกำหนดที่ `prisma.module.ts`:
```ts
import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```
ตอนนี้เราก็จะได้ Prisma service ที่พร้อมเรียกใช้งานใน application ของเราแล้ว


## Authentication
ติดตั้ง packages ที่จำเป็น สำหรับการทำ authentication ด้วย Passport:
```shell
npm install --save @nestjs/passport passport passport-local
npm install --save-dev @types/passport-local
```
รวมทั้งติดตั้ง `@nestjs/config` เพื่อใช้สำหรับดึง environment variables มาใช้งานใน NestJS app:
```shell
npm install --save @nestjs/config
```
การตั้งค่า secret key สำหรับ JWT secret จะทำต่างจากในบทความเล็กน้อยเพื่อให้เป็นไปตาม pattern ที่สามารถใช้ใน production ได้ โดยจะกำหนด `JWT_SECRET` ไว้ใน `.env` file แล้วทำการโหลดเข้ามาใช้งาน แทนการกำหนด secret key ไว้ภายใน code โดยตรงตามบทความ

ก่อนอื่นเริ่มจากการสร้าง secret key ก่อน โดยในที่นี้จะใช้ the built-in Node.js `crypto` module
โดยรันคำสั่งต่อไปนี้ใน terminal เพื่อสร้าง secret key:
```shell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
จากนั้นนำ secret key ที่ได้ไปใส่ใน `.env` file เป็นค่า value ของ `JWT_SECRET`
```
JWT_SECRET=your_generated_secret_key_here
```

ใน `app.module.ts` ทำการ import และ register the `ConfigModule` โดยใช้ `ConfigModule.forRoot()` เพื่อโหลดและอ่านค่า environment variables ซึ่งโดยค่าเริ่มต้นจะอ่านจาก `.env` file ใน project root directory:
```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ArticlesModule } from './articles/articles.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes the ConfigService available everywhere
    }),
    PrismaModule,
    ArticlesModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

จากนั้น inject และใช้งาน `ConfigService` ใน `auth.module.ts` file:
```ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '60m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
```
