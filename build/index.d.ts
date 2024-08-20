import { PaginateArgs, PaginateOptions, PaginateResult } from "./types";
declare const _default: (options?: Partial<PaginateOptions>) => (client: any) => {
    $extends: {
        extArgs: {
            result: {};
            model: {
                $allModels: {
                    paginate: () => typeof paginate;
                };
                user: {
                    paginate: () => typeof paginate;
                };
                post: {
                    paginate: () => typeof paginate;
                };
            };
            query: {};
            client: {};
        };
    };
};
export default _default;
declare function paginate<T, A extends PaginateArgs<T>>(this: T, args: A): Promise<PaginateResult<T, A>>;
