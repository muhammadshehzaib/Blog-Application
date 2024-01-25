import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Auth, Role } from './schemas/auth.schema';
import { InjectModel } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { LoginUserDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Auth.name) private authModel: mongoose.Model<Auth>,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<Auth | null> {
    const user = await this.authModel.findOne({ username });
    if (user && user.password === password) {
      return user;
    }
    return null;
  }

  async login(user: LoginUserDto): Promise<{ accessToken: string }> {
    const userId = await this.authModel.findOne({ username: user.username });

    if (!userId) {
      throw new NotFoundException('user NOT FOUND');
    }
    console.log(userId);
    const payload = { sub: userId._id };
    // console.log('Shehzaib ' + );
    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }

  async create(
    username: string,
    email: string,
    password: string,
    role: Role,
  ): Promise<Auth> {
    const user = new this.authModel({ username, email, password, role });
    return user.save();
  }

  async findById(id: string): Promise<Auth | null> {
    return this.authModel.findById(id).exec();
  }
}
