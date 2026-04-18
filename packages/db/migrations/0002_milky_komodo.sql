CREATE TYPE "public"."assignment_status" AS ENUM('pending_fork', 'pending_candidate', 'in_progress', 'submitted', 'scored', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."seniority" AS ENUM('junior', 'middle', 'senior', 'architect');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'hr_manager');--> statement-breakpoint
CREATE TABLE "assignment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"short_id" varchar(16) NOT NULL,
	"company_id" uuid NOT NULL,
	"hr_user_id" text NOT NULL,
	"source_repo_url" text NOT NULL,
	"source_repo_private" integer DEFAULT 0 NOT NULL,
	"fork_owner" varchar(80),
	"fork_name" varchar(140),
	"fork_url" text,
	"seniority" "seniority" NOT NULL,
	"status" "assignment_status" DEFAULT 'pending_fork' NOT NULL,
	"invite_token" varchar(80) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	CONSTRAINT "assignment_short_id_unique" UNIQUE("short_id"),
	CONSTRAINT "assignment_invite_token_unique" UNIQUE("invite_token")
);
--> statement-breakpoint
CREATE TABLE "candidate" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" uuid NOT NULL,
	"email" varchar(320),
	"github_username" varchar(80),
	"invited_at" timestamp with time zone,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"slug" varchar(80) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "company_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "company_token" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"encrypted_pat" text NOT NULL,
	"scope" varchar(120) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "submission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" uuid NOT NULL,
	"candidate_id" uuid,
	"pr_number" integer NOT NULL,
	"pr_head_sha" varchar(64) NOT NULL,
	"score" integer,
	"breakdown" jsonb,
	"scored_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" "user_role" DEFAULT 'hr_manager' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "company_id" uuid;--> statement-breakpoint
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_hr_user_id_user_id_fk" FOREIGN KEY ("hr_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate" ADD CONSTRAINT "candidate_assignment_id_assignment_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_token" ADD CONSTRAINT "company_token_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission" ADD CONSTRAINT "submission_assignment_id_assignment_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission" ADD CONSTRAINT "submission_candidate_id_candidate_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidate"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assignment_company_idx" ON "assignment" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "assignment_hr_idx" ON "assignment" USING btree ("hr_user_id");--> statement-breakpoint
CREATE INDEX "assignment_status_idx" ON "assignment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "candidate_assignment_idx" ON "candidate" USING btree ("assignment_id");--> statement-breakpoint
CREATE INDEX "company_name_idx" ON "company" USING btree ("name");--> statement-breakpoint
CREATE INDEX "company_token_company_idx" ON "company_token" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "submission_assignment_idx" ON "submission" USING btree ("assignment_id");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE set null ON UPDATE no action;