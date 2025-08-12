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

        create: procedure.input($Schema.InvitationInputSchema.create).mutation(async ({ ctx, input }) => checkMutate(db(ctx).invitation.create(input as any))),

        delete: procedure.input($Schema.InvitationInputSchema.delete).mutation(async ({ ctx, input }) => checkMutate(db(ctx).invitation.delete(input as any))),

        findFirst: procedure.input($Schema.InvitationInputSchema.findFirst).query(({ ctx, input }) => checkRead(db(ctx).invitation.findFirst(input as any))),

        findMany: procedure.input($Schema.InvitationInputSchema.findMany).query(({ ctx, input }) => checkRead(db(ctx).invitation.findMany(input as any))),

        findUnique: procedure.input($Schema.InvitationInputSchema.findUnique).query(({ ctx, input }) => checkRead(db(ctx).invitation.findUnique(input as any))),

        update: procedure.input($Schema.InvitationInputSchema.update).mutation(async ({ ctx, input }) => checkMutate(db(ctx).invitation.update(input as any))),

    }
    );
}

export interface ClientType<AppRouter extends AnyRouter, Context = AppRouter['_def']['_config']['$types']['ctx']> {
    create: {

        useMutation: <T extends Prisma.InvitationCreateArgs>(opts?: UseTRPCMutationOptions<
            Prisma.InvitationCreateArgs,
            TRPCClientErrorLike<AppRouter>,
            Prisma.InvitationGetPayload<T>,
            Context
        >,) =>
            Omit<UseTRPCMutationResult<Prisma.InvitationGetPayload<T>, TRPCClientErrorLike<AppRouter>, Prisma.SelectSubset<T, Prisma.InvitationCreateArgs>, Context>, 'mutateAsync'> & {
                mutateAsync:
                <T extends Prisma.InvitationCreateArgs>(variables: T, opts?: UseTRPCMutationOptions<T, TRPCClientErrorLike<AppRouter>, Prisma.InvitationGetPayload<T>, Context>) => Promise<Prisma.InvitationGetPayload<T>>
            };

    };
    delete: {

        useMutation: <T extends Prisma.InvitationDeleteArgs>(opts?: UseTRPCMutationOptions<
            Prisma.InvitationDeleteArgs,
            TRPCClientErrorLike<AppRouter>,
            Prisma.InvitationGetPayload<T>,
            Context
        >,) =>
            Omit<UseTRPCMutationResult<Prisma.InvitationGetPayload<T>, TRPCClientErrorLike<AppRouter>, Prisma.SelectSubset<T, Prisma.InvitationDeleteArgs>, Context>, 'mutateAsync'> & {
                mutateAsync:
                <T extends Prisma.InvitationDeleteArgs>(variables: T, opts?: UseTRPCMutationOptions<T, TRPCClientErrorLike<AppRouter>, Prisma.InvitationGetPayload<T>, Context>) => Promise<Prisma.InvitationGetPayload<T>>
            };

    };
    findFirst: {

        useQuery: <T extends Prisma.InvitationFindFirstArgs, TData = Prisma.InvitationGetPayload<T>>(
            input: Prisma.SelectSubset<T, Prisma.InvitationFindFirstArgs>,
            opts?: UseTRPCQueryOptions<string, T, Prisma.InvitationGetPayload<T>, TData, Error>
        ) => UseTRPCQueryResult<
            TData,
            TRPCClientErrorLike<AppRouter>
        >;
        useInfiniteQuery: <T extends Prisma.InvitationFindFirstArgs>(
            input: Omit<Prisma.SelectSubset<T, Prisma.InvitationFindFirstArgs>, 'cursor'>,
            opts?: UseTRPCInfiniteQueryOptions<string, T, Prisma.InvitationGetPayload<T>, Error>
        ) => UseTRPCInfiniteQueryResult<
            Prisma.InvitationGetPayload<T>,
            TRPCClientErrorLike<AppRouter>
        >;

    };
    findMany: {

        useQuery: <T extends Prisma.InvitationFindManyArgs, TData = Array<Prisma.InvitationGetPayload<T>>>(
            input: Prisma.SelectSubset<T, Prisma.InvitationFindManyArgs>,
            opts?: UseTRPCQueryOptions<string, T, Array<Prisma.InvitationGetPayload<T>>, TData, Error>
        ) => UseTRPCQueryResult<
            TData,
            TRPCClientErrorLike<AppRouter>
        >;
        useInfiniteQuery: <T extends Prisma.InvitationFindManyArgs>(
            input: Omit<Prisma.SelectSubset<T, Prisma.InvitationFindManyArgs>, 'cursor'>,
            opts?: UseTRPCInfiniteQueryOptions<string, T, Array<Prisma.InvitationGetPayload<T>>, Error>
        ) => UseTRPCInfiniteQueryResult<
            Array<Prisma.InvitationGetPayload<T>>,
            TRPCClientErrorLike<AppRouter>
        >;

    };
    findUnique: {

        useQuery: <T extends Prisma.InvitationFindUniqueArgs, TData = Prisma.InvitationGetPayload<T>>(
            input: Prisma.SelectSubset<T, Prisma.InvitationFindUniqueArgs>,
            opts?: UseTRPCQueryOptions<string, T, Prisma.InvitationGetPayload<T>, TData, Error>
        ) => UseTRPCQueryResult<
            TData,
            TRPCClientErrorLike<AppRouter>
        >;
        useInfiniteQuery: <T extends Prisma.InvitationFindUniqueArgs>(
            input: Omit<Prisma.SelectSubset<T, Prisma.InvitationFindUniqueArgs>, 'cursor'>,
            opts?: UseTRPCInfiniteQueryOptions<string, T, Prisma.InvitationGetPayload<T>, Error>
        ) => UseTRPCInfiniteQueryResult<
            Prisma.InvitationGetPayload<T>,
            TRPCClientErrorLike<AppRouter>
        >;

    };
    update: {

        useMutation: <T extends Prisma.InvitationUpdateArgs>(opts?: UseTRPCMutationOptions<
            Prisma.InvitationUpdateArgs,
            TRPCClientErrorLike<AppRouter>,
            Prisma.InvitationGetPayload<T>,
            Context
        >,) =>
            Omit<UseTRPCMutationResult<Prisma.InvitationGetPayload<T>, TRPCClientErrorLike<AppRouter>, Prisma.SelectSubset<T, Prisma.InvitationUpdateArgs>, Context>, 'mutateAsync'> & {
                mutateAsync:
                <T extends Prisma.InvitationUpdateArgs>(variables: T, opts?: UseTRPCMutationOptions<T, TRPCClientErrorLike<AppRouter>, Prisma.InvitationGetPayload<T>, Context>) => Promise<Prisma.InvitationGetPayload<T>>
            };

    };
}
