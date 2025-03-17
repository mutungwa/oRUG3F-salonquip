/*
  Warnings:

  - You are about to alter the column `quantitySold` on the `Sale` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - The `saleDate` column on the `Sale` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "customerPhone" TEXT,
ADD COLUMN     "loyaltyPointsEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
ALTER COLUMN "quantitySold" SET DATA TYPE INTEGER,
DROP COLUMN "saleDate",
ADD COLUMN     "saleDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "dateUpdated" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "loyaltyPoints" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "referredBy" TEXT,
    "dateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phoneNumber_key" ON "Customer"("phoneNumber");

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_referredBy_fkey" FOREIGN KEY ("referredBy") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
