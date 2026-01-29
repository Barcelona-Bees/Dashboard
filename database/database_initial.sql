DROP DATABASE IF EXISTS BarcBees;
CREATE DATABASE BarcBees;

CREATE TYPE notifType as ENUM('emial','phone','both');

CREATE TABLE Hive{
    int hiveID PRIMARY KEY,
    varchar(100) name not null,
    zipcode char(5) not null
;}

CREATE TABLE User{
    int userID PRIMARY KEY, 
    varchar(20) username NOT NULL,
    varchar(500) password NOT NULL,
    varchar(500) email NOT NULL,
    char(10) phone NULL,
    DATETIME dataStartDate NULL 
};

CREATE TABLE Notify{
    int userID NOT NULL,
    ENUM('email','phone','both', 'none') noteType,
    boolean temp,
    boolean humidity,
    boolean carbonDioxide,
    boolean swarm
}


CREATE TABLE Temperature{
    int tempID PRIMARY KEY,
    DATETIME timestamp NOT NULL,
    float reading NULL
};

CREATE TABLE OutsideTemp{
    int oTempID PRIMARY KEY,
    DATETIME timestamp NOT NULL,
    float reading NULL
};

CREATE TABLE CO2{
    int CO2ID PRIMARY KEY,
    DATETIME timestamp NOT NULL,
    float reading NULL
};

CREATE TABLE Humidity{
    int humidtyID PRIMARY KEY,
    DATETIME timestamp NOT NULL,
    float reading NULL
};

CREATE TABLE OutsidePressure{
    int pressureID PRIMARY KEY,
    DATETIME timestamp NOT NULL,
    float reading NULL
};


CREATE TABLE HiveData{
    int hiveID,
    DATETIME timestamp NOT NULL,
    int tempID NULL,
    int humidtyID NULL,
    int oTempID NULL,
    int pressureID NULL,
    int CO2ID NULL,
    PRIMARY KEY (hiveID, timestamp),
    CONSTRAINT FK_hivedata_hive FOREIGN KEY hiveID references Hive(hiveID)
    CONSTRAINT FK_hive_temp FOREIGN KEY tempID references Temperature(tempID),
    CONSTRAINT FK_hive_humidity FOREIGN KEY humidtyID references Humidity(humidtyID)
    CONSTRAINT FK_hive_outsideTemp FOREIGN KEY oTempID references OutsideTemp(oTempID),
    CONSTRAINT FK_hive_pressure FOREIGN KEY pressureID references OutsidePressure(pressureID),
    CONSTRAINT FK_hive_CO2ID FOREIGN KEY CO2ID references CO2(CO2ID)
};

CREATE TABLE UserHives{
    int userID NOT NULL,
    int hiveID NOT NULL,
    PRIMARY KEY(userID, hiveID),
    CONSTRAINT FK_userhives_users FOREIGN KEY userID references User(userID),
    CONSTRAINT FK_userhives_hive FOREIGN KEY hiveID references Hive(hiveID)
}

