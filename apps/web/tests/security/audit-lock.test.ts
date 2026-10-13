import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Prisma, PrismaClient } from "../../generated/prisma/client";
import { lockAuditChain } from "../../src/features/admin/server/audit-lock";
import { safeErrorFields } from "../../src/server/logging/error-fields";

test("Neon audit lock avoids Prisma P2010 caused by PostgreSQL void results", async () => {
  const factory = new PrismaNeon({
    connectionString: "postgresql://test:test@localhost:5432/test",
  });
  const adapter = await factory.connect();
  const queries: string[] = [];
  const queryMock = mock.method(
    adapter.underlyingDriver(),
    "query",
    async (query: { text: string }) => {
      queries.push(query.text);
      return {
        command: "SELECT",
        rowCount: 1,
        oid: 0,
        rows: [[""]],
        fields: [{ name: "pg_advisory_xact_lock", dataTypeID: 2278 }],
      };
    },
  );
  const connectMock = mock.method(factory, "connect", async () => adapter);
  const client = new PrismaClient({ adapter: factory });
  try {
    // Reproduce the original failure using the real installed Prisma/Neon codecs.
    await assert.rejects(
      client.$queryRaw(Prisma.sql`SELECT pg_advisory_xact_lock(109545, 2202)`),
      (error: unknown) => {
        assert.equal(safeErrorFields(error).unsupportedDatabaseType, "void");
        return (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2010"
        );
      },
    );
    // The fixed helper executes the identical lock without decoding void.
    await lockAuditChain(client);
    assert.equal(queries.length, 2);
    assert.ok(
      queries.every(
        (query) => query === "SELECT pg_advisory_xact_lock(109545, 2202)",
      ),
    );
    queryMock.mock.mockImplementationOnce(async () => {
      throw Object.assign(new Error("permission denied"), {
        code: "42501",
        severity: "ERROR",
      });
    });
    await assert.rejects(lockAuditChain(client));
  } finally {
    await client.$disconnect();
    queryMock.mock.restore();
    connectMock.mock.restore();
  }
});
