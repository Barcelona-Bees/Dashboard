DROP DATABASE IF EXISTS BarcBees;
CREATE DATABASE BarcBees;
USE BarcBees;

CREATE TABLE Hive(
	hiveID int PRIMARY KEY auto_increment,
	name varchar(100) not null,
    zipcode char(5) not null,
    startDate datetime not null,
);

CREATE TABLE User(
    userID int PRIMARY KEY auto_increment, 
    username varchar(20) NOT NULL,
	password varchar(500) NOT NULL,
	email varchar(500) NOT NULL,
    phone char(10) NULL,
    sessionToken varchar(500) NULL,
    dataStartDate DATETIME NULL 
);

CREATE TABLE Notify(
    userID int PRIMARY KEY,
    notifType ENUM('email','phone','both', 'none'),
    temp boolean,
    humidity boolean,
    carbonDioxide boolean,
    swarm boolean,
     CONSTRAINT FK_Notify_User FOREIGN KEY (userID) references User(userID)
);


CREATE TABLE Temperature(
    tempID int PRIMARY KEY auto_increment,
    hiveID int NOT NULL,
    timestamp DATETIME NOT NULL,
    reading float NULL,
    CONSTRAINT FK_Temperature_Hive FOREIGN KEY (hiveID) references Hive(hiveID)
);

CREATE TABLE OutsideTemp(
    oTempID int PRIMARY KEY auto_increment,
    hiveID int NOT NULL,
    timestamp DATETIME NOT NULL,
    reading float NULL,
    CONSTRAINT FK_OutsideTemp_Hive FOREIGN KEY (hiveID) references Hive(hiveID)

);

CREATE TABLE CarbonDioxide(
    carbonDioxideID int PRIMARY KEY auto_increment,
    hiveID int NOT NULL,
    timestamp DATETIME NOT NULL,
    reading float NULL,
    CONSTRAINT FK_CarbonDioxide_Hive FOREIGN KEY (hiveID) references Hive(hiveID)

);

CREATE TABLE Humidity(
    humidtyID int PRIMARY KEY auto_increment,
    timestamp DATETIME NOT NULL,
    reading float NULL,
    CONSTRAINT FK_Temperature_Hive FOREIGN KEY (hiveID) references Hive(hiveID)
);

CREATE TABLE OutsidePressure(
    pressureID int PRIMARY KEY auto_increment,
    timestamp DATETIME NOT NULL,
    reading float NULL
);


CREATE TABLE HiveData(
	hiveID int NOT NULL ,
    timestamp DATETIME NOT NULL,
    tempID int NULL,
    humidtyID int NULL,
    oTempID int NULL,
    pressureID int NULL,
    carbonDioxideID int NULL,
    PRIMARY KEY (hiveID, timestamp),
    CONSTRAINT FK_hivedata_hive FOREIGN KEY (hiveID) references Hive(hiveID),
    CONSTRAINT FK_hive_temp FOREIGN KEY (tempID) references Temperature(tempID),
    CONSTRAINT FK_hive_humidity FOREIGN KEY (humidtyID) references Humidity(humidtyID),
    CONSTRAINT FK_hive_outsideTemp FOREIGN KEY (oTempID) references OutsideTemp(oTempID),
    CONSTRAINT FK_hive_pressure FOREIGN KEY (pressureID) references OutsidePressure(pressureID),
    CONSTRAINT FK_hive_CO2ID FOREIGN KEY (carbonDioxideID) references carbonDioxide(carbonDioxideID)
);

CREATE TABLE UserHives(
    userID int NOT NULL,
    hiveID int NOT NULL,
    PRIMARY KEY(userID, hiveID),
    CONSTRAINT FK_userhives_users FOREIGN KEY (userID) references User(userID),
    CONSTRAINT FK_userhives_hive FOREIGN KEY (hiveID) references Hive(hiveID)
)

