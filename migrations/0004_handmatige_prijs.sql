-- Een handmatig afgesproken totaalprijs, bijvoorbeeld bij een kortingsafspraak.
--
-- NULL betekent: geen handmatige prijs, het contract volgt gewoon de tarieven.
-- Staat er wel een bedrag, dan komt het verschil met het rekenkundige totaal op
-- de regel van de stretchtent, of op die van de Shotjesbar als er geen tent
-- gehuurd wordt. Er komt geen kortingsregel in het contract: de klant ziet
-- hetzelfde overzicht als anders, alleen met een ander bedrag.
ALTER TABLE contracts ADD COLUMN handmatig_totaal_cent INTEGER;
