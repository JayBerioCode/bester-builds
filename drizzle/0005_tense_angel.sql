CREATE TABLE `inventory_job_usage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`inventoryItemId` int NOT NULL,
	`quantityUsed` decimal(10,3) NOT NULL,
	`unitCost` decimal(10,2) NOT NULL,
	`totalCost` decimal(10,2) NOT NULL,
	`notes` text,
	`loggedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_job_usage_id` PRIMARY KEY(`id`)
);
