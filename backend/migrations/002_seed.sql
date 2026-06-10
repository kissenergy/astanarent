-- Production-safe seed: no demo users, listings, media, or reviews.
-- The owner phone is promoted to admin when it exists.
-- On a fresh install, register with +77075226839 to create the first admin.

update users set is_admin = true where phone = '+77075226839';
