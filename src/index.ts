import { Prisma } from "@prisma/client"
import { CursorPaginateArgs, OffsetPaginateArgs, PaginateArgs, PaginateOptions, PaginateResult } from "./types"
import { offset } from "./offset"
import { cursor } from "./cursor"
import { PrismaClientValidationError } from "@prisma/client/runtime/library"

let defaultArgs: Partial<PaginateOptions> | undefined
export default (options?: Partial<PaginateOptions>) => {
    defaultArgs = options

    return Prisma.defineExtension((client) => {
        return client.$extends({
            name: "paginate",
            model: {
                $allModels: {
                    paginate,
                }
            }
        })
    })
}

async function paginate<T, A extends PaginateArgs<T>>(
    this: T,
    args: A,
): Promise<PaginateResult<T, A>> {
    if ("offset" in args) {
        if (typeof args.offset !== "object") {
            args.offset = {}
        }

        args.offset.perPage = args.offset?.perPage ?? defaultArgs?.offset?.perPage
        return offset(this, args as OffsetPaginateArgs<T>) as unknown as PaginateResult<T, A>
    }

    if ("cursor" in args) {
        if (typeof args.cursor !== "object") {
            args.cursor = {}
        }

        args.cursor.limit = args.cursor.limit ?? defaultArgs?.cursor?.limit
        args.cursor.getCursor = args.cursor.getCursor ?? defaultArgs?.cursor?.getCursor
        args.cursor.setCursor = args.cursor.setCursor ?? defaultArgs?.cursor?.setCursor

        return cursor(this, args as CursorPaginateArgs<T>) as unknown as PaginateResult<T, A>
    }

    const clientVersion = Prisma.prismaVersion.client
    throw new PrismaClientValidationError(
        `Unable to use paginate without 'offset' or 'cursor'`,
        { clientVersion }
    )
}