import { Prisma } from "@prisma/client"
import { offsetResult } from "./offset"
import { cursorResult } from "./cursor"

export type Exclusive<
  T extends Record<PropertyKey, unknown>,
  U extends Record<PropertyKey, unknown>
> =
  | (T & { [k in Exclude<keyof U, keyof T>]?: never })
  | (U & { [k in Exclude<keyof T, keyof U>]?: never })

export type findManyArgsOmited<T> = Omit<Prisma.Args<T, "findMany">, "skip" | "take" | "cursor">

type offsetPaginate = {
  page?: number
  perPage?: number
}

export type cursorPaginate = {
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

export type PaginateResult<T, A> = A extends { cursor: cursorPaginate } ? cursorResult<T, A> : offsetResult<T, A>

export type paginateArgs<T> = findManyArgsOmited<T> & Exclusive<{ offset: offsetPaginate | true }, { cursor: cursorPaginate | true }>

export type cursorPaginateArgs<T> = findManyArgsOmited<T> & { cursor: cursorPaginate }

export type offsetPaginateArgs<T> = findManyArgsOmited<T> & { offset: offsetPaginate }

export type findManyResult<T, A> = Prisma.Result<T, A, "findMany">