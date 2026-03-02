ALTER TABLE `shift_logs` ADD `approvalStatus` enum('pending','approved','rejected') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `shift_logs` ADD `approvedBy` int;--> statement-breakpoint
ALTER TABLE `shift_logs` ADD `approvedByName` varchar(255);--> statement-breakpoint
ALTER TABLE `shift_logs` ADD `approvedAt` timestamp;--> statement-breakpoint
ALTER TABLE `shift_logs` ADD `rejectionReason` text;