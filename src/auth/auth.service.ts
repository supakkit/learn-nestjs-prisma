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
