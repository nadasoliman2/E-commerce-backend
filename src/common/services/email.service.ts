import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
interface SendEmailOptions {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  attachments?: any[];
  html: string;
}
@Injectable()
export class EmailService {
  private EMAIL_USER: string;
  private EMAIL_PASS: string;
  private APPLICATION_NAME: string;

  constructor(private readonly configService: ConfigService) {
    this.EMAIL_USER = this.configService.get<string>('EMAIL_USER') as string;
    this.EMAIL_PASS = this.configService.get<string>('EMAIL_PASS') as string;
    this.APPLICATION_NAME = this.configService.get<string>(
      'APPLICATION_NAME',
    ) as string;
  }

  sendEmail = async ({
    to,
    cc,
    bcc,
    subject,
    attachments = [],
    html,
  }: SendEmailOptions): Promise<void> => {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.EMAIL_USER,
        pass: this.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"${this.APPLICATION_NAME}" <${this.EMAIL_USER}>`,
      to,
      subject,
      cc,
      bcc,
      html,
      attachments,
    });
    console.log(`Email sent to ${to} with subject "${subject}"`);
  };
  emailTemplete = ({ title, otp }: { title: string; otp: number }): string => {
    return `
  <div style="font-family:Arial, sans-serif; background:#f4f4f4; padding:20px;">
    <div style="max-width:600px; margin:auto; background:#ffffff; padding:30px; border-radius:10px; text-align:center;">
      
      <h2 style="color:#333;">
        ${title}
      </h2>

      <p style="font-size:16px; color:#555;">
        Use the following OTP to complete your request:
      </p>

      <div style="
        font-size:30px;
        letter-spacing:6px;
        font-weight:bold;
        background:#f2f2f2;
        padding:15px;
        border-radius:8px;
        margin:20px 0;
        display:inline-block;
      ">
        ${otp}
      </div>

      <p style="font-size:14px; color:#999;">
        This OTP is valid for a limited time.
      </p>

    </div>
  </div>
  `;
  };
}
