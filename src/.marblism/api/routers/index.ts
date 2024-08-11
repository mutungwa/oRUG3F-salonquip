/* eslint-disable */
import type { unsetMarker, AnyRouter, AnyRootConfig, CreateRouterInner, Procedure, ProcedureBuilder, ProcedureParams, ProcedureRouterRecord, ProcedureType } from "@trpc/server";
import type { PrismaClient } from "@prisma/client";
import createAccountRouter from "./Account.router";
import createUserRouter from "./User.router";
import createSessionRouter from "./Session.router";
import createRoleRouter from "./Role.router";
import createAdminRouter from "./Admin.router";
import createBranchRouter from "./Branch.router";
import createItemRouter from "./Item.router";
import createSaleRouter from "./Sale.router";
import createStockTransferRouter from "./StockTransfer.router";
import { ClientType as AccountClientType } from "./Account.router";
import { ClientType as UserClientType } from "./User.router";
import { ClientType as SessionClientType } from "./Session.router";
import { ClientType as RoleClientType } from "./Role.router";
import { ClientType as AdminClientType } from "./Admin.router";
import { ClientType as BranchClientType } from "./Branch.router";
import { ClientType as ItemClientType } from "./Item.router";
import { ClientType as SaleClientType } from "./Sale.router";
import { ClientType as StockTransferClientType } from "./StockTransfer.router";

export type BaseConfig = AnyRootConfig;

export type RouterFactory<Config extends BaseConfig> = <
    ProcRouterRecord extends ProcedureRouterRecord
>(
    procedures: ProcRouterRecord
) => CreateRouterInner<Config, ProcRouterRecord>;

export type UnsetMarker = typeof unsetMarker;

export type ProcBuilder<Config extends BaseConfig> = ProcedureBuilder<
    ProcedureParams<Config, any, any, any, UnsetMarker, UnsetMarker, any>
>;

export function db(ctx: any) {
    if (!ctx.prisma) {
        throw new Error('Missing "prisma" field in trpc context');
    }
    return ctx.prisma as PrismaClient;
}

export function createRouter<Config extends BaseConfig>(router: RouterFactory<Config>, procedure: ProcBuilder<Config>) {
    return router({
        account: createAccountRouter(router, procedure),
        user: createUserRouter(router, procedure),
        session: createSessionRouter(router, procedure),
        role: createRoleRouter(router, procedure),
        admin: createAdminRouter(router, procedure),
        branch: createBranchRouter(router, procedure),
        item: createItemRouter(router, procedure),
        sale: createSaleRouter(router, procedure),
        stockTransfer: createStockTransferRouter(router, procedure),
    }
    );
}

export interface ClientType<AppRouter extends AnyRouter> {
    account: AccountClientType<AppRouter>;
    user: UserClientType<AppRouter>;
    session: SessionClientType<AppRouter>;
    role: RoleClientType<AppRouter>;
    admin: AdminClientType<AppRouter>;
    branch: BranchClientType<AppRouter>;
    item: ItemClientType<AppRouter>;
    sale: SaleClientType<AppRouter>;
    stockTransfer: StockTransferClientType<AppRouter>;
}
