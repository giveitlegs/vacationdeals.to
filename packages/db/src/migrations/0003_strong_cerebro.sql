CREATE TABLE "brand_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"brand_id" integer NOT NULL,
	"role" varchar(100) NOT NULL,
	"name" varchar(255),
	"email" varchar(255),
	"phone" varchar(50),
	"linkedin_url" text,
	"source" varchar(100),
	"source_url" text,
	"confidence" varchar(20) DEFAULT 'medium',
	"notes" text,
	"last_verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "parent_company" varchar(255);--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "hq_address" text;--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "hq_city" varchar(100);--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "hq_state" varchar(50);--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "hq_country" varchar(50);--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "hq_zip" varchar(20);--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "main_phone" varchar(50);--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "general_email" varchar(255);--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "linkedin_url" text;--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "crunchbase_url" text;--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "ownership" varchar(50);--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "year_founded" integer;--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "employee_count" varchar(50);--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "est_revenue" varchar(50);--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "contacts_last_researched_at" timestamp;--> statement-breakpoint
ALTER TABLE "brand_contacts" ADD CONSTRAINT "brand_contacts_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;