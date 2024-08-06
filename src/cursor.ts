import { Prisma } from "@prisma/client"
import { cursorPaginate, cursorPaginateArgs, findManyResult, paginateArgs } from "./types"
import { PrismaClientValidationError } from "@prisma/client/runtime/library"

export async function cursor<T, A extends cursorPaginateArgs<T>>(
    model: T,
    args: A
): Promise<cursorResult<T, A>> {
    const context = Prisma.getExtensionContext(model)
    let { cursor, ...findManyOptions } = args
    const {
        after,
        before,
        limit,
        setCursor = (cursor) => {
            return {
                id: cursor
            }
        },
        getCursor = (target) => {
            if (target && "id" in (target as any)) {
                return (target as any).id
            }
            throw new Error("The query must return an 'id' field to perform the cursor conversion.")
        }
    } = cursor
    if (after && before) {
        const clientVersion = Prisma.prismaVersion.client
        throw new PrismaClientValidationError(
            `Unable to use cursor-based pagination with 'after' and 'before' specified at the same time`,
            { clientVersion }
        )
    }
    let take

    if (after) {
        if (limit && limit !== -1) {
            take = limit + 1
        }
        let [result, previousPage] = await Promise.all([
            (context as any).findMany({
                ...findManyOptions,
                skip: 1,
                take: take,
                cursor: setCursor(after),
            }),
            (context as any).findMany({
                where: args.where,
                include: undefined,
                select: undefined,
                omit: undefined,
                cursor: setCursor(after),
                take: -1,
                skip: 1
            }),
        ])

        let hasNextPage = limit !== undefined && result.length > limit
        if (hasNextPage) {
            result.pop()
        }

        return {
            result,
            meta: {
                hasPreviousPage: previousPage.length === 1,
                hasNextPage: hasNextPage,
                startCursor: getCursor(result[0]),
                endCursor: getCursor(result[result.length - 1])
            }
        }
    }

    if (before) {
        if (limit && limit !== -1) {
            take = -limit - 1
        }

        let [result, nextPage] = await Promise.all([
            (context as any).findMany({
                ...findManyOptions,
                skip: 1,
                take: take,
                cursor: setCursor(before),
            }),
            (context as any).findMany({
                where: args.where,
                include: undefined,
                select: undefined,
                omit: undefined,
                cursor: setCursor(before),
                take: 1,
                skip: 1
            }),
        ])

        let hasPreviousPage = limit !== undefined && result.length > limit
        if (hasPreviousPage) {
            result.shift()
        }

        return {
            result,
            meta: {
                hasPreviousPage: hasPreviousPage,
                hasNextPage: nextPage.length === 1,
                startCursor: getCursor(result[0]),
                endCursor: getCursor(result[result.length - 1])
            }
        }
    }

    if (limit && limit > 0) {
        take = limit + 1
    }
    let [result] = await Promise.all([
        (context as any).findMany({
            ...findManyOptions,
            take: take,
        }),
    ])

    let hasNextPage = limit! > 0 && result.length > limit!
    if (hasNextPage) {
        result.pop()
    }

    return {
        result,
        meta: {
            hasPreviousPage: false,
            hasNextPage: hasNextPage,
            startCursor: getCursor(result[0]),
            endCursor: getCursor(result[result.length - 1])
        }
    }
}

type cursorMeta = {
    hasPreviousPage: boolean
    hasNextPage: boolean
    startCursor: string | number
    endCursor: string | number
}

export type cursorResult<T, A> = {
    result: findManyResult<T, A>
    meta: cursorMeta
}