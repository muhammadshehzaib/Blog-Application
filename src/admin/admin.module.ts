import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'mail' })],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
