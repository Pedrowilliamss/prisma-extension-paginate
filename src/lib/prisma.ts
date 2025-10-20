import { Prisma, PrismaClient } from "@prisma/client";
import { createPaginateExtension } from "../index"

const extension = createPaginateExtension(Prisma)

export const prisma = new PrismaClient().$extends(
    extension
);