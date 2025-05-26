-- CreateTable for SaleItem
CREATE TABLE "SaleItem" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "itemCategory" TEXT NOT NULL,
    "itemPrice" DOUBLE PRECISION NOT NULL,
    "sellPrice" DOUBLE PRECISION NOT NULL,
    "quantitySold" INTEGER NOT NULL,
    "profit" DOUBLE PRECISION NOT NULL,
    "dateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

-- AlterTable for Sale to add new fields
ALTER TABLE "Sale" 
    ADD COLUMN "totalAmount" DOUBLE PRECISION,
    ADD COLUMN "totalProfit" DOUBLE PRECISION,
    ADD COLUMN "paymentMethod" TEXT NOT NULL DEFAULT 'cash',
    ADD COLUMN "paymentReference" TEXT;

-- Make existing fields nullable for backward compatibility
ALTER TABLE "Sale" 
    ALTER COLUMN "sellPrice" DROP NOT NULL,
    ALTER COLUMN "quantitySold" DROP NOT NULL,
    ALTER COLUMN "itemId" DROP NOT NULL,
    ALTER COLUMN "itemName" DROP NOT NULL,
    ALTER COLUMN "itemCategory" DROP NOT NULL,
    ALTER COLUMN "itemPrice" DROP NOT NULL,
    ALTER COLUMN "profit" DROP NOT NULL;

-- Update existing sales with totalAmount and totalProfit
UPDATE "Sale"
SET 
    "totalAmount" = "sellPrice" * "quantitySold",
    "totalProfit" = "profit"
WHERE 
    "sellPrice" IS NOT NULL AND "quantitySold" IS NOT NULL;

-- Migrate existing sales to SaleItem
INSERT INTO "SaleItem" (
    "id", 
    "saleId", 
    "itemId", 
    "itemName", 
    "itemCategory", 
    "itemPrice", 
    "sellPrice", 
    "quantitySold", 
    "profit", 
    "dateCreated", 
    "dateUpdated"
)
SELECT 
    gen_random_uuid()::text, 
    "id", 
    "itemId", 
    "itemName", 
    "itemCategory", 
    "itemPrice", 
    "sellPrice", 
    "quantitySold", 
    "profit", 
    "dateCreated", 
    "dateUpdated"
FROM "Sale"
WHERE 
    "itemId" IS NOT NULL AND 
    "sellPrice" IS NOT NULL AND 
    "quantitySold" IS NOT NULL;

-- Add Foreign Keys
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create indexes
CREATE INDEX "SaleItem_saleId_idx" ON "SaleItem"("saleId");
CREATE INDEX "SaleItem_itemId_idx" ON "SaleItem"("itemId");
