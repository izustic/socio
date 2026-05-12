-- Add image_url column to circles table
alter table public.circles
add column if not exists image_url text;

notify pgrst, 'reload schema';
