import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, expect, it } from "vitest";

const db = new PGlite();
const owner = "10000000-0000-4000-8000-000000000001";
const other = "10000000-0000-4000-8000-000000000002";
const id = "20000000-0000-4000-8000-000000000001";
const second = "20000000-0000-4000-8000-000000000002";
const legacy = "20000000-0000-4000-8000-000000000003";
const sql = (file: string) =>
  readFileSync(new URL(`../../supabase/${file}`, import.meta.url), "utf8");

beforeAll(async () => {
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; CREATE SCHEMA auth;
    CREATE TABLE auth.users (id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    GRANT USAGE ON SCHEMA auth TO authenticated;
    CREATE TABLE public."Hotels" (hotel_name text, destination text, price_per_night numeric, rating numeric);
    GRANT ALL ON public."Hotels" TO anon, authenticated;
    GRANT UPDATE(price_per_night) ON public."Hotels" TO authenticated;
    INSERT INTO auth.users VALUES ('${owner}'), ('${other}');`);
  await db.exec(sql("02_protected_bookings.sql"));
  await db.exec(sql("migrations/20260908000000_add_booking_policy_fields.sql"));
  await db.exec(`INSERT INTO protected_bookings (id,status,amount_paise) VALUES ('${legacy}','PROTECTED',777);
    GRANT UPDATE(status) ON protected_bookings TO authenticated;
    GRANT SELECT(status) ON protected_bookings TO anon;
    CREATE POLICY obsolete_anonymous_read ON protected_bookings FOR SELECT TO anon USING (true);
    CREATE POLICY obsolete_public_read ON protected_bookings FOR SELECT TO authenticated USING (true);`);
  await db.exec(sql("migrations/20261010000000_secure_protected_bookings.sql"));
  await db.exec(`INSERT INTO protected_bookings (id,user_id,status,amount_paise) VALUES ('${id}','${owner}','PAYMENT_PENDING',400000),('${second}','${other}','PROTECTED',500000);
    INSERT INTO "Hotels" VALUES ('Fixture stay','Fixture town',2000,4.2);`);
}, 30000);
afterAll(async () => {
  await db.close();
});

async function queryAs(
  role: "anon" | "authenticated" | "service_role",
  user: string,
  query: string,
) {
  return db.transaction(async (tx) => {
    await tx.exec(`SET LOCAL ROLE ${role}`);
    await tx.query("SELECT set_config('request.jwt.claim.sub', $1, true)", [
      user,
    ]);
    return tx.query(query);
  });
}

it("runs the actual migration and preserves unowned legacy rows", async () => {
  const result = await db.query(
    "SELECT amount_paise,user_id,order_creation_state FROM protected_bookings WHERE id=$1",
    [legacy],
  );
  expect(result.rows).toEqual([
    { amount_paise: 777, user_id: null, order_creation_state: "LEGACY" },
  ]);
});
it("denies anonymous reads and restricts signed-in reads even with an older broad policy", async () => {
  await expect(
    queryAs("anon", "", "SELECT * FROM protected_bookings"),
  ).rejects.toMatchObject({ code: "42501" });
  expect(
    (await queryAs("authenticated", owner, "SELECT id FROM protected_bookings"))
      .rows,
  ).toEqual([{ id }]);
  expect(
    (await queryAs("authenticated", other, "SELECT id FROM protected_bookings"))
      .rows,
  ).toEqual([{ id: second }]);
});
it("denies direct browser inserts, updates, deletes and old column-granted writes", async () => {
  for (const role of ["anon", "authenticated"] as const) {
    for (const statement of [
      "INSERT INTO protected_bookings(status) VALUES ('PROTECTED')",
      `UPDATE protected_bookings SET status='PROTECTED' WHERE id='${id}'`,
      `DELETE FROM protected_bookings WHERE id='${id}'`,
      'UPDATE "Hotels" SET price_per_night=1',
    ])
      await expect(queryAs(role, owner, statement)).rejects.toMatchObject({
        code: "42501",
      });
  }
});
it("allows the server writer and enforces request/payment uniqueness", async () => {
  await queryAs(
    "service_role",
    "",
    `UPDATE protected_bookings SET status='PROTECTED' WHERE id='${id}'`,
  );
  await db.query(
    "UPDATE protected_bookings SET idempotency_key=$1,razorpay_order_id='order_unique',razorpay_payment_id='pay_unique' WHERE id=$2",
    [id, id],
  );
  for (const assignment of [
    "razorpay_order_id='order_unique'",
    "razorpay_payment_id='pay_unique'",
    `user_id='${owner}',idempotency_key='${id}'`,
  ])
    await expect(
      db.exec(
        `UPDATE protected_bookings SET ${assignment} WHERE id='${second}'`,
      ),
    ).rejects.toMatchObject({ code: "23505" });
});
it("rejects invalid managed rows rather than accepting null or mismatched amounts/dates", async () => {
  await expect(
    db.query(
      "UPDATE protected_bookings SET order_creation_state='READY',amount_paise=NULL WHERE id=$1",
      [id],
    ),
  ).rejects.toMatchObject({ code: "23514" });
});
