import { CursorPaginateArgs, CursorResult } from "./types";
export declare function cursor<T, A extends CursorPaginateArgs<T>>(model: T, args: A): Promise<CursorResult<T, A>>;
