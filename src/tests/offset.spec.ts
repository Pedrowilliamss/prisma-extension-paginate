import { afterEach, beforeEach, describe, expect, expectTypeOf, it } from "vitest"
import setup from "./utils/setup-tests"
import teardown from "./utils/teardown-tests"
import prismaPaginateExtension from "../index"
import { PER_PAGE } from "../lib/constants"
import { prisma } from "../lib/prisma"
import { Post, PrismaClient, User } from "@prisma/client"
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
        const { data, meta } = await prisma.user.paginate({
            offset: {
                page: 1,
                perPage: 10
            },
            select: {
                id: true
            }
        })

        expect(data).toHaveLength(meta.pageCount)
    })

    it("Should be able to paginate with query", async () => {
        const newUser = await prisma.user.create({
            data: {
                name: "unique-name",
                email: "unique-email@gmail.com",
                password: "some-password-hash",
            }
        })

        const { data } = await prisma.user.paginate({
            where: {
                email: newUser.email
            },
            offset: {
                page: 1,
                perPage: 30
            },
        })

        expect(data[0]).toEqual(expect.objectContaining(newUser))
    })

    it("Should be able to return an `array` of objects having the `type` according to the caller", async () => {
        const { data: userResult } = await prisma.user.paginate({
            offset: {
                page: 1,
                perPage: 10
            }
        })

        expectTypeOf(userResult[0]).toEqualTypeOf<User>()

        const { data: postResult } = await prisma.post.paginate({
            offset: {
                page: 1,
                perPage: 10
            }
        })

        expectTypeOf(postResult[0]).toEqualTypeOf<Post>()
    })

    it("Should be able to return the first page of data if `offser.page` is not provided", async () => {
        const perPage = Math.ceil(numberOfInserts / 2)
        const { data, meta } = await prisma.user.paginate({
            offset: {
                perPage
            }
        })

        const totalPage = Math.ceil(numberOfInserts / perPage)
        const nextPage = totalPage > 1 ? 2 : null

        expect(data).toHaveLength(perPage)
        expect(meta).toEqual(expect.objectContaining({
            totalCount: numberOfInserts,
            pageCount: perPage,
            totalPages: totalPage,
            currentPage: 1,
            previousPage: null,
            nextPage: nextPage
        }))
    })

    it("Should always return the first page if 'page' is not specified", async () => {
        const perPage = Math.ceil(numberOfInserts / 2)
        const { data, meta } = await prisma.user.paginate({
            offset: {
                perPage
            }
        })

        const totalPage = Math.ceil(numberOfInserts / perPage)
        const nextPage = totalPage > 1 ? 2 : null

        expect(data).toHaveLength(perPage)
        expect(meta).toEqual(expect.objectContaining({
            totalCount: numberOfInserts,
            pageCount: perPage,
            totalPages: totalPage,
            currentPage: 1,
            previousPage: null,
            nextPage: nextPage
        }))
    })

    it("Should be able to return all data if `offsert.perPage` is -1, even if there is a default value", async () => {
        const prismaWithDefaultOptions = new PrismaClient().$extends(
            prismaPaginateExtension({
                offset: {
                    perPage: PER_PAGE
                }
            })
        )
        const perPage = -1
        const { data } = await prismaWithDefaultOptions.user.paginate({
            offset: {
                perPage
            }
        })

        expect(data).toHaveLength(numberOfInserts)
    })

    it("Should be able to return all data if `offsert.perPage` is undefined and does not have a default value", async () => {
        const prismaWithoutDefaultOptions = new PrismaClient().$extends(
            prismaPaginateExtension()
        )
        const { data } = await prismaWithoutDefaultOptions.user.paginate({
            offset: {}
        })

        expect(data).toHaveLength(numberOfInserts)
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

        expectTypeOf(meta).toEqualTypeOf<{
            totalCount: number
            pageCount: number
            totalPages: number
            currentPage: number
            previousPage: number | null
            nextPage: number | null
        }>()

        expect(meta).toEqual(expect.objectContaining({
            totalCount: numberOfInserts,
            pageCount: perPage,
            totalPages: Math.ceil(numberOfInserts / perPage),
            currentPage: page,
            previousPage: null,
            nextPage: page + 1
        }))
    })

    it("Should be able to return an empty array if it does not find the specified data.", async () => {
        const page = 1
        const perPage = 20
        const { data, meta } = await prisma.user.paginate({
            where: {
                id: -1
            },
            offset: {
                page,
                perPage
            }
        })

        expect(data).toHaveLength(0)
        expect(meta).toEqual(expect.objectContaining({
            totalCount: 0,
            pageCount: 0,
            totalPages: 1,
            currentPage: 1,
            previousPage: null,
            nextPage: null
        }))
    })

    it("Should be able to use the default options", async () => {
        const prismaWithDefaultOptions = new PrismaClient().$extends(
            prismaPaginateExtension({
                offset: {
                    perPage: PER_PAGE
                }
            })
        )
        const { data, meta } = await prismaWithDefaultOptions.user.paginate({
            offset: {}
        })

        expect(data).toHaveLength(PER_PAGE)
        expect(meta).toEqual(expect.objectContaining({
            pageCount: PER_PAGE,
            currentPage: 1,
            previousPage: null,
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