#ifndef GG_VL53L0X_h
#define GG_VL53L0X_h

#if ARDUINO >= 100
	#include "Arduino.h"
#else
	#include "WProgram.h"
#endif

#if defined(ESP32)
	#include "analogWrite.h"
#endif

#include <Wire.h>
#include "VL53L0X.h"

void VL53L0X_SetSHUT(int pin,bool pinvalue);

void VL53L0X_Init(VL53L0X * lox,int Addr,int SHUT);

#endif