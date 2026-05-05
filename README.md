# Japan Restaurant Guide

This app turns `../geo_master.csv` into a restaurant-only Next.js site, and it can read restaurant data from either:

- the committed local JSON fallback in `src/data/restaurants.generated.json`
- or a Supabase `restaurants` table when Supabase environment variables are set

## Local setup

1. Install Node.js 20+.
2. From `web/`, install dependencies:

```bash
npm install
```

3. Create `.env.local` from `.env.example`.

4. Optional: regenerate the local restaurant dataset from `../geo_master.csv`:

```bash
npm run data:build
```

5. Start the site:

```bash
npm run dev
```

## Data flow

### Local JSON fallback

The site can run entirely from the committed generated JSON:

- source file: `../geo_master.csv`
- generated file: `src/data/restaurants.generated.json`
- Google enrichment cache: `.cache/google-place-enrichment.json`

This is also the safest Vercel default because it does not require Google API calls during every deploy.

### Supabase backend

If these environment variables are present, the app will read from Supabase instead of the local JSON:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

The code automatically falls back to the local JSON if Supabase is not configured or if the query fails.

## Supabase setup

1. Create a Supabase project.
2. In the Supabase SQL editor, run:

```sql
\i supabase/schema.sql
```

If your SQL editor does not support `\i`, copy the contents of `supabase/schema.sql` and run it directly.

3. Export the generated restaurant JSON to a Supabase-friendly CSV:

```bash
npm run data:export-supabase
```

4. Import `supabase/restaurants_import.csv` into the `public.restaurants` table.

## Vercel deployment

1. Push this repo to GitHub.
2. Import the repo into Vercel.
3. Set the project root to `web/`.
4. In Vercel environment variables, add:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
GOOGLE_MAPS_API_KEY=your_google_places_api_key
```

5. Deploy.

The current `build` script is just `next build`, so Vercel deploys do not depend on rebuilding restaurant data from Google Places during each deployment.

## Useful scripts

```bash
npm run data:build
npm run data:export-supabase
npm run build:fresh-data
```
=======
# japan_website
Website to share my Japanese experience 
>>>>>>> 60a7156fe65fd59943ff47e9d2e9793f83c910d0
