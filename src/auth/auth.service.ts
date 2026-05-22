import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Auth, Role } from './schemas/auth.schema';
import { InjectModel } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { LoginUserDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { MailService } from '../mail/mail.service';
import { CreateUserDto } from './dto/auth.dto';
import { Otp } from './schemas/otp.schema';
import { ChangePasswordDto } from './dto/ChangePassword.dto';

const BCRYPT_ROUNDS = 10;
const OTP_MAX_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Auth.name) private authModel: mongoose.Model<Auth>,
    @InjectModel(Otp.name)
    private optModel: mongoose.Model<Otp>,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async validateUser(username: string, password: string): Promise<Auth | null> {
    const user = await this.authModel.findOne({ username });
    if (user && (await bcrypt.compare(password, user.password))) {
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
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

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

  async listUsers(): Promise<Auth[]> {
    return this.authModel.find().select('-password').exec();
  }

  async generateOtp(body: CreateUserDto): Promise<{ status: string }> {
    const { email } = body;
    const user = await this.authModel.findOne({ email });

    if (!user) {
      throw new BadRequestException('Email does not exist');
    }

    const otpCode = crypto.randomInt(100000, 1000000).toString();
    const hashedOtp = await bcrypt.hash(otpCode, BCRYPT_ROUNDS);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.optModel.findOneAndUpdate(
      { email: user.email },
      { $set: { code: hashedOtp, expiresAt, attempts: 0 } },
      { upsert: true, new: true },
    );

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

    await this.mailService.enqueue({
      to: user.email,
      subject: 'Otp verifier',
      html: htmlContent,
    });

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
    if (!otp) {
      throw new BadRequestException('Invalid Otp');
    }

    if ((otp.attempts ?? 0) >= OTP_MAX_ATTEMPTS) {
      await this.optModel.deleteOne({ _id: otp._id });
      throw new BadRequestException('Too many attempts. Request a new OTP.');
    }

    const matches = await bcrypt.compare(query.code, otp.code);
    if (!matches) {
      await this.optModel.updateOne(
        { _id: otp._id },
        { $inc: { attempts: 1 } },
      );
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

    const hashedPassword = await bcrypt.hash(body.newPassword, BCRYPT_ROUNDS);

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
