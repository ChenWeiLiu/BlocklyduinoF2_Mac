#ifndef SharpIR_h
#define SharpIR_h

#if ARDUINO >= 100
	#include "Arduino.h"
#else
	#include "WProgram.h"
#endif

#if defined(ESP32)
	#include "analogWrite.h"
#endif

#define GP2Y0A51SK0F 1	//(  2-15cm)
#define GP2Y0A41SK0F 2	//(  4-30cm)
#define GP2Y0A21YK0F 3 	//( 10- 80cm)
#define GP2Y0A60SZLF 4	//( 10-150cm)
#define GP2Y0A02YK0F 5	//( 20-150cm)
#define GP2Y0A710K0F 6	//(100-550cm)

class SharpIR
{
	public:
		SharpIR(int Model, int irPin);
		float Measure();

	private:
		int _Model,_irPin,_MaxIR,_MinIR;
		float _VoltCoefficient,_DistanceCoefficient;
};

#endif