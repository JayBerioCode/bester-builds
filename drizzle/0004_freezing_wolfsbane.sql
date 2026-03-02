CREATE TABLE `pricing_rates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`printType` enum('banner','poster','signage','vehicle_wrap','canvas','fabric','wallpaper','floor_graphic','window_graphic','other') NOT NULL,
	`material` varchar(100) NOT NULL,
	`ratePerSqm` decimal(10,2) NOT NULL,
	`setupFee` decimal(10,2) NOT NULL DEFAULT '0.00',
	`minCharge` decimal(10,2) NOT NULL DEFAULT '0.00',
	`laminationRatePerSqm` decimal(10,2) DEFAULT '0.00',
	`eyeletRatePerMetre` decimal(10,2) DEFAULT '0.00',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pricing_rates_id` PRIMARY KEY(`id`)
);
