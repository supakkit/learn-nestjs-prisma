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

### ขั้นตอนการ set up Swagger
ติดตั้ง Swagger:
```shell
npm install --save @nestjs/swagger swagger-ui-express
```

จากนั้นเริ่มต้นใช้งาน Swagger ใน project โดยกำหนดที่ `main.ts`:
```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Median')
    .setDescription('The Median API description')
    .setVersion('0.1')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
```
เท่านี้ เราก็สามารถใช้งาน Swagger ใน project ของเราได้แล้ว สามารถรัน project แล้วดู UI ของมันได้ที่: http://localhost:3000/api

## จัดการ exceptions โดยใช้ global exception filter
### สร้าง manual exception filter
เริ่มจากการสร้าง boilerplate โดยใช้คำสั่ง:
```shell
npx nest generate filter prisma-client-exception
```

จากนั้นใน `prisma-client-exception.filter.ts` file ดักจับ error จาก Prisma แล้วเปลี่ยน class เป็นการ extends จาก `BaseExceptionFilter` class แทน แล้วใช้ switch case ในการตรวจสอบประเภทของ exception จากนั้นจึงสร้าง response object ที่เหมาะสมส่งกลับไปยัง client:
```ts
import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    console.error(exception.message);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const message = exception.message.replace(/\n/g, '');

    switch (exception.code) {
      case 'P2002': {
        const status = HttpStatus.CONFLICT;
        response.status(status).json({
          statusCode: status,
          message: message,
        });
        break;
      }
      case 'P2025': {
        const status = HttpStatus.NOT_FOUND;
        response.status(status).json({
          statusCode: status,
          message: message,
        });
        break;
      }
      default:
        // default 500 error code
        super.catch(exception, host);
        break;
    }
  }
}
```

จากนั้นปรับใช้ exception filter นี้ใน app โดยไปที่ `main.ts` file แล้วเพิ่ม code ดังนี้:
```ts
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { PrismaClientExceptionFilter } from './prisma-client-exception/prisma-client-exception.filter';

// ...

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ...

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```
เท่านี้ เมื่อเกิด error จาก Prisma แทนที่ client จะได้รับแค่ "Internal server error" ก็จะมีรายละเอียด และ status code ที่เฉพาะเจาะจงมากยิ่งขึ้นแล้ว

## Implement CRUD endpoints for Users
### Generate boilerplate files
เริ่มด้วยการสร้างโครงสร้างไฟล์เริ่มต้นสำหรับ users ด้วย Nest CLI โดยใช้คำสั่ง:
```shell
npx nest generate resource
```
จากนั้นจะมี prompt ให้เราระบุรายละเอียดดังนี้:
1. `What name would you like to use for this resource (plural, e.g., "users")?` -> users
2. `What transport layer do you use?` -> REST API
3. `Would you like to generate CRUD entry points?` -> Yes

แล้วเราจะได้ `src/users` directory มาพร้อมกับ boilerplate files ต่างๆ

### ทำการ import `PrismaModule` เข้าไปใน module เพื่อใช้งาน `PrismaService`
โดยไปที่ `users.module.ts` file เพื่อ import `PrismaModule`:
```ts
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [PrismaModule],
})
export class UsersModule {}
```
จากนั้นที่ `users.service.ts` file ให้ inject the `PrismaService` เข้ามาใช้งาน:
```ts
import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}  // <-- inject the `PrismaService`

}
```
เท่านี้เราก็สามารถเรียกใช้งาน `PrismaService` ภายใน `UsersService` class นี้ ได้ผ่าน `prisma` variable

### สร้าง input validation
เพื่อที่จะตรวจสอบ client's input ว่าเป็นไปตามรูปแบบที่เราต้องการหรือไม่ เราจะต้องใช้ built-in NestJS `ValidationPipe` เพื่อบังคับกฎการตรวจสอบที่เรากำหนดไว้ ไปใช้กับทุก incoming client payloads
ซึ่งการกำหนดกฎการตรวจสอบนี้จะกำหนดผ่าน decorators จาก `class-validator` package ดังนั้นก่อนอื่น ติดตั้ง packages 2 ตัวดังนี้:
```shell
npm install class-validator class-transformer
```
- `class-validator` ให้ decorators ที่ใช้สำหรับตรวจสอบ input data
- `class-transformer` ให้ decorators ที่ใช้สำหรับ transform input data ให้อยู่ในรูปแบบที่ต้องการ เช่น แปลง data จากประเภท string เป็น number เป็นต้น

