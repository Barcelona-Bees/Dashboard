/* Heltec Automation LoRaWAN DHT11 Temperature & Humidity Sensor
 *
 * Function:
 * 1. Reads DHT11 ONCE at startup before LoRaWAN initializes
 * 2. Sends reading 15 times every 2 seconds to ensure gateway receives at least one
 * 3. After 15 sends waits 9:30 minutes
 * 4. Takes fresh reading and repeats indefinitely
 *
 * Hardware:
 * - Heltec MeshSolar (nRF52840 + SX1262)
 * - DHT11 sensor on pin 32 (H6 connector GPIO32)
 * - Elecrow single channel gateway (US915 Channel 0 SF10)
 * - The Things Network (ABP, FSB1)
 *
 * HelTec AutoMation, Chengdu, China
 * www.heltec.org
 */

#include <Arduino.h>
#include <SPI.h>
#include <Adafruit_TinyUSB.h>
#include "heltec_nrf_lorawan.h"
#include <DHT.h>

/* DHT11 Setup - pin 32 confirmed working on H6 connector */
#define DHT_PIN  32
#define DHT_TYPE DHT11
DHT dht(DHT_PIN, DHT_TYPE);

/* How many times to send before switching to 10 min wait */
#define MAX_ATTEMPTS   15

/* 2 seconds between retries */
#define RETRY_INTERVAL 2000

/* 10 minutes between reading cycles */
#define SEND_INTERVAL  570000

/* Sensor readings */
float currentTempF    = 0.0;
float currentHumidity = 0.0;
bool  sensorReadingValid = false;
int   sendCount    = 0;
bool  cycleComplete = false;

/* OTAA para (not used - ABP mode) */
uint8_t devEui[] = { 0x22, 0x32, 0x33, 0x00, 0x00, 0x99, 0xaa, 0x04 };
uint8_t appEui[] = { 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 };
uint8_t appKey[] = { 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88 };

/* ABP keys - update these to match your TTN device */
uint8_t nwkSKey[] = { 0xEB, 0x69, 0x68, 0x56, 0xA3, 0x3E, 0xCD, 0x77, 0xFC, 0x57, 0xE9, 0xA9, 0x1D, 0xA4, 0xF3, 0x78 };
uint8_t appSKey[] = { 0xE2, 0x68, 0x47, 0x8F, 0xED, 0x72, 0x7F, 0xE3, 0xE4, 0xBF, 0x3B, 0xEF, 0x66, 0xAE, 0x06, 0x91 };
uint32_t devAddr = (uint32_t)0x260C5B85;

/* LoRaWAN config */
uint16_t userChannelsMask[6] = { 0x0001,0x0000,0x0000,0x0000,0x0000,0x0000 }; // Channel 0 = 902.3MHz
LoRaMacRegion_t loraWanRegion = LORAMAC_REGION_US915;
DeviceClass_t   loraWanClass  = CLASS_A;
uint32_t appTxDutyCycle       = RETRY_INTERVAL;
bool overTheAirActivation     = false;  // ABP mode
bool loraWanAdr               = false;  // Keep DR0 fixed
bool isTxConfirmed            = true;
uint8_t appPort               = 2;
uint8_t confirmedNbTrials     = 8;

/* Read fresh DHT11 values */
void readSensor() {
  delay(2000);
  float h = dht.readHumidity();
  float t = dht.readTemperature(true); // Fahrenheit

  if (isnan(h) || isnan(t)) {
    Serial.println("DHT11 read failed!");
    sensorReadingValid = false;
  } else {
    currentHumidity = h;
    currentTempF    = t;
    sensorReadingValid = true;
    Serial.print("New reading - Temp: ");
    Serial.print(currentTempF);
    Serial.print(" F  Humidity: ");
    Serial.print(currentHumidity);
    Serial.println("%");
  }
}

/* Prepares the LoRaWAN payload */
static void prepareTxFrame(uint8_t port) {
  // If last cycle completed take fresh reading and reset
  if (cycleComplete) {
    cycleComplete  = false;
    sendCount      = 0;
    appTxDutyCycle = RETRY_INTERVAL;
    readSensor();
  }

  sendCount++;
  Serial.print("Attempt ");
  Serial.print(sendCount);
  Serial.print("/");
  Serial.print(MAX_ATTEMPTS);
  Serial.print(" - Temp: ");
  Serial.print(currentTempF);
  Serial.print(" F  Humidity: ");
  Serial.print(currentHumidity);
  Serial.println("%");

  // After MAX_ATTEMPTS switch to 10 minute wait
  if (sendCount >= MAX_ATTEMPTS) {
    Serial.println("==========================");
    Serial.println("15 attempts done.");
    Serial.println("Waiting 10 minutes...");
    Serial.println("==========================");
    appTxDutyCycle = SEND_INTERVAL;
    cycleComplete  = true;
  }

  // Pack payload - 4 bytes (temp + humidity)
  if (!sensorReadingValid) {
    appDataSize = 4;
    appData[0]  = 0x00;
    appData[1]  = 0x00;
    appData[2]  = 0x00;
    appData[3]  = 0x00;
    return;
  }

  // Multiply by 10 to preserve 1 decimal place (e.g. 72.5F = 725)
  int16_t tempInt = (int16_t)(currentTempF    * 10);
  int16_t humInt  = (int16_t)(currentHumidity * 10);

  appDataSize = 4;
  appData[0]  = (tempInt >> 8) & 0xFF;  // Temp high byte
  appData[1]  = tempInt & 0xFF;          // Temp low byte
  appData[2]  = (humInt  >> 8) & 0xFF;  // Humidity high byte
  appData[3]  = humInt  & 0xFF;          // Humidity low byte
}

void setup() {
  // Read DHT11 before LoRaWAN starts to avoid timing conflicts
  pinMode(DHT_PIN, INPUT_PULLUP);
  dht.begin();
  readSensor();

  boardInit(LORA_DEBUG_ENABLE, LORA_DEBUG_SERIAL_NUM, 115200);
  debug_printf("start\r\n");

  sendCount = 0;
  Serial.println("Sending 15 times every 2 seconds, then waiting 10 minutes...");
}

void loop() {
  switch (deviceState) {
    case DEVICE_STATE_INIT:
      LoRaWAN.init(loraWanClass, loraWanRegion);
      LoRaWAN.setDefaultDR(0); // DR0 = SF10 to match gateway SF10
      break;

    case DEVICE_STATE_JOIN:
      LoRaWAN.join();
      break;

    case DEVICE_STATE_SEND:
      prepareTxFrame(appPort);
      LoRaWAN.send();
      deviceState = DEVICE_STATE_CYCLE;
      break;

    case DEVICE_STATE_CYCLE:
      txDutyCycleTime = appTxDutyCycle + randr(-APP_TX_DUTYCYCLE_RND, APP_TX_DUTYCYCLE_RND);
      LoRaWAN.cycle(txDutyCycleTime);
      deviceState = DEVICE_STATE_SLEEP;
      break;

    case DEVICE_STATE_SLEEP:
      LoRaWAN.sleep(loraWanClass);
      break;

    default:
      deviceState = DEVICE_STATE_INIT;
      break;
  }
}
