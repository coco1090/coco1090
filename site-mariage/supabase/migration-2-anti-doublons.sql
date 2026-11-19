-- À exécuter après schema.sql : email obligatoire et unique, une personne ne peut être enregistrée qu'une fois.
alter table responses alter column email set not null;
create unique index if not exists responses_email_unique on responses (lower(email));

alter table people add column if not exists name_key text;
update people set name_key = lower(first_name) || '|' || lower(last_name) where name_key is null;
alter table people alter column name_key set not null;
create unique index if not exists people_name_key_unique on people (name_key);
