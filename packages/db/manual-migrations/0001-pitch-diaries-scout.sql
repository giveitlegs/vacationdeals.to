-- Manual migration: just the two new tables (pitch_diaries, scout_applications)
-- and the pitch_diaries → brands FK. The drizzle-kit-generated 0002 SQL also
-- bundled re-creates of every existing table (because the migrations folder
-- wasn't tracking prior schema), so we apply only the new bits by hand.

CREATE TABLE IF NOT EXISTS "pitch_diaries" (
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

CREATE TABLE IF NOT EXISTS "scout_applications" (
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

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'pitch_diaries_brand_id_brands_id_fk'
	) THEN
		ALTER TABLE "pitch_diaries"
			ADD CONSTRAINT "pitch_diaries_brand_id_brands_id_fk"
			FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id")
			ON DELETE no action ON UPDATE no action;
	END IF;
END$$;

CREATE INDEX IF NOT EXISTS "pitch_diaries_status_idx" ON "pitch_diaries" ("status");
CREATE INDEX IF NOT EXISTS "pitch_diaries_brand_slug_idx" ON "pitch_diaries" ("brand_slug");
CREATE INDEX IF NOT EXISTS "scout_applications_status_idx" ON "scout_applications" ("status");
