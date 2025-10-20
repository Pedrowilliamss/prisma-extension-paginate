import { PaginateArgs, PaginateOptions, PaginateResult, PrismaNamespace } from "./types";
export declare let Prisma: PrismaNamespace;
export declare function createPaginateExtension(prisma: PrismaNamespace, options?: Partial<PaginateOptions>): (client: any) => {
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
declare function paginate<T, A extends PaginateArgs<T>>(this: T, args: A): Promise<PaginateResult<T, A>>;
export {};
//# sourceMappingURL=index.d.ts.map