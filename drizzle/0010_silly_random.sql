CREATE TABLE `job_cards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobCardNumber` varchar(50) NOT NULL,
	`invoiceId` int NOT NULL,
	`poNumber` varchar(100) NOT NULL,
	`jobTitle` varchar(255) NOT NULL,
	`customerName` varchar(255),
	`assignedTo` int,
	`assignedToName` varchar(255),
	`dueDate` timestamp,
	`printType` varchar(100),
	`width` decimal(8,2),
	`height` decimal(8,2),
	`dimensionUnit` varchar(10) DEFAULT 'm',
	`quantity` int DEFAULT 1,
	`material` varchar(255),
	`finishing` varchar(255),
	`instructions` text,
	`notes` text,
	`fileUrl` text,
	`status` enum('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `job_cards_id` PRIMARY KEY(`id`),
	CONSTRAINT `job_cards_jobCardNumber_unique` UNIQUE(`jobCardNumber`)
);
--> statement-breakpoint
ALTER TABLE `invoices` ADD `poNumber` varchar(100);