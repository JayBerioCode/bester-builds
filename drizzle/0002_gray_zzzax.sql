CREATE TABLE `shift_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`clockIn` timestamp NOT NULL,
	`clockOut` timestamp,
	`hoursWorked` decimal(8,2),
	`earnings` decimal(12,2),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shift_logs_id` PRIMARY KEY(`id`)
);
