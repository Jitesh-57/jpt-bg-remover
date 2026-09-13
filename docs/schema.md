# Database

Four tables, in `supabase/migrations/`. Apply them with:

```
GET /api/admin/migrate?token=<ADMIN_IMAGE_TOKEN>          # what is pending
GET /api/admin/migrate?token=<ADMIN_IMAGE_TOKEN>&apply=1  # apply it
```

Needs `SUPABASE_DB_URL` — Supabase → Project Settings → Database → Connection
string, with the real password in it. Use the **Session pooler** URI (port
5432): the direct `db.<ref>.supabase.co` host is IPv6-only on newer projects and
a serverless function generally cannot reach it, while the transaction pooler on
6543 does not support prepared statements. Nothing here uses one, so 6543 works
too — but 5432 is the one to paste.

Then check the result:

```
GET /api/admin/db-check?token=<ADMIN_IMAGE_TOKEN>
```

Read-only. It compares the schema against every column the app reads or writes,
confirms RLS is on and each table has a policy, counts the rows, and lists what
is wrong in `problems`. `ok: true` means there is nothing left to do.

`supabase-js` speaks PostgREST, which has no DDL, which is why the tables could
not be created from the app before and had to be pasted into the SQL editor by
hand. This route connects to Postgres directly instead.

Each file is applied once and recorded in `schema_migrations`. Writing every
migration to be re-runnable is a good habit but a bad guarantee — `create
policy` has no `if not exists`, so replaying the folder used to fail and roll
back the whole batch. The ledger makes that impossible whatever a file contains.

---

## profiles

Who the account is, and what its balance is **now**.

| column | |
| --- | --- |
| `id` | the `auth.users` id |
| `email`, `name`, `picture` | from the OAuth profile |
| `credits` | live balance. `credit_ledger` explains it |
| `plan` | the pack most recently bought, or `free` |

No insert or update policy, deliberately. A user who could update their own row
could give themselves credits. Writes come from the service role only.

## purchases

One row per completed payment, with the invoice number issued at the time.

Razorpay remains the record of the money — `lib/purchases.server.ts` can
reconstruct every sale from the gateway's order notes, which is what keeps the
invoice pages working when a row is missing. This table is the local copy, and
it pins the invoice number so a reissued receipt matches the one the customer
already has.

## generations

Every image the AI made, with **both ends of it**.

| column | |
| --- | --- |
| `source_url` | the photo that went in |
| `result_url` | the image that came out |
| `tool`, `app_slug` | which tool, and which creative app |
| `model`, `provider` | e.g. `nano-banana` / `fal` |
| `prompt`, `preset`, `aspect_ratio` | what it was asked for |
| `credits_spent` | what it cost the user |
| `status`, `error`, `duration_ms` | how it went |
| `thumb` | legacy base64 preview; new rows use `result_url` |

Images used to exist only in the tab that made them: the route returned a data
URL and kept nothing, and "My Generations" stored a 25KB base64 thumbnail in a
column. `lib/store-image.ts` now writes both the upload and the result to the
`generations` storage bucket, so these are URLs.

**Failures are recorded too.** A generation that failed after the provider was
already paid is exactly the row worth having, and it is the one the old
client-side saver could never capture — nothing came back to save.

## credit_ledger

Every movement of a credit, and the balance it left behind.

| column | |
| --- | --- |
| `delta` | signed: `+5` for a purchase, `-2` for a generation |
| `balance_after` | the balance this movement produced |
| `reason` | `purchase` / `generation` / `signup_grant` / `admin_adjust` / `refund` |
| `purchase_id`, `generation_id` | what caused it |

This is what makes a balance explainable. "Why do I have 11 credits after buying
a 5-credit pack?" was unanswerable from the data — `profiles.credits` is only
ever the current number. Now it is a query:

```sql
select created_at, delta, balance_after, reason, coalesce(tool, note) as detail
  from credit_ledger
 where user_id = '…'
 order by id;
```

Written from `withCredits` (every spend) and `verify-payment` (every purchase).
Neither can fail the request: the credits have already moved and the image has
already been made, so a bookkeeping failure is logged, never surfaced.

Insert is service-role only. A ledger the subject can write to is not a ledger.

---

## Row-level security

Every table has RLS on, with a select policy scoped to `auth.uid()`, and
`generations` also allows a user to delete their own rows. There are no insert
or update policies anywhere: all writes go through the service role, which
bypasses RLS.

So a signed-in user can read their own invoices, generations and credit history
— and only their own — while nothing they can reach lets them change a balance.
