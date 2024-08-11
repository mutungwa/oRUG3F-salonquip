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

        create: procedure.input($Schema.AdminInputSchema.create).mutation(async ({ ctx, input }) => checkMutate(db(ctx).admin.create(input as any))),

        delete: procedure.input($Schema.AdminInputSchema.delete).mutation(async ({ ctx, input }) => checkMutate(db(ctx).admin.delete(input as any))),

        findFirst: procedure.input($Schema.AdminInputSchema.findFirst).query(({ ctx, input }) => checkRead(db(ctx).admin.findFirst(input as any))),

        findMany: procedure.input($Schema.AdminInputSchema.findMany).query(({ ctx, input }) => checkRead(db(ctx).admin.findMany(input as any))),

        findUnique: procedure.input($Schema.AdminInputSchema.findUnique).query(({ ctx, input }) => checkRead(db(ctx).admin.findUnique(input as any))),

        update: procedure.input($Schema.AdminInputSchema.update).mutation(async ({ ctx, input }) => checkMutate(db(ctx).admin.update(input as any))),

    }
    );
}

export interface ClientType<AppRouter extends AnyRouter, Context = AppRouter['_def']['_config']['$types']['ctx']> {
    create: {

        useMutation: <T extends Prisma.AdminCreateArgs>(opts?: UseTRPCMutationOptions<
            Prisma.AdminCreateArgs,
            TRPCClientErrorLike<AppRouter>,
            Prisma.AdminGetPayload<T>,
            Context
        >,) =>
            Omit<UseTRPCMutationResult<Prisma.AdminGetPayload<T>, TRPCClientErrorLike<AppRouter>, Prisma.SelectSubset<T, Prisma.AdminCreateArgs>, Context>, 'mutateAsync'> & {
                mutateAsync:
                <T extends Prisma.AdminCreateArgs>(variables: T, opts?: UseTRPCMutationOptions<T, TRPCClientErrorLike<AppRouter>, Prisma.AdminGetPayload<T>, Context>) => Promise<Prisma.AdminGetPayload<T>>
            };

    };
    delete: {

        useMutation: <T extends Prisma.AdminDeleteArgs>(opts?: UseTRPCMutationOptions<
            Prisma.AdminDeleteArgs,
            TRPCClientErrorLike<AppRouter>,
            Prisma.AdminGetPayload<T>,
            Context
        >,) =>
            Omit<UseTRPCMutationResult<Prisma.AdminGetPayload<T>, TRPCClientErrorLike<AppRouter>, Prisma.SelectSubset<T, Prisma.AdminDeleteArgs>, Context>, 'mutateAsync'> & {
                mutateAsync:
                <T extends Prisma.AdminDeleteArgs>(variables: T, opts?: UseTRPCMutationOptions<T, TRPCClientErrorLike<AppRouter>, Prisma.AdminGetPayload<T>, Context>) => Promise<Prisma.AdminGetPayload<T>>
            };

    };
    findFirst: {

        useQuery: <T extends Prisma.AdminFindFirstArgs, TData = Prisma.AdminGetPayload<T>>(
            input: Prisma.SelectSubset<T, Prisma.AdminFindFirstArgs>,
            opts?: UseTRPCQueryOptions<string, T, Prisma.AdminGetPayload<T>, TData, Error>
        ) => UseTRPCQueryResult<
            TData,
            TRPCClientErrorLike<AppRouter>
        >;
        useInfiniteQuery: <T extends Prisma.AdminFindFirstArgs>(
            input: Omit<Prisma.SelectSubset<T, Prisma.AdminFindFirstArgs>, 'cursor'>,
            opts?: UseTRPCInfiniteQueryOptions<string, T, Prisma.AdminGetPayload<T>, Error>
        ) => UseTRPCInfiniteQueryResult<
            Prisma.AdminGetPayload<T>,
            TRPCClientErrorLike<AppRouter>
        >;

    };
    findMany: {

        useQuery: <T extends Prisma.AdminFindManyArgs, TData = Array<Prisma.AdminGetPayload<T>>>(
            input: Prisma.SelectSubset<T, Prisma.AdminFindManyArgs>,
            opts?: UseTRPCQueryOptions<string, T, Array<Prisma.AdminGetPayload<T>>, TData, Error>
        ) => UseTRPCQueryResult<
            TData,
            TRPCClientErrorLike<AppRouter>
        >;
        useInfiniteQuery: <T extends Prisma.AdminFindManyArgs>(
            input: Omit<Prisma.SelectSubset<T, Prisma.AdminFindManyArgs>, 'cursor'>,
            opts?: UseTRPCInfiniteQueryOptions<string, T, Array<Prisma.AdminGetPayload<T>>, Error>
        ) => UseTRPCInfiniteQueryResult<
            Array<Prisma.AdminGetPayload<T>>,
            TRPCClientErrorLike<AppRouter>
        >;

    };
    findUnique: {

        useQuery: <T extends Prisma.AdminFindUniqueArgs, TData = Prisma.AdminGetPayload<T>>(
            input: Prisma.SelectSubset<T, Prisma.AdminFindUniqueArgs>,
            opts?: UseTRPCQueryOptions<string, T, Prisma.AdminGetPayload<T>, TData, Error>
        ) => UseTRPCQueryResult<
            TData,
            TRPCClientErrorLike<AppRouter>
        >;
        useInfiniteQuery: <T extends Prisma.AdminFindUniqueArgs>(
            input: Omit<Prisma.SelectSubset<T, Prisma.AdminFindUniqueArgs>, 'cursor'>,
            opts?: UseTRPCInfiniteQueryOptions<string, T, Prisma.AdminGetPayload<T>, Error>
        ) => UseTRPCInfiniteQueryResult<
            Prisma.AdminGetPayload<T>,
            TRPCClientErrorLike<AppRouter>
        >;

    };
    update: {

        useMutation: <T extends Prisma.AdminUpdateArgs>(opts?: UseTRPCMutationOptions<
            Prisma.AdminUpdateArgs,
            TRPCClientErrorLike<AppRouter>,
            Prisma.AdminGetPayload<T>,
            Context
        >,) =>
            Omit<UseTRPCMutationResult<Prisma.AdminGetPayload<T>, TRPCClientErrorLike<AppRouter>, Prisma.SelectSubset<T, Prisma.AdminUpdateArgs>, Context>, 'mutateAsync'> & {
                mutateAsync:
                <T extends Prisma.AdminUpdateArgs>(variables: T, opts?: UseTRPCMutationOptions<T, TRPCClientErrorLike<AppRouter>, Prisma.AdminGetPayload<T>, Context>) => Promise<Prisma.AdminGetPayload<T>>
            };

    };
}
