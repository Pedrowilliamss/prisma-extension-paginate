import { Prisma } from "@prisma/client"
import { PrismaClientValidationError } from "@prisma/client/runtime/library"
import { findManyResult, paginateArgs } from "./types"

type offsetMeta = {
    totalCount: number
    pageCount: number
    totalPages: number
    currentPage: number
    previousPage: number | null
    nextPage: number | null
}

export type offsetResult<T,A> = {
    result: findManyResult<T,A>
    meta: offsetMeta
}

export async function offset<T, A extends paginateArgs<T>>(
    model: T, 
    args: A, 
): Promise<offsetResult<T, A>> {
    const context = Prisma.getExtensionContext(model)
    const {offset, ...findManyOptions} = args

    let { page = 1, perPage } = offset!

    if (typeof page !== "number") { 
        const clientVersion = Prisma.prismaVersion.client
        throw new PrismaClientValidationError(
            `Argument page: Invalid value provided. Expected Int, provided ${typeof page}`,
            { clientVersion }
        )
    }

    if (perPage !== undefined && typeof perPage !== "number") {
        const clientVersion = Prisma.prismaVersion.client
        throw new PrismaClientValidationError(
            `Argument perPage: Invalid value provided. Expected Int, provided ${typeof perPage}`,
            { clientVersion }
        )
    }

    if (perPage && perPage > Number.MAX_SAFE_INTEGER) {
        const clientVersion = Prisma.prismaVersion.client
        throw new PrismaClientValidationError(
            `Unable to fit value 1e+21 into a 64-bit signed integer for field \`perPage\``,
            { clientVersion }
        )
    }

    let result, totalCount

    [result, totalCount] = await Promise.all([
        (context as any).findMany({
            ...findManyOptions,
            skip: perPage ? (page - 1) * perPage : undefined,
            take: perPage,
        }),
        (context as any).count({
            where: args.where,
        }),
    ])

    const meta = generateMetaPaginate({totalCount, page, perPage, pageCount: result.length})

    return {
        result,
        meta
    }
}  

type generateMetaPaginateParams = {
    totalCount: number
    perPage?: number
    page?: number,
    pageCount: number
}

function generateMetaPaginate({ page, pageCount, perPage, totalCount }: generateMetaPaginateParams): offsetMeta {
    perPage = perPage ?? totalCount
    let totalPages = Math.ceil(totalCount / perPage) || 1
    const currentPage = Math.min(page ?? 1, totalPages)
    const previousPage = currentPage > 1 ? currentPage -1 : null
    const nextPage = currentPage < totalPages ? currentPage + 1 : null

    return {
        totalCount,
        pageCount,
        totalPages, 
        currentPage,
        previousPage,
        nextPage
    }
}
