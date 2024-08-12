import { prisma } from "../../lib/prisma";

export default async function teardown() {
    await prisma.post.deleteMany()
    await prisma.user.deleteMany()

    await prisma.$disconnect()
}