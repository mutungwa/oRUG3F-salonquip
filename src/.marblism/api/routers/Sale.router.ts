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

        create: procedure.input($Schema.SaleInputSchema.create).mutation(async ({ ctx, input }) => checkMutate(db(ctx).sale.create(input as any))),

        delete: procedure.input($Schema.SaleInputSchema.delete).mutation(async ({ ctx, input }) => checkMutate(db(ctx).sale.delete(input as any))),

        findFirst: procedure.input($Schema.SaleInputSchema.findFirst).query(({ ctx, input }) => checkRead(db(ctx).sale.findFirst(input as any))),

        findMany: procedure.input($Schema.SaleInputSchema.findMany).query(({ ctx, input }) => checkRead(db(ctx).sale.findMany(input as any))),

        findUnique: procedure.input($Schema.SaleInputSchema.findUnique).query(({ ctx, input }) => checkRead(db(ctx).sale.findUnique(input as any))),

        update: procedure.input($Schema.SaleInputSchema.update).mutation(async ({ ctx, input }) => checkMutate(db(ctx).sale.update(input as any))),

    }
    );
}

export interface ClientType<AppRouter extends AnyRouter, Context = AppRouter['_def']['_config']['$types']['ctx']> {
    create: {

        useMutation: <T extends Prisma.SaleCreateArgs>(opts?: UseTRPCMutationOptions<
            Prisma.SaleCreateArgs,
            TRPCClientErrorLike<AppRouter>,
            Prisma.SaleGetPayload<T>,
            Context
        >,) =>
            Omit<UseTRPCMutationResult<Prisma.SaleGetPayload<T>, TRPCClientErrorLike<AppRouter>, Prisma.SelectSubset<T, Prisma.SaleCreateArgs>, Context>, 'mutateAsync'> & {
                mutateAsync:
                <T extends Prisma.SaleCreateArgs>(variables: T, opts?: UseTRPCMutationOptions<T, TRPCClientErrorLike<AppRouter>, Prisma.SaleGetPayload<T>, Context>) => Promise<Prisma.SaleGetPayload<T>>
            };

    };
    delete: {

        useMutation: <T extends Prisma.SaleDeleteArgs>(opts?: UseTRPCMutationOptions<
            Prisma.SaleDeleteArgs,
            TRPCClientErrorLike<AppRouter>,
            Prisma.SaleGetPayload<T>,
            Context
        >,) =>
            Omit<UseTRPCMutationResult<Prisma.SaleGetPayload<T>, TRPCClientErrorLike<AppRouter>, Prisma.SelectSubset<T, Prisma.SaleDeleteArgs>, Context>, 'mutateAsync'> & {
                mutateAsync:
                <T extends Prisma.SaleDeleteArgs>(variables: T, opts?: UseTRPCMutationOptions<T, TRPCClientErrorLike<AppRouter>, Prisma.SaleGetPayload<T>, Context>) => Promise<Prisma.SaleGetPayload<T>>
            };

    };
    findFirst: {

        useQuery: <T extends Prisma.SaleFindFirstArgs, TData = Prisma.SaleGetPayload<T>>(
            input: Prisma.SelectSubset<T, Prisma.SaleFindFirstArgs>,
            opts?: UseTRPCQueryOptions<string, T, Prisma.SaleGetPayload<T>, TData, Error>
        ) => UseTRPCQueryResult<
            TData,
            TRPCClientErrorLike<AppRouter>
        >;
        useInfiniteQuery: <T extends Prisma.SaleFindFirstArgs>(
            input: Omit<Prisma.SelectSubset<T, Prisma.SaleFindFirstArgs>, 'cursor'>,
            opts?: UseTRPCInfiniteQueryOptions<string, T, Prisma.SaleGetPayload<T>, Error>
        ) => UseTRPCInfiniteQueryResult<
            Prisma.SaleGetPayload<T>,
            TRPCClientErrorLike<AppRouter>
        >;

    };
    findMany: {

        useQuery: <T extends Prisma.SaleFindManyArgs, TData = Array<Prisma.SaleGetPayload<T>>>(
            input: Prisma.SelectSubset<T, Prisma.SaleFindManyArgs>,
            opts?: UseTRPCQueryOptions<string, T, Array<Prisma.SaleGetPayload<T>>, TData, Error>
        ) => UseTRPCQueryResult<
            TData,
            TRPCClientErrorLike<AppRouter>
        >;
        useInfiniteQuery: <T extends Prisma.SaleFindManyArgs>(
            input: Omit<Prisma.SelectSubset<T, Prisma.SaleFindManyArgs>, 'cursor'>,
            opts?: UseTRPCInfiniteQueryOptions<string, T, Array<Prisma.SaleGetPayload<T>>, Error>
        ) => UseTRPCInfiniteQueryResult<
            Array<Prisma.SaleGetPayload<T>>,
            TRPCClientErrorLike<AppRouter>
        >;

    };
    findUnique: {

        useQuery: <T extends Prisma.SaleFindUniqueArgs, TData = Prisma.SaleGetPayload<T>>(
            input: Prisma.SelectSubset<T, Prisma.SaleFindUniqueArgs>,
            opts?: UseTRPCQueryOptions<string, T, Prisma.SaleGetPayload<T>, TData, Error>
        ) => UseTRPCQueryResult<
            TData,
            TRPCClientErrorLike<AppRouter>
        >;
        useInfiniteQuery: <T extends Prisma.SaleFindUniqueArgs>(
            input: Omit<Prisma.SelectSubset<T, Prisma.SaleFindUniqueArgs>, 'cursor'>,
            opts?: UseTRPCInfiniteQueryOptions<string, T, Prisma.SaleGetPayload<T>, Error>
        ) => UseTRPCInfiniteQueryResult<
            Prisma.SaleGetPayload<T>,
            TRPCClientErrorLike<AppRouter>
        >;

    };
    update: {

        useMutation: <T extends Prisma.SaleUpdateArgs>(opts?: UseTRPCMutationOptions<
            Prisma.SaleUpdateArgs,
            TRPCClientErrorLike<AppRouter>,
            Prisma.SaleGetPayload<T>,
            Context
        >,) =>
            Omit<UseTRPCMutationResult<Prisma.SaleGetPayload<T>, TRPCClientErrorLike<AppRouter>, Prisma.SelectSubset<T, Prisma.SaleUpdateArgs>, Context>, 'mutateAsync'> & {
                mutateAsync:
                <T extends Prisma.SaleUpdateArgs>(variables: T, opts?: UseTRPCMutationOptions<T, TRPCClientErrorLike<AppRouter>, Prisma.SaleGetPayload<T>, Context>) => Promise<Prisma.SaleGetPayload<T>>
            };

    };
}
