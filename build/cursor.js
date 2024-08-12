"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cursor = cursor;
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
async function cursor(model, args) {
    const context = client_1.Prisma.getExtensionContext(model);
    let { cursor, ...findManyOptions } = args;
    const { after, before, limit, setCursor = (cursor) => {
        return {
            id: cursor
        };
    }, getCursor = (target) => {
        if (target && "id" in target) {
            return target.id;
        }
        throw new Error("The query must return an 'id' field to perform the cursor conversion.");
    } } = cursor;
    if (after && before) {
        const clientVersion = client_1.Prisma.prismaVersion.client;
        throw new library_1.PrismaClientValidationError(`Unable to use cursor-based pagination with 'after' and 'before' specified at the same time`, { clientVersion });
    }
    let take;
    if (after) {
        if (limit && limit !== -1) {
            take = limit + 1;
        }
        let [data, previousPage] = await Promise.all([
            context.findMany({
                ...findManyOptions,
                skip: 1,
                take: take,
                cursor: setCursor(after),
            }),
            context.findMany({
                where: args.where,
                include: undefined,
                select: undefined,
                omit: undefined,
                cursor: setCursor(after),
                take: -1,
                skip: 1
            }),
        ]);
        let hasNextPage = limit !== undefined && data.length > limit;
        if (hasNextPage) {
            data.pop();
        }
        return {
            data,
            meta: {
                hasPreviousPage: previousPage.length === 1,
                hasNextPage: hasNextPage,
                startCursor: getCursor(data[0]),
                endCursor: getCursor(data[data.length - 1])
            }
        };
    }
    if (before) {
        if (limit && limit !== -1) {
            take = -limit - 1;
        }
        let [data, nextPage] = await Promise.all([
            context.findMany({
                ...findManyOptions,
                skip: 1,
                take: take,
                cursor: setCursor(before),
            }),
            context.findMany({
                where: args.where,
                include: undefined,
                select: undefined,
                omit: undefined,
                cursor: setCursor(before),
                take: 1,
                skip: 1
            }),
        ]);
        let hasPreviousPage = limit !== undefined && data.length > limit;
        if (hasPreviousPage) {
            data.shift();
        }
        return {
            data,
            meta: {
                hasPreviousPage: hasPreviousPage,
                hasNextPage: nextPage.length === 1,
                startCursor: getCursor(data[0]),
                endCursor: getCursor(data[data.length - 1])
            }
        };
    }
    if (limit && limit > 0) {
        take = limit + 1;
    }
    let [data] = await Promise.all([
        context.findMany({
            ...findManyOptions,
            take: take,
        }),
    ]);
    let hasNextPage = limit > 0 && data.length > limit;
    if (hasNextPage) {
        data.pop();
    }
    return {
        data,
        meta: {
            hasPreviousPage: false,
            hasNextPage: hasNextPage,
            startCursor: getCursor(data[0]),
            endCursor: getCursor(data[data.length - 1])
        }
    };
}
