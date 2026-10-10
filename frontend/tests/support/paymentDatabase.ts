import { randomUUID } from "node:crypto";

type Row = Record<string, unknown>;
type Result = {
  data: Row | Row[] | null;
  error: { code: string; message: string } | null;
};

/** Query-boundary fake only. The separate PGlite suite executes real grants/RLS. */
export class PaymentDatabase {
  bookings: Row[] = [];
  hotels: Row[] = [
    {
      hotel_name: "Fixture stay",
      destination: "Fixture town",
      price_per_night: 2000,
      rating: 4.2,
    },
  ];
  writes: { operation: string; value: Row; filters: [string, unknown][] }[] =
    [];
  beforeUpdate: (() => void) | null = null;
  updateError: string | null = null;
  from(table: string) {
    return new Query(this, table);
  }
}

class Query {
  private operation = "select";
  private value: Row = {};
  private filters: [string, unknown][] = [];
  private max = Infinity;
  constructor(
    private db: PaymentDatabase,
    private table: string,
  ) {}
  select() {
    return this;
  }
  eq(field: string, value: unknown) {
    this.filters.push([field, value]);
    return this;
  }
  is(field: string, value: unknown) {
    return this.eq(field, value);
  }
  ilike(field: string, value: string) {
    this.filters.push([field, value]);
    return this;
  }
  limit(max: number) {
    this.max = max;
    return this;
  }
  insert(value: Row) {
    this.operation = "insert";
    this.value = value;
    return this;
  }
  update(value: Row) {
    this.operation = "update";
    this.value = value;
    return this;
  }
  async maybeSingle() {
    const result = this.run();
    return {
      ...result,
      data: Array.isArray(result.data) ? (result.data[0] ?? null) : result.data,
    };
  }
  single() {
    return this.maybeSingle();
  }
  then<T = Result, U = never>(
    fulfilled?: ((value: Result) => T | PromiseLike<T>) | null,
    rejected?: ((reason: unknown) => U | PromiseLike<U>) | null,
  ) {
    return Promise.resolve(this.run()).then(fulfilled, rejected);
  }
  private run(): Result {
    const rows = this.table === "Hotels" ? this.db.hotels : this.db.bookings;
    if (this.operation === "update") {
      const callback = this.db.beforeUpdate;
      this.db.beforeUpdate = null;
      callback?.();
      if (this.db.updateError)
        return {
          data: null,
          error: {
            code: this.db.updateError,
            message: "private database details",
          },
        };
    }
    if (this.operation === "select")
      return {
        data: structuredClone(
          rows
            .filter((row) =>
              this.filters.every(([key, value]) => row[key] === value),
            )
            .slice(0, this.max),
        ),
        error: null,
      };
    const selected =
      this.operation === "insert"
        ? [{ id: randomUUID(), ...this.value }]
        : rows
            .filter((row) =>
              this.filters.every(
                ([key, value]) => (row[key] ?? null) === value,
              ),
            )
            .map((row) => ({ ...row, ...this.value }));
    for (const row of selected) {
      if (
        rows.some(
          (other) =>
            other.id !== row.id &&
            ((row.razorpay_order_id &&
              other.razorpay_order_id === row.razorpay_order_id) ||
              (row.razorpay_payment_id &&
                other.razorpay_payment_id === row.razorpay_payment_id) ||
              (row.idempotency_key &&
                other.user_id === row.user_id &&
                other.idempotency_key === row.idempotency_key)),
        )
      )
        return {
          data: null,
          error: { code: "23505", message: "unique violation" },
        };
    }
    this.db.writes.push({
      operation: this.operation,
      value: this.value,
      filters: this.filters,
    });
    for (const row of selected) {
      const index = rows.findIndex((existing) => existing.id === row.id);
      if (index < 0) rows.push(row);
      else rows[index] = row;
    }
    return { data: structuredClone(selected), error: null };
  }
}
