ALTER TABLE "user" ADD COLUMN "contact_email" varchar(320);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "phone" varchar(32);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "onboarded_at" timestamp with time zone;