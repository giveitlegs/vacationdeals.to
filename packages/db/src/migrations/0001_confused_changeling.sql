CREATE TABLE IF NOT EXISTS "cwv_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"strategy" varchar(20) NOT NULL,
	"lcp" numeric(10, 2),
	"cls" numeric(6, 4),
	"inp" numeric(10, 2),
	"fcp" numeric(10, 2),
	"ttfb" numeric(10, 2),
	"performance_score" integer,
	"accessibility_score" integer,
	"best_practices_score" integer,
	"seo_score" integer,
	"error_message" text,
	"checked_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "cwv_results_url_strategy_idx" ON "cwv_results" ("url", "strategy", "checked_at" DESC);
