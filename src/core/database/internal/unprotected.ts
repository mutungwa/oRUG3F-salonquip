import { Configuration } from '@/core/configuration'
import { PrismaClient } from '@prisma/client'

const createPrismaClient = () => {
  return new PrismaClient({
    log: Configuration.isDevelopment ? ['error', 'warn'] : ['error'],
    transactionOptions: {
      timeout: 30000, // 30 seconds
      maxWait: 10000,  // 10 seconds max wait time to acquire a transaction slot
      isolationLevel: 'ReadCommitted'
    }
  })
}

class Singleton {
  static prisma = createPrismaClient()
}

export const DatabaseUnprotected = Singleton.prisma
