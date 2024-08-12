import { prisma } from "../../lib/prisma"

export default async function setup(count: number) {
  await prisma.$connect()

  for (let i = 1; i <= count; i++) {
    await prisma.user.create({
      data: {
        email: `email${i}`,
        name: `name${i}`,
        password: `password${i}`,
        posts: {
          create: {
            description: "some-description",
          }
        }
      }
    })
  }
}