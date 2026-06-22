# Security setup

The application code supports four club roles:

- `member`: authenticated angler/member account; read-only in this release.
- `boat`: authenticated boat representative account; read-only in this release.
- `weighmaster`: enter, edit, and delete catches; upload catch photos.
- `admin`: all weighmaster permissions plus every other admin tool.

## 1. Apply the database migration

Run `supabase/migrations/202606220001_auth_roles_rls.sql` in the Supabase SQL
Editor. This enables Row Level Security, creates `user_roles`, and installs the
role policies.

## 2. Create the first staff account

In Supabase, open **Authentication > Users** and create or invite the user.
Copy that user's UUID.

Run:

```sql
insert into public.user_roles (user_id, role)
values ('AUTH_USER_UUID', 'admin')
on conflict (user_id)
do update set role = excluded.role, updated_at = now();
```

Use `weighmaster` instead of `admin` for catch-entry staff. Use `member` or
`boat` for authenticated club accounts that do not yet need editing access.

## 3. Verify environment variables

Vercel needs:

```text
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

The application also accepts the legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` while
the project transitions to publishable keys.

## 4. Test permissions

1. A signed-out visitor can read public standings and profiles.
2. A signed-out visitor is redirected from `/admin`.
3. A weighmaster can use `/admin/catch-entry` and `/admin/catches`.
4. A weighmaster cannot open other admin routes.
5. An admin can use all admin routes.
6. Direct database writes with the public key are rejected by RLS.

## 5. Review existing Storage policies

The migration adds restrictive policies for `boat-media` and `catch-media`.
In **Storage > Policies**, remove any older policy that broadly allows
anonymous uploads, updates, or deletes on `storage.objects`, because permissive
policies are combined.
