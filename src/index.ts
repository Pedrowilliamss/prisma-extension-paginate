import { Prisma } from "@prisma/client";
import { paginateArgs, PaginateResult } from "./types";
import { offset } from "./offset";
import { cursor } from "./cursor";

export default (options?: paginateOptions) => {
    return Prisma.defineExtension((client) => {
        return client.$extends({
            name: "pagianate",
            model: {
                $allModels: {
                    paginate: paginate
                }
            }
        })  
    })
} 

async function paginate<T, A extends paginateArgs<T>>(
    this: T, 
    args: A,
): Promise<PaginateResult<T,A>> {
    if ("offset" in args) {
        return offset(this,args) as unknown as PaginateResult<T,A>
    }

    if ("cursor" in args) {
        return cursor(this,args) as unknown as PaginateResult<T,A>
    }
    
    throw new Error() // TODO: Especifi a prismaValidationError
}


interface paginateOptions {
    pageSize?: number
}

