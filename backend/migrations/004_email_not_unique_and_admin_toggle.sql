alter table users drop constraint if exists users_email_key;

drop index if exists users_email_key;

update users set is_admin = true where phone = '+77075226839';
