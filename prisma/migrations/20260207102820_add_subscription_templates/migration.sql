-- CreateTable
CREATE TABLE "SubscriptionTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "validityDays" INTEGER NOT NULL DEFAULT 30,
    "planId" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionTemplateLine" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "discountId" TEXT,
    "taxRateId" TEXT,

    CONSTRAINT "SubscriptionTemplateLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubscriptionTemplate_isActive_idx" ON "SubscriptionTemplate"("isActive");

-- CreateIndex
CREATE INDEX "SubscriptionTemplateLine_templateId_idx" ON "SubscriptionTemplateLine"("templateId");

-- AddForeignKey
ALTER TABLE "SubscriptionTemplate" ADD CONSTRAINT "SubscriptionTemplate_planId_fkey" FOREIGN KEY ("planId") REFERENCES "RecurringPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionTemplateLine" ADD CONSTRAINT "SubscriptionTemplateLine_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "SubscriptionTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionTemplateLine" ADD CONSTRAINT "SubscriptionTemplateLine_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionTemplateLine" ADD CONSTRAINT "SubscriptionTemplateLine_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "Discount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionTemplateLine" ADD CONSTRAINT "SubscriptionTemplateLine_taxRateId_fkey" FOREIGN KEY ("taxRateId") REFERENCES "TaxRate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
