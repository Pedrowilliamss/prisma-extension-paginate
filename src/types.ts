import { Prisma } from "@prisma/client"

export type Exclusive<
  T extends Record<PropertyKey, unknown>,
  U extends Record<PropertyKey, unknown>
> =
  | (T & { [k in Exclude<keyof U, keyof T>]?: never })
  | (U & { [k in Exclude<keyof T, keyof U>]?: never })

export type FindManyArgsOmited<T> = Omit<Prisma.Args<T, "findMany">, "skip" | "take" | "cursor">

type OffsetPaginate = {
  page?: number
  perPage?: number
}

export type CursorPaginate = {
  limit?: number
  setCursor?: SetCursor
  getCursor?: GetCursor
} & Exclusive<{ before?: string | number }, { after?: string | number }>

export interface PaginateOptions {
  offset: {
    perPage: number
  },
  cursor: {
    limit?: number
    setCursor?: SetCursor,
    getCursor?: GetCursor
  }
}

type SetCursor = (cursor: string | number) => unknown
type GetCursor = (target: unknown) => string | number

export type PaginateResult<T, A> = A extends { cursor: CursorPaginate } ? CursorResult<T, A> : OffsetResult<T, A>

export type PaginateArgs<T> = FindManyArgsOmited<T> & Exclusive<{ offset: OffsetPaginate | true }, { cursor: CursorPaginate | true }>

export type CursorPaginateArgs<T> = FindManyArgsOmited<T> & { cursor: CursorPaginate }

export type OffsetPaginateArgs<T> = FindManyArgsOmited<T> & { offset: OffsetPaginate }

export type FindManyResult<T, A> = Prisma.Result<T, A, "findMany">

export type CursorMeta = {
  hasPreviousPage: boolean
  hasNextPage: boolean
  startCursor: string | number | null
  endCursor: string | number | null
}

export type CursorResult<T, A> = [
  data: FindManyResult<T, A>,
  meta: CursorMeta
]

export type OffsetMeta = {
  totalCount: number
  pageCount: number
  totalPages: number
  currentPage: number
  previousPage: number | null
  nextPage: number | null
}

export type OffsetResult<T, A> = [
  data: FindManyResult<T, A>,
  meta: OffsetMeta
]