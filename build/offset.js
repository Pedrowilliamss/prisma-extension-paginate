"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.offset = offset;
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
async function offset(model, args) {
    const context = client_1.Prisma.getExtensionContext(model);
    const { offset, ...findManyOptions } = args;
    let { page = 1, perPage } = offset;
    if (typeof page !== "number") {
        const clientVersion = client_1.Prisma.prismaVersion.client;
        throw new library_1.PrismaClientValidationError(`Argument page: Invalid value provided. Expected Int, provided ${typeof page}`, { clientVersion });
    }
    if (perPage !== undefined && typeof perPage !== "number") {
        const clientVersion = client_1.Prisma.prismaVersion.client;
        throw new library_1.PrismaClientValidationError(`Argument perPage: Invalid value provided. Expected Int, provided ${typeof perPage}`, { clientVersion });
    }
    if (perPage && perPage > Number.MAX_SAFE_INTEGER) {
        const clientVersion = client_1.Prisma.prismaVersion.client;
        throw new library_1.PrismaClientValidationError(`Unable to fit value 1e+21 into a 64-bit signed integer for field \`perPage\``, { clientVersion });
    }
    let data, totalCount, skip, take;
    if (perPage && perPage !== -1) {
        skip = (page - 1) * perPage;
        take = perPage;
    }
    [data, totalCount] = await Promise.all([
        context.findMany({
            ...findManyOptions,
            skip: skip,
            take: take,
        }),
        context.count({
            where: args.where,
        }),
    ]);
    const meta = generateMetaPaginate({ totalCount, page, perPage, pageCount: data.length });
    return [
        data,
        meta
    ];
}
function generateMetaPaginate({ page, pageCount, perPage, totalCount }) {
    perPage = perPage ?? totalCount;
    let totalPages = Math.ceil(totalCount / perPage) || 1;
    const currentPage = Math.min(page ?? 1, totalPages);
    const previousPage = currentPage > 1 ? currentPage - 1 : null;
    const nextPage = currentPage < totalPages ? currentPage + 1 : null;
    return {
        totalCount,
        pageCount,
        totalPages,
        currentPage,
        previousPage,
        nextPage
    };
}
