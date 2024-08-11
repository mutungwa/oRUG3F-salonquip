/* eslint-disable */
import { type RouterFactory, type ProcBuilder, type BaseConfig, db } from ".";
import * as _Schema from '@zenstackhq/runtime/zod/input';
const $Schema: typeof _Schema = (_Schema as any).default ?? _Schema;
import { checkRead, checkMutate } from '../helper';
import type { Prisma } from '@prisma/client';
import type { UseTRPCMutationOptions, UseTRPCMutationResult, UseTRPCQueryOptions, UseTRPCQueryResult, UseTRPCInfiniteQueryOptions, UseTRPCInfiniteQueryResult } from '@trpc/react-query/shared';
import type { TRPCClientErrorLike } from '@trpc/client';
import type { AnyRouter } from '@trpc/server';

export default function createRouter<Config extends BaseConfig>(router: RouterFactory<Config>, procedure: ProcBuilder<Config>) {
    return router({

        create: procedure.input($Schema.StockTransferInputSchema.create).mutation(async ({ ctx, input }) => checkMutate(db(ctx).stockTransfer.create(input as any))),

        delete: procedure.input($Schema.StockTransferInputSchema.delete).mutation(async ({ ctx, input }) => checkMutate(db(ctx).stockTransfer.delete(input as any))),

        findFirst: procedure.input($Schema.StockTransferInputSchema.findFirst).query(({ ctx, input }) => checkRead(db(ctx).stockTransfer.findFirst(input as any))),

        findMany: procedure.input($Schema.StockTransferInputSchema.findMany).query(({ ctx, input }) => checkRead(db(ctx).stockTransfer.findMany(input as any))),

        findUnique: procedure.input($Schema.StockTransferInputSchema.findUnique).query(({ ctx, input }) => checkRead(db(ctx).stockTransfer.findUnique(input as any))),

        update: procedure.input($Schema.StockTransferInputSchema.update).mutation(async ({ ctx, input }) => checkMutate(db(ctx).stockTransfer.update(input as any))),

    }
    );
}

