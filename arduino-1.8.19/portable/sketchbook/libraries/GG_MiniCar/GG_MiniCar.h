#ifndef GG_MiniCar_h
#define GG_MiniCar_h

#if ARDUINO >= 100
	#include "Arduino.h"
#else
	#include "WProgram.h"
#endif

#if defined(ESP32)
	#include "analogWrite.h"
#endif

#define MaxStraightForwardCorrection 127
#define MinStraightForwardCorrection -127
#define DefaultSpeed 128
#define GG_MiniCar_MaxSpeed 254

#define MecanumForward() 		pwmForward()
#define MecanumBackward() 	pwmBackward()
#define MecanumStop() 			pwmStop()
#define	MecanumTurnLeft()		pwmTurnLeftHigh()
#define MecanumTurnRight()	pwmTurnRightHigh()

class DC_Car
{
	public:
		DC_Car(int Left_Pin1,int Left_Pin2,bool Left_Reverse,int Right_Pin1,int Right_Pin2,bool Right_Reverse,bool All_PWM_Pin);
		DC_Car(int LeftFront_Pin1,int LeftFront_Pin2,bool LeftFront_Reverse,
			   int RightFront_Pin1,int RightFront_Pin2,bool RightFront_Reverse,
			   int LeftRear_Pin1,int LeftRear_Pin2,bool LeftRear_Reverse,
			   int RightRear_Pin1,int RightRear_Pin2,bool RightRear_Reverse,
			   bool All_PWM_Pin);
		void pwmDriveFront(int left_forward,int left_backward,int right_forward,int right_backward);
		void pwmDriveRear(int left_forward,int left_backward,int right_forward,int right_backward);
		void pwmDrive(int LeftFront_forward,int LeftFront_backward,
					  int RightFront_forward,int RightFront_backward,
					  int LeftRear_forward,int LeftRear_backward,
					  int RightRear_forward,int RightRear_backward);
		void SetSpeed(int speed);
		void SetStraightAdj(int adj);
		void pwmForward();
		void pwmBackward();
		void pwmTurnLeftLow();
		void pwmTurnLeftHigh();
		void pwmTurnLeftArc(int sDifference);
		void pwmTurnRightLow();
		void pwmTurnRightHigh();
		void pwmTurnRightArc(int sDifference);
		void pwmStop();
		void pwmWait();
//		void MecanumForward();
		void MecanumForwardLeft();
		void MecanumForwardRight();
//		void MecanumBackward();
		void MecanumBackwardLeft();
		void MecanumBackwardRight();
		void MecanumLeft();
		void MecanumRight();
//		void MecanumTurnLeft();
//		void MecanumTurnRight();
		void JoystickDrive(int StickX,int StickY);
		void JoystickMecanumDrive(int StickX,int StickY);
		void SetJoystickMiddle(int MiddleX,int MiddleY,int Radius);
/*
		void Forward();
		void Backward();
		void TurnLeftLow();
		void TurnLeftHigh();
		void TurnRightLow();
		void TurnRightHigh();
		void Stop();
		void Wait();
*/
	private:
		int _Wheel,_LFF_Pin,_LFB_Pin,_RFF_Pin,_RFB_Pin,_LRF_Pin,_LRB_Pin,_RRF_Pin,_RRB_Pin;
		int _rate=DefaultSpeed,_LeftFrontPWM=DefaultSpeed,_RightFrontPWM=DefaultSpeed,_LeftRearPWM=DefaultSpeed,_RightRearPWM=DefaultSpeed;
		int _MaxSetSpeed=GG_MiniCar_MaxSpeed,_MinSetSpeed=0;//直線修正後,可以設定的速率範圍
		int _dc_SFC=0,_Left_SFC=0,_Right_SFC=0; //車子直進校正
		int _JoystickRadius=127,_JoystickMiddleX=128,_JoystickMiddleY=127,_JoystickTurnType=1,_JoystickStep1=0,_JoystickStep2=0;
		bool _CarAllPWMPin=true,_LeftFrontReverse=false, _RightFrontReverse=false,_LeftRearReverse=false, _RightRearReverse=false;

		void pwmBackTurn(bool Dir,int TurnType);		
};

class DC_Motor
{
	public:
	DC_Motor(int in1,int in2,bool isReverse,bool All_PWM_Pin);
	void Drive(bool forward,bool backward);
	void pwmDrive(int forward,int backward);

	private:
	int _MotorIN1,_MotorIN2;
	bool _MotorAllPWMPin=true,_DirReverse=false;
};

class Trace
{
	public:
	Trace(int IrPin);
	bool isDetectWhite();

	private:
	  int _ir_pin;
};

class Avoid
{
	public:
	Avoid(int IrPin);
	bool isDetectAvoid();

	private:
	  int _AvoidIr_pin;
};

#endif