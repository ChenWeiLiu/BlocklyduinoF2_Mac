#include "GG_US.h"

long US_Time_Out=Max_US_Range;

int US_Measure_Unit=unitMM;

void Set_US_Measure_Unit(int unit)
{
	US_Measure_Unit=unit;
}

void Set_US_Time_Out(int MaxRange)
{
	US_Time_Out=MaxRange*58.8235294117647;
}

float US_Measure(int Trig, int Echo)
{
	unsigned long duration,distance;
  pinMode(Trig,OUTPUT);
  digitalWrite(Trig, LOW);
  delayMicroseconds(2);
  digitalWrite(Trig, HIGH);
  delayMicroseconds(10);
  digitalWrite(Trig, LOW);
  pinMode(Echo,INPUT);
  duration = pulseIn(Echo,HIGH,US_Time_Out);
  if ( duration == 0 ) {
		return -1;
  } if ( duration == US_Time_Out ) {
		return 9999;
  } else {
		// distance=duration/5.88235294117647;
		distance=duration*17;
		if (US_Measure_Unit==unitMM) {	//公厘
			return distance/100;
		} else if (US_Measure_Unit==unitCM) {	//公分
		return (float) distance/1000;
		} else {													//英吋
		return (float) distance/2540;
		}
	}
}

Ultrasonic::Ultrasonic(int Trig, int Echo)
{
  this->Trig_pin=Trig;
  this->Echo_pin=Echo;
}

float Ultrasonic::Measure()
{
	return US_Measure(this->Trig_pin,this->Echo_pin);
}
