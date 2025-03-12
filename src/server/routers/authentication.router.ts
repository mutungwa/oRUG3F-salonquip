import { Configuration } from '@/core/configuration'
import { Trpc } from '@/core/trpc/server'
import { TRPCError } from '@trpc/server'
import * as Bcrypt from 'bcryptjs'
import * as Jwt from 'jsonwebtoken'
import { z } from 'zod'
import { EmailService } from '../libraries/email'

// Enhanced input validation schemas
const passwordSchema = z.string()
  .min(6, 'Password must have at least 6 characters')
  .max(100, 'Password is too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

const userInputSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(2, 'Name is too short').max(50, 'Name is too long'),
  pictureUrl: z.string().url().optional(),
  password: passwordSchema,
})

export const AuthenticationRouter = Trpc.createRouter({
  register: Trpc.procedurePublic
    .input(userInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if email is already registered
        const userExisting = await ctx.databaseUnprotected.user.findUnique({
          where: { email: input.email.toLowerCase() }, // Normalize email
          select: { id: true } // Only select needed fields
        })

        if (userExisting) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Email is already registered',
          })
        }

        // Check if this is the first user
        const userCount = await ctx.databaseUnprotected.user.count();
        const isFirstUser = userCount === 0;

        // Hash password and create user
        const passwordHashed = await hashPassword(input.password)

        // Create user with appropriate role
        const userData = {
          ...input,
          email: input.email.toLowerCase(), // Normalize email
          password: passwordHashed,
        };

        const user = await ctx.databaseUnprotected.user.create({
          data: userData,
          select: { id: true } // Only return necessary data
        });

        // If this is the first user, make them an admin
        if (isFirstUser) {
          // Create admin role for the user
          await ctx.databaseUnprotected.role.create({
            data: {
              name: 'admin',
              userId: user.id
            }
          });

          // Create admin record
          await ctx.databaseUnprotected.admin.create({
            data: {
              userId: user.id
            }
          });

          console.info('First user registered as admin', { userId: user.id });
        } else {
          console.info('User registered as regular user', { userId: user.id });
        }

        return { id: user.id }
      } catch (error) {
        console.error('Registration failed', { error, email: input.email })
        throw error
      }
    }),

  sendResetPasswordEmail: Trpc.procedurePublic
    .input(z.object({ 
      email: z.string().email('Invalid email format') 
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Find user without throwing
        const user = await ctx.databaseUnprotected.user.findUnique({
          where: { email: input.email.toLowerCase() },
          select: { id: true, email: true, name: true }
        })

        // Don't reveal if user exists
        if (!user) {
          console.info('Reset password requested for non-existent user', { email: input.email })
          return { success: true }
        }

        const payload = { 
          userId: user.id,
          version: '1.0', // For future token versioning
          timestamp: Date.now()
        }

        const secret = Configuration.getAuthenticationSecret()
        const TIME_24_HOURS = 60 * 60 * 24

        const token = Jwt.sign(payload, secret, { 
          expiresIn: TIME_24_HOURS,
          algorithm: 'HS256' // Explicitly specify algorithm
        })

        const url = Configuration.getBaseUrl()
        const urlResetPassword = `${url}/reset-password/${token}`

        // Define the HTML template
        const htmlTemplate = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
            <style>
              .email-container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                font-family: Arial, sans-serif;
                color: #333;
              }
              .button {
                display: inline-block;
                padding: 10px 20px;
                margin-top: 20px;
                background-color: #007bff;
                color: #fff;
                text-decoration: none;
                border-radius: 5px;
              }
            </style>
          </head>
          <body>
            <div class="email-container">
              <h1>Hello, ${user.name ?? user.email}</h1>
              <p>We received a request to reset your password. Click the button below to reset it:</p>
              <a href="${urlResetPassword}" class="button">Reset Password</a>
              <p>If you did not request a password reset, please ignore this email.</p>
            </div>
          </body>
          </html>
        `;

        await EmailService.send({
          type: EmailService.Type.AUTHENTICATION_FORGOT_PASSWORD,
          email: user.email,
          name: user.name ?? user.email,
          subject: `Reset your password`,
          content: htmlTemplate,
          variables: {},
        })

        console.info('Reset password email sent', { userId: user.id })
        return { success: true }

      } catch (error) {
        console.error('Failed to send reset password email', { 
          error,
          email: input.email 
        })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Could not send the email',
        })
      }
    }),

  resetPassword: Trpc.procedurePublic
    .input(z.object({ 
      token: z.string(),
      password: passwordSchema
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const secret = Configuration.getAuthenticationSecret()

        // Verify and decode token
        const decoded = Jwt.verify(input.token, secret, {
          algorithms: ['HS256'] // Explicitly specify allowed algorithms
        }) as { userId: string; version: string; timestamp: number }

        // Check token age as additional security
        const tokenAge = Date.now() - decoded.timestamp
        if (tokenAge > 24 * 60 * 60 * 1000) { // 24 hours in milliseconds
          throw new Error('Token expired')
        }

        // Find and update user
        const user = await ctx.databaseUnprotected.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, email: true }
        })

        if (!user) {
          throw new Error('User not found')
        }

        const passwordHashed = await hashPassword(input.password)

        await ctx.databaseUnprotected.user.update({
          where: { id: user.id },
          data: {
            password: passwordHashed,
          },
        })

        console.info('Password reset successful', { userId: user.id })
        return { success: true }

      } catch (error) {
        console.error('Password reset failed', { error })
        
        if (error.message === 'Token expired') {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Reset password link has expired',
          })
        }

        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired reset password link',
        })
      }
    }),
})

// Enhanced password hashing with Promise support
const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12 // Increased from 10 for better security
  try {
    const salt = await Bcrypt.genSalt(saltRounds)
    return await Bcrypt.hash(password, salt)
  } catch (error) {
    console.error('Password hashing failed', { error })
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unable to process password',
    })
  }
}