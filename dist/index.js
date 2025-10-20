"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Prisma = void 0;
exports.createPaginateExtension = createPaginateExtension;
const offset_1 = require("./offset");
const cursor_1 = require("./cursor");
const library_1 = require("@prisma/client/runtime/library");
let defaultArgs;
function createPaginateExtension(prisma, options) {
    defaultArgs = options;
    exports.Prisma = prisma;
    return prisma.defineExtension((client) => {
        return client.$extends({
            name: "paginate",
            model: {
                $allModels: {
                    paginate,
                }
            }
        });
    });
}
async function paginate(args) {
    if ("offset" in args) {
        if (typeof args.offset !== "object") {
            args.offset = {};
        }
        args.offset.perPage = args.offset?.perPage ?? defaultArgs?.offset?.perPage;
        return (0, offset_1.offset)(this, args);
    }
    if ("cursor" in args) {
        if (typeof args.cursor !== "object") {
            args.cursor = {};
        }
        args.cursor.limit = args.cursor.limit ?? defaultArgs?.cursor?.limit;
        args.cursor.getCursor = args.cursor.getCursor ?? defaultArgs?.cursor?.getCursor;
        args.cursor.setCursor = args.cursor.setCursor ?? defaultArgs?.cursor?.setCursor;
        return (0, cursor_1.cursor)(this, args);
    }
    const clientVersion = exports.Prisma.prismaVersion.client;
    throw new library_1.PrismaClientValidationError(`Unable to use paginate without 'offset' or 'cursor'`, { clientVersion });
}
//# sourceMappingURL=index.js.map