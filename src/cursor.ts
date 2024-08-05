import { Prisma } from "@prisma/client"
import { findManyResult, paginateArgs } from "./types"

export async function cursor<T, A extends paginateArgs<T>>(
    model: T,
    args: A
) /* :Promise<cursorResult<T, A>> */ {
    const context = Prisma.getExtensionContext(model)
    const { cursor, ...findManyOptions } = args
    const { 
        after, 
        before, 
        limit, 
        setCursor = defaultSetCursor, 
        getCursor = defaultGetCursor 
    } = cursor!
    let result, totalCount

    [result, totalCount] = await Promise.all([
        (context as any).findMany({
            ...findManyOptions,
            take: limit ? (before ? -limit : limit) : undefined,
            cursor: after || before ? setCursor((after ?? before)!) : undefined,  
        }),
        (context as any).count({
            where: args.where,
        }),
    ])

    const meta = generateMetaCursor({
        hasPreviousPage: after ? true : false, //TODO: Mudar essa grande merda
        hasNextPage: before ? true : false, //TODO: Mudar essa grande merda
        totalCount, 
        count: result.length, 
        startCursor: getCursor(result[0]), 
        endCursor: getCursor(result[result.length-1])})
    return {
        result,
        meta
    }
}

function defaultSetCursor<T>(cursor: T): Record<string, T> {
    return {
        id: cursor
    }
}

function defaultGetCursor<T extends Record<string, O>, O>(cursor: T): O {
    return cursor[Object.keys(cursor)[0]];
}

type cursorMeta = {
    totalCount: number
    count: number
    hasPreviousPage: boolean
    hasNextPage: boolean
    startCursor: string | number | null
    endCursor: string | number | null
}

export type cursorResult<T,A> = {
    result: findManyResult<T,A>
    meta: cursorMeta
}

type generateMetaCursorParams = {
    totalCount: number
    count: number
    hasPreviousPage: boolean
    hasNextPage: boolean
    startCursor: string | number
    endCursor: string | number
}

function generateMetaCursor({totalCount, count, startCursor, endCursor, hasPreviousPage}: generateMetaCursorParams): cursorMeta {
    return {
        totalCount: totalCount,
        count: count,
        startCursor: startCursor,
        endCursor: endCursor,
        hasPreviousPage: hasPreviousPage,
        hasNextPage: true
    }
}