จากนั้น set up `ValidationPipe` ใน `main.ts` file:
```ts
// ...
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());  // <-- set up `ValidationPipe`

  // ...
}
bootstrap();
```
ต่อไปเราก็สามารถกำหนด validation rules ต่างๆ ที่ entity หรือ DTO class เพื่อบังคับใช้กับ incoming input payloads ได้แล้ว

### Exclude `password` field from the response body
เราสามารถลบ `password` field แบบ manual ได้ใน controller route handles หรือใช้ interceptor เพื่อลบมันจาก response body โดยอัตโนมัติก็ได้เช่นกัน ซึ่งเราจะใช้วิธีที่สองนี้กัน
โดย interceptors เป็นการให้เราสามารถเพิ่ม extra logic เข้าไปก่อนหรือหลัง route handler จะถูกดำเนินการ ซึ่งในกรณีคือ เป็นการลบ `password` field จาก response body นั่นเอง
เริ่มจากเปิดใช้งาน `ClassSerializerInterceptor` ใน app ที่ `main.ts` file:
```ts
import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';

// ...

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Enable `ClassSerializerInterceptor` globally
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));  

  // ...

}
bootstrap();
```
ซึ่ง `ClassSerializerInterceptor` ใช้ `class-transformer` package ในการกำหนดรูปแบบที่เราจะ transform objects โดยเราจะใช้ `@Exclude()` decorator จาก `class-transformer` package ในการกำหนดที่ `password` field ใน `UserEntity` class เพื่อยกเว้นมัน จาก response body ในหัวข้อถัดไปนี้

### กำหนด `User` entity class
การกำหนด entity ของ user เป็นการกำหนดลักษณะข้อมูลของมันในชั้นของ API ซึ่งมันจะสะท้อนถึง fields ทั้งหมดที่มีอยู่ใน model นั้นๆ โดยไปที่ `entities/user.entity.ts` file และเพิ่ม properties ของมันดังนี้:
```ts
import { User } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

export class UserEntity implements User {
  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }

  @ApiProperty()
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false, nullable: true })
  name: string | null;

  @ApiProperty()
  email: string;

  @Exclude()
  password: string;
}
```
- `@ApiProperty()` decorator เป็นการระบุว่า property นั้นๆ จะถูกรวมอยู่ใน API properties ที่แสดงใน Swagger หาก property ใดไม่ได้กำหนด แสดงว่ามันจะไม่แสดงอยู่ใน properties ที่ Swagger แต่ยังไม่ได้หมายความว่า property นั้นจะไม่ถูกส่งไปให้ client พร้อมกับ properties อื่นๆ
  - โดย decorator นี้รับ argument เป็น object ที่ระบุ option ต่างๆ ของ field นั้นๆ
- `@Exclude` decorator เป็น decorator จาก `class-transformer` package เพื่อกำหนดให้ `password` field ถูก transform ให้ยกเว้นจากการรวมอยู่ใน response body
- constructor รับค่า object และใช้ `Object.assign()` method ในการคัดลอก properties ที่รับมาเพื่อเป็น `UserEntity` instance

### กำหนด `User` DTO class
การกำหนด DTO (Data Transfer Object) เป็นการกำหนดรูปแบบของ data ที่ต้องการ ที่จะถูกส่งผ่าน network ใน actions ต่างๆ เช่น การสร้าง user ใหม่ หรือการอัปเดท user เป็นต้น ซึ่งเราจะกำหนด validation rules ให้กับ incoming input payloads กันที่นี่นั่นเอง โดยเริ่มจากรูปแบบ data ของการสร้าง user ใหม่ที่ `create-user.dto.ts` file:
```ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  @ApiProperty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @ApiProperty()
  password: string;
}
```
จากนั้นที่ `update-user.dto.ts` file ไม่ได้เพิ่มเติมอะไรเพราะเป็น data รูปแบบเดียวกับการสร้าง user ใหม่ เพียงแต่อาจเป็นแค่บางส่วนของมันเท่านั้้น ซึ่งกำหนดไว้ถูกต้องแล้ว:
```ts
import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {}
```

### กำหนด `UsersService` class
ไปที่ `users.service.ts` file แล้วเรียกใช้งาน `PrismaService` ผ่าน `prisma` variable เพื่อติดต่อกับ database ในการดำเนินการ actions ต่างๆ แล้ว return ผลลัพธ์กลับไป ดังนี้:
```ts
import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

export const roundsOfHashing = 10;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      roundsOfHashing,
    );

    createUserDto.password = hashedPassword;
    return this.prisma.user.create({ data: createUserDto });
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  findOne(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(
        updateUserDto.password,
        roundsOfHashing,
      );
    }

    return this.prisma.user.update({ where: { id }, data: updateUserDto });
  }

  remove(id: number) {
    return this.prisma.user.delete({ where: { id } });
  }
}
```
- แม้การเรียกใช้งาน prisma service จะเป็น Promise แต่หากเรา return Promise ออกไปโตยตรง NestJS มีกลไกในการจัดการกับ Promise ให้เรียบร้อยแล้ว ดังนั้นเราจึงไม่จำเป็นต้องมีการเรียนใช้ async/await แต่หากใน method ของเราต้องมีการนำค่าหลังจากดำเนินการกับ database มาใช้งานต่อ เราจำเป็นต้องระบุ async หน้า method และระบุ await หน้า prisma service เพื่อรอผลลัพธ์ของ Promise

### กำหนด `UsersController` class
```ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserEntity } from './entities/user.entity';

@Controller('users')
@ApiTags('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiCreatedResponse({ type: UserEntity })
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return new UserEntity(user);
  }

  @Get()
  @ApiOkResponse({ type: UserEntity, isArray: true })
  async findAll() {
    const users = await this.usersService.findAll();
    return users.map((user) => new UserEntity(user));
  }

  @Get(':id')
  @ApiOkResponse({ type: UserEntity })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findOne(id);
    if (!user) throw new NotFoundException('User not found');
    return new UserEntity(user);
  }

  @Patch(':id')
  @ApiOkResponse({ type: UserEntity })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.usersService.update(id, updateUserDto);
    return new UserEntity(user);
  }

  @Delete(':id')
  @ApiOkResponse({ type: UserEntity })
  async remove(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.remove(id);
    return new UserEntity(user);
  }
}
```
- `@ApiTags` decorator เป็นการกำหนดกลุ่มของ API ที่ Swagger
- `@ApiCreatedResponse()` และ `@ApiOkResponse()` decorators เป็นการกำหนดรูปแบบ response data ของ endpoint นั้นๆ ที่แสดงที่ Swagger โดยส่ง argument เป็น object ที่ระบุเป็น `{ type: UserEntity }` ซึ่งมันจะทำงานร่วมกับ `@ApiProperty` decorator ที่เรากำหนดไว้ที่ `UserEntity` นั่นเอง
- `ParseIntPipe` โดย Pipe คล้ายกับ middleware ซึ่ง `ParseIntPipe` นี้ทำหน้าที่ในการแปลง data ให้เป็น integer number เรานำมันมาใช้เพื่อแปลง param ที่รับมาในรูปแบบ string ให้เป็น number
- `NotFoundException` class เป็นการจัดการกับ exception ที่เกิดขึ้นในกรณี not found หรือก็คือ 404 error
- และจะสังเกตเห็นว่า เราไม่ได้ return เป็น data ที่ได้จาก database ออกไปโดยตรง แต่ส่งมันเข้าไปเป็น argument ให้กับ `UserEntity` class แล้วส่ง instance ของมันออกไปแทน ซึ่งนี่เป็นวิธีในการควบคุมรูปแบบ data ที่เราต้องการส่งออกไปให้กับ client นั่นเอง

นอกจากนี้ ใน entity อื่นๆ ที่สามารถ populate user ไปได้ เราก็ต้องนำค่า user นั้นไปสร้าง `UserEntity` instance เพื่อส่งออกไป แทนที่จะส่งค่า user ที่ได้ส่งออกไปโดยตรง เนื่องจาก `password` field ใน user เป็นข้อมูลลับที่เราไม่ต้องการส่งกลับไปยัง client ด้วยนั่นเอง ยกตัวอย่างใน `ArticleEntity`:
```ts
constructor({ author, ...data }: Partial<ArticleEntity>) {
  Object.assign(this, data);

  if (author) {
    this.author = new UserEntity(author);
  }
}
```