export interface ClientType<AppRouter extends AnyRouter, Context = AppRouter['_def']['_config']['$types']['ctx']> {
    create: {

        useMutation: <T extends Prisma.StockTransferCreateArgs>(opts?: UseTRPCMutationOptions<
            Prisma.StockTransferCreateArgs,
            TRPCClientErrorLike<AppRouter>,
            Prisma.StockTransferGetPayload<T>,
            Context
        >,) =>
            Omit<UseTRPCMutationResult<Prisma.StockTransferGetPayload<T>, TRPCClientErrorLike<AppRouter>, Prisma.SelectSubset<T, Prisma.StockTransferCreateArgs>, Context>, 'mutateAsync'> & {
                mutateAsync:
                <T extends Prisma.StockTransferCreateArgs>(variables: T, opts?: UseTRPCMutationOptions<T, TRPCClientErrorLike<AppRouter>, Prisma.StockTransferGetPayload<T>, Context>) => Promise<Prisma.StockTransferGetPayload<T>>
            };

    };
    delete: {

        useMutation: <T extends Prisma.StockTransferDeleteArgs>(opts?: UseTRPCMutationOptions<
            Prisma.StockTransferDeleteArgs,
            TRPCClientErrorLike<AppRouter>,
            Prisma.StockTransferGetPayload<T>,
            Context
        >,) =>
            Omit<UseTRPCMutationResult<Prisma.StockTransferGetPayload<T>, TRPCClientErrorLike<AppRouter>, Prisma.SelectSubset<T, Prisma.StockTransferDeleteArgs>, Context>, 'mutateAsync'> & {
                mutateAsync:
                <T extends Prisma.StockTransferDeleteArgs>(variables: T, opts?: UseTRPCMutationOptions<T, TRPCClientErrorLike<AppRouter>, Prisma.StockTransferGetPayload<T>, Context>) => Promise<Prisma.StockTransferGetPayload<T>>
            };

    };
    findFirst: {

        useQuery: <T extends Prisma.StockTransferFindFirstArgs, TData = Prisma.StockTransferGetPayload<T>>(
            input: Prisma.SelectSubset<T, Prisma.StockTransferFindFirstArgs>,
            opts?: UseTRPCQueryOptions<string, T, Prisma.StockTransferGetPayload<T>, TData, Error>
        ) => UseTRPCQueryResult<
            TData,
            TRPCClientErrorLike<AppRouter>
        >;
        useInfiniteQuery: <T extends Prisma.StockTransferFindFirstArgs>(
            input: Omit<Prisma.SelectSubset<T, Prisma.StockTransferFindFirstArgs>, 'cursor'>,
            opts?: UseTRPCInfiniteQueryOptions<string, T, Prisma.StockTransferGetPayload<T>, Error>
        ) => UseTRPCInfiniteQueryResult<
            Prisma.StockTransferGetPayload<T>,
            TRPCClientErrorLike<AppRouter>
        >;

    };
    findMany: {

        useQuery: <T extends Prisma.StockTransferFindManyArgs, TData = Array<Prisma.StockTransferGetPayload<T>>>(
            input: Prisma.SelectSubset<T, Prisma.StockTransferFindManyArgs>,
            opts?: UseTRPCQueryOptions<string, T, Array<Prisma.StockTransferGetPayload<T>>, TData, Error>
        ) => UseTRPCQueryResult<
            TData,
            TRPCClientErrorLike<AppRouter>
        >;
        useInfiniteQuery: <T extends Prisma.StockTransferFindManyArgs>(
            input: Omit<Prisma.SelectSubset<T, Prisma.StockTransferFindManyArgs>, 'cursor'>,
            opts?: UseTRPCInfiniteQueryOptions<string, T, Array<Prisma.StockTransferGetPayload<T>>, Error>
        ) => UseTRPCInfiniteQueryResult<
            Array<Prisma.StockTransferGetPayload<T>>,
            TRPCClientErrorLike<AppRouter>
        >;

    };
    findUnique: {

        useQuery: <T extends Prisma.StockTransferFindUniqueArgs, TData = Prisma.StockTransferGetPayload<T>>(
            input: Prisma.SelectSubset<T, Prisma.StockTransferFindUniqueArgs>,
            opts?: UseTRPCQueryOptions<string, T, Prisma.StockTransferGetPayload<T>, TData, Error>
        ) => UseTRPCQueryResult<
            TData,
            TRPCClientErrorLike<AppRouter>
        >;
        useInfiniteQuery: <T extends Prisma.StockTransferFindUniqueArgs>(
            input: Omit<Prisma.SelectSubset<T, Prisma.StockTransferFindUniqueArgs>, 'cursor'>,
            opts?: UseTRPCInfiniteQueryOptions<string, T, Prisma.StockTransferGetPayload<T>, Error>
        ) => UseTRPCInfiniteQueryResult<
            Prisma.StockTransferGetPayload<T>,
            TRPCClientErrorLike<AppRouter>
        >;

    };
    update: {

        useMutation: <T extends Prisma.StockTransferUpdateArgs>(opts?: UseTRPCMutationOptions<
            Prisma.StockTransferUpdateArgs,
            TRPCClientErrorLike<AppRouter>,
            Prisma.StockTransferGetPayload<T>,
            Context
        >,) =>
            Omit<UseTRPCMutationResult<Prisma.StockTransferGetPayload<T>, TRPCClientErrorLike<AppRouter>, Prisma.SelectSubset<T, Prisma.StockTransferUpdateArgs>, Context>, 'mutateAsync'> & {
                mutateAsync:
                <T extends Prisma.StockTransferUpdateArgs>(variables: T, opts?: UseTRPCMutationOptions<T, TRPCClientErrorLike<AppRouter>, Prisma.StockTransferGetPayload<T>, Context>) => Promise<Prisma.StockTransferGetPayload<T>>
            };

    };
}
