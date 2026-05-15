import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Auth, Role } from './schemas/auth.schema';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Query } from 'mongoose';
import { LoginUserDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
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
    const payload = {
      sub: userId._id,
      tokenVersion: userId.tokenVersion ?? 0,
    };

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

  async generateOtp(body: CreateUserDto): Promise<{ status: string }> {
    const { email } = body;
    const user = await this.authModel.findOne({ email });

    if (!user) {
      throw new BadRequestException('Email does not exist');
    }

    const otpCode = crypto.randomInt(100000, 1000000).toString();
    const hashedOtp = bcrypt.hashSync(otpCode, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

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
    const mailResponse = await transporter.sendMail({
      from: process.env.EMAIL,
      to: user.email,
      subject: 'Otp verifier',
      html: htmlContent,
    });

    if (!mailResponse.accepted.includes(user.email)) {
      return { status: 'failed' };
    }

    await this.optModel.findOneAndUpdate(
      { email: user.email },
      { $set: { code: hashedOtp, expiresAt } },
      { upsert: true, new: true },
    );

    return { status: 'sent' };
  }
  async verifyOtp(query: { code: string }, body: CreateUserDto): Promise<any> {
    if (!query?.code || typeof query.code !== 'string') {
      throw new BadRequestException('Invalid Otp');
    }

    const otp = await this.optModel.findOne({
      email: body.email,
      expiresAt: { $gt: new Date() },
    });
    if (!otp || !bcrypt.compareSync(query.code, otp.code)) {
      throw new BadRequestException('Invalid Otp');
    }

    const user = await this.authModel.findOne({ email: body.email });
    if (!user) {
      throw new BadRequestException('Invalid Otp');
    }

    await this.optModel.deleteOne({ _id: otp._id });

    const resetToken = await this.jwtService.signAsync(
      {
        sub: user._id,
        email: user.email,
        purpose: 'password_reset',
      },
      { expiresIn: '10m' },
    );

    return { matched: true, resetToken };
  }

  async changePassword(body: ChangePasswordDto): Promise<{ success: true }> {
    if (!body.newPassword || body.newPassword.length < 8) {
      throw new BadRequestException(
        'Password must be at least 8 characters long',
      );
    }

    let payload: { sub: string; email: string; purpose: string };
    try {
      payload = await this.jwtService.verifyAsync(body.resetToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    if (payload.purpose !== 'password_reset') {
      throw new UnauthorizedException('Invalid reset token');
    }

    const user = await this.authModel.findById(payload.sub);
    if (!user || user.email !== payload.email) {
      throw new UnauthorizedException('Invalid reset token');
    }

    const hashedPassword = bcrypt.hashSync(body.newPassword, 10);

    await this.authModel.updateOne(
      { _id: user._id },
      {
        $set: { password: hashedPassword },
        $inc: { tokenVersion: 1 },
      },
    );

    return { success: true };
  }

  async changeRole(
    actingUser: Auth & { _id: mongoose.Types.ObjectId },
    targetUserId: string,
    newRole: Role,
  ): Promise<Auth> {
    if (!mongoose.isValidObjectId(targetUserId)) {
      throw new BadRequestException('Invalid user id');
    }

    const target = await this.authModel.findById(targetUserId);
    if (!target) {
      throw new NotFoundException('User not found');
    }

    if (
      target.role === Role.Admin &&
      newRole !== Role.Admin &&
      actingUser._id.toString() === target._id.toString()
    ) {
      throw new BadRequestException('Admins cannot demote themselves');
    }

    target.role = newRole;
    target.tokenVersion = (target.tokenVersion ?? 0) + 1;
    return target.save();
  }
}
