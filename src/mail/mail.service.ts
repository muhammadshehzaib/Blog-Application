import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

export const MAIL_QUEUE = 'mail';
export const SEND_EMAIL_JOB = 'send-email';

export interface SendEmailJobData {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class MailService {
  constructor(
    @InjectQueue(MAIL_QUEUE) private readonly mailQueue: Queue<SendEmailJobData>,
  ) {}

  async enqueue(data: SendEmailJobData): Promise<void> {
    await this.mailQueue.add(SEND_EMAIL_JOB, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 30_000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
    });
  }
}
