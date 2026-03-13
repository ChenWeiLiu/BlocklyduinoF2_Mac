#include "SharpIR.h"

//==============================================================================
//GP2Y0A51SK0F(  2-15cm)
//GP2Y0A41SK0F(  4-30cm)
//GP2Y0A21Y   ( 10- 80cm)
//GP2Y0A60SZLF( 10-150cm)
//GP2Y0A02YK0F( 20-150cm)
//GP2Y0A710K0F(100-550cm)
SharpIR::SharpIR(int Model,int irPin) {
  _irPin=irPin;
  _Model=Model;
  pinMode(_irPin, INPUT);
#if defined(ESP32)
	_VoltCoefficient=0.0008056641;	//3.3/4096
#elif defined(ARDUINO_linkit_7697)
	_VoltCoefficient=0.0006103516;	//2.5/4096
#else
	_VoltCoefficient=0.0048828125;	//5/1024
#endif
  switch (_Model) {
  case 1:	//GP2Y0A51SK0F 1	(  2-15cm)
    _MinIR=2;
    _MaxIR=15;
#if defined(ESP32)
	_DistanceCoefficient=1;
#elif defined(ARDUINO_linkit_7697)
	_DistanceCoefficient=2;
#else
	_DistanceCoefficient=3;
#endif
    break;
  case 2:	//GP2Y0A41SK0F 2	(  4-30cm)
    _MinIR=4;
    _MaxIR=30;
    break;
  case 3:	//GP2Y0A21YK0F 3 	( 10- 80cm)
    _MinIR=10;
    _MaxIR=80;
    break;
  case 4:	//GP2Y0A60SZLF 4	( 10-150cm)
    _MinIR=10;
    _MaxIR=150;
    break;
  case 5:	//GP2Y0A02YK0F 5	( 20-150cm)  
    _MinIR=20;
    _MaxIR=150;
    break;
  case 6:	//GP2Y0A710K0F 6	(100-550cm)
    _MinIR=100;
    _MaxIR=550;
    break;
  default:
    _MinIR=-1;
    _MaxIR=9999;
    break;
  }
}
//Sharp GP2Y0A21YK 10cm-80cm
float SharpIR::Measure() {
  int rawVolts;
  float	volts,distance;

  rawVolts=analogRead(_irPin);
  switch (_Model) {
  case 1:	//GP2Y0A51SK0F 1	(  2-15cm)
    distance=-1;
    break;
  case 2:	//GP2Y0A41SK0F 2	(  4-30cm)
    volts = rawVolts*_VoltCoefficient;  	// value from sensor * (5/1024)
    distance = 13*pow(volts, -1); 					// worked out from datasheet graph
    break;
  case 3:	//GP2Y0A21YK0F 3 	( 10- 80cm)
    volts = rawVolts*_VoltCoefficient;   // value from sensor * (5/1024) - if running 3.3.volts then change 5 to 3.3
    distance = 65*pow(volts, -1.10);          // worked out from graph 65 = theretical distance / (1/Volts)S 
    break;
  case 4:	//GP2Y0A60SZLF 4	( 10-150cm)
    distance=-1;
    break;
  case 5:	//GP2Y0A02YK0F 5	( 20-150cm)  
    distance = 10650.08 * pow(rawVolts,-0.935) - 10;
    break;
  case 6:	//GP2Y0A710K0F 6	(100-550cm)
    distance=-1;
    break;
  default:
    distance=-1;
    break;
  }
  if ((distance<_MinIR) && (distance!=-1)) {
    distance=0;
  } else if (distance>_MaxIR) {
    distance=9999;
  }
  return distance;
}