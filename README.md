# Ahianeo

Ahianeo is a eCommerce website I'm building for the major purpose of showing that I can indeed build one. When everything's completed, it'll have an API, an admin panel, and a storefront.

## Stack

I use Bun and Cloudflare Wrangler for running the app locally. Backend is built with Hono. Admin and storefront are built with TanStack Start. Stripe handles checkouts and payments. Database is PostgreSQL with Drizzle as the ORM. Everything (API, admin, storefront) gets deployed to Cloudflare Workers.

## What are the features?

All the good stuff, but as lightweight as possible. I'm not trying to build the next Amazon here.

- Sell and buy stuff. Basically the usual eCommerce things.
- Admins can sell stuff, customers can buy stuff.
- Superadmin can create admins, who can then manage customers, products, etc.
