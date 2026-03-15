# Blog System + Conversion Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a 100-article blog at /blog and /{post-slug} with perfect SEO, plus mobile QA fixes and conversion optimization elements.

**Architecture:** Blog posts stored as static TypeScript data files in `apps/web/src/lib/blog-posts/`. Blog index at `/blog` with hero, categories, pagination. Individual posts at both `/blog/[slug]` (canonical) and flat `/{slug}` (via the existing catch-all resolver). All posts SSG with ISR. Conversion elements are pure CSS animations on existing components.

**Tech Stack:** Next.js 15 App Router, Tailwind CSS v4, TypeScript, inline SVG for blog images

---

## Phase 1: Blog Infrastructure (Tasks 1-4)

### Task 1: Blog Post Type System + Data Structure

**Files:**
- Create: `apps/web/src/lib/blog-types.ts`

Define the blog post interface and helper types. This is the foundation everything else builds on.

### Task 2: Blog Index Page (`/blog`)

**Files:**
- Create: `apps/web/src/app/(frontend)/blog/page.tsx`

Blog listing page with:
- Light gradient hero with title "Vacation Deals Blog"
- Category tabs (All, Destinations, Brands, Interests, Segments)
- Featured posts section (3 large cards)
- Paginated grid of post cards
- BreadcrumbList + CollectionPage schema
- SEO metadata
- revalidate = 3600

### Task 3: Blog Post Page (`/blog/[slug]`)

**Files:**
- Create: `apps/web/src/app/(frontend)/blog/[slug]/page.tsx`

Individual blog post page with all required elements:
- BLUF/TLDR box at top
- Hero image (inline SVG)
- Author + date + read time
- Intro paragraph with first internal link above fold
- Numbered points with inline images, pro-tips, fun facts
- HTML comparison table
- Related blogs section
- 10 FAQs with accordion
- Combined schema: Article + FAQPage + BreadcrumbList
- OG image, meta title/description
- revalidate = 3600

### Task 4: Integrate Blog Slugs into Catch-All Route + Sitemap

**Files:**
- Modify: `apps/web/src/app/(frontend)/[slug]/page.tsx` — add blog post resolution
- Modify: `apps/web/src/app/sitemap.ts` — add all blog post URLs
- Modify: `apps/web/src/components/Navbar.tsx` — add Blog nav link
- Modify: `apps/web/src/components/Footer.tsx` — add Blog link

---

## Phase 2: Blog Content (Tasks 5-8, parallelizable)

### Task 5: Destination Blog Posts (30 articles)

**Files:**
- Create: `apps/web/src/lib/blog-posts/destinations.ts`

~30 posts like:
- "10 Best Vacation Deals in Orlando for 2026"
- "7 Best Las Vegas Resort Deals You Won't Believe"
- "Best Cancun All-Inclusive Vacation Deals"
- etc. for all major destinations

### Task 6: Brand Blog Posts (20 articles)

**Files:**
- Create: `apps/web/src/lib/blog-posts/brands.ts`

~20 posts like:
- "Westgate Resorts Vacation Deals: Complete 2026 Guide"
- "BookVIP vs GetawayDealz: Which Has Better Deals?"
- "Is Hilton Grand Vacations Worth It? Our Honest Review"

### Task 7: Interest Blog Posts (25 articles)

**Files:**
- Create: `apps/web/src/lib/blog-posts/interests.ts`

~25 posts like:
- "Best Beach Vacation Deals in 2026"
- "Best Family Vacation Deals That Won't Break the Bank"
- "Best Romantic Getaway Deals for Couples"
- "Best Golf Vacation Deals at Resort Properties"

### Task 8: Segment Blog Posts (25 articles)

**Files:**
- Create: `apps/web/src/lib/blog-posts/segments.ts`

~25 posts like:
- "First-Timer's Guide to Timeshare Vacation Deals"
- "Best Vacation Deals Under $100 (Yes, Really)"
- "Best Vacation Deals for Retirees"
- "How to Get the Most Out of Your Vacation Deal Presentation"

---

## Phase 3: Conversion Optimization (Task 9)

### Task 9: CSS Animations + Conversion Elements

**Files:**
- Modify: `apps/web/src/app/globals.css` — add conversion animations
- Modify: `apps/web/src/components/DealCard.tsx` — pulsing CTA, badges
- Modify: `apps/web/src/app/(frontend)/deals/[slug]/page.tsx` — sticky CTA bar
- Create: `apps/web/src/components/StickyDealBar.tsx` — scroll-triggered sticky CTA

Elements:
- Pulsing "View Deal" button glow (CSS keyframes)
- Sticky bottom bar on deal detail pages (CSS position:sticky)
- "Popular" / "Hot Deal" badges on cards
- Arrow visual indicators pointing to CTAs
- Price emphasis animations

---

## Phase 4: Mobile QA (Task 10)

### Task 10: Mobile Audit + Fixes

**Files:**
- Various component files as needed

Check and fix:
- Tap target sizes (min 44px)
- Filter bar mobile layout
- Deal card mobile readability
- Navbar drawer
- Footer link spacing
- Breadcrumb text wrapping
- "View Deal" button prominence on mobile

---

## Execution Strategy

Tasks 5-8 (blog content) are fully parallelizable — 4 agents writing content simultaneously.
Tasks 1-4 must be sequential (infrastructure before content).
Task 9-10 can run in parallel with blog content.
