DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  rollNo TEXT,
  mentorEmail TEXT
);

-- =====================
-- ADMIN
-- =====================
INSERT INTO users (name, email, password, role)
VALUES ('Admin', 'admin@ecs.edu', 'admin123', 'admin');

-- =====================
-- TEACHERS
-- =====================
INSERT INTO users (name, email, password, role) VALUES
('Dr. Dattatray V. Bhoir', 'bhoir@frcrce.ac.in', 'teacher123', 'teacher'),
('Prof. Binsy Joseph', 'binsy.joseph@fragnel.edu.in', 'teacher123', 'teacher'),
('Dr. Swapnali Makde', 'swapnali@fragnel.edu.in', 'teacher123', 'teacher'),
('Prof. Vaibhav Godbole', 'godbole@fragnel.edu.in', 'teacher123', 'teacher'),
('Prof. Archana Lopes', 'archana.lopes@fragnel.edu.in', 'teacher123', 'teacher'),
('Prof. Jayen Modi', 'jayen.modi@fragnel.edu.in', 'teacher123', 'teacher'),
('Prof. Prajakta Bhangale', 'prajakta.bhongale@frcrce.ac.in', 'teacher123', 'teacher'),
('Dr. Sailakshmi Paravathi', 'sailakshmi@fragnel.edu.in', 'teacher123', 'teacher'),
('Dr. Inderkumar Kochar', 'kochar@fragnel.edu.in', 'teacher123', 'teacher');

-- =====================
-- STUDENTS
-- =====================

-- Dr. Bhoir Students
INSERT INTO users (name, email, password, role, rollNo, mentorEmail) VALUES
('ADIPELLY PRIYAL RAVI','10514@crce.edu.in','10514','student','10514','bhoir@frcrce.ac.in'),
('SHIVARE SAMARTH ARUN','10573@crce.edu.in','10573','student','10573','bhoir@frcrce.ac.in'),
('SINGH AMOGH ASHUTOSH','10574@crce.edu.in','10574','student','10574','bhoir@frcrce.ac.in'),
('TELLIS ORIN FABIAN','10575@crce.edu.in','10575','student','10575','bhoir@frcrce.ac.in'),
('TIWARI SHAURY ASHISH','10576@crce.edu.in','10576','student','10576','bhoir@frcrce.ac.in'),
('YADAV ADITYA INDRAJEET','10577@crce.edu.in','10577','student','10577','bhoir@frcrce.ac.in'),
('DSOUZA BRANDON MARTIN','10529@crce.edu.in','10529','student','10529','bhoir@frcrce.ac.in');

-- Dr. Swapnali Students
INSERT INTO users (name, email, password, role, rollNo, mentorEmail) VALUES
('ANSARI OBAID ASHFAQ','10517@crce.edu.in','10517','student','10517','swapnali@fragnel.edu.in'),
('RAPARTHY VINAY DASHARATH','10562@crce.edu.in','10562','student','10562','swapnali@fragnel.edu.in'),
('REDDY ARNAV MANOJ','10563@crce.edu.in','10563','student','10563','swapnali@fragnel.edu.in'),
('REDDY SARISSHABHASKAR','10564@crce.edu.in','10564','student','10564','swapnali@fragnel.edu.in'),
('RODRICKS JADON DOMINIC','10565@crce.edu.in','10565','student','10565','swapnali@fragnel.edu.in'),
('RODRIGUES BREYON RAJESH','10566@crce.edu.in','10566','student','10566','swapnali@fragnel.edu.in'),
('SEQUEIRA SHELDON SAMUEL','10567@crce.edu.in','10567','student','10567','swapnali@fragnel.edu.in');

-- Dr. Kochar Students
INSERT INTO users (name, email, password, role, rollNo, mentorEmail) VALUES
('CHAMOLI SAANVI PREMLAL','10523@crce.edu.in','10523','student','10523','kochar@fragnel.edu.in'),
('CHAUDHARI ATHARVA PRUTHVIRAJ','10524@crce.edu.in','10524','student','10524','kochar@fragnel.edu.in'),
('CHAURASIA VAIDEHI SANJAY','10525@crce.edu.in','10525','student','10525','kochar@fragnel.edu.in'),
('CHAVAN BHOOMI SANTOSH','10526@crce.edu.in','10526','student','10526','kochar@fragnel.edu.in'),
('DABRE BONNY NOVEL','10527@crce.edu.in','10527','student','10527','kochar@fragnel.edu.in'),
('DCRUZ THEA MALCOLM','10528@crce.edu.in','10528','student','10528','kochar@fragnel.edu.in');