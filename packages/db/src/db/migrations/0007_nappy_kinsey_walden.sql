ALTER TABLE "order" ADD COLUMN "stripe_checkout_session_id" text;--> statement-breakpoint
ALTER TABLE "order" DROP COLUMN "stripe_payment_intent_id";--> statement-breakpoint
ALTER TABLE "order" DROP COLUMN "shipping_address";--> statement-breakpoint
ALTER TABLE "order" DROP COLUMN "billing_address";