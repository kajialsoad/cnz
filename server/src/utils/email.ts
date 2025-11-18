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

  async sendEmailVerificationEmail(email: string, verificationCode: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #2E8B57; color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">ইমেইল ভেরিফিকেশন</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">ক্লিন কেয়ার</p>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 40px 30px; border-radius: 0 0 8px 8px;">
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            আপনার অ্যাকাউন্ট ভেরিফাই করতে নিচের কোড ব্যবহার করুন:
          </p>
          
          <div style="background-color: #fff; border: 3px dashed #2E8B57; border-radius: 8px; padding: 30px; margin: 30px 0; text-align: center;">
            <p style="color: #666; font-size: 14px; margin: 0 0 15px 0;">আপনার ভেরিফিকেশন কোড:</p>
            <div style="font-size: 48px; font-weight: bold; color: #2E8B57; letter-spacing: 8px; font-family: 'Courier New', monospace;">
              ${verificationCode}
            </div>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            ⏰ এই কোড <strong>১০ মিনিটের</strong> জন্য বৈধ থাকবে।
          </p>
          
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-top: 20px; border-radius: 4px;">
            <p style="color: #856404; margin: 0; font-size: 13px;">
              <strong>⚠️ সতর্কতা:</strong> এই কোড কারো সাথে শেয়ার করবেন না। আমরা কখনও আপনার কাছে এই কোড চাইব না।
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>ক্লিন কেয়ার - বর্জ্য ব্যবস্থাপনা সিস্টেম</p>
          <p>© ${new Date().getFullYear()} Clean Care. সর্বস্বত্ব সংরক্ষিত।</p>
        </div>
      </div>
    `;

    const text = `
ইমেইল ভেরিফিকেশন - ক্লিন কেয়ার

আপনার ভেরিফিকেশন কোড: ${verificationCode}

এই কোড অ্যাপে প্রবেশ করান। কোড ১০ মিনিটের জন্য বৈধ থাকবে।

এই কোড কারো সাথে শেয়ার করবেন না।
    `;

    await this.sendEmail({
      to: email,
      subject: 'ইমেইল ভেরিফিকেশন কোড - ক্লিন কেয়ার',
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
}

export default new EmailService();