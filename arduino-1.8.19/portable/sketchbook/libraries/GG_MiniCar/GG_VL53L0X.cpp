#include "GG_VL53L0X.h"

void VL53L0X_SetSHUT(int pin,bool pinvalue) {
  if (pin>=0) {
    pinMode(pin, OUTPUT);
    digitalWrite(pin,pinvalue);
    delay(10);
  }
}

void VL53L0X_Init(VL53L0X * lox,int Addr,int SHUT) {
	Wire.begin();
  if (SHUT>=0) {
    pinMode(SHUT, OUTPUT);
    digitalWrite(SHUT,HIGH);
  }
  delay(10);
  if (Addr<0) {
		Addr=0x29;
  } else {
    lox->setAddress(Addr);
  }
  lox->setTimeout(500);
  delay(10);
  if (!lox->init()) {
    Serial.print("Failed to detect and initialize sensor @0x");
    Serial.print(Addr,HEX);
    Serial.println(" !");
  }
  delay(10);
}
