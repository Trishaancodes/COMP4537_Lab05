DROP DATABASE IF EXISTS comp4537_lab5;
DROP USER IF EXISTS 'lab5_writer'@'%';
DROP USER IF EXISTS 'lab5_reader'@'%';

CREATE DATABASE comp4537_lab5;
USE comp4537_lab5;

-- Writer: used for POST requests (create the table if missing + insert rows)
CREATE USER 'lab5_writer'@'%' IDENTIFIED BY 'change_me_writer';
GRANT CREATE, INSERT, SELECT ON comp4537_lab5.* TO 'lab5_writer'@'%';

-- Reader: used for GET requests (SELECT only)
CREATE USER 'lab5_reader'@'%' IDENTIFIED BY 'change_me_reader';
GRANT SELECT ON comp4537_lab5.* TO 'lab5_reader'@'%';
