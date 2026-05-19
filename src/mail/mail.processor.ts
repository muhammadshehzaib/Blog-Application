import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import * as nodemailer from 'nodemailer';
import { MAIL_QUEUE, SendEmailJobData } from './mail.service';

@Processor(MAIL_QUEUE)
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    super();
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });
  }

  async process(job: Job<SendEmailJobData>): Promise<void> {
    const { to, subject, html } = job.data;
    this.logger.log(`sending email job ${job.id} to ${to}`);

    const result = await this.transporter.sendMail({
      from: process.env.EMAIL,
      to,
      subject,
      html,
    });

    if (!result.accepted?.includes(to)) {
      throw new Error(`SMTP did not accept ${to}`);
    }

    this.logger.log(`email job ${job.id} sent to ${to}`);
  }
}
