import { Trpc } from '@/core/trpc/server'
import { z } from 'zod'

export const stockTransferRouter = Trpc.createRouter({
  create: Trpc.procedure
    .input(z.object({
      quantity: z.number(),
      transferDate: z.string(),
      itemId: z.string(),
      fromBranchId: z.string(),
      toBranchId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await ctx.prisma.stockTransfer.create({
          data: {
            quantity: input.quantity,
            transferDate: input.transferDate,
            itemId: input.itemId,
            fromBranchId: input.fromBranchId,
            toBranchId: input.toBranchId
          },
          include: {
            item: true,
            fromBranch: true,
            toBranch: true
          }
        })

        console.log('Created transfer:', JSON.stringify(result, null, 2))
        return result
      } catch (error) {
        console.error('Error creating transfer:', error)
        throw error
      }
    }),

  findMany: Trpc.procedure
    .input(z.object({}).optional())
    .query(async ({ ctx }) => {
      try {
        // First, let's check if we can get any transfers at all
        const transferCount = await ctx.prisma.stockTransfer.count()
        console.log('Total transfers in database:', transferCount)

        // Now let's get the transfers with their relations
        const transfers = await ctx.prisma.stockTransfer.findMany({
          include: {
            item: true,
            fromBranch: true,
            toBranch: true
          },
          orderBy: {
            transferDate: 'desc'
          }
        })

        // Debug logging
        if (transfers.length > 0) {
          console.log('Sample transfer data:', {
            id: transfers[0].id,
            itemName: transfers[0].item?.name,
            fromBranch: transfers[0].fromBranch?.name,
            toBranch: transfers[0].toBranch?.name
          })
        }

        return transfers
      } catch (error) {
        console.error('Error fetching transfers:', error)
        throw error
      }
    })
}) 