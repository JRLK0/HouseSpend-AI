-- Script para crear las tablas de Stock si no existen
-- Ejecutar este script en PostgreSQL si las tablas no se crean automáticamente

-- Crear tabla StockItems
CREATE TABLE IF NOT EXISTS "StockItems" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" INTEGER NOT NULL,
    "ProductName" VARCHAR(500) NOT NULL,
    "CategoryId" INTEGER,
    "CurrentQuantity" NUMERIC(18,3) NOT NULL,
    "Unit" VARCHAR(50) NOT NULL DEFAULT 'unidad',
    "MinQuantity" NUMERIC(18,3),
    "MaxQuantity" NUMERIC(18,3),
    "LastUpdated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "Notes" TEXT,
    CONSTRAINT "FK_StockItems_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_StockItems_Categories_CategoryId" FOREIGN KEY ("CategoryId") REFERENCES "Categories" ("Id") ON DELETE SET NULL,
    CONSTRAINT "UQ_StockItems_UserId_ProductName" UNIQUE ("UserId", "ProductName")
);

-- Crear tabla StockTransactions
CREATE TABLE IF NOT EXISTS "StockTransactions" (
    "Id" SERIAL PRIMARY KEY,
    "StockItemId" INTEGER NOT NULL,
    "TicketId" INTEGER,
    "TransactionType" INTEGER NOT NULL,
    "Quantity" NUMERIC(18,3) NOT NULL,
    "Date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "Notes" TEXT,
    CONSTRAINT "FK_StockTransactions_StockItems_StockItemId" FOREIGN KEY ("StockItemId") REFERENCES "StockItems" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_StockTransactions_Tickets_TicketId" FOREIGN KEY ("TicketId") REFERENCES "Tickets" ("Id") ON DELETE SET NULL
);

-- Crear índices
CREATE INDEX IF NOT EXISTS "IX_StockItems_UserId" ON "StockItems" ("UserId");
CREATE INDEX IF NOT EXISTS "IX_StockItems_CategoryId" ON "StockItems" ("CategoryId");
CREATE INDEX IF NOT EXISTS "IX_StockTransactions_StockItemId" ON "StockTransactions" ("StockItemId");
CREATE INDEX IF NOT EXISTS "IX_StockTransactions_Date" ON "StockTransactions" ("Date");
CREATE INDEX IF NOT EXISTS "IX_StockTransactions_TicketId" ON "StockTransactions" ("TicketId");

