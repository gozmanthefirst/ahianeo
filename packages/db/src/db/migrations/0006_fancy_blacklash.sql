ALTER TABLE "order" ADD COLUMN "order_number" text NOT NULL;--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "payment_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "stripe_payment_intent_id" text;--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "payment_method" text;--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "billing_address" text NOT NULL;--> statement-breakpoint
ALTER TABLE "order_item" ADD COLUMN "sub_total" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_order_number_unique" UNIQUE("order_number");