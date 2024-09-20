import { Prisma } from "@prisma/client"
import { CursorPaginateArgs, CursorResult, FindManyResult } from "./types"
import { PrismaClientValidationError } from "@prisma/client/runtime/library"

export async function cursor<T, A extends CursorPaginateArgs<T>>(
	model: T,
	args: A
): Promise<CursorResult<T, A>> {
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
	const isLimitDefined = limit && limit >= 0

	if (after) {
		if (isLimitDefined) {
			take = limit + 1
		}
		let [data, previousPage] = await Promise.all([
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
				skip: limit === 1 ? 0 : 1
			}),
		])

		const isDataEmpty = data.length === 0
		if (isDataEmpty) {
			return [
				data,
				{
					endCursor: null,
					startCursor: null,
					hasNextPage: false,
					hasPreviousPage: false
				}
			]
		}

		let hasNextPage = limit !== undefined && data.length > limit
		if (hasNextPage) {
			data.pop()
		}

		return [
			data,
			{
				hasPreviousPage: previousPage.length === 1,
				hasNextPage: hasNextPage,
				startCursor: getCursor(data[0]),
				endCursor: getCursor(data[data.length - 1])
			}
		]
	}

	if (before) {
		if (isLimitDefined) {
			take = -limit - 1
		}

		let [data, nextPage] = await Promise.all([
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

		const isDataEmpty = data.length === 0
		if (isDataEmpty) {
			return [
				data,
				{
					endCursor: null,
					startCursor: null,
					hasNextPage: false,
					hasPreviousPage: false
				}
			]
		}

		let hasPreviousPage = limit !== undefined && data.length > limit
		if (hasPreviousPage) {
			data.shift()
		}

		return [
			data,
			{
				hasPreviousPage: hasPreviousPage,
				hasNextPage: nextPage.length === 1,
				startCursor: getCursor(data[0]),
				endCursor: getCursor(data[data.length - 1])
			}
		]
	}

	if (isLimitDefined) {
		take = limit + 1
	}

	let data = await (context as any).findMany({
		...findManyOptions,
		take: take,
	})

	const isDataEmpty = data.length === 0
	if (isDataEmpty) {
		return [
			data,
			{
				endCursor: null,
				startCursor: null,
				hasNextPage: false,
				hasPreviousPage: false
			}
		]
	}

	let hasNextPage = limit! > 0 && data.length > limit!
	if (hasNextPage) {
		data.pop()
	}

	return [
		data,
		{
			hasPreviousPage: false,
			hasNextPage: hasNextPage,
			startCursor: getCursor(data[0]),
			endCursor: getCursor(data[data.length - 1])
		}
	]
}