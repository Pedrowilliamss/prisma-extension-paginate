import { OffsetPaginateArgs, OffsetResult } from "./types";
export declare function offset<T, A extends OffsetPaginateArgs<T>>(model: T, args: A): Promise<OffsetResult<T, A>>;
