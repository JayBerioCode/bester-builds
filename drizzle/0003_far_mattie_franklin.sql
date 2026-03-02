ALTER TABLE `employees` ADD `pinHash` varchar(255);--> statement-breakpoint
ALTER TABLE `employees` ADD `pinSet` boolean DEFAULT false NOT NULL;