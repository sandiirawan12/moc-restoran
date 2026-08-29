-- MOC Restoran SQL Dump for Railway MySQL
SET FOREIGN_KEY_CHECKS=0;

DROP TABLE IF EXISTS `restaurant_tables`;
CREATE TABLE `restaurant_tables` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `capacity` int NOT NULL,
  `status` enum('available','occupied','reserved') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'available',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `restaurant_tables_code_unique` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `restaurant_tables` (`id`, `code`, `capacity`, `status`, `created_at`, `updated_at`) VALUES ('1', 'A', '2', 'available', '2026-08-28 16:51:57', '2026-08-28 12:01:03');
INSERT INTO `restaurant_tables` (`id`, `code`, `capacity`, `status`, `created_at`, `updated_at`) VALUES ('2', 'B', '4', 'available', '2026-08-28 16:51:57', '2026-08-28 11:23:56');
INSERT INTO `restaurant_tables` (`id`, `code`, `capacity`, `status`, `created_at`, `updated_at`) VALUES ('3', 'C', '6', 'available', '2026-08-28 16:51:57', '2026-08-28 12:06:03');
INSERT INTO `restaurant_tables` (`id`, `code`, `capacity`, `status`, `created_at`, `updated_at`) VALUES ('4', 'D', '8', 'available', '2026-08-28 16:51:57', '2026-08-28 12:12:03');

DROP TABLE IF EXISTS `waiting_queues`;
CREATE TABLE `waiting_queues` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `customer_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `party_size` int NOT NULL,
  `status` enum('waiting','seated','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'waiting',
  `arrived_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=213 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `waiting_queues` (`id`, `customer_name`, `party_size`, `status`, `arrived_at`, `created_at`, `updated_at`) VALUES ('157', 'Karno & Pacar', '2', 'seated', '2026-08-28 10:25:44', '2026-08-28 10:25:44', '2026-08-28 11:22:47');

DROP TABLE IF EXISTS `dining_sessions`;
CREATE TABLE `dining_sessions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `table_id` bigint unsigned NOT NULL,
  `waiting_queue_id` bigint unsigned DEFAULT NULL,
  `customer_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `party_size` int NOT NULL,
  `seated_at` timestamp NOT NULL,
  `duration_minutes` int NOT NULL,
  `expected_finish_at` timestamp NOT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `status` enum('active','completed','force_completed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `dining_sessions_table_id_foreign` (`table_id`),
  KEY `dining_sessions_waiting_queue_id_foreign` (`waiting_queue_id`),
  CONSTRAINT `dining_sessions_table_id_foreign` FOREIGN KEY (`table_id`) REFERENCES `restaurant_tables` (`id`) ON DELETE CASCADE,
  CONSTRAINT `dining_sessions_waiting_queue_id_foreign` FOREIGN KEY (`waiting_queue_id`) REFERENCES `waiting_queues` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=217 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `dining_sessions` (`id`, `table_id`, `waiting_queue_id`, `customer_name`, `party_size`, `seated_at`, `duration_minutes`, `expected_finish_at`, `completed_at`, `status`, `created_at`, `updated_at`) VALUES ('172', '1', NULL, 'Budi & Pacar', '2', '2026-08-28 10:25:02', '36', '2026-08-28 11:01:02', '2026-08-28 11:22:47', 'completed', '2026-08-28 10:25:02', '2026-08-28 11:22:47');
INSERT INTO `dining_sessions` (`id`, `table_id`, `waiting_queue_id`, `customer_name`, `party_size`, `seated_at`, `duration_minutes`, `expected_finish_at`, `completed_at`, `status`, `created_at`, `updated_at`) VALUES ('173', '3', NULL, 'Jano & Teman teman', '6', '2026-08-28 10:25:29', '100', '2026-08-28 12:05:29', '2026-08-28 12:06:03', 'completed', '2026-08-28 10:25:29', '2026-08-28 12:06:03');
INSERT INTO `dining_sessions` (`id`, `table_id`, `waiting_queue_id`, `customer_name`, `party_size`, `seated_at`, `duration_minutes`, `expected_finish_at`, `completed_at`, `status`, `created_at`, `updated_at`) VALUES ('174', '4', NULL, 'Sandi & Family', '6', '2026-08-28 10:26:14', '105', '2026-08-28 12:11:14', '2026-08-28 12:12:03', 'completed', '2026-08-28 10:26:14', '2026-08-28 12:12:03');
INSERT INTO `dining_sessions` (`id`, `table_id`, `waiting_queue_id`, `customer_name`, `party_size`, `seated_at`, `duration_minutes`, `expected_finish_at`, `completed_at`, `status`, `created_at`, `updated_at`) VALUES ('175', '2', NULL, 'Viko & Teman', '3', '2026-08-28 10:26:56', '57', '2026-08-28 11:23:56', '2026-08-28 11:23:56', 'completed', '2026-08-28 10:26:56', '2026-08-28 11:23:56');
INSERT INTO `dining_sessions` (`id`, `table_id`, `waiting_queue_id`, `customer_name`, `party_size`, `seated_at`, `duration_minutes`, `expected_finish_at`, `completed_at`, `status`, `created_at`, `updated_at`) VALUES ('200', '1', '157', 'Karno & Pacar', '2', '2026-08-28 11:22:47', '38', '2026-08-28 12:00:47', '2026-08-28 12:01:03', 'completed', '2026-08-28 11:22:47', '2026-08-28 12:01:03');

SET FOREIGN_KEY_CHECKS=1;
