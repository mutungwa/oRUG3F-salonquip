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

        create: procedure.input($Schema.SaleItemInputSchema.create).mutation(async ({ ctx, input }) => checkMutate(db(ctx).saleItem.create(input as any))),

        delete: procedure.input($Schema.SaleItemInputSchema.delete).mutation(async ({ ctx, input }) => checkMutate(db(ctx).saleItem.delete(input as any))),

        findFirst: procedure.input($Schema.SaleItemInputSchema.findFirst).query(({ ctx, input }) => checkRead(db(ctx).saleItem.findFirst(input as any))),

        findMany: procedure.input($Schema.SaleItemInputSchema.findMany).query(({ ctx, input }) => checkRead(db(ctx).saleItem.findMany(input as any))),

        findUnique: procedure.input($Schema.SaleItemInputSchema.findUnique).query(({ ctx, input }) => checkRead(db(ctx).saleItem.findUnique(input as any))),

        update: procedure.input($Schema.SaleItemInputSchema.update).mutation(async ({ ctx, input }) => checkMutate(db(ctx).saleItem.update(input as any))),

    }
    );
}

export interface ClientType<AppRouter extends AnyRouter, Context = AppRouter['_def']['_config']['$types']['ctx']> {
    create: {

        useMutation: <T extends Prisma.SaleItemCreateArgs>(opts?: UseTRPCMutationOptions<
            Prisma.SaleItemCreateArgs,
            TRPCClientErrorLike<AppRouter>,
            Prisma.SaleItemGetPayload<T>,
            Context
        >,) =>
            Omit<UseTRPCMutationResult<Prisma.SaleItemGetPayload<T>, TRPCClientErrorLike<AppRouter>, Prisma.SelectSubset<T, Prisma.SaleItemCreateArgs>, Context>, 'mutateAsync'> & {
                mutateAsync:
                <T extends Prisma.SaleItemCreateArgs>(variables: T, opts?: UseTRPCMutationOptions<T, TRPCClientErrorLike<AppRouter>, Prisma.SaleItemGetPayload<T>, Context>) => Promise<Prisma.SaleItemGetPayload<T>>
            };

    };
    delete: {

        useMutation: <T extends Prisma.SaleItemDeleteArgs>(opts?: UseTRPCMutationOptions<
            Prisma.SaleItemDeleteArgs,
            TRPCClientErrorLike<AppRouter>,
            Prisma.SaleItemGetPayload<T>,
            Context
        >,) =>
            Omit<UseTRPCMutationResult<Prisma.SaleItemGetPayload<T>, TRPCClientErrorLike<AppRouter>, Prisma.SelectSubset<T, Prisma.SaleItemDeleteArgs>, Context>, 'mutateAsync'> & {
                mutateAsync:
                <T extends Prisma.SaleItemDeleteArgs>(variables: T, opts?: UseTRPCMutationOptions<T, TRPCClientErrorLike<AppRouter>, Prisma.SaleItemGetPayload<T>, Context>) => Promise<Prisma.SaleItemGetPayload<T>>
            };

    };
    findFirst: {

        useQuery: <T extends Prisma.SaleItemFindFirstArgs, TData = Prisma.SaleItemGetPayload<T>>(
            input: Prisma.SelectSubset<T, Prisma.SaleItemFindFirstArgs>,
            opts?: UseTRPCQueryOptions<string, T, Prisma.SaleItemGetPayload<T>, TData, Error>
        ) => UseTRPCQueryResult<
            TData,
            TRPCClientErrorLike<AppRouter>
        >;
        useInfiniteQuery: <T extends Prisma.SaleItemFindFirstArgs>(
            input: Omit<Prisma.SelectSubset<T, Prisma.SaleItemFindFirstArgs>, 'cursor'>,
            opts?: UseTRPCInfiniteQueryOptions<string, T, Prisma.SaleItemGetPayload<T>, Error>
        ) => UseTRPCInfiniteQueryResult<
            Prisma.SaleItemGetPayload<T>,
            TRPCClientErrorLike<AppRouter>
        >;

    };
    findMany: {

        useQuery: <T extends Prisma.SaleItemFindManyArgs, TData = Array<Prisma.SaleItemGetPayload<T>>>(
            input: Prisma.SelectSubset<T, Prisma.SaleItemFindManyArgs>,
            opts?: UseTRPCQueryOptions<string, T, Array<Prisma.SaleItemGetPayload<T>>, TData, Error>
        ) => UseTRPCQueryResult<
            TData,
            TRPCClientErrorLike<AppRouter>
        >;
        useInfiniteQuery: <T extends Prisma.SaleItemFindManyArgs>(
            input: Omit<Prisma.SelectSubset<T, Prisma.SaleItemFindManyArgs>, 'cursor'>,
            opts?: UseTRPCInfiniteQueryOptions<string, T, Array<Prisma.SaleItemGetPayload<T>>, Error>
        ) => UseTRPCInfiniteQueryResult<
            Array<Prisma.SaleItemGetPayload<T>>,
            TRPCClientErrorLike<AppRouter>
        >;

    };
    findUnique: {

        useQuery: <T extends Prisma.SaleItemFindUniqueArgs, TData = Prisma.SaleItemGetPayload<T>>(
            input: Prisma.SelectSubset<T, Prisma.SaleItemFindUniqueArgs>,
            opts?: UseTRPCQueryOptions<string, T, Prisma.SaleItemGetPayload<T>, TData, Error>
        ) => UseTRPCQueryResult<
            TData,
            TRPCClientErrorLike<AppRouter>
        >;
        useInfiniteQuery: <T extends Prisma.SaleItemFindUniqueArgs>(
            input: Omit<Prisma.SelectSubset<T, Prisma.SaleItemFindUniqueArgs>, 'cursor'>,
            opts?: UseTRPCInfiniteQueryOptions<string, T, Prisma.SaleItemGetPayload<T>, Error>
        ) => UseTRPCInfiniteQueryResult<
            Prisma.SaleItemGetPayload<T>,
            TRPCClientErrorLike<AppRouter>
        >;

    };
    update: {

        useMutation: <T extends Prisma.SaleItemUpdateArgs>(opts?: UseTRPCMutationOptions<
            Prisma.SaleItemUpdateArgs,
            TRPCClientErrorLike<AppRouter>,
            Prisma.SaleItemGetPayload<T>,
            Context
        >,) =>
            Omit<UseTRPCMutationResult<Prisma.SaleItemGetPayload<T>, TRPCClientErrorLike<AppRouter>, Prisma.SelectSubset<T, Prisma.SaleItemUpdateArgs>, Context>, 'mutateAsync'> & {
                mutateAsync:
                <T extends Prisma.SaleItemUpdateArgs>(variables: T, opts?: UseTRPCMutationOptions<T, TRPCClientErrorLike<AppRouter>, Prisma.SaleItemGetPayload<T>, Context>) => Promise<Prisma.SaleItemGetPayload<T>>
            };

    };
}
