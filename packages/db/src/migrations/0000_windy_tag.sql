CREATE TABLE "ad_banners" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"position" varchar(100) NOT NULL,
	"html_content" text,
	"image_url" text,
	"link_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ad_library_ads" (
	"id" serial PRIMARY KEY NOT NULL,
	"ad_library_page_id" integer,
	"brand_id" integer,
	"meta_ad_id" varchar(100) NOT NULL,
	"ad_creative_body" text,
	"ad_creative_link_title" text,
	"ad_creative_link_description" text,
	"ad_creative_link_caption" text,
	"ad_snapshot_url" text,
	"ad_delivery_start_time" timestamp,
	"ad_delivery_stop_time" timestamp,
	"ad_creation_time" timestamp,
	"publisher_platforms" text,
	"languages" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"scraped_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ad_library_ads_meta_ad_id_unique" UNIQUE("meta_ad_id")
);
--> statement-breakpoint
CREATE TABLE "ad_library_pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"brand_id" integer,
	"page_id" varchar(100) NOT NULL,
	"page_name" varchar(500) NOT NULL,
	"page_url" text,
	"platform" varchar(50) DEFAULT 'facebook',
	"total_ads_found" integer DEFAULT 0,
	"last_scraped_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ad_library_pages_page_id_unique" UNIQUE("page_id")
);
--> statement-breakpoint
CREATE TABLE "admin_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_user_id" integer,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(50),
	"entity_id" integer,
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" varchar(100) NOT NULL,
	"admin_user_id" integer NOT NULL,
	"ip_address" varchar(100),
	"user_agent" text,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(255),
	"role" varchar(50) DEFAULT 'admin' NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(500) NOT NULL,
	"title" varchar(500) NOT NULL,
	"meta_title" varchar(200) NOT NULL,
	"meta_description" text NOT NULL,
	"category" varchar(50) NOT NULL,
	"publish_date" timestamp NOT NULL,
	"author" varchar(255) DEFAULT 'The VacationDeals.to Team' NOT NULL,
	"read_time" varchar(50),
	"bluf" text NOT NULL,
	"hero_image_alt" text,
	"hero_gradient" varchar(255),
	"content" text NOT NULL,
	"faqs" text NOT NULL,
	"internal_links" text,
	"related_slugs" text,
	"tags" text,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"logo_url" text,
	"website" text,
	"type" varchar(50) DEFAULT 'broker' NOT NULL,
	"description" text,
	"is_suppressed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brands_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "consent_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"ip_address" varchar(100) NOT NULL,
	"user_agent" text,
	"form_source" varchar(100) NOT NULL,
	"consent_text" text NOT NULL,
	"tcpa_consent" boolean DEFAULT false NOT NULL,
	"terms_consent" boolean DEFAULT false NOT NULL,
	"double_opt_in_confirmed" boolean DEFAULT false NOT NULL,
	"consented_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_inquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"company" varchar(255),
	"message" text,
	"inquiry_type" varchar(50) DEFAULT 'historical_data' NOT NULL,
	"status" varchar(50) DEFAULT 'new' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deal_price_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"deal_id" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"scraped_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deals" (
	"id" serial PRIMARY KEY NOT NULL,
	"brand_id" integer,
	"destination_id" integer,
	"source_id" integer,
	"title" varchar(500) NOT NULL,
	"slug" varchar(500) NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"original_price" numeric(10, 2),
	"duration_nights" integer NOT NULL,
	"duration_days" integer NOT NULL,
	"description" text,
	"resort_name" varchar(500),
	"url" text NOT NULL,
	"image_url" text,
	"inclusions" text,
	"requirements" text,
	"presentation_minutes" integer,
	"travel_window" varchar(255),
	"savings_percent" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"scraped_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "deals_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "destinations" (
	"id" serial PRIMARY KEY NOT NULL,
	"city" varchar(255) NOT NULL,
	"state" varchar(100),
	"region" varchar(100),
	"country" varchar(100) DEFAULT 'US' NOT NULL,
	"slug" varchar(255) NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "destinations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "email_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"subject" varchar(500) NOT NULL,
	"html_body" text NOT NULL,
	"text_body" text,
	"from_name" varchar(255) DEFAULT 'VacationDeals.to',
	"from_email" varchar(255) DEFAULT 'hello@vacationdeals.to',
	"segment_filter" text,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"scheduled_at" timestamp,
	"sent_at" timestamp,
	"total_sent" integer DEFAULT 0,
	"total_opened" integer DEFAULT 0,
	"total_clicked" integer DEFAULT 0,
	"total_bounced" integer DEFAULT 0,
	"total_unsubscribed" integer DEFAULT 0,
	"created_by_admin_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_sends" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer,
	"subscriber_id" integer,
	"email" varchar(255) NOT NULL,
	"provider_message_id" varchar(255),
	"status" varchar(50) DEFAULT 'sent' NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"opened_at" timestamp,
	"clicked_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "roulette_deals" (
	"id" serial PRIMARY KEY NOT NULL,
	"deal_id" integer NOT NULL,
	"weight" integer DEFAULT 5 NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_excluded" boolean DEFAULT false NOT NULL,
	"rarity" varchar(20) DEFAULT 'common' NOT NULL,
	"spin_count" integer DEFAULT 0 NOT NULL,
	"click_count" integer DEFAULT 0 NOT NULL,
	"conversion_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "roulette_deals_deal_id_unique" UNIQUE("deal_id")
);
--> statement-breakpoint
CREATE TABLE "roulette_spins" (
	"id" serial PRIMARY KEY NOT NULL,
	"deal_id" integer,
	"session_id" varchar(100),
	"user_agent" text,
	"clicked" boolean DEFAULT false NOT NULL,
	"rarity" varchar(20),
	"spun_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scrape_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_id" integer,
	"scraper_key" varchar(100) NOT NULL,
	"started_at" timestamp NOT NULL,
	"finished_at" timestamp,
	"deals_found" integer DEFAULT 0,
	"deals_stored" integer DEFAULT 0,
	"urls_crawled" integer DEFAULT 0,
	"status" varchar(50) DEFAULT 'running' NOT NULL,
	"error_message" text,
	"pages_visited" text
);
--> statement-breakpoint
CREATE TABLE "seo_health" (
	"id" serial PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"check_type" varchar(100) NOT NULL,
	"severity" varchar(20) NOT NULL,
	"message" text NOT NULL,
	"details" text,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"checked_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "site_pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_id" integer,
	"url" text NOT NULL,
	"title" varchar(500),
	"status_code" integer,
	"content_type" varchar(100),
	"has_price" boolean DEFAULT false,
	"price_found" numeric(10, 2),
	"word_count" integer,
	"last_crawled_at" timestamp DEFAULT now() NOT NULL,
	"discovered_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(255) NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "site_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"base_url" text NOT NULL,
	"scraper_key" varchar(100) NOT NULL,
	"last_scraped_at" timestamp,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"deal_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sources_scraper_key_unique" UNIQUE("scraper_key")
);
--> statement-breakpoint
CREATE TABLE "subscribers" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"name" varchar(255),
	"source" varchar(100),
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"unsubscribe_token" varchar(100),
	"tags" text,
	"preferences" text,
	"last_emailed_at" timestamp,
	"unsubscribed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscribers_email_unique" UNIQUE("email"),
	CONSTRAINT "subscribers_unsubscribe_token_unique" UNIQUE("unsubscribe_token")
);
--> statement-breakpoint
ALTER TABLE "ad_library_ads" ADD CONSTRAINT "ad_library_ads_ad_library_page_id_ad_library_pages_id_fk" FOREIGN KEY ("ad_library_page_id") REFERENCES "public"."ad_library_pages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_library_ads" ADD CONSTRAINT "ad_library_ads_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_library_pages" ADD CONSTRAINT "ad_library_pages_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_price_history" ADD CONSTRAINT "deal_price_history_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_created_by_admin_id_admin_users_id_fk" FOREIGN KEY ("created_by_admin_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_sends" ADD CONSTRAINT "email_sends_campaign_id_email_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."email_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_sends" ADD CONSTRAINT "email_sends_subscriber_id_subscribers_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."subscribers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roulette_deals" ADD CONSTRAINT "roulette_deals_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roulette_spins" ADD CONSTRAINT "roulette_spins_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scrape_runs" ADD CONSTRAINT "scrape_runs_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_pages" ADD CONSTRAINT "site_pages_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "deals_url_idx" ON "deals" USING btree ("url");