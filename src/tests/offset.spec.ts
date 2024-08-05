import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, expectTypeOf, it } from "vitest"
import setup from "./utils/setup-tests"
import teardown from "./utils/teardown-tests"
import { prisma } from "@/lib/prisma"
import { Post, User } from "@prisma/client"
import { PrismaClientValidationError } from "@prisma/client/runtime/library"
import { randomInt } from "crypto"

let numberOfInserts = randomInt(5, 37)

describe("Offset", async () => {
    beforeEach(async () => {
        await setup(numberOfInserts)
    })

    afterEach(async () => {
        await teardown()
    })

    it("Should be able to paginate", async () => {
        const { result, meta } = await prisma.user.paginate({
            offset: {
                page: 1,
                perPage: 10
            },
            select: {
                id: true
            }
        })

        expect(result).toHaveLength(meta.pageCount)
    })

    it("Should be able to paginate with query", async () => {
        const newUser = await prisma.user.create({
            data: {
                name: "unique-name",
                email: "unique-email@gmail.com",
                password: "some-password-hash",
            }
        })

        const { result } = await prisma.user.paginate({
            where: {
                email: newUser.email
            },
            offset: {
                page: 1,
                perPage: 10
            }
        })

        expect(result[0]).toEqual(expect.objectContaining(newUser))
    })

    it("Should be able to return an `array` of objects having the `type` according to the caller", async () => {
        const { result:  userResult } = await prisma.user.paginate({
            offset: {
                page: 1,
                perPage: 10
            }
        })

        expectTypeOf(userResult[0]).toEqualTypeOf<User>()

        const { result:  postResult } = await prisma.post.paginate({
            offset: {
                page: 1,
                perPage: 10
            }
        })

        expectTypeOf(postResult[0]).toEqualTypeOf<Post>()
    })

    it("Should be able to return the first page of results if `offser.page` is not provided", async () => {
        const perPage = Math.ceil(numberOfInserts / 2)
        const { result, meta } = await prisma.user.paginate({
            offset: {
                perPage
            }
        })

        const totalPage = Math.ceil(numberOfInserts / perPage)
        const nextPage = totalPage > 1 ? 2 : null

        expect(result).toHaveLength(perPage)
        expect(meta).toEqual(expect.objectContaining({
            totalCount: numberOfInserts,
            pageCount: perPage,
            totalPages: totalPage,
            currentPage: 1,
            previousPage: null,
            nextPage: nextPage
        }))
    })

    it("Should be able to return all results if `offsert.perPage` is undefined", async () => {
        const perPage = undefined
        const { result } = await prisma.user.paginate({
            offset: {
                page: 3, // It doesn't matter what the value of page is if perPage is undefined
                perPage
            }
        })

        expect(result).toHaveLength(numberOfInserts)
    })

    it("Should be able to return all results when `page` and `perPage` are undefined", async () => {
        const { result, meta } = await prisma.user.paginate({
            offset: {} // TODO: Substituir para offset: true
        })

        expect(result).toHaveLength(numberOfInserts)
        expect(meta).toEqual(expect.objectContaining({
            totalCount: numberOfInserts,
            pageCount: numberOfInserts,
            totalPages: 1,
            currentPage: 1,
            previousPage: null,
            nextPage: null
        }))
    })

    it("Should be able to return a meta object with type `offsetMeta`", async () => {
        const { meta } = await prisma.user.paginate({
            offset: {
                page: 1,
                perPage: 20
            }, 
            select: {
                id: true
            }
        })

        expectTypeOf(meta).toEqualTypeOf<{
            totalCount: number
            pageCount: number
            totalPages: number
            currentPage: number
            previousPage: number | null
            nextPage: number | null
        }>()
    })

    it("Should be able to return a `meta` object with the correct pagination data", async () => {
        const page = 1
        const perPage = Math.ceil(numberOfInserts / 2)
        const { meta } = await prisma.user.paginate({
            offset: {
                page,
                perPage
            }
        })

        expect(meta).toEqual(expect.objectContaining({
            totalCount: numberOfInserts,
            pageCount: perPage,
            totalPages: Math.ceil(numberOfInserts/perPage),
            currentPage: page,
            previousPage: null,
            nextPage: page + 1
        }))
    })

    it("Should be able to return an empty array if it does not find the specified data.", async () => {
        const page = 1
        const perPage = 20
        const { result, meta } = await prisma.user.paginate({
            where: {
                id: -1
            },
            offset: {
                page,
                perPage
            }
        })

        expect(result).toHaveLength(0)
        expect(meta).toEqual(expect.objectContaining({
            totalCount: 0,
            pageCount: 0,
            totalPages: 1,
            currentPage: 1,
            previousPage: null,
            nextPage: null
        }))
    })

    it("Should not be possible to paginate items if the 'page' argument is not a number or undefined", async () => {
        await expect(() => prisma.user.paginate({
            offset: {
                // @ts-ignore
                page: "1",
            }
        })).rejects.toBeInstanceOf(PrismaClientValidationError)
    })

    it("Should not be possible to paginate items if the 'perPage' argument is not a number or undefined", async () => {
        await expect(() => prisma.user.paginate({
                offset: {
                    // @ts-ignore
                    perPage: "1",
                }   
            }
        )).rejects.toBeInstanceOf(PrismaClientValidationError)
    })

    it("Should not be possible to paginate items if the 'perPage' argument is not a valid number", async () => {
        await expect(() => prisma.user.paginate({
                offset: {
                    perPage: Number.MAX_SAFE_INTEGER + 1,
                }   
            }
        )).rejects.toBeInstanceOf(PrismaClientValidationError)
    })

    it("Should not be possible to paginate without specifying the pagination method", async () => {
        // @ts-ignore
        await expect(() => prisma.user.paginate())
            .rejects.toBeInstanceOf(Error)
    })

    it("`meta` should return consistent information if it is on the first page", async () => {
        const numberOfPages = 3
        const page = 1
        const perPage = Math.ceil(numberOfInserts / numberOfPages) // 3 pages
        const { meta } = await prisma.user.paginate({
            offset: {
                page,
                perPage
            }
        })

        expect(meta).toEqual(expect.objectContaining({
            totalCount: numberOfInserts,
            pageCount: perPage,
            totalPages: numberOfPages,
            currentPage: page,
            previousPage: null,
            nextPage: page + 1
        }))
    })

    it("`meta` should return consistent information if it is on the last page", async () => {
        const numberOfPages = 3
        const page = numberOfPages
        const perPage = Math.ceil(numberOfInserts / numberOfPages)

        const { meta } = await prisma.user.paginate({
            offset: {
                page,
                perPage
            }
        })

        expect(meta).toEqual(expect.objectContaining({
            totalCount: numberOfInserts,
            pageCount: numberOfInserts - (perPage * (numberOfPages - 1)),
            totalPages: numberOfPages,
            currentPage: page,
            previousPage: page - 1,
            nextPage: null
        }))
    })

    it("`meta` should return consistent information if it is on the middle page", async () => {
        const numberOfPages = 3
        const page = 2
        const perPage = Math.ceil(numberOfInserts / numberOfPages)
        const { meta } = await prisma.user.paginate({
            offset: {
                page,
                perPage
            }
        })

        expect(meta).toEqual(expect.objectContaining({
            totalCount: numberOfInserts,
            pageCount: perPage,
            totalPages: numberOfPages,
            currentPage: page,
            previousPage: page - 1,
            nextPage: page + 1
        }))
    })

    it("`meta` should return consistent information if there is only one page", async () => {
        const numberOfPages = 1
        const page = 1
        const perPage = Math.ceil(numberOfInserts / numberOfPages)
        const { meta } = await prisma.user.paginate({
            offset: {
                page,
                perPage
            }
        })

        expect(meta).toEqual(expect.objectContaining({
            totalCount: numberOfInserts,
            pageCount: perPage,
            totalPages: numberOfPages,
            currentPage: page,
            previousPage: null,
            nextPage: null
        }))
    })
})