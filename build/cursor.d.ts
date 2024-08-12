import { cursorPaginateArgs, findManyResult } from "./types";
export declare function cursor<T, A extends cursorPaginateArgs<T>>(model: T, args: A): Promise<cursorResult<T, A>>;
type cursorMeta = {
    hasPreviousPage: boolean;
    hasNextPage: boolean;
    startCursor: string | number;
    endCursor: string | number;
};
export type cursorResult<T, A> = {
    data: findManyResult<T, A>;
    meta: cursorMeta;
};
export {};
