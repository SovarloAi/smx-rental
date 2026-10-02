-- Contractmodule SMX Rental — basisschema.
-- Bedragen staan altijd in hele centen (INTEGER), nooit als float.
-- Tijdstempels zijn ISO-8601-strings in UTC.

CREATE TABLE IF NOT EXISTS contracts (
  id                  TEXT PRIMARY KEY,
  token               TEXT NOT NULL UNIQUE,
  status              TEXT NOT NULL DEFAULT 'concept'
                        CHECK (status IN ('concept','verstuurd','geopend','ondertekend','goedgekeurd')),

  -- tijdstempels
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL,
  sent_at             TEXT,
  opened_at           TEXT,
  signed_at           TEXT,
  approved_at         TEXT,
  reminded_at         TEXT,

  -- klantgegevens
  klant_naam            TEXT NOT NULL DEFAULT '',
  klant_adres           TEXT NOT NULL DEFAULT '',
  klant_postcode_plaats TEXT NOT NULL DEFAULT '',
  klant_telefoon        TEXT NOT NULL DEFAULT '',
  klant_email           TEXT NOT NULL DEFAULT '',
  plaatsingsadres       TEXT NOT NULL DEFAULT '',

  -- periode
  feest_datum         TEXT NOT NULL DEFAULT '',
  opbouw_datum        TEXT NOT NULL DEFAULT '',
  opbouw_tijd         TEXT NOT NULL DEFAULT '19:00',
  afbouw_datum        TEXT NOT NULL DEFAULT '',
  afbouw_tijd         TEXT NOT NULL DEFAULT '11:00',

  -- producten
  extra_dagen         INTEGER NOT NULL DEFAULT 0  CHECK (extra_dagen >= 0),
  verlichting         INTEGER NOT NULL DEFAULT 0  CHECK (verlichting IN (0,1)),
  zijwanden           INTEGER NOT NULL DEFAULT 0  CHECK (zijwanden BETWEEN 0 AND 2),
  klinkers            INTEGER NOT NULL DEFAULT 0  CHECK (klinkers IN (0,1)),
  shotjesbar          INTEGER NOT NULL DEFAULT 0  CHECK (shotjesbar IN (0,1)),
  transport_cent      INTEGER NOT NULL DEFAULT 0  CHECK (transport_cent >= 0),
  afspraken           TEXT NOT NULL DEFAULT '',

  -- server-side berekend totaal + gebruikte voorwaardenversie
  totaal_cent         INTEGER NOT NULL DEFAULT 0,
  voorwaarden_versie  TEXT NOT NULL DEFAULT 'v1',

  -- ondertekening door de klant
  signer_naam         TEXT,
  signer_plaats       TEXT,
  signature_key       TEXT,
  signed_ip           TEXT,
  signed_user_agent   TEXT,
  document_hash       TEXT,

  -- overig
  op_papier           INTEGER NOT NULL DEFAULT 0 CHECK (op_papier IN (0,1)),
  papier_key          TEXT,
  pdf_key             TEXT,
  gezien              INTEGER NOT NULL DEFAULT 1 CHECK (gezien IN (0,1))
);

CREATE INDEX IF NOT EXISTS idx_contracts_feest  ON contracts (feest_datum);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts (status);

-- Audit-log. Blijft bestaan zolang het contract bestaat.
CREATE TABLE IF NOT EXISTS events (
  id          TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  type        TEXT NOT NULL
                CHECK (type IN ('aangemaakt','gewijzigd','verstuurd','herinnering',
                                'geopend','ondertekend','goedgekeurd','op_papier')),
  at          TEXT NOT NULL,
  ip          TEXT,
  user_agent  TEXT
);

CREATE INDEX IF NOT EXISTS idx_events_contract ON events (contract_id, at);

-- Sleutel/waarde-instellingen, o.a. owner_signature_key.
CREATE TABLE IF NOT EXISTS settings (
  sleutel TEXT PRIMARY KEY,
  waarde  TEXT NOT NULL
);

-- Eenvoudige rate limiting voor de klant-API (vaste tijdvensters).
CREATE TABLE IF NOT EXISTS ratelimit (
  bucket       TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  aantal       INTEGER NOT NULL
);