## Authentication
มีประเภทของ authentication ที่ใช้บน web อยู่ 2 ประเภทหลักได้แก่: _session-based_ authentication และ _token-based_ authentication ซึ่งในที่นี้จะใช้ token-based authentication โดยใช้ [JSON Web Tokens (JWT)](https://jwt.io/)

### Set up the JWT Secret Key in `.env`
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

### Set up `ConfigModule` เพื่อใช้งาน environment variables
ติดตั้ง `@nestjs/config` เพื่อใช้สำหรับดึง environment variables มาใช้งานใน NestJS app:
```shell
npm install --save @nestjs/config
```

ใน `app.module.ts` ทำการ import และ register the `ConfigModule` โดยใช้ `ConfigModule.forRoot()` เพื่อโหลดและอ่านค่า environment variables ซึ่งโดยค่าเริ่มต้นจะอ่านจาก `.env` file ใน project root directory:
```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

// ...

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes the ConfigService available everywhere
    }),
    
    // ...

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### สร้าง endpoints สำหรับทำ authentication
เริ่มจากสร้าง `auth` module เพื่อใช้จัดการเกี่ยวกับ authentication:
```shell
npx nest generate resource
```
จากนั้นจะมี prompt ให้เราระบุรายละเอียดดังนี้:
1. `What name would you like to use for this resource (plural, e.g., "users")?` -> auth
2. `What transport layer do you use?` -> REST API
3. `Would you like to generate CRUD entry points?` -> No

เราก็จะได้ `auth` module ที่อยู่ใน `src/auth` directory

### Import `JwtModule` and `UsersModule` into the `AuthModule`
ติดตั้ง package สำหรับ `JwtModule`:
```shell
npm install --save @nestjs/jwt
```

จากนั้นใน `auth.module.ts` file ให้ import `JwtModule` และ `UsersModule` เข้าไปใช้งาน โดยมีการ inject และใช้งาน `ConfigService` เพื่อดึงค่าของ `JWT_SECRET` จาก `.env` มาใช้ config ค่าให้กับ `JwtModule`:
```ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    UsersModule,   // <-- import the `UsersModule`
    JwtModule.registerAsync({  // <-- import and config the `JwtModule`
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

ซึ่งหาก `UsersModule` ที่ `users.module.ts` file ยังไม่ได้ export `UsresService` ออกมา ให้ export มันออกมาด้วย:
```ts
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [PrismaModule],
  exports: [UsersService],  // <-- export the `UsersService`
})
export class UsersModule {}
```

### Implement a `POST /auth/login` endpoint
สร้าง `dto` directory และสร้าง `login.dto.ts` file เพื่อกำหนดรูปแบบ data ในการ login:
```shell
mkdir src/auth/dto
touch src/auth/dto/login.dto.ts
```

จากนั้นเข้าไปที่ `login.dto.ts` file เพื่อสร้าง `LoginDto` class ขึ้นมาดังนี้:
```ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @ApiProperty()
  password: string;
}
```

ต่อมา สร้าง `entities` directory และสร้าง `auth.entity.ts` file เพื่อกำหนดรูปแบบ data ของ JWT payload:
```shell
mkdir src/auth/entities
touch src/auth/entities/auth.entity.ts
```

จากนั้นเข้าไปที่ `auth.entity.ts` file เพื่อสร้าง `AuthEntity` class ซึ่งแสดงถึงรูปแบบ data ของ JWT payload ดังนี้:
```ts
import { ApiProperty } from '@nestjs/swagger';

export class AuthEntity {
  @ApiProperty()
  accessToken: string;
}
```

ที่ `auth.service.ts` file ให้ inject `UsersService` และ `JwtService` เข้ามาใช้งาน และสร้าง signup และ login methods:
```ts
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { AuthEntity } from './entities/auth.entity';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signup(createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  async login(email: string, password: string): Promise<AuthEntity> {
    // Fetch a user with the given email
    const user = await this.usersService.findByEmail(email);

    // If no user is found, throw an error
    if (!user) {
      throw new NotFoundException(`No user found for email: ${email}`);
    }

    // Check if the password is correct
    const isPasswordValid = await bcrypt.compare(password, user.password);

    // If password does not match, throw an error
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    // Generate a JWT containing the user's ID and return it
    const payload = { userId: user.id };
    const token = this.jwtService.sign(payload);
    return {
      accessToken: token,
    };
  }
}
```

จากนั้นสร้าง `POST /auth/signup` และ `POST /auth/login` routes ใน `AuthController` class ที่ `auth.controller.ts` file:
```ts
import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthEntity } from './entities/auth.entity';
import { LoginDto } from './dto/login.dto';
import { UserEntity } from 'src/users/entities/user.entity';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiCreatedResponse({ type: UserEntity })
  async signup(@Body() createUserDto: CreateUserDto) {
    const user = await this.authService.signup(createUserDto);
    return new UserEntity(user);
  }

  @Post('login')
  @ApiOkResponse({ type: AuthEntity })
  login(@Body() { email, password }: LoginDto) {
    return this.authService.login(email, password);
  }
}
```
ตอนนี้เราก็สามารถทดสอบการ login ได้แล้ว โดยหลังจาก login สำเร็จ เราจะได้รับ JWT token ใน response body โดยในหัวข้อถัดไป เราจะนำ token ที่ได้นี้ไปใช้ในการ authenticate users

### Install and set up `passport` สำหรับทำ authentication
Passport.js เป็น authentication middleware สำหรับ Node.js ซึ่งมันมี strategy ที่หลากหลายที่รองรับการทำ authentication เช่น ด้วย username/password, OAuth, JWT token เป็นต้น ซึ่งในที่นี้จะใช้การ authentication ด้วย JWT token เริ่มด้วยการติดตั้ง packages ที่จำเป็น:
```shell
npm install --save @nestjs/passport passport passport-jwt
npm install --save-dev @types/passport-jwt
```

จากนั้น import `PassportModule` เข้าไปใช้งานใน `AuthModule` ที่ `auth.module.ts` file:
```ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { PassportModule } from '@nestjs/passport';

// ...

@Module({
  imports: [
    UsersModule,
    PassportModule,  // <-- import `PassportModule` into the module

    // ...
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
```

### Implement JWT authentication strategy
เริ่มด้วยการสร้าง `auth/strategies` directory และสร้าง `jwt.strategy.ts` file ภายในนั้น:
```shell
mkdir src/auth/strategies
touch src/auth/strategies/jwt.strategy.ts
```

จากนั้นใน `jwt.strategy.ts` file เพิ่ม code ดังนี้:
```ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private configService: ConfigService) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) throw new Error('Missing jwt secret key.');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtSecret,
    });
  }

  validate(payload: { userId: number }) {
    return payload;
  }
}
```
- จะสังเกตเห็นว่า เราจะอ่าน token ที่ client ส่งมาจาก request header ซึ่งเราจะพูดถึงการเปลี่ยนไปใช้งานที่ cookie ในภายหลัง
- **Note:** ที่ `validate` method ได้เปลี่ยนแปลงต่างจากบทความ โดยจากเดิมเป็นการ return user data ที่ดึงจาก database เปลี่ยนเป็นให้ return payload ออกไปแทน

ต่อมา นำ `JwtStrategy` นี้เพิ่มเข้าไปเป็น provider ใน `AuthModule`:
```ts
// ...

import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
    
  // ...

  providers: [AuthService, JwtStrategy],  // <-- add the `JwtStrategy` as a provider
})
export class AuthModule {}
```

### Implement JWT auth guard
Guards ใน NestJS ใช้สำหรับตรวจสอบว่า request ควรจะถูกอนุญาตให้ถูกดำเนินการต่อในกระบวนการถัดไปหรือไม่ ซึ่งเราจะสร้าง `JwtAuthGuard` เพื่อใช้มัน protect routes ที่จำเป็นต้องมีการ authentication ก่อน เริ่มด้วยการสร้าง custom Guard นี้ขึ้นมาในชื่อ `jwt-auth.guard.ts` ไว้ใน `src/auth` directory:
```shell
touch src/auth/jwt-auth.guard.ts
```

จากนั้นใน `jwt-auth.guard.ts` file เพิ่ม code ดังนี้:
```ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

สุดท้าย นำมันไปปรับใช้กับ endpoints ที่ต้องการ protect routes โดยไปที่ `UsersController` แล้วใช้ `@UseGuards` decorator เพื่อปรับใช้ `JwtAuthGuard` ยกตัวอย่างการปรับใช้กับ `GET /users` route:
```ts
import {
  // ...
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

// ...

@Controller('users')
@ApiTags('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)  // <-- apply the `JwtAuthGuard`
  @ApiOkResponse({ type: UserEntity, isArray: true })
  async findOne(':id') {
    // ...
  }

  // ...
}
```
- โดยให้ปรับใช้กับทุก routes ที่ต้องมีการ authentication ก่อน ทั้ง `GET /users`, `GET /users/:id`, `Patch /users/:id`, และ `DELETE /users/:id` routes

### Integrate authentication in Swagger
ปัจจุบันที่ Swagger ของเรายังไม่มีตัวบ่งบอกว่า endpoints ใดบ้างที่เป็น auth protected ดังนั้น เราจะเพิ่ม `@ApiBearerAuth()` decorator ไว้ที่ controller ที่ endpoints ที่เป็น auth protected อยู่ ดังนี้:
```ts
import {
  // ...
  UseGuards,
} from '@nestjs/common';
import {
  // ...
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

// ...

@Controller('users')
@ApiTags('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()  // <-- indidate that authentication is required
  @ApiOkResponse({ type: UserEntity, isArray: true })
  async findAll() {
    // ...
  }

  // ...
}
```

ซึ่ง app เราตอนนี้ยังไม่สามารถ authenticate เพื่อทดสอบ endpoints ที่ถูก protected นี้ได้ ดังนั้นเพื่อให้สามารถทดสอบ endpoints เหล่านี้ เราสามารถเพิ่มการ authentication ใน Swagger โดยการเพิ่มการเรียกใช้งาน `.addBearerAuth()` method ของ `SwaggerModule` setup ใน `main.ts` file ได้:
```ts
// ...

async function bootstrap() {
  
  // ...

  const config = new DocumentBuilder()
    .setTitle('Median')
    .setDescription('The Median API description')
    .setVersion('0.1')
    .addBearerAuth()  // <-- call the `addBearerAuth()` method
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
```

ตอนนี้ระบบ authentication ใน app ของเราก็พร้อมใช้งานแล้ว

## Additional - Authentication
ในหัวข้อนี้เป็นส่วนที่เพิ่มเติมขึ้นมานอกเหนือจากเนื่อหาในบทความที่เราใช้อ้างอิง โดยจะเพิ่มการ `GET /profile` route และเพิ่มการเปลี่ยนการเก็บ token มาไว้ที่ cookie ซึ่งอ้างอิงเนื้อหาจากบทความ: [มาทำ Authentication ด้วย NestJS และ Passport กัน](https://mikelopster.dev/posts/nestjs-passport/)

### เพิ่ม `GET /users/profile` route
สร้าง `auth/interfaces` directory ขึ้นมา และสร้าง `auth-request.interface.ts` file:
```shell
mkdir src/auth/interfaces
touch src/auth/interfaces/auth-request.interface.ts
```

จากนั้นใน `auth-request.interface.ts` file ให้สร้าง type ดังนี้:
```ts
import { Request } from 'express';

export interface AuthRequest extends Request {
  user: {
    userId: string;
  };
}
```

ต่อมาไปที่ `user/users.controller.ts` file แล้วเพิ่ม `GET users/profile` route ขึ้นมา:
```ts
import {
  // ...
  Request,
} from '@nestjs/common';
import type { AuthRequest } from 'src/auth/interfaces/auth-request.interface';

// ...

@Controller('users')
@ApiTags('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: UserEntity })
  async getProfile(@Request() req: AuthRequest) {
    const user = await this.usersService.findOne(req.user.userId);
    if (!user) throw new NotFoundException('User not found');
    return new UserEntity(user);
  }

  // ...
}
```

### เปลี่ยนการเก็บ token มาไว้ที่ cookie
เราจำเป็นต้องมีการอ่านค่าจาก cookie ดังนั้นจึงต้องลง `cookie-parser` package เพื่อช่วยให้เราสามารถอ่านค่าจาก cookie ได้:
```shell
npm install cookie-parser
```

จากนั้น เรียกใช้ `cookie-parser` middleware เพื่อให้มันแปลงค่า cookie จาก request ที่เข้ามา โดยเรียกใช้มันที่ `main.ts` file:
```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ...
  
  app.use(cookieParser());  // <-- apply the `cookie-parser` middleware
  await app.listen(3000);
}
bootstrap();
```

จากนั้นที่ `jwt.strategy.ts` file ให้เปลี่ยนจากการอ่านค่า token จาก request header มาเป็นจาก cookie แทน:
```ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private configService: ConfigService) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) throw new Error('Missing jwt secret key.');

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([ 
        (request: Request) => {
          return request?.cookies?.accessToken;  // <-- change to get the token from cookie
        },
      ]),
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: { userId: number }) {
    return payload;
  }
}
```

และที่ `auth.controller.ts` file เปลี่ยนจากการ return the token กลับไปทาง response body ไปเป็นการเก็บ token เข้าไปใน cookie แทน:
```ts
import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthEntity } from './entities/auth.entity';
import { LoginDto } from './dto/login.dto';
import type { Response } from 'express';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOkResponse({ type: AuthEntity })
  async login(
    @Body() { email, password }: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken } = await this.authService.login(email, password);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
    });
    return { message: 'Logged in successfully' };
  }
}
```
