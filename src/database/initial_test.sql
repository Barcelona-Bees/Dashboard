USE BarcBees;

INSERT into User (userID, username, password, email, phone, dataStartDate)
	VALUES(1, 'Admin', 'Admin', 'admin@admin.com', NULL, date(now()) );
    
INSERT into User (username, password, email, phone, dataStartDate)
	VALUES('test', 'test', 'test@test.com', NULL, date(now()) );
    
INSERT INTO Hive (name, zipcode)
		VALUES ('hive','14623');
	
INSERT INTO Notify(userID, notifType, temp, humidity, carbonDioxide, swarm)
	VALUES(1, 'both', true, true, true, true);
    
INSERT INTO Temperature(timestamp, reading)
	VALUES(date(now()), 18.2);
      
INSERT INTO Temperature(timestamp, reading)
	VALUES('2026-02-01 12:00:00', 18.2),
	('2026-02-01 12:10:00', 18.7),
	('2026-02-01 12:20:00', 20.2),
	('2026-02-01 12:30:00', 21.2),
	('2026-02-01 12:40:00', 21.4),
	('2026-02-01 12:50:00', 21.7);
    
INSERT INTO OutsideTemp(timestamp, reading)
	VALUES(date(now), 19.2);
    
INSERT INTO CarbonDioxide(timestamp, reading)
	VALUES(date(now), 10.0);
    
INSERT INTO Humidity(timestamp, reading)
	VALUES(date(now), 40.1);

-- Not sure good data
INSERT INTO OutsidePressure(timestamp, reading)
	VALUES(date(now), 10);

-- Get Datas
SELECT * FROM Temperature;
select * from Temperature where timestamp like '%2026-02-01%';

SELECT * FROM User;

SELECT * FROM Hive;




select * from User