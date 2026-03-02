CREATE TABLE `appointments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`type` enum('client_consultation','production','delivery','equipment_maintenance','team_meeting','other') NOT NULL,
	`customerId` int,
	`orderId` int,
	`assignedTo` int,
	`status` enum('scheduled','confirmed','in_progress','completed','cancelled','rescheduled') NOT NULL DEFAULT 'scheduled',
	`startTime` timestamp NOT NULL,
	`endTime` timestamp NOT NULL,
	`location` varchar(255),
	`description` text,
	`notes` text,
	`reminderSent` boolean DEFAULT false,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`company` varchar(255),
	`email` varchar(320),
	`phone` varchar(50),
	`address` text,
	`city` varchar(100),
	`country` varchar(100),
	`status` enum('active','inactive','prospect') NOT NULL DEFAULT 'prospect',
	`customerType` enum('individual','business','reseller') NOT NULL DEFAULT 'individual',
	`notes` text,
	`totalSpent` decimal(12,2) DEFAULT '0.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(50),
	`role` enum('manager','print_operator','designer','sales','delivery','admin','other') NOT NULL,
	`department` varchar(100),
	`status` enum('active','inactive','on_leave') NOT NULL DEFAULT 'active',
	`hireDate` timestamp,
	`hourlyRate` decimal(8,2),
	`skills` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `interactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`type` enum('call','email','meeting','quote','follow_up','complaint','other') NOT NULL,
	`subject` varchar(255) NOT NULL,
	`notes` text,
	`outcome` varchar(255),
	`nextFollowUp` timestamp,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `interactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventory_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`sku` varchar(100),
	`category` enum('paper','vinyl','fabric','ink','substrate','laminate','hardware','consumable','equipment','other') NOT NULL,
	`description` text,
	`unit` varchar(50) DEFAULT 'unit',
	`currentStock` decimal(10,2) DEFAULT '0',
	`minStockLevel` decimal(10,2) DEFAULT '0',
	`maxStockLevel` decimal(10,2),
	`unitCost` decimal(10,2) DEFAULT '0.00',
	`unitPrice` decimal(10,2) DEFAULT '0.00',
	`supplier` varchar(255),
	`supplierSku` varchar(100),
	`location` varchar(100),
	`isActive` boolean DEFAULT true,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventory_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_items_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `inventory_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`itemId` int NOT NULL,
	`type` enum('purchase','usage','adjustment','return','waste') NOT NULL,
	`quantity` decimal(10,2) NOT NULL,
	`unitCost` decimal(10,2),
	`reference` varchar(255),
	`notes` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceNumber` varchar(50) NOT NULL,
	`orderId` int,
	`customerId` int NOT NULL,
	`status` enum('draft','sent','viewed','partial','paid','overdue','cancelled') NOT NULL DEFAULT 'draft',
	`subtotal` decimal(12,2) NOT NULL,
	`taxRate` decimal(5,2) DEFAULT '0.00',
	`taxAmount` decimal(12,2) DEFAULT '0.00',
	`discountAmount` decimal(12,2) DEFAULT '0.00',
	`total` decimal(12,2) NOT NULL,
	`amountPaid` decimal(12,2) DEFAULT '0.00',
	`amountDue` decimal(12,2) NOT NULL,
	`issueDate` timestamp NOT NULL DEFAULT (now()),
	`dueDate` timestamp NOT NULL,
	`notes` text,
	`terms` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_invoiceNumber_unique` UNIQUE(`invoiceNumber`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`company` varchar(255),
	`email` varchar(320),
	`phone` varchar(50),
	`source` enum('website','referral','social_media','cold_call','trade_show','other') NOT NULL DEFAULT 'other',
	`stage` enum('new','contacted','qualified','proposal','negotiation','won','lost') NOT NULL DEFAULT 'new',
	`estimatedValue` decimal(12,2),
	`printingNeeds` text,
	`assignedTo` int,
	`notes` text,
	`convertedToCustomer` boolean DEFAULT false,
	`customerId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`description` varchar(255) NOT NULL,
	`quantity` decimal(10,2) NOT NULL,
	`unitPrice` decimal(10,2) NOT NULL,
	`total` decimal(12,2) NOT NULL,
	`inventoryItemId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(50) NOT NULL,
	`customerId` int NOT NULL,
	`status` enum('quote','confirmed','in_production','quality_check','ready','dispatched','delivered','cancelled') NOT NULL DEFAULT 'quote',
	`priority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
	`title` varchar(255) NOT NULL,
	`description` text,
	`printType` enum('banner','poster','signage','vehicle_wrap','canvas','fabric','wallpaper','floor_graphic','window_graphic','other') DEFAULT 'other',
	`width` decimal(8,2),
	`height` decimal(8,2),
	`dimensionUnit` enum('mm','cm','m','inch','ft') DEFAULT 'm',
	`quantity` int DEFAULT 1,
	`material` varchar(255),
	`finishing` varchar(255),
	`fileUrl` text,
	`subtotal` decimal(12,2) DEFAULT '0.00',
	`taxRate` decimal(5,2) DEFAULT '0.00',
	`taxAmount` decimal(12,2) DEFAULT '0.00',
	`discountAmount` decimal(12,2) DEFAULT '0.00',
	`total` decimal(12,2) DEFAULT '0.00',
	`dueDate` timestamp,
	`deliveryMethod` enum('pickup','delivery','courier') DEFAULT 'pickup',
	`deliveryAddress` text,
	`assignedTo` int,
	`notes` text,
	`internalNotes` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`customerId` int NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`method` enum('cash','card','bank_transfer','eft','cheque','online','other') NOT NULL,
	`status` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`reference` varchar(255),
	`notes` text,
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`orderId` int,
	`assignedTo` int,
	`status` enum('pending','in_progress','review','completed','cancelled') NOT NULL DEFAULT 'pending',
	`priority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
	`category` enum('design','printing','finishing','quality_check','delivery','admin','other') DEFAULT 'other',
	`estimatedHours` decimal(6,2),
	`actualHours` decimal(6,2),
	`dueDate` timestamp,
	`completedAt` timestamp,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
