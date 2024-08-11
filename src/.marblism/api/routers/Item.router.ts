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

        create: procedure.input($Schema.ItemInputSchema.create).mutation(async ({ ctx, input }) => checkMutate(db(ctx).item.create(input as any))),

        delete: procedure.input($Schema.ItemInputSchema.delete).mutation(async ({ ctx, input }) => checkMutate(db(ctx).item.delete(input as any))),

        findFirst: procedure.input($Schema.ItemInputSchema.findFirst).query(({ ctx, input }) => checkRead(db(ctx).item.findFirst(input as any))),

        findMany: procedure.input($Schema.ItemInputSchema.findMany).query(({ ctx, input }) => checkRead(db(ctx).item.findMany(input as any))),

        findUnique: procedure.input($Schema.ItemInputSchema.findUnique).query(({ ctx, input }) => checkRead(db(ctx).item.findUnique(input as any))),

        update: procedure.input($Schema.ItemInputSchema.update).mutation(async ({ ctx, input }) => checkMutate(db(ctx).item.update(input as any))),

    }
    );
}

export interface ClientType<AppRouter extends AnyRouter, Context = AppRouter['_def']['_config']['$types']['ctx']> {
    create: {

        useMutation: <T extends Prisma.ItemCreateArgs>(opts?: UseTRPCMutationOptions<
            Prisma.ItemCreateArgs,
            TRPCClientErrorLike<AppRouter>,
            Prisma.ItemGetPayload<T>,
            Context
        >,) =>
            Omit<UseTRPCMutationResult<Prisma.ItemGetPayload<T>, TRPCClientErrorLike<AppRouter>, Prisma.SelectSubset<T, Prisma.ItemCreateArgs>, Context>, 'mutateAsync'> & {
                mutateAsync:
                <T extends Prisma.ItemCreateArgs>(variables: T, opts?: UseTRPCMutationOptions<T, TRPCClientErrorLike<AppRouter>, Prisma.ItemGetPayload<T>, Context>) => Promise<Prisma.ItemGetPayload<T>>
            };

    };
    delete: {

        useMutation: <T extends Prisma.ItemDeleteArgs>(opts?: UseTRPCMutationOptions<
            Prisma.ItemDeleteArgs,
            TRPCClientErrorLike<AppRouter>,
            Prisma.ItemGetPayload<T>,
            Context
        >,) =>
            Omit<UseTRPCMutationResult<Prisma.ItemGetPayload<T>, TRPCClientErrorLike<AppRouter>, Prisma.SelectSubset<T, Prisma.ItemDeleteArgs>, Context>, 'mutateAsync'> & {
                mutateAsync:
                <T extends Prisma.ItemDeleteArgs>(variables: T, opts?: UseTRPCMutationOptions<T, TRPCClientErrorLike<AppRouter>, Prisma.ItemGetPayload<T>, Context>) => Promise<Prisma.ItemGetPayload<T>>
            };

    };
    findFirst: {

        useQuery: <T extends Prisma.ItemFindFirstArgs, TData = Prisma.ItemGetPayload<T>>(
            input: Prisma.SelectSubset<T, Prisma.ItemFindFirstArgs>,
            opts?: UseTRPCQueryOptions<string, T, Prisma.ItemGetPayload<T>, TData, Error>
        ) => UseTRPCQueryResult<
            TData,
            TRPCClientErrorLike<AppRouter>
        >;
        useInfiniteQuery: <T extends Prisma.ItemFindFirstArgs>(
            input: Omit<Prisma.SelectSubset<T, Prisma.ItemFindFirstArgs>, 'cursor'>,
            opts?: UseTRPCInfiniteQueryOptions<string, T, Prisma.ItemGetPayload<T>, Error>
        ) => UseTRPCInfiniteQueryResult<
            Prisma.ItemGetPayload<T>,
            TRPCClientErrorLike<AppRouter>
        >;

    };
    findMany: {

        useQuery: <T extends Prisma.ItemFindManyArgs, TData = Array<Prisma.ItemGetPayload<T>>>(
            input: Prisma.SelectSubset<T, Prisma.ItemFindManyArgs>,
            opts?: UseTRPCQueryOptions<string, T, Array<Prisma.ItemGetPayload<T>>, TData, Error>
        ) => UseTRPCQueryResult<
            TData,
            TRPCClientErrorLike<AppRouter>
        >;
        useInfiniteQuery: <T extends Prisma.ItemFindManyArgs>(
            input: Omit<Prisma.SelectSubset<T, Prisma.ItemFindManyArgs>, 'cursor'>,
            opts?: UseTRPCInfiniteQueryOptions<string, T, Array<Prisma.ItemGetPayload<T>>, Error>
        ) => UseTRPCInfiniteQueryResult<
            Array<Prisma.ItemGetPayload<T>>,
            TRPCClientErrorLike<AppRouter>
        >;

    };
    findUnique: {

        useQuery: <T extends Prisma.ItemFindUniqueArgs, TData = Prisma.ItemGetPayload<T>>(
            input: Prisma.SelectSubset<T, Prisma.ItemFindUniqueArgs>,
            opts?: UseTRPCQueryOptions<string, T, Prisma.ItemGetPayload<T>, TData, Error>
        ) => UseTRPCQueryResult<
            TData,
            TRPCClientErrorLike<AppRouter>
        >;
        useInfiniteQuery: <T extends Prisma.ItemFindUniqueArgs>(
            input: Omit<Prisma.SelectSubset<T, Prisma.ItemFindUniqueArgs>, 'cursor'>,
            opts?: UseTRPCInfiniteQueryOptions<string, T, Prisma.ItemGetPayload<T>, Error>
        ) => UseTRPCInfiniteQueryResult<
            Prisma.ItemGetPayload<T>,
            TRPCClientErrorLike<AppRouter>
        >;

    };
    update: {

        useMutation: <T extends Prisma.ItemUpdateArgs>(opts?: UseTRPCMutationOptions<
            Prisma.ItemUpdateArgs,
            TRPCClientErrorLike<AppRouter>,
            Prisma.ItemGetPayload<T>,
            Context
        >,) =>
            Omit<UseTRPCMutationResult<Prisma.ItemGetPayload<T>, TRPCClientErrorLike<AppRouter>, Prisma.SelectSubset<T, Prisma.ItemUpdateArgs>, Context>, 'mutateAsync'> & {
                mutateAsync:
                <T extends Prisma.ItemUpdateArgs>(variables: T, opts?: UseTRPCMutationOptions<T, TRPCClientErrorLike<AppRouter>, Prisma.ItemGetPayload<T>, Context>) => Promise<Prisma.ItemGetPayload<T>>
            };

    };
}
