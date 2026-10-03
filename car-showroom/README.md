# Car Showroom

A responsive digital car showroom with a customer-facing inventory and an authenticated dealership admin area.

## Stack

- Vite + vanilla JavaScript
- Supabase JS 2.117.2
- Supabase Postgres/Auth/Storage-ready architecture
- Responsive CSS

## Modes

The project has two modes:

1. **Demo mode** — works without Supabase and persists admin edits/leads in browser localStorage.
2. **Production mode** — enabled by setting:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_DEALERSHIP_ID`

Only the publishable client key belongs in the browser. Never expose a service-role/secret key.

## Supabase setup

The initial schema is in `supabase/001_initial_schema.sql`.

After a Supabase project is available:

1. Apply the schema.
2. Create an admin user in Supabase Auth.
3. Create a dealership row.
4. Add that user's UUID to `dealership_members` with the appropriate role.
5. Set the three Vite environment variables.
6. Configure the public site URL and Auth redirect URLs.
7. Add a Storage bucket and policies for vehicle images before enabling image uploads.

## Run

```bash
npm install
npm test
npm run build
npm run dev
```

## Security notes

- RLS is enabled in the initial database schema.
- Admin authorization is based on `dealership_members`, not a hidden URL.
- Public clients use only the publishable Supabase key.
- User-controlled strings are HTML-escaped before insertion into the showroom/admin UI.
- Car inputs are validated and normalized before persistence.
