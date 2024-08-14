# Prisma-Extension-Paginate

### Prisma client extension which allows you to perform pagination quickly and easily

# 📚 Table of Contents
- [Installation](#installation)
- [Usage](#usage)
  - [Quick Starte](#quick-Start)
  - [Offset Pagination](#offset-pagination)
  - [Cursor-based Pagination](#cursor-based-pagination)
- [Docs](#docs)

# 🏗️ Installation

**⚠️Note:** This extension requires Prisma version `4.9.0` or higher.

To install the extension, run the following command:

```bash
npm install prisma-extension-paginate
```
Add to prisma client
``` ts
import { PrismaClient } from "@prisma/client";
import paginate from "prisma-extension-paginate";

const prisma = new PrismaClient().$extends(
    paginate()
);
```

Adding default options
``` ts
const prisma = new PrismaClient().$extends(
    paginate({
        offset: {
            perPage: 30
        },
        cursor: {
            limit: 30,
            setCursor(cursor) {
                return { id: cursor }
            },
            getCursor(target) {
                return (target as any).id
            },
        }
    })
);
```

# 🧩 Usage

## 🦚 Quick Start
### It's possible to perform a query and receive its metadata
``` ts
const prisma = new PrismaClient().$extends(
  paginate()
);

const [ data, meta ] = await prisma.user.paginate({
  offset: {
    page: 1,
    perPage: 10
  },
});

/* meta content: 
*    {
*        totalCount: 40,
*        pageCount: 10,
*        totalPages: 4,
*        currentPage: 1,
*        previousPage:  null
*        nextPage: 2,
*    }
*/
```

## 🪜 Offset Pagination

### The offset pagination model uses only two parameters `page` and `perPage`
**Loading the first page**

``` ts
const [ data, meta ] = await prisma.user.paginate({
  offset: {
    perPage: 10
  },
});

/* meta content: 
*    {
*        totalCount: 40,
*        pageCount: 10,
*        totalPages: 4,
*        currentPage: 1,
*        previousPage: null,
*        nextPage: 2 
*    }
*/
```

**Getting an arbitrary page**
``` ts
const [ data, meta ] = await prisma.user.paginate({
  offset: {
    page: 3,
    perPage: 10
  },
});

/* meta content: 
*    {
*        totalCount: 40,
*        pageCount: 10,
*        totalPages: 4,
*        currentPage: 3,
*        previousPage: 2,
*        nextPage: 4 
*    }
*/
```

**Getting all items**
``` ts
const [ data, meta ] = await prisma.user.paginate({
  offset: {  
    perPage: 10 // Returns all items if 'per Page' is negative
  },
});

/* meta content: 
*    {
*        totalCount: 40,
*        pageCount: 40,
*        totalPages: 1,
*        currentPage: 1,
*        previousPage: null,
*        nextPage: null
*    }
*/
```

**Default properties can be overridden**
``` ts
const prisma = new PrismaClient().$extends(
  paginate({
    offset: {
      perPage: 10
    }
  })
)

const [ data, meta ] = await prisma.user.paginate({
  offset: {
    page: 1,
    perPage: 20 // overwrite
  },
});

/* meta content: 
*    {
*        totalCount: 40,
*        pageCount: 20,
*        totalPages: 1,
*        currentPage: 1,
*        previousPage: null,
*        nextPage: 2
*    }
*/
```

## ⤴️ Cursor-based Pagination

### The cursor-based pagination model uses `after` or `before` to perform queries, and can also receive `limit` to determine the number of items per query.

By default, cursor pagination uses the 'id' property as a parameter. This can be changed by overriding the `getCursor` and `setCursor` functions.

``` ts
const prisma = new PrismaClient().$extends(
    paginate({
        cursor: {
            limit: 10,
            // Using userId as a cursor
            setCursor(cursor) {
                return { userId: cursor }
            },
            getCursor(target) {
                return (target as any).userId
            },
        }
    })
)

const [ data, meta ] = await prisma.user.paginate({
    cursor: {
        after: "01914d98-79db-7dda-8976-88a8025dfd32",
        limit: 20
    }
})
```


**Getting the first results**
``` ts
const [ data, meta ] = await prisma.user.paginate({
    cursor: {
        limit: 20
    }
})

/* meta content: 
* {
*    hasPreviousPage: false,
*    hasNextPage: true,
*    startCursor: 98,
*    endCursor: 118
* }
*/
```

**Load next page**
``` ts
const [ data, meta ] = await prisma.user.paginate({
    cursor: {
        after: 118,
        limit: 20
    }
})

/* meta content: 
* {
*    hasPreviousPage: true,
*    hasNextPage: false,
*    startCursor: 118,
*    endCursor: 138
* }
*/
```

**Load precious page**
``` ts
const [ data, meta ] = await prisma.user.paginate({
    cursor: {
        before: 118,
        limit: 20
    }
})

/* meta content: 
* {
*    hasPreviousPage: false,
*    hasNextPage: true,
*    startCursor: 98,
*    endCursor: 118
* }
*/
```

**overriding the `getCursor` and `setCursor` functions.**
``` ts
// specific function
function setCursor(cursor: string | number) {
    if (typeof cursor !== "string" ) {
        cursor = cursor.toString()
    }
    const [userId, createdAt] = cursor.split(",")
    return { userId, createdAt }
}

// specific function
function getCursor(target) {
    return `${target.userId},${target.createdAt}`
}

const { data, meta } = await prisma.user.paginate({
    cursor: {
        after: "01914d98-79db-7dda-8976-88a8025dfd32,2024-08-22T00:00:00Z",
        limit: 20,
        setCursor: setCursor,
        getCursor: getCursor,
    }
})

/* meta content: 
* {
*    hasPreviousPage: false,
*    hasNextPage: true,
*    startCursor: "01914d98-79db-7dda-8976-88a8025dfd32,2024-08-22T00:00:00Z",
*    endCursor: "01914dba-e8cc-7c47-aee2-0bd80051ed4b,2024-08-24T15:00:00Z"
* }
*/
```

# 📖 docs
### This library was based on the official Prisma documentation, read more about Prisma's native pagination types at: https://www.prisma.io/docs/orm/prisma-client/queries/pagination

