import { afterEach, beforeEach, describe, expect, expectTypeOf, it } from "vitest"
import setup from "./utils/setup-tests"
import teardown from "./utils/teardown-tests"
import prismaPaginateExtension from "../index"
import { randomInt } from "crypto"
import { LIMIT } from "../lib/constants"
import { prisma } from "../lib/prisma"
import { User, PrismaClient } from "@prisma/client"
import { PrismaClientValidationError } from "@prisma/client/runtime/library"
import { CursorMeta } from "../types"

let numberOfInserts = randomInt(5, 37)

describe("Cursor", async () => {
    beforeEach(async () => {
        await setup(numberOfInserts)
    })

    afterEach(async () => {
        await teardown()
    })

    it("Should be able to use cursor-based pagination", async () => {
        const [data] = await prisma.user.paginate({
            cursor: true
        })

        const target = data[0]
        expectTypeOf(target).toEqualTypeOf<User>()

        expect(target).toStrictEqual({
            id: expect.any(Number),
            name: expect.any(String),
            email: expect.any(String),
            password: expect.any(String),
        })
    })

    it("Should be able to get the metadata from cursor-based pagination", async () => {
        const { id: cursor } = await prisma.user.findFirstOrThrow()
        const [_, meta] = await prisma.user.paginate({
            cursor: {
                after: cursor,
                limit: 10
            },
        })

        expectTypeOf(meta).toEqualTypeOf<{
            hasPreviousPage: boolean,
            hasNextPage: boolean,
            startCursor: string | number | null,
            endCursor: string | number | null
        }>()

        expect(meta).toHaveProperty('startCursor')
        expect(meta).toHaveProperty('endCursor')
        expect(meta).toHaveProperty('hasPreviousPage')
        expect(meta).toHaveProperty('hasNextPage')
    })

    it("Should be able use default options", async () => {
        const prismaWithDefaultOptions = new PrismaClient().$extends(
            prismaPaginateExtension({
                cursor: {
                    limit: LIMIT,
                    getCursor: (target) => { return (target as any).id },
                    setCursor: (cursor) => { return { id: cursor } }
                }
            })
        )

        const [data, meta] = await prismaWithDefaultOptions.user.paginate({
            cursor: true
        })

        const expectedResult = await prisma.user.findMany({
            take: LIMIT
        })

        expect(data).toStrictEqual(expectedResult)
        expect(meta).toStrictEqual({
            hasPreviousPage: false,
            hasNextPage: true,
            startCursor: expectedResult[0].id,
            endCursor: expectedResult[expectedResult.length - 1].id,
        })
    })

    it("Should be able use custom get and set cursor", async () => {
        let limit = 5
        const { email } = await prisma.user.findFirstOrThrow({
            orderBy: {
                email: "asc"
            }
        })

        const [data, meta] = await prisma.user.paginate({
            cursor: {
                setCursor(cursor) {
                    return { email: cursor }
                },
                getCursor(target) {
                    return (target as any).email
                },
                after: email,
                limit: limit
            },
            orderBy: {
                email: "asc"
            }
        })

        const expectedResults = await prisma.user.findMany({
            cursor: {
                email: email
            },
            skip: 1,
            take: limit,
            orderBy: {
                email: "asc"
            }
        })

        expect(data.length).toStrictEqual(expectedResults.length)
        expect(meta).toStrictEqual({
            hasPreviousPage: false,
            hasNextPage: true,
            startCursor: expectedResults[0].email,
            endCursor: expectedResults[expectedResults.length - 1].email,
        })
    })

    it("Should be able to return all data if `offsert.perPage` is -1, even if there is a default value", async () => {
        const prismaWithDefaultOptions = new PrismaClient().$extends(
            prismaPaginateExtension({
                cursor: {
                    limit: LIMIT
                }
            })
        )

        const [data, meta] = await prismaWithDefaultOptions.user.paginate({
            cursor: {
                limit: -1
            }
        })

        expect(data).toHaveLength(numberOfInserts)
        expect(meta).toEqual(expect.objectContaining({
            hasPreviousPage: false,
            hasNextPage: false,
        }))
    })

    it("Should be able to return the typed data according to the arguments", async () => {
        const limit = 1
        const [data] = await prisma.user.paginate({
            cursor: {
                limit: limit
            },
            select: {
                id: true,
                name: true,
                posts: {
                    select: {
                        id: true
                    }
                }
            },
        })

        expectTypeOf(data[0]).toEqualTypeOf<{
            id: number,
            name: string | null,
            posts: {
                id: number
            }[],
        }>()
        expect(data[0]).toStrictEqual({
            id: expect.any(Number),
            name: expect.any(String),
            posts: expect.arrayContaining([{
                id: expect.any(Number),
            }]),
        })
    })

    it("Should be able to use cursor-based pagination using the 'limit' parameter", async () => {
        const limit = Math.ceil(numberOfInserts / 3)
        const [data] = await prisma.user.paginate({
            cursor: {
                limit: limit
            },
        })

        const expectedResult = await prisma.user.findMany({
            take: limit
        })

        expect(data).toStrictEqual(expectedResult)
    })

    it("Should be able to use cursor to page through the first 'n' data", async () => {
        const limit = Math.ceil(numberOfInserts / 3)
        const [data, meta] = await prisma.user.paginate({
            cursor: {
                limit: limit
            }
        })
        const { id: startCursor } = data[0]
        const { id: endCurso } = data[limit - 1]

        const expectedResult = await prisma.user.findMany({
            take: limit
        })

        expect(data).toStrictEqual(expectedResult)

        expect(meta).toStrictEqual({
            hasPreviousPage: false,
            hasNextPage: true,
            startCursor: startCursor,
            endCursor: endCurso
        })
    })

    it("Should be able to use cursor to page through the next 'n' data", async () => {
        const limit = Math.ceil(numberOfInserts / 3)

        const { id: cursor } = await prisma.user.findFirstOrThrow({
            skip: limit,
            select: {
                id: true
            }
        })

        const expectedResults = await prisma.user.findMany({
            cursor: {
                id: cursor
            },
            take: limit,
            skip: 1
        })

        const [data, meta] = await prisma.user.paginate({
            cursor: {
                after: cursor,
                limit: limit
            },
        })

        expect(data).toStrictEqual(expectedResults)
        expect(meta).toStrictEqual({
            hasPreviousPage: true,
            hasNextPage: true,
            startCursor: expectedResults[0].id,
            endCursor: expectedResults[limit - 1].id
        })
    })

    it("Should be able to use cursor to page through the previous 'n' data", async () => {
        const limit = Math.ceil(numberOfInserts / 3)

        const { id: cursor } = await prisma.user.findFirstOrThrow({
            skip: limit,
            select: {
                id: true
            }
        })

        const expectedResults = await prisma.user.findMany({
            cursor: {
                id: cursor
            },
            take: -limit,
            skip: 1
        })

        const [data, meta] = await prisma.user.paginate({
            cursor: {
                before: cursor,
                limit: limit
            },
        })

        expect(data).toStrictEqual(expectedResults)
        expect(meta).toStrictEqual({
            hasPreviousPage: false,
            hasNextPage: true,
            startCursor: expectedResults[0].id,
            endCursor: expectedResults[expectedResults.length - 1].id
        })
    })

    it("Should be able to use cursor to page through the last 'n' data using 'after'", async () => {
        const totalPages = 3
        const limit = Math.ceil(numberOfInserts / totalPages)

        const { id: cursor } = await prisma.user.findFirstOrThrow({
            skip: limit * (totalPages - 1),
            select: {
                id: true
            }
        })

        const expectedResults = await prisma.user.findMany({
            cursor: {
                id: cursor
            },
            take: limit,
            skip: 1
        })

        const [data, meta] = await prisma.user.paginate({
            cursor: {
                after: cursor,
                limit: limit
            },
        })

        expect(data).toStrictEqual(expectedResults)
        expect(meta).toStrictEqual({
            hasPreviousPage: true,
            hasNextPage: false,
            startCursor: expectedResults[0].id,
            endCursor: expectedResults[expectedResults.length - 1].id
        })
    })

    it("Should be able to use cursor to page through the last 'n' data using 'before'", async () => {
        const totalPages = 3
        const limit = Math.ceil(numberOfInserts / totalPages)

        const { id: cursor } = await prisma.user.findFirstOrThrow({
            skip: numberOfInserts - 1,
            select: {
                id: true
            }
        })

        const expectedResults = await prisma.user.findMany({
            take: -limit,
            skip: 1
        })

        const [data, meta] = await prisma.user.paginate({
            cursor: {
                before: cursor,
                limit: limit
            },
        })

        expect(data).toStrictEqual(expectedResults)
        expect(meta).toStrictEqual({
            hasPreviousPage: true,
            hasNextPage: false,
            startCursor: expectedResults[0].id,
            endCursor: expectedResults[expectedResults.length - 1].id
        })
    })

    it("Should not be able to use cursor-based pagination with after and before used in sets", async () => {
        await expect(() => prisma.user.paginate({
            cursor: {
                after: 1,
                // @ts-ignore
                before: 3
            }
        })).rejects.toBeInstanceOf(PrismaClientValidationError)
    })

    it("Should be able to pagination on empty tables", async () => {
        const invalidId = -1
        const [data, meta] = await prisma.user.paginate({
            where: {
                id: invalidId
            },
            cursor: true
        })

        expect(data).toHaveLength(0)
        expect(meta).toEqual<CursorMeta>({
            endCursor: null,
            startCursor: null,
            hasNextPage: false,
            hasPreviousPage: false
        })
    })
})