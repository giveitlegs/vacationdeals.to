CREATE TABLE "pitch_diaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"brand_id" integer,
	"brand_slug" varchar(100),
	"location_city" varchar(100),
	"resort_name" varchar(255),
	"attended_at" timestamp,
	"duration_minutes" integer,
	"pressure_level" integer,
	"presenter_count" integer,
	"managers_brought_in" integer,
	"closing_offer" text,
	"prices_quoted" text,
	"notable_quotes" text,
	"story" text NOT NULL,
	"did_they_buy" boolean DEFAULT false,
	"submitter_email" varchar(255),
	"submitter_ip_hash" varchar(64),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"approved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "prospect_clicks" (
	"id" serial PRIMARY KEY NOT NULL,
	"prospect_brand_slug" varchar(100) NOT NULL,
	"ip_hash" varchar(64),
	"user_agent" text,
	"referer" text,
	"page_path" text,
	"banner_position" varchar(50),
	"viewed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scout_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"city_state" varchar(100),
	"willing_to_travel_miles" integer,
	"brands_experienced" text,
	"why_interested" text,
	"ip_hash" varchar(64),
	"user_agent" text,
	"status" varchar(20) DEFAULT 'new' NOT NULL,
	"contacted_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ad_banners" ADD COLUMN "utm_content_match" varchar(100);--> statement-breakpoint
ALTER TABLE "ad_banners" ADD COLUMN "width" integer;--> statement-breakpoint
ALTER TABLE "ad_banners" ADD COLUMN "height" integer;--> statement-breakpoint
ALTER TABLE "ad_banners" ADD COLUMN "prospect_brand_slug" varchar(100);--> statement-breakpoint
ALTER TABLE "pitch_diaries" ADD CONSTRAINT "pitch_diaries_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;