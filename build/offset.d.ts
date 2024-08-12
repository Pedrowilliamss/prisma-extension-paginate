import { findManyResult, offsetPaginateArgs } from "./types";
type offsetMeta = {
    totalCount: number;
    pageCount: number;
    totalPages: number;
    currentPage: number;
    previousPage: number | null;
    nextPage: number | null;
};
export type offsetResult<T, A> = {
    data: findManyResult<T, A>;
    meta: offsetMeta;
};
export declare function offset<T, A extends offsetPaginateArgs<T>>(model: T, args: A): Promise<offsetResult<T, A>>;
export {};
