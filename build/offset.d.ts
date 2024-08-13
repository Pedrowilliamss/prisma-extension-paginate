import { offsetPaginateArgs, offsetResult } from "./types";
export declare function offset<T, A extends offsetPaginateArgs<T>>(model: T, args: A): Promise<offsetResult<T, A>>;
