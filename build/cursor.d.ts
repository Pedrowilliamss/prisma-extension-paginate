import { cursorPaginateArgs, cursorResult } from "./types";
export declare function cursor<T, A extends cursorPaginateArgs<T>>(model: T, args: A): Promise<cursorResult<T, A>>;
