import { PaginateArgs, PaginateOptions, PaginateResult, PrismaNamespace } from "./types";
export declare function createPagianteExtension(prisma: PrismaNamespace, options?: Partial<PaginateOptions>): (client: any) => {
    $extends: {
        extArgs: {
            result: {};
            model: {
                $allModels: {
                    paginate: () => <T, A extends PaginateArgs<T>>(this: T, args: A) => Promise<PaginateResult<T, A>>;
                };
                user: {
                    paginate: () => <T, A extends PaginateArgs<T>>(this: T, args: A) => Promise<PaginateResult<T, A>>;
                };
                post: {
                    paginate: () => <T, A extends PaginateArgs<T>>(this: T, args: A) => Promise<PaginateResult<T, A>>;
                };
            };
            query: {};
            client: {};
        };
    };
};
//# sourceMappingURL=index.d.ts.map