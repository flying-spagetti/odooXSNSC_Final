-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "expirationDate" TIMESTAMP(3),
ADD COLUMN     "orderDate" TIMESTAMP(3),
ADD COLUMN     "paymentDone" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentMethod" "PaymentMethod",
ADD COLUMN     "paymentTermDays" INTEGER,
ADD COLUMN     "quotationTemplate" TEXT,
ADD COLUMN     "salespersonId" TEXT;

-- CreateIndex
CREATE INDEX "Subscription_salespersonId_idx" ON "Subscription"("salespersonId");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_salespersonId_fkey" FOREIGN KEY ("salespersonId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
