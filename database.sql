-- Skema Supabase/PostgreSQL voucher kas keluar.
-- Policy kelas di bawah terbuka untuk anon; batasi akses sebelum memakai data nyata.
-- Frontend hanya boleh memakai anon key, jangan pernah service_role key.
create extension if not exists pgcrypto;

create table if not exists public.vouchers (
  id uuid primary key default gen_random_uuid(),
  voucher_no text not null unique,
  tx_date date not null,
  description text not null check (length(trim(description)) > 0),
  total_amount numeric(18,2) not null default 0 check (total_amount >= 0),
  status text not null default 'DRAFT' check (status in ('DRAFT','POSTED')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.voucher_lines (
  id uuid primary key default gen_random_uuid(),
  voucher_id uuid not null references public.vouchers(id) on delete cascade,
  account_code text not null,
  account_name text not null,
  line_memo text not null default '',
  debit numeric(18,2) not null default 0 check (debit >= 0),
  credit numeric(18,2) not null default 0 check (credit >= 0),
  check (not (debit > 0 and credit > 0))
);
create index if not exists voucher_lines_voucher_id_idx on public.voucher_lines(voucher_id);
create index if not exists vouchers_created_at_idx on public.vouchers(created_at desc);
create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  table_name text not null,
  record_id text not null,
  action text not null check (action in ('INSERT','UPDATE','DELETE')),
  old_data jsonb,
  new_data jsonb,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at desc);

create or replace function public.write_audit_log()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  old_record jsonb;
  new_record jsonb;
  record_key text;
begin
  if tg_op <> 'INSERT' then old_record := to_jsonb(old); end if;
  if tg_op <> 'DELETE' then new_record := to_jsonb(new); end if;
  record_key := coalesce(new_record ->> 'id', old_record ->> 'id');
  insert into public.audit_logs(table_name, record_id, action, old_data, new_data, changed_by)
  values (tg_table_name, record_key, tg_op, old_record, new_record, auth.uid());
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
drop trigger if exists vouchers_audit_trigger on public.vouchers;
create trigger vouchers_audit_trigger after insert or update or delete on public.vouchers
for each row execute function public.write_audit_log();
drop trigger if exists voucher_lines_audit_trigger on public.voucher_lines;
create trigger voucher_lines_audit_trigger after insert or update or delete on public.voucher_lines
for each row execute function public.write_audit_log();

create or replace function public.create_voucher(p_voucher_no text,p_tx_date date,p_description text,p_rows jsonb,p_status text default 'DRAFT')
returns uuid language plpgsql security definer set search_path = public as $$
declare
  new_voucher_id uuid;
  debit_total numeric(18,2);
  credit_total numeric(18,2);
  row_count integer;
begin
  if p_status not in ('DRAFT','POSTED') then raise exception 'Status voucher tidak valid.'; end if;
  if trim(coalesce(p_voucher_no,'')) = '' or trim(coalesce(p_description,'')) = '' then raise exception 'Nomor voucher dan deskripsi wajib diisi.'; end if;
  if jsonb_typeof(p_rows) <> 'array' then raise exception 'Rincian jurnal harus berupa array.'; end if;
  select count(*),coalesce(sum((item ->> 'debit')::numeric),0),coalesce(sum((item ->> 'credit')::numeric),0)
    into row_count,debit_total,credit_total from jsonb_array_elements(p_rows) as item;
  if p_status = 'POSTED' and (row_count < 2 or debit_total <= 0 or debit_total <> credit_total) then
    raise exception 'Voucher POSTED wajib memiliki minimal dua baris dan total debit sama dengan kredit di atas nol.';
  end if;
  if p_status = 'POSTED' and exists (
    select 1 from jsonb_array_elements(p_rows) as item
    where trim(coalesce(item ->> 'account_code', '')) = ''
       or (coalesce((item ->> 'debit')::numeric, 0) = 0 and coalesce((item ->> 'credit')::numeric, 0) = 0)
  ) then
    raise exception 'Setiap baris voucher POSTED harus memilih akun dan memiliki nominal.';
  end if;
  insert into public.vouchers(voucher_no,tx_date,description,total_amount,status,created_by)
  values(trim(p_voucher_no),p_tx_date,trim(p_description),debit_total,p_status,auth.uid()) returning id into new_voucher_id;
  insert into public.voucher_lines(voucher_id,account_code,account_name,line_memo,debit,credit)
  select new_voucher_id,item ->> 'account_code',coalesce(item ->> 'account_name',''),coalesce(item ->> 'line_memo',''),
    coalesce((item ->> 'debit')::numeric,0),coalesce((item ->> 'credit')::numeric,0)
  from jsonb_array_elements(p_rows) as item;
  return new_voucher_id;
end;
$$;

create or replace function public.update_draft_voucher(
  p_voucher_id uuid,
  p_voucher_no text,
  p_tx_date date,
  p_description text,
  p_rows jsonb,
  p_status text default 'DRAFT'
)
returns void language plpgsql security definer set search_path = public as $$
declare
  current_status text;
  debit_total numeric(18,2);
  credit_total numeric(18,2);
  row_count integer;
begin
  select status into current_status from public.vouchers where id = p_voucher_id for update;
  if current_status is null then raise exception 'Voucher tidak ditemukan.'; end if;
  if current_status <> 'DRAFT' then raise exception 'Voucher POSTED tidak dapat diubah.'; end if;
  if p_status not in ('DRAFT','POSTED') then raise exception 'Status voucher tidak valid.'; end if;
  if trim(coalesce(p_voucher_no,'')) = '' or trim(coalesce(p_description,'')) = '' then
    raise exception 'Nomor voucher dan deskripsi wajib diisi.';
  end if;
  if jsonb_typeof(p_rows) <> 'array' then raise exception 'Rincian jurnal harus berupa array.'; end if;

  select count(*),coalesce(sum((item ->> 'debit')::numeric),0),coalesce(sum((item ->> 'credit')::numeric),0)
    into row_count,debit_total,credit_total from jsonb_array_elements(p_rows) as item;
  if p_status = 'POSTED' and (row_count < 2 or debit_total <= 0 or debit_total <> credit_total) then
    raise exception 'Voucher POSTED wajib seimbang dan memiliki minimal dua baris.';
  end if;
  if p_status = 'POSTED' and exists (
    select 1 from jsonb_array_elements(p_rows) as item
    where trim(coalesce(item ->> 'account_code','')) = ''
       or (coalesce((item ->> 'debit')::numeric,0) = 0 and coalesce((item ->> 'credit')::numeric,0) = 0)
  ) then raise exception 'Setiap baris voucher POSTED harus memilih akun dan memiliki nominal.'; end if;

  update public.vouchers
    set voucher_no=trim(p_voucher_no),tx_date=p_tx_date,description=trim(p_description),
        total_amount=debit_total,status=p_status,updated_at=now()
    where id=p_voucher_id;
  delete from public.voucher_lines where voucher_id=p_voucher_id;
  insert into public.voucher_lines(voucher_id,account_code,account_name,line_memo,debit,credit)
  select p_voucher_id,item ->> 'account_code',coalesce(item ->> 'account_name',''),coalesce(item ->> 'line_memo',''),
    coalesce((item ->> 'debit')::numeric,0),coalesce((item ->> 'credit')::numeric,0)
  from jsonb_array_elements(p_rows) as item;
end;
$$;

create or replace function public.post_draft_voucher(p_voucher_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  current_status text;
  debit_total numeric(18,2);
  credit_total numeric(18,2);
  row_count integer;
begin
  select status into current_status from public.vouchers where id = p_voucher_id for update;
  if current_status is null then raise exception 'Voucher tidak ditemukan.'; end if;
  if current_status <> 'DRAFT' then raise exception 'Hanya voucher DRAFT yang dapat diposting.'; end if;
  select count(*),coalesce(sum(debit),0),coalesce(sum(credit),0) into row_count,debit_total,credit_total
    from public.voucher_lines where voucher_id = p_voucher_id;
  if row_count < 2 or debit_total <= 0 or debit_total <> credit_total then raise exception 'Draft belum memenuhi syarat zero-discrepancy.'; end if;
  if exists (select 1 from public.voucher_lines where voucher_id = p_voucher_id and (trim(account_code) = '' or (debit = 0 and credit = 0))) then
    raise exception 'Setiap baris draft harus memilih akun dan memiliki nominal.';
  end if;
  update public.vouchers set status='POSTED',total_amount=debit_total,updated_at=now() where id=p_voucher_id;
end;
$$;
create or replace function public.delete_draft_voucher(p_voucher_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare current_status text;
begin
  select status into current_status from public.vouchers where id=p_voucher_id for update;
  if current_status is null then raise exception 'Voucher tidak ditemukan.'; end if;
  if current_status <> 'DRAFT' then raise exception 'Voucher POSTED tidak dapat dihapus.'; end if;
  delete from public.vouchers where id=p_voucher_id;
end;
$$;

alter table public.vouchers enable row level security;
alter table public.voucher_lines enable row level security;
alter table public.audit_logs enable row level security;
drop policy if exists class_demo_read_vouchers on public.vouchers;
create policy class_demo_read_vouchers on public.vouchers for select to anon,authenticated using (true);
drop policy if exists class_demo_read_voucher_lines on public.voucher_lines;
create policy class_demo_read_voucher_lines on public.voucher_lines for select to anon,authenticated using (true);
drop policy if exists class_demo_read_audit_logs on public.audit_logs;
create policy class_demo_read_audit_logs on public.audit_logs for select to anon,authenticated using (true);
grant usage on schema public to anon,authenticated;
grant select on public.vouchers,public.voucher_lines,public.audit_logs to anon,authenticated;
grant execute on function public.create_voucher(text,date,text,jsonb,text) to anon,authenticated;
grant execute on function public.update_draft_voucher(uuid,text,date,text,jsonb,text) to anon,authenticated;
grant execute on function public.post_draft_voucher(uuid) to anon,authenticated;
grant execute on function public.delete_draft_voucher(uuid) to anon,authenticated;
