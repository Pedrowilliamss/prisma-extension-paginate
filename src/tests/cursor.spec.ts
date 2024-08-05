import { afterEach, beforeEach, describe, expect, expectTypeOf, it } from "vitest"
import setup from "./utils/setup-tests"
import teardown from "./utils/teardown-tests"
import { randomInt } from "crypto"
import { prisma } from "@/lib/prisma"
import { User } from "@prisma/client"
import { PrismaClientValidationError } from "@prisma/client/runtime/library"

let numberOfInserts = randomInt(6, 37)

describe("Cursor", async () => {
    beforeEach(async () => {
        await setup(numberOfInserts)
    })

    afterEach(async () => {
        await teardown()
    })

    it("Should be able to use cursor-based pagination", async () => {
        const { result } = await prisma.user.paginate({
            cursor: {}
        })

        const target = result[0]
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
        const { meta } = await prisma.user.paginate({
            cursor: {
                after: cursor,
                limit: 10
            },
        })

        expectTypeOf(meta).toEqualTypeOf<{
            hasPreviousPage: boolean,
            hasNextPage: boolean,
            startCursor: string | number,
            endCursor: string | number
        }>()

        expect(meta).toHaveProperty('startCursor')
        expect(meta).toHaveProperty('endCursor')
        expect(meta).toHaveProperty('hasPreviousPage')
        expect(meta).toHaveProperty('hasNextPage')
    })

    it("Should be able to return the typed result according to the arguments", async () => {
        const limit = 1
        const { result } = await prisma.user.paginate({
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

        expectTypeOf(result[0]).toEqualTypeOf<{
            id: number,
            name: string | null,
            posts: {
                id: number
            }[],
        }>()
        expect(result[0]).toStrictEqual({
            id: expect.any(Number),
            name: expect.any(String),
            posts: expect.arrayContaining([{
                id: expect.any(Number),
            }]),
        })
    })

    it("Should be able to use cursor-based pagination using the 'limit' parameter", async () => {
        const limit = Math.ceil(numberOfInserts / 3)
        const { result } = await prisma.user.paginate({
            cursor: {
                limit: limit
            },
        })

        const expectedResult = await prisma.user.findMany({
            take: limit
        })

        expect(result).toStrictEqual(expectedResult)
    })

    it("Should be able to use cursor to page through the first 'n' results", async () => {
        const limit = Math.ceil(numberOfInserts / 3)
        const { result, meta } = await prisma.user.paginate({
            cursor: {
                limit: limit
            }
        })
        const { id: startCursor } = result[0]
        const { id: endCurso } = result[limit - 1]

        const expectedResult = await prisma.user.findMany({
            take: limit
        })

        expect(result).toStrictEqual(expectedResult)

        expect(meta).toStrictEqual({
            hasPreviousPage: false,
            hasNextPage: true,
            startCursor: startCursor,
            endCursor: endCurso
        })
    })

    it("Should be able to use cursor to page through the next 'n' results", async () => {
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

        const { result, meta } = await prisma.user.paginate({
            cursor: {
                after: cursor,
                limit: limit
            },
        })

        expect(result).toStrictEqual(expectedResults)
        expect(meta).toStrictEqual({
            hasPreviousPage: true,
            hasNextPage: true,
            startCursor: expectedResults[0].id,
            endCursor: expectedResults[limit - 1].id
        })
    })

    it("Should be able to use cursor to page through the previous 'n' results", async () => {
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

        const { result, meta } = await prisma.user.paginate({
            cursor: {
                before: cursor,
                limit: limit
            },
        })

        expect(result).toStrictEqual(expectedResults)
        expect(meta).toStrictEqual({
            hasPreviousPage: false,
            hasNextPage: true,
            startCursor: expectedResults[0].id,
            endCursor: expectedResults[expectedResults.length - 1].id
        })
    })

    it("Should be able to use cursor to page through the last 'n' results using 'after'", async () => {
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

        const { result, meta } = await prisma.user.paginate({
            cursor: {
                after: cursor,
                limit: limit
            },
        })

        expect(result).toStrictEqual(expectedResults)
        expect(meta).toStrictEqual({
            hasPreviousPage: true,
            hasNextPage: false,
            startCursor: expectedResults[0].id,
            endCursor: expectedResults[expectedResults.length - 1].id
        })
    })

    it("Should be able to use cursor to page through the last 'n' results using 'before'", async () => {
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

        const { result, meta } = await prisma.user.paginate({
            cursor: {
                before: cursor,
                limit: limit
            },
        })

        expect(result).toStrictEqual(expectedResults)
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
})