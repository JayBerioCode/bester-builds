CREATE TABLE `employee_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recipientId` int NOT NULL,
	`recipientName` varchar(255),
	`type` enum('shift_approved','shift_rejected','general') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`shiftId` int,
	`isRead` boolean NOT NULL DEFAULT false,
	`sentByName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `employee_notifications_id` PRIMARY KEY(`id`)
);
