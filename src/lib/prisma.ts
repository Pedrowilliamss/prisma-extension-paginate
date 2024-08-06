import { PrismaClient } from "@prisma/client";
import prismaPaginateExtension from "../index"

export const prisma = new PrismaClient().$extends(
    prismaPaginateExtension()
);