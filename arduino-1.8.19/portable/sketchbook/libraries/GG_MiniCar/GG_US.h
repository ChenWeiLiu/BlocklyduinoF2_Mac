#ifndef GG_US_h
#define GG_US_h

#if ARDUINO >= 100
	#include "Arduino.h"
#else
	#include "WProgram.h"
#endif

#if defined(ESP32)
	#include "analogWrite.h"
#endif

#ifndef Max_US_Range
#define Max_US_Range 24000;  // 23200 µs = 400cm
#endif

#define unitINC 0
#define unitCM  1
#define unitMM  2

float US_Measure(int Trig, int Echo);

void Set_US_Measure_Unit(int unit);

void Set_US_Time_Out(int MaxRange);

class Ultrasonic
{
	public:
		Ultrasonic(int Trig, int Echo);
		float Measure();

	private:
		int Trig_pin,Echo_pin;
};

#endif