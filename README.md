# Luma Display Commerce

React + Vite storefront and admin console for enterprise product procurement.

## Stack

- React 18
- Vite
- Tailwind CSS
- React Router DOM
- Axios

## Run Locally

1. `cp .env.example .env`
2. `npm install`
3. `npm run dev`

The Vite dev server proxies `/api` and `/media` to `VITE_API_PROXY_TARGET`.

## Production Runtime

This repo now defaults to same-origin API calls in production:

- Frontend requests target `/api`
- Media requests resolve through `/media`
- `server.mjs` serves the built app and reverse-proxies `/api` and `/media` to `API_PROXY_TARGET`

Build and run locally:

1. `npm run build`
2. `npm run start`

Health check:

- `GET /healthz`

## Render Deployment

`render.yaml` is included for a Node web service deployment. Set:

- `API_PROXY_TARGET=https://<your-backend-service>.onrender.com`
- `VITE_API_BASE_URL=/api`

This avoids browser-side CORS issues by keeping the browser on one origin and proxying API traffic server-side.

## Backend Production Checklist

The frontend can proxy around browser CORS, but the backend still needs correct production settings:

- `DEBUG=False`
- `ALLOWED_HOSTS` includes the Render host/custom domain
- If you deploy the frontend separately as a static site, `CORS_ALLOWED_ORIGINS` must include that frontend origin
- If you use session/cookie auth anywhere, `CSRF_TRUSTED_ORIGINS` must include the frontend origin and secure cookie flags must be enabled
- `DATABASE_URL` points to the production database you expect
- The admin account exists in production and has the right flags

Example Django verification:

```bash
python manage.py shell -c "from django.contrib.auth import get_user_model; U=get_user_model(); print(list(U.objects.filter(username='YOUR_ADMIN_USERNAME').values('id','username','email','is_active','is_staff','is_superuser')))"
```

## Performance Notes

The catalog loader now:

- Reuses nested subcategories already returned by `/api/categories/`
- Falls back to batched subcategory requests only when the backend does not embed them
- Reuses cached product data on the product detail page instead of always refetching

These changes reduce initial storefront/admin catalog latency without changing API contracts or UI behavior.
