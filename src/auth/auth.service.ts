import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Auth, Role } from './schemas/auth.schema';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Query } from 'mongoose';
import { LoginUserDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';
import { CreateUserDto } from './dto/auth.dto';
import { Otp } from './schemas/otp.schema';
import { ChangePasswordDto } from './dto/ChangePassword.dto';
@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Auth.name) private authModel: mongoose.Model<Auth>,
    @InjectModel(Otp.name) //inject the model into this class
    private optModel: mongoose.Model<Otp>,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<Auth | null> {
    const user = await this.authModel.findOne({ username });
    if (user && bcrypt.compareSync(password, user.password)) {
      return user;
    }
    return null;
  }

  async login(
    user: LoginUserDto,
  ): Promise<{ accessToken: string; user: Object }> {
    const userId = await this.authModel.findOne({ username: user.username });
    if (!userId) {
      throw new NotFoundException('user NOT FOUND');
    }
    const payload = { sub: userId._id };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: userId._id,
    };
  }

  async create(
    username: string,
    email: string,
    password: string,
    role: Role,
  ): Promise<Auth> {
    const hashedPassword = bcrypt.hashSync(password, 10); // Hash the password

    const user = new this.authModel({
      username,
      email,
      password: hashedPassword,
      role,
    });
    return user.save();
  }

  async findById(id: string): Promise<Auth | null> {
    return this.authModel.findById(id).exec();
  }

  async generateOtp(body: CreateUserDto): Promise<any> {
    const { email } = body;
    console.log('front', email);
    const user = await this.authModel.findOne({ email: email });

    if (!user) {
      throw new BadRequestException('Email does not exist');
    }
    const otpExist = await this.optModel.findOne({ email: user.email });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    const htmlContent = `
      <html>
        <head>
          <title>Otp verifier</title>
        </head>
        <body>
          <p>Hello ${user.username},</p>
          <p>Your OTP code is: ${otpCode}</p>
          <p>This is from nuntium</p>
          <p>Please ignore this email if you did not request to log in.</p>
        </body>
      </html>
    `;
    const message = {
      from: process.env.EMAIL,
      to: user.email,
      subject: 'Otp verifier',
      html: htmlContent,
    };
    const mailResponse = await transporter.sendMail(message);
    console.log('mailResponse', mailResponse);
    let otpResponse;
    if (mailResponse.accepted.includes(user.email)) {
      if (!otpExist) {
        const otp = await this.optModel.create({
          email: user.email,
          code: otpCode,
        });
        console.log('otp in db', otp);
        otpResponse = {
          message: 'OTP generated successfully',
          otpCode,
          status: 200,
        };
        // return otpCode
      } else {
        const updateOtp = await this.optModel.findOneAndUpdate(
          { email: user.email },
          {
            $set: {
              code: otpCode,
              expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            },
          },
          { new: true }, // Return the updated document
        );
        console.log('updated otp', updateOtp);
        otpResponse = {
          message: 'OTP updated successfully',
          otpCode,
          status: 200,
        };
        // return updateOtp.code
      }
    } else {
      otpResponse = {
        message: 'Failed to send OTP',
        otpCode: null,
        status: 401,
      };
    }
    return otpResponse;
  }
  async verifyOtp(query: { code: string }, body: CreateUserDto): Promise<any> {
    console.log('verifyOtp query', query);
    console.log('verifyOtp body', body);
    const otp: any = await this.optModel.findOne({
      email: body.email,
      code: query.code,
      expiresAt: { $gt: new Date() },
    });
    console.log('verfified otp', otp);
    if (otp) {
      return { matched: true };
    } else {
      throw new BadRequestException('Invalid Otp');
    }
  }
  async changePassword(body: LoginUserDto): Promise<any> {
    const user = await this.authModel.findOne({ username: body.username });

    if (!user) {
      throw new BadRequestException('Username does not exist');
    }
    const hashedPassword = bcrypt.hashSync(body.password, 10);

    const res = await this.authModel.findOneAndUpdate(
      { username: user.username },
      { password: hashedPassword },
      {
        new: true,
      },
    );

    return res.save();
  }
}
