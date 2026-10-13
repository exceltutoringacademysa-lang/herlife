alter table public.life_items drop constraint if exists life_items_kind_check;
alter table public.life_items add constraint life_items_kind_check check (kind in ('note','wardrobe','goal','journal'));
