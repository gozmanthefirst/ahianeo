ALTER TABLE "product" DROP CONSTRAINT "product_name_unique";--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_name_unique" UNIQUE("name");