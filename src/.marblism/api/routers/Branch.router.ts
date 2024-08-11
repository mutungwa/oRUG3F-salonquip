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

        create: procedure.input($Schema.BranchInputSchema.create).mutation(async ({ ctx, input }) => checkMutate(db(ctx).branch.create(input as any))),

        delete: procedure.input($Schema.BranchInputSchema.delete).mutation(async ({ ctx, input }) => checkMutate(db(ctx).branch.delete(input as any))),

        findFirst: procedure.input($Schema.BranchInputSchema.findFirst).query(({ ctx, input }) => checkRead(db(ctx).branch.findFirst(input as any))),

        findMany: procedure.input($Schema.BranchInputSchema.findMany).query(({ ctx, input }) => checkRead(db(ctx).branch.findMany(input as any))),

        findUnique: procedure.input($Schema.BranchInputSchema.findUnique).query(({ ctx, input }) => checkRead(db(ctx).branch.findUnique(input as any))),

        update: procedure.input($Schema.BranchInputSchema.update).mutation(async ({ ctx, input }) => checkMutate(db(ctx).branch.update(input as any))),

    }
    );
}

export interface ClientType<AppRouter extends AnyRouter, Context = AppRouter['_def']['_config']['$types']['ctx']> {
    create: {

        useMutation: <T extends Prisma.BranchCreateArgs>(opts?: UseTRPCMutationOptions<
            Prisma.BranchCreateArgs,
            TRPCClientErrorLike<AppRouter>,
            Prisma.BranchGetPayload<T>,
            Context
        >,) =>
            Omit<UseTRPCMutationResult<Prisma.BranchGetPayload<T>, TRPCClientErrorLike<AppRouter>, Prisma.SelectSubset<T, Prisma.BranchCreateArgs>, Context>, 'mutateAsync'> & {
                mutateAsync:
                <T extends Prisma.BranchCreateArgs>(variables: T, opts?: UseTRPCMutationOptions<T, TRPCClientErrorLike<AppRouter>, Prisma.BranchGetPayload<T>, Context>) => Promise<Prisma.BranchGetPayload<T>>
            };

    };
    delete: {

        useMutation: <T extends Prisma.BranchDeleteArgs>(opts?: UseTRPCMutationOptions<
            Prisma.BranchDeleteArgs,
            TRPCClientErrorLike<AppRouter>,
            Prisma.BranchGetPayload<T>,
            Context
        >,) =>
            Omit<UseTRPCMutationResult<Prisma.BranchGetPayload<T>, TRPCClientErrorLike<AppRouter>, Prisma.SelectSubset<T, Prisma.BranchDeleteArgs>, Context>, 'mutateAsync'> & {
                mutateAsync:
                <T extends Prisma.BranchDeleteArgs>(variables: T, opts?: UseTRPCMutationOptions<T, TRPCClientErrorLike<AppRouter>, Prisma.BranchGetPayload<T>, Context>) => Promise<Prisma.BranchGetPayload<T>>
            };

    };
    findFirst: {

        useQuery: <T extends Prisma.BranchFindFirstArgs, TData = Prisma.BranchGetPayload<T>>(
            input: Prisma.SelectSubset<T, Prisma.BranchFindFirstArgs>,
            opts?: UseTRPCQueryOptions<string, T, Prisma.BranchGetPayload<T>, TData, Error>
        ) => UseTRPCQueryResult<
            TData,
            TRPCClientErrorLike<AppRouter>
        >;
        useInfiniteQuery: <T extends Prisma.BranchFindFirstArgs>(
            input: Omit<Prisma.SelectSubset<T, Prisma.BranchFindFirstArgs>, 'cursor'>,
            opts?: UseTRPCInfiniteQueryOptions<string, T, Prisma.BranchGetPayload<T>, Error>
        ) => UseTRPCInfiniteQueryResult<
            Prisma.BranchGetPayload<T>,
            TRPCClientErrorLike<AppRouter>
        >;

    };
    findMany: {

        useQuery: <T extends Prisma.BranchFindManyArgs, TData = Array<Prisma.BranchGetPayload<T>>>(
            input: Prisma.SelectSubset<T, Prisma.BranchFindManyArgs>,
            opts?: UseTRPCQueryOptions<string, T, Array<Prisma.BranchGetPayload<T>>, TData, Error>
        ) => UseTRPCQueryResult<
            TData,
            TRPCClientErrorLike<AppRouter>
        >;
        useInfiniteQuery: <T extends Prisma.BranchFindManyArgs>(
            input: Omit<Prisma.SelectSubset<T, Prisma.BranchFindManyArgs>, 'cursor'>,
            opts?: UseTRPCInfiniteQueryOptions<string, T, Array<Prisma.BranchGetPayload<T>>, Error>
        ) => UseTRPCInfiniteQueryResult<
            Array<Prisma.BranchGetPayload<T>>,
            TRPCClientErrorLike<AppRouter>
        >;

    };
    findUnique: {

        useQuery: <T extends Prisma.BranchFindUniqueArgs, TData = Prisma.BranchGetPayload<T>>(
            input: Prisma.SelectSubset<T, Prisma.BranchFindUniqueArgs>,
            opts?: UseTRPCQueryOptions<string, T, Prisma.BranchGetPayload<T>, TData, Error>
        ) => UseTRPCQueryResult<
            TData,
            TRPCClientErrorLike<AppRouter>
        >;
        useInfiniteQuery: <T extends Prisma.BranchFindUniqueArgs>(
            input: Omit<Prisma.SelectSubset<T, Prisma.BranchFindUniqueArgs>, 'cursor'>,
            opts?: UseTRPCInfiniteQueryOptions<string, T, Prisma.BranchGetPayload<T>, Error>
        ) => UseTRPCInfiniteQueryResult<
            Prisma.BranchGetPayload<T>,
            TRPCClientErrorLike<AppRouter>
        >;

    };
    update: {

        useMutation: <T extends Prisma.BranchUpdateArgs>(opts?: UseTRPCMutationOptions<
            Prisma.BranchUpdateArgs,
            TRPCClientErrorLike<AppRouter>,
            Prisma.BranchGetPayload<T>,
            Context
        >,) =>
            Omit<UseTRPCMutationResult<Prisma.BranchGetPayload<T>, TRPCClientErrorLike<AppRouter>, Prisma.SelectSubset<T, Prisma.BranchUpdateArgs>, Context>, 'mutateAsync'> & {
                mutateAsync:
                <T extends Prisma.BranchUpdateArgs>(variables: T, opts?: UseTRPCMutationOptions<T, TRPCClientErrorLike<AppRouter>, Prisma.BranchGetPayload<T>, Context>) => Promise<Prisma.BranchGetPayload<T>>
            };

    };
}
