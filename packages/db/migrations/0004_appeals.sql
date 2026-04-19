CREATE TYPE "public"."appeal_status" AS ENUM('none', 'requested', 'approved', 'rejected');--> statement-breakpoint
ALTER TABLE "submission" ADD COLUMN "appeal_token" varchar(80);--> statement-breakpoint
ALTER TABLE "submission" ADD COLUMN "appeal_status" "appeal_status" DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "submission" ADD COLUMN "appeal_reason" text;--> statement-breakpoint
ALTER TABLE "submission" ADD COLUMN "appeal_requested_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "submission" ADD CONSTRAINT "submission_appeal_token_unique" UNIQUE("appeal_token");