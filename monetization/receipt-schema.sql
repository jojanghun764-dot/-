-- Apply in a private PostgreSQL database. The game client must never write here.
CREATE TABLE player_accounts (
  id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE play_purchases (
  token_sha256 char(64) PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES player_accounts(id),
  product_id text NOT NULL,
  entitlement_period text NOT NULL DEFAULT 'lifetime',
  order_id text,
  verified_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, product_id, entitlement_period)
);

CREATE TABLE grants (
  id bigserial PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES player_accounts(id),
  source_kind text NOT NULL,
  source_id text NOT NULL,
  gems integer NOT NULL DEFAULT 0 CHECK (gems >= 0),
  equipment_tickets integer NOT NULL DEFAULT 0 CHECK (equipment_tickets >= 0),
  companion_tickets integer NOT NULL DEFAULT 0 CHECK (companion_tickets >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_kind, source_id)
);

-- One transaction: INSERT play_purchases ON CONFLICT DO NOTHING;
-- if inserted, INSERT grants with source_kind='play_purchase' and
-- source_id=token_sha256. Increment the server-owned balance in that
-- same transaction. Do not trust localStorage amounts or a client product grant.
