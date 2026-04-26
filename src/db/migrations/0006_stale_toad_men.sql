CREATE TABLE "human_site_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"human_id" uuid NOT NULL,
	"site_role_id" uuid NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"assigned_by" uuid,
	CONSTRAINT "human_site_roles_unique" UNIQUE("human_id","site_role_id")
);
--> statement-breakpoint
CREATE TABLE "site_role_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "site_role_permissions_unique" UNIQUE("site_role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "site_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_name" varchar(100) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "site_roles_role_name_unique" UNIQUE("role_name")
);
--> statement-breakpoint
ALTER TABLE "human_site_roles" ADD CONSTRAINT "human_site_roles_human_id_humans_id_fk" FOREIGN KEY ("human_id") REFERENCES "public"."humans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "human_site_roles" ADD CONSTRAINT "human_site_roles_site_role_id_site_roles_id_fk" FOREIGN KEY ("site_role_id") REFERENCES "public"."site_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "human_site_roles" ADD CONSTRAINT "human_site_roles_assigned_by_humans_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."humans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_role_permissions" ADD CONSTRAINT "site_role_permissions_site_role_id_site_roles_id_fk" FOREIGN KEY ("site_role_id") REFERENCES "public"."site_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_role_permissions" ADD CONSTRAINT "site_role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "human_site_roles_human_idx" ON "human_site_roles" USING btree ("human_id");--> statement-breakpoint
CREATE INDEX "human_site_roles_role_idx" ON "human_site_roles" USING btree ("site_role_id");--> statement-breakpoint
CREATE INDEX "site_role_permissions_role_idx" ON "site_role_permissions" USING btree ("site_role_id");--> statement-breakpoint
CREATE INDEX "site_role_permissions_perm_idx" ON "site_role_permissions" USING btree ("permission_id");