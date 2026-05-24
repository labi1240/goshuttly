# Ammo Terminal

## Overview

Ammo Terminal is a high-performance aggregator website designed to pull, normalize, and display data from various external sources in real-time. It provides users with a centralized, lightning-fast dashboard to search, compare, and filter listings efficiently, solving the problem of fragmented information and pricing across multiple disconnected vendors.

## Goals

1. Establish a reliable, automated data ingestion pipeline that normalizes external data into a unified PostgreSQL schema.
2. Deliver a sub-second search and filtering experience using Next.js 16 Server Components and TanStack Query.
3. Successfully convert free users to premium tiers by gating advanced analytics and alerts behind Stripe billing.

## Core User Flow

1. User arrives at the landing page and views trending or recently aggregated listings.
2. User utilizes the search bar and advanced UI filters to narrow down specific items based on criteria (e.g., price, availability, vendor).
3. User signs in via Clerk to save specific filters, bookmark items, or set up availability alerts.
4. User navigates to the billing portal to upgrade to a premium subscription via Stripe for real-time notifications and advanced historical data access.
5. User clicks an external link to be redirected to the original vendor's site to complete their transaction.

## Features

### Data Aggregation & Display
- **Unified Search Interface:** Global search bar with autocomplete and strict type validation.
- **Advanced Filtering:** Multi-faceted filtering (price ranges, categories, stock status) managed by Zustand for immediate UI feedback.
- **Data Tables & Cards:** Interactive, hierarchy-driven UI (following Refactoring UI principles) to display dense aggregator data cleanly.

### User Management & Monetization
- **Secure Authentication:** Passwordless or OAuth login flows managed by Clerk.
- **User Dashboard:** A private route where users can manage saved searches, alerts, and profile settings.
- **Subscription Management:** Stripe checkout sessions and a customer portal for managing premium access tiers.

## Scope

### In Scope
- Core data ingestion logic and Prisma schema definitions for storing normalized items.
- Responsive, accessible front-end built with Tailwind 4.0 and shadcn/ui.
- Client-side data fetching and caching with TanStack Query.
- Clerk authentication integration (via Next.js 16 `proxy.ts`).
- Stripe billing integration for subscription plans.

### Out of Scope
- Native iOS or Android applications (focus is strictly on the responsive web application).
- Processing direct e-commerce transactions for the aggregated items (Ammo Terminal acts as an aggregator/referral engine, not the final merchant).
- Complex community features like user forums or direct messaging.

## Success Criteria

1. A signed-in user can successfully execute a filtered search and save those parameters to their profile.
2. The database successfully receives and normalizes data from external endpoints without manual intervention.
3. A user can seamlessly upgrade their account to a premium tier via Stripe, and the application immediately reflects their updated permission state.