import nodemailer from 'nodemailer';
import env from '../config/env';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: env.SMTP_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${resetToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">পাসওয়ার্ড রিসেট</h2>
        <p>আপনার পাসওয়ার্ড রিসেট করার জন্য নিচের লিঙ্কে ক্লিক করুন:</p>
        <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">পাসওয়ার্ড রিসেট করুন</a>
        <p style="margin-top: 20px; color: #666;">এই লিঙ্ক ১ ঘন্টা পরে মেয়াদ শেষ হবে।</p>
        <p style="color: #666;">যদি আপনি পাসওয়ার্ড রিসেট করতে না চান, তাহলে এই ইমেইল উপেক্ষা করুন।</p>
      </div>
    `;

    const text = `পাসওয়ার্ড রিসেট করার জন্য এই লিঙ্কে যান: ${resetUrl}`;

    await this.sendEmail({
      to: email,
      subject: 'পাসওয়ার্ড রিসেট - ক্লিন কেয়ার',
      html,
      text,
    });
  }

  async sendEmailVerificationEmail(email: string, verificationToken: string): Promise<void> {
    const verificationUrl = `${env.CLIENT_URL}/verify-email?token=${verificationToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">ইমেইল ভেরিফিকেশন</h2>
        <p>আপনার ইমেইল ভেরিফাই করার জন্য নিচের লিঙ্কে ক্লিক করুন:</p>
        <a href="${verificationUrl}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">ইমেইল ভেরিফাই করুন</a>
        <p style="margin-top: 20px; color: #666;">এই লিঙ্ক ২৪ ঘন্টা পরে মেয়াদ শেষ হবে।</p>
      </div>
    `;

    const text = `ইমেইল ভেরিফাই করার জন্য এই লিঙ্কে যান: ${verificationUrl}`;

    await this.sendEmail({
      to: email,
      subject: 'ইমেইল ভেরিফিকেশন - ক্লিন কেয়ার',
      html,
      text,
    });
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">স্বাগতম, ${firstName}!</h2>
        <p>ক্লিন কেয়ার পরিবারে আপনাকে স্বাগতম।</p>
        <p>এখন আপনি আমাদের সেবা ব্যবহার করতে পারবেন:</p>
        <ul>
          <li>সহজেই ক্লিনিং সার্ভিস বুক করা</li>
          <li>আপনার বুকিং ট্র্যাক করা</li>
          <li>পেমেন্ট ম্যানেজমেন্ট</li>
        </ul>
        <p>আপনার অ্যাকাউন্ট সম্পূর্ণ করতে আপনার প্রোফাইল আপডেট করুন।</p>
      </div>
    `;

    const text = `স্বাগতম, ${firstName}! ক্লিন কেয়ারে আপনার অ্যাকাউন্ট তৈরি হয়েছে।`;

    await this.sendEmail({
      to: email,
      subject: 'স্বাগতম - ক্লিন কেয়ার',
      html,
      text,
    });
  }

  async sendVerificationEmail(email: string, data: { userName: string; verificationCode: string; expiryMinutes: number }): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2E8B57 0%, #7CC289 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">ক্লিন কেয়ার বাংলাদেশ</h1>
          <p style="color: white; margin: 10px 0 0 0;">ইমেইল ভেরিফিকেশন</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #2E8B57; margin-top: 0;">হ্যালো ${data.userName}!</h2>
          
          <p>ক্লিন কেয়ার বাংলাদেশে নিবন্ধনের জন্য ধন্যবাদ। আপনার নিবন্ধন সম্পূর্ণ করতে আপনার ইমেইল ভেরিফাই করুন।</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
            <p style="margin: 0 0 10px 0; color: #666;">আপনার ভেরিফিকেশন কোড:</p>
            <h1 style="color: #2E8B57; font-size: 36px; letter-spacing: 8px; margin: 10px 0;">${data.verificationCode}</h1>
            <p style="margin: 10px 0 0 0; color: #999; font-size: 14px;">এই কোড ${data.expiryMinutes} মিনিটের মধ্যে মেয়াদ শেষ হবে</p>
          </div>
          
          <p>অ্যাপে এই কোড প্রবেশ করুন আপনার অ্যাকাউন্ট সক্রিয় করতে।</p>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            যদি আপনি এই ভেরিফিকেশন অনুরোধ করেননি, তাহলে এই ইমেইল উপেক্ষা করুন।
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            © 2025 ক্লিন কেয়ার বাংলাদেশ। সর্বাধিকার সংরক্ষিত।
          </p>
        </div>
      </div>
    `;

    const text = `হ্যালো ${data.userName},\n\nআপনার ভেরিফিকেশন কোড: ${data.verificationCode}\n\nএই কোড ${data.expiryMinutes} মিনিটের মধ্যে মেয়াদ শেষ হবে।\n\nধন্যবাদ,\nক্লিন কেয়ার বাংলাদেশ`;

    await this.sendEmail({
      to: email,
      subject: 'ইমেইল ভেরিফিকেশন - ক্লিন কেয়ার বাংলাদেশ',
      html,
      text,
    });
  }
}

export default new EmailService();