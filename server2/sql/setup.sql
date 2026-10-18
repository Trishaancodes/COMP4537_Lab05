-- Run once as an admin user (e.g. root) on the MySQL/MariaDB server.
-- Claude (https://claude.ai) was used to help write this file.
-- Principle of Least Privilege: two users, neither can DROP, DELETE or UPDATE.

CREATE DATABASE IF NOT EXISTS lab5;

-- Writer: used for POST requests (create the table if missing + insert rows)
CREATE USER IF NOT EXISTS 'lab5_writer'@'%' IDENTIFIED BY 'change_me_writer';
GRANT CREATE, INSERT, SELECT ON lab5.* TO 'lab5_writer'@'%';

-- Reader: used for GET requests (SELECT only)
CREATE USER IF NOT EXISTS 'lab5_reader'@'%' IDENTIFIED BY 'change_me_reader';
GRANT SELECT ON lab5.* TO 'lab5_reader'@'%';

FLUSH PRIVILEGES;
