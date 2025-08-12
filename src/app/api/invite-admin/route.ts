import { db } from '@/core/database';
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { z } from 'zod';

const inviteSchema = z.object({
  email: z.string().email(),
  inviterName: z.string(),
  companyName: z.string().optional().default('SalonQuip'),
  inviterUserId: z.string(),
});

// Gmail transporter configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER, // Your Gmail address
      pass: process.env.GMAIL_APP_PASSWORD, // Your Gmail app password
    },
  });
};

// Generate invitation token (you might want to store this in database)
const generateInvitationToken = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Create HTML email template
const createInvitationEmailTemplate = (inviterName: string, companyName: string, invitationLink: string) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Admin Invitation - ${companyName}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .button {
          display: inline-block;
          background: #52c41a;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          color: #666;
          font-size: 14px;
        }
        .warning {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎉 You're Invited!</h1>
        <p>Admin Access to ${companyName}</p>
      </div>
      
      <div class="content">
        <h2>Hello there!</h2>
        
        <p><strong>${inviterName}</strong> has invited you to join <strong>${companyName}</strong> as an administrator.</p>
        
        <p>As an admin, you'll have access to:</p>
        <ul>
          <li>📊 Full dashboard and analytics</li>
          <li>👥 User management</li>
          <li>📦 Inventory control</li>
          <li>💰 Sales tracking</li>
          <li>🏢 Branch management</li>
          <li>🎁 Loyalty program administration</li>
        </ul>
        
        <div style="text-align: center;">
          <a href="${invitationLink}" class="button">Accept Invitation</a>
        </div>
        
        <div class="warning">
          <strong>⚠️ Important:</strong> This invitation link will expire in 7 days. Please accept it as soon as possible.
        </div>
        
        <p>If you have any questions, please contact <strong>${inviterName}</strong> or reply to this email.</p>
        
        <p>Welcome to the team!</p>
      </div>
      
      <div class="footer">
        <p>This invitation was sent by ${companyName}</p>
        <p>If you didn't expect this invitation, you can safely ignore this email.</p>
      </div>
    </body>
    </html>
  `;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, inviterName, companyName, inviterUserId } = inviteSchema.parse(body);

    // Normalize email to lowercase for consistency
    const normalizedEmail = email.toLowerCase();

    // Check if required environment variables are set
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return NextResponse.json(
        { error: 'Email configuration is not set up. Please configure GMAIL_USER and GMAIL_APP_PASSWORD environment variables.' },
        { status: 500 }
      );
    }

    // Check if user with this email already exists
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists.' },
        { status: 400 }
      );
    }

    // Check if there's already a pending invitation for this email
    const existingInvitation = await db.invitation.findFirst({
      where: {
        email: normalizedEmail,
        status: 'pending',
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'An invitation for this email is already pending.' },
        { status: 400 }
      );
    }

    // Generate invitation token and link
    const invitationToken = generateInvitationToken();
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const invitationLink = `${baseUrl}/register?token=${invitationToken}&email=${encodeURIComponent(normalizedEmail)}&type=admin`;

    // Calculate expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Store invitation in database
    const invitation = await db.invitation.create({
      data: {
        email: normalizedEmail,
        token: invitationToken,
        inviterUserId,
        inviterName,
        companyName,
        expiresAt,
        status: 'pending'
      }
    });

    // Create transporter
    const transporter = createTransporter();

    // Email options
    const mailOptions = {
      from: {
        name: companyName,
        address: process.env.GMAIL_USER,
      },
      to: email, // Send to original email for display purposes
      subject: `Admin Invitation - Join ${companyName}`,
      html: createInvitationEmailTemplate(inviterName, companyName, invitationLink),
      text: `
        You've been invited to join ${companyName} as an administrator by ${inviterName}.
        
        Click this link to accept your invitation: ${invitationLink}
        
        This invitation expires in 7 days.
        
        Welcome to the team!
        
        ---
        ${companyName}
      `,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log('Invitation email sent:', info.messageId);

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
      invitationId: invitation.id,
    });

  } catch (error) {
    console.error('Error sending invitation:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to send invitation. Please try again.' },
      { status: 500 }
    );
  }
}
