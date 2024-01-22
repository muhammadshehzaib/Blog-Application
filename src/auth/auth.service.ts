import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Auth } from './schemas/auth.schema';
import { InjectModel } from '@nestjs/mongoose';
import mongoose from 'mongoose';


@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Auth.name) private authModel: mongoose.Model<Auth>,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<Auth | null> {
    const user = await this.authModel.findOne({username});
    if (user && user.password === password) {
      return user;
    }
    return null;
  }

  async login(user:Auth): Promise<{ accessToken: string }> {
    const payload = { sub: user.email };
    return {
      accessToken: this.jwtService.sign(payload),
      
    };
    
  }

  async create(username:string,email:string,password:string): Promise<Auth> {
    const user = new this.authModel({ username,email, password, });
    return user.save();
  }


  async findById(id: string): Promise<Auth | null> {
    return this.authModel.findById(id).exec();
  }
  
}