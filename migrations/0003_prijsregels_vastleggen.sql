-- Het prijsoverzicht werd bij elke weergave opnieuw berekend met de tarieven
-- die op dát moment in de code stonden. Een tariefwijziging veranderde daardoor
-- met terugwerkende kracht wat er op een al ondertekend contract stond, en
-- maakte de documenthash oncontroleerbaar.
--
-- Vanaf nu leggen we de prijsregels vast op het moment dat het contract wordt
-- aangemaakt of gewijzigd. Daarna veranderen ze niet meer.

ALTER TABLE contracts ADD COLUMN regels_json TEXT;
