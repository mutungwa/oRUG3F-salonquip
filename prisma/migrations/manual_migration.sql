-- Add Foreign Keys to SaleItem table
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create indexes for better performance
CREATE INDEX "SaleItem_saleId_idx" ON "SaleItem"("saleId");
CREATE INDEX "SaleItem_itemId_idx" ON "SaleItem"("itemId");

-- Migrate existing sales to SaleItem if needed
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
    "quantitySold" IS NOT NULL AND
    NOT EXISTS (
        -- Skip if this sale already has items in SaleItem
        SELECT 1 FROM "SaleItem" WHERE "SaleItem"."saleId" = "Sale"."id"
    );
