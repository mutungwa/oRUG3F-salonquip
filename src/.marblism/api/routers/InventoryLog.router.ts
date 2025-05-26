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

        create: procedure.input($Schema.InventoryLogInputSchema.create).mutation(async ({ ctx, input }) => checkMutate(db(ctx).inventoryLog.create(input as any))),

        delete: procedure.input($Schema.InventoryLogInputSchema.delete).mutation(async ({ ctx, input }) => checkMutate(db(ctx).inventoryLog.delete(input as any))),

        findFirst: procedure.input($Schema.InventoryLogInputSchema.findFirst).query(({ ctx, input }) => checkRead(db(ctx).inventoryLog.findFirst(input as any))),

        findMany: procedure.input($Schema.InventoryLogInputSchema.findMany).query(({ ctx, input }) => checkRead(db(ctx).inventoryLog.findMany(input as any))),

        findUnique: procedure.input($Schema.InventoryLogInputSchema.findUnique).query(({ ctx, input }) => checkRead(db(ctx).inventoryLog.findUnique(input as any))),

        update: procedure.input($Schema.InventoryLogInputSchema.update).mutation(async ({ ctx, input }) => checkMutate(db(ctx).inventoryLog.update(input as any))),

    }
    );
}

export interface ClientType<AppRouter extends AnyRouter, Context = AppRouter['_def']['_config']['$types']['ctx']> {
    create: {

        useMutation: <T extends Prisma.InventoryLogCreateArgs>(opts?: UseTRPCMutationOptions<
            Prisma.InventoryLogCreateArgs,
            TRPCClientErrorLike<AppRouter>,
            Prisma.InventoryLogGetPayload<T>,
            Context
        >,) =>
            Omit<UseTRPCMutationResult<Prisma.InventoryLogGetPayload<T>, TRPCClientErrorLike<AppRouter>, Prisma.SelectSubset<T, Prisma.InventoryLogCreateArgs>, Context>, 'mutateAsync'> & {
                mutateAsync:
                <T extends Prisma.InventoryLogCreateArgs>(variables: T, opts?: UseTRPCMutationOptions<T, TRPCClientErrorLike<AppRouter>, Prisma.InventoryLogGetPayload<T>, Context>) => Promise<Prisma.InventoryLogGetPayload<T>>
            };

    };
    delete: {

        useMutation: <T extends Prisma.InventoryLogDeleteArgs>(opts?: UseTRPCMutationOptions<
            Prisma.InventoryLogDeleteArgs,
            TRPCClientErrorLike<AppRouter>,
            Prisma.InventoryLogGetPayload<T>,
            Context
        >,) =>
            Omit<UseTRPCMutationResult<Prisma.InventoryLogGetPayload<T>, TRPCClientErrorLike<AppRouter>, Prisma.SelectSubset<T, Prisma.InventoryLogDeleteArgs>, Context>, 'mutateAsync'> & {
                mutateAsync:
                <T extends Prisma.InventoryLogDeleteArgs>(variables: T, opts?: UseTRPCMutationOptions<T, TRPCClientErrorLike<AppRouter>, Prisma.InventoryLogGetPayload<T>, Context>) => Promise<Prisma.InventoryLogGetPayload<T>>
            };

    };
    findFirst: {

        useQuery: <T extends Prisma.InventoryLogFindFirstArgs, TData = Prisma.InventoryLogGetPayload<T>>(
            input: Prisma.SelectSubset<T, Prisma.InventoryLogFindFirstArgs>,
            opts?: UseTRPCQueryOptions<string, T, Prisma.InventoryLogGetPayload<T>, TData, Error>
        ) => UseTRPCQueryResult<
            TData,
            TRPCClientErrorLike<AppRouter>
        >;
        useInfiniteQuery: <T extends Prisma.InventoryLogFindFirstArgs>(
            input: Omit<Prisma.SelectSubset<T, Prisma.InventoryLogFindFirstArgs>, 'cursor'>,
            opts?: UseTRPCInfiniteQueryOptions<string, T, Prisma.InventoryLogGetPayload<T>, Error>
        ) => UseTRPCInfiniteQueryResult<
            Prisma.InventoryLogGetPayload<T>,
            TRPCClientErrorLike<AppRouter>
        >;

    };
    findMany: {

        useQuery: <T extends Prisma.InventoryLogFindManyArgs, TData = Array<Prisma.InventoryLogGetPayload<T>>>(
            input: Prisma.SelectSubset<T, Prisma.InventoryLogFindManyArgs>,
            opts?: UseTRPCQueryOptions<string, T, Array<Prisma.InventoryLogGetPayload<T>>, TData, Error>
        ) => UseTRPCQueryResult<
            TData,
            TRPCClientErrorLike<AppRouter>
        >;
        useInfiniteQuery: <T extends Prisma.InventoryLogFindManyArgs>(
            input: Omit<Prisma.SelectSubset<T, Prisma.InventoryLogFindManyArgs>, 'cursor'>,
            opts?: UseTRPCInfiniteQueryOptions<string, T, Array<Prisma.InventoryLogGetPayload<T>>, Error>
        ) => UseTRPCInfiniteQueryResult<
            Array<Prisma.InventoryLogGetPayload<T>>,
            TRPCClientErrorLike<AppRouter>
        >;

    };
    findUnique: {

        useQuery: <T extends Prisma.InventoryLogFindUniqueArgs, TData = Prisma.InventoryLogGetPayload<T>>(
            input: Prisma.SelectSubset<T, Prisma.InventoryLogFindUniqueArgs>,
            opts?: UseTRPCQueryOptions<string, T, Prisma.InventoryLogGetPayload<T>, TData, Error>
        ) => UseTRPCQueryResult<
            TData,
            TRPCClientErrorLike<AppRouter>
        >;
        useInfiniteQuery: <T extends Prisma.InventoryLogFindUniqueArgs>(
            input: Omit<Prisma.SelectSubset<T, Prisma.InventoryLogFindUniqueArgs>, 'cursor'>,
            opts?: UseTRPCInfiniteQueryOptions<string, T, Prisma.InventoryLogGetPayload<T>, Error>
        ) => UseTRPCInfiniteQueryResult<
            Prisma.InventoryLogGetPayload<T>,
            TRPCClientErrorLike<AppRouter>
        >;

    };
    update: {

        useMutation: <T extends Prisma.InventoryLogUpdateArgs>(opts?: UseTRPCMutationOptions<
            Prisma.InventoryLogUpdateArgs,
            TRPCClientErrorLike<AppRouter>,
            Prisma.InventoryLogGetPayload<T>,
            Context
        >,) =>
            Omit<UseTRPCMutationResult<Prisma.InventoryLogGetPayload<T>, TRPCClientErrorLike<AppRouter>, Prisma.SelectSubset<T, Prisma.InventoryLogUpdateArgs>, Context>, 'mutateAsync'> & {
                mutateAsync:
                <T extends Prisma.InventoryLogUpdateArgs>(variables: T, opts?: UseTRPCMutationOptions<T, TRPCClientErrorLike<AppRouter>, Prisma.InventoryLogGetPayload<T>, Context>) => Promise<Prisma.InventoryLogGetPayload<T>>
            };

    };
}
