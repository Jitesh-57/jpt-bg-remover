# Invoices

Buyers get a numbered, printable invoice for every credit pack. Razorpay's
Checkout flow (Orders + the modal) does not issue one — its Invoices API is a
separate product where Razorpay raises the document and emails a payment link —
so the payment is taken first and the document is issued here.

- `/invoices` — the signed-in buyer's purchases
- `/invoices/<razorpay_payment_id>` — the invoice, laid out for print/PDF

Both read with the visitor's own Supabase session, never the service role, so a
guessed payment id in the URL returns nothing rather than someone else's name,
email and payment reference.

## 1. The table

`verify-payment` writes a row per purchase. If the table does not exist the
purchase still completes — credits are added and the money has moved — and the
failure is logged with the payment id so the row can be reconstructed. Create
it once:

```sql
create table if not exists public.purchases (
  id                  bigserial primary key,
  user_id             uuid not null references auth.users (id) on delete cascade,
  razorpay_order_id   text not null,
  razorpay_payment_id text not null unique,
  plan                text not null,
  credits_added       integer not null,
  amount_paise        integer not null,
  invoice_no          text unique,
  created_at          timestamptz not null default now()
);

create index if not exists purchases_user_created_idx
  on public.purchases (user_id, created_at desc);

-- A buyer reads only their own rows. Writes come from the service role in
-- verify-payment, which bypasses RLS, so no insert policy is needed.
alter table public.purchases enable row level security;

create policy "own purchases" on public.purchases
  for select using (auth.uid() = user_id);
```

`razorpay_payment_id unique` also makes a replayed verify-payment call a
no-op rather than a second credit grant. `invoice_no unique` turns a numbering
race into a visible error instead of two customers holding the same number.

## 2. The seller details

Nothing identifying the seller is hardcoded — an invoice carries legal identity,
and inventing a name, address or GSTIN would put false particulars on a document
a customer may file with their own accounts. Set these in Vercel. Unset fields
are omitted from the invoice rather than guessed.

| Variable | Required | Notes |
| --- | --- | --- |
| `INVOICE_SELLER_NAME` | recommended | Registered/trading name. Defaults to "Pixel Shine". |
| `INVOICE_SELLER_ADDRESS` | recommended | Multi-line; newlines are preserved. |
| `INVOICE_SELLER_EMAIL` | recommended | The address a buyer should reply to. |
| `INVOICE_SELLER_GSTIN` | only if registered | Shows the GST block and titles the document "Tax invoice". |
| `INVOICE_GST_RATE` | with a GSTIN | e.g. `18`. |
| `INVOICE_SELLER_PAN` | optional | |
| `INVOICE_SELLER_STATE` | optional | Place of supply. |
| `INVOICE_NUMBER_PREFIX` | optional | Defaults to `PS`, giving `PS/2026-27/0001`. |

**On GST:** the packs are priced as what the customer pays, so when a GSTIN is
configured the tax is backed *out* of the total rather than added on top —
charging the rate on top would bill more than the pricing page quoted. Without a
GSTIN the invoice shows no tax and says "No GST charged", which is the correct
statement for a seller who is not registered.

Numbering restarts each Indian financial year (April–March), which is the
convention a buyer's accountant expects.
