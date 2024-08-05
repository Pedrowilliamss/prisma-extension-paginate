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

type cursorPaginate = {
  limit?: number
  setCursor?: <C>(cursor: string | number) => C
  getCursor?: <T>(target: T) => string | number
} & Exclusive<{ before?: string | number }, { after?: string | number }>

export type PaginateResult<T, A> = A extends { cursor: cursorPaginate } ? cursorResult<T, A> : offsetResult<T, A>

export type paginateArgs<T> = findManyArgsOmited<T> & Exclusive<{ offset: offsetPaginate }, { cursor: cursorPaginate }>

export type findManyResult<T, A> = Prisma.Result<T, A, "findMany">