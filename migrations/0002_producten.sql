-- De stretchtent was altijd inbegrepen; vanaf nu is hij een gewone keuze,
-- zodat een klant ook alleen de Shotjesbar kan huren.
--
-- Daarnaast krijgen de zijwanden een eigen aantal extra dagen: de toeslag van
-- EUR 10 per zijwand per dag geldt alleen voor de dagen dat ze blijven staan,
-- niet automatisch voor elke extra huurdag.

ALTER TABLE contracts ADD COLUMN tent INTEGER NOT NULL DEFAULT 1;
ALTER TABLE contracts ADD COLUMN zijwand_extra_dagen INTEGER NOT NULL DEFAULT 0;
