import { PrismaClient } from "@prisma/client";
import paginate from "../index"

export const prisma = new PrismaClient().$extends(
    paginate()
);