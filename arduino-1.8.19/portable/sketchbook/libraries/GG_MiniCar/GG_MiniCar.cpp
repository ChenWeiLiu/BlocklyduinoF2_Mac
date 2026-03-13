#include "GG_MiniCar.h"

//以下為四驅車 =======================================================================
DC_Car::DC_Car(int LeftFront_Pin1,int LeftFront_Pin2,bool LeftFront_Reverse,int RightFront_Pin1,int RightFront_Pin2,bool RightFront_Reverse,int LeftRear_Pin1,int LeftRear_Pin2,bool LeftRear_Reverse,int RightRear_Pin1,int RightRear_Pin2,bool RightRear_Reverse,bool All_PWM_Pin) {
	this->_CarAllPWMPin=All_PWM_Pin;
//以下左前輪 =========================================================================
	this->_LeftFrontReverse=LeftFront_Reverse;
	if (this->_LeftFrontReverse && this->_CarAllPWMPin) {
		this->_LFF_Pin=LeftFront_Pin2;
		this->_LFB_Pin=LeftFront_Pin1;
	} else {
		this->_LFF_Pin=LeftFront_Pin1;
		this->_LFB_Pin=LeftFront_Pin2;
	}
//以下右前輪 =========================================================================
	this->_RightFrontReverse=RightFront_Reverse;
	if (_RightFrontReverse && this->_CarAllPWMPin) {
		this->_RFF_Pin=RightFront_Pin2;
		this->_RFB_Pin=RightFront_Pin1;
	} else {
		this->_RFF_Pin=RightFront_Pin1;
		this->_RFB_Pin=RightFront_Pin2;
	}
//以下左後輪 =========================================================================
	this->_LeftRearReverse=LeftRear_Reverse;
	if (this->_LeftRearReverse && this->_CarAllPWMPin) {
		this->_LRF_Pin=LeftRear_Pin2;
		this->_LRB_Pin=LeftRear_Pin1;
	} else {
		this->_LRF_Pin=LeftRear_Pin1;
		this->_LRB_Pin=LeftRear_Pin2;
	}
//以下右後輪 =========================================================================
	this->_RightRearReverse=RightRear_Reverse;
	if (_RightRearReverse && this->_CarAllPWMPin) {
		this->_RRF_Pin=RightRear_Pin2;
		this->_RRB_Pin=RightRear_Pin1;
	} else {
		this->_RRF_Pin=RightRear_Pin1;
		this->_RRB_Pin=RightRear_Pin2;
	}
//以下基礎參數 =======================================================================
  this->_rate=DefaultSpeed;
  this->_dc_SFC=0;
  this->_Left_SFC=0;
  this->_Right_SFC=0;
  this->_LeftFrontPWM=DefaultSpeed;
  this->_RightFrontPWM=DefaultSpeed;
  this->_LeftRearPWM=DefaultSpeed;
  this->_RightRearPWM=DefaultSpeed;
	this->_MaxSetSpeed=GG_MiniCar_MaxSpeed;
	this->_MinSetSpeed=0;
	if ((LeftFront_Pin1<0) && (LeftFront_Pin2<0) && (RightFront_Pin1<0) && (RightFront_Pin2<0)){
		this->_Wheel=2;
	} else {
		this->_Wheel=4;
	}
}

DC_Car::DC_Car(int Left_Pin1,int Left_Pin2,bool Left_Reverse,int Right_Pin1,int Right_Pin2,bool Right_Reverse,bool All_PWM_Pin) {
	DC_Car(0,0,false,0,0,false,Left_Pin1,Left_Pin2,Left_Reverse,Right_Pin1,Right_Pin2,Right_Reverse,All_PWM_Pin);
}

void DC_Car::pwmDriveFront(int left_forward,int left_backward,int right_forward,int right_backward) {
//以下左前輪 =========================================================================
	if (this->_CarAllPWMPin) {
		analogWrite(this->_LFF_Pin,left_forward);
	} else {
		pinMode(this->_LFF_Pin,OUTPUT);
	  digitalWrite(this->_LFF_Pin,this->_LeftFrontReverse ? !left_forward : left_forward);
	}
  analogWrite(this->_LFB_Pin,left_backward);
#if defined(ESP32)
	vTaskDelay(10);
#else
	delay(1);
#endif
//以下右前輪 =========================================================================
	if (this->_CarAllPWMPin) {
		analogWrite(this->_RFF_Pin,right_forward);
	} else {
		pinMode(this->_RFF_Pin,OUTPUT);
	  digitalWrite(this->_RFF_Pin,_RightFrontReverse ? !right_forward : right_forward);
	}
  analogWrite(this->_RFB_Pin,right_backward);
#if defined(ESP32)
	vTaskDelay(10);
#else
	delay(1);
#endif
}

void DC_Car::pwmDriveRear(int left_forward,int left_backward,int right_forward,int right_backward) {
//以下左前輪 =========================================================================
	if (this->_CarAllPWMPin) {
		analogWrite(this->_LRF_Pin,left_forward);
	} else {
		pinMode(this->_LRF_Pin,OUTPUT);
	  digitalWrite(this->_LRF_Pin,this->_LeftRearReverse ? !left_forward : left_forward);
	}
  analogWrite(this->_LRB_Pin,left_backward);
#if defined(ESP32)
	vTaskDelay(10);
#else
	delay(1);
#endif
//以下右前輪 =========================================================================
	if (this->_CarAllPWMPin) {
		analogWrite(this->_RRF_Pin,right_forward);
	} else {
		pinMode(this->_RFF_Pin,OUTPUT);
	  digitalWrite(this->_RRF_Pin,_RightRearReverse ? !right_forward : right_forward);
	}
  analogWrite(this->_RRB_Pin,right_backward);
#if defined(ESP32)
	vTaskDelay(10);
#else
	delay(1);
#endif
}

void DC_Car::pwmDrive(int LF_forward,int LF_backward,int RF_forward,int RF_backward,int LR_forward,int LR_backward,int RR_forward,int RR_backward) {
	this->pwmDriveRear(LR_forward,LR_backward,RR_forward,RR_backward);
	if (this->_Wheel==4) this->pwmDriveFront(LF_forward,LF_backward,RF_forward,RF_backward);
}

void DC_Car::SetSpeed(int speed) {
	if (speed<this->_MinSetSpeed) {	//小於最小值
		this->_rate=this->_MinSetSpeed;
		Serial.print("Error! Change speed to Minimum Speed=");
		Serial.println(this->_MinSetSpeed);
	} else if (speed>this->_MaxSetSpeed) {	//大於最大值
		this->_rate=this->_MaxSetSpeed;		
		Serial.print("Error! Change speed to maximum Speed=");
		Serial.println(_MaxSetSpeed);
	} else {
		this->_rate=speed;
	}
	if (this->_Wheel==4) {	
		this->_LeftFrontPWM=this->_rate+this->_Left_SFC;	//左輪速率=設定速率+左輪直線修正值
		this->_RightFrontPWM=this->_rate-this->_Right_SFC;	//右輪速率=設定速率-右輪直線修正值
	}
	this->_LeftRearPWM=this->_rate+this->_Left_SFC;	//左輪速率=設定速率+左輪直線修正值
	this->_RightRearPWM=this->_rate-this->_Right_SFC;	//右輪速率=設定速率-右輪直線修正值
}

void DC_Car::SetStraightAdj(int adj) {
	int reminder;
	if (adj>MaxStraightForwardCorrection) {	//比最大值大
		this->_dc_SFC=MaxStraightForwardCorrection;
	} else if (adj<MinStraightForwardCorrection) {	//比最小值小
		this->_dc_SFC=MinStraightForwardCorrection;
	} else {
		this->_dc_SFC=adj;
	}
	reminder=this->_dc_SFC % 2;
	this->_Right_SFC=this->_dc_SFC / 2.0;	//左輪調整一半
	this->_Left_SFC=this->_Right_SFC+reminder;	//右輪調整一半+一半的餘數
	this->_rate=DefaultSpeed;	//速率設為預設值
	this->_MaxSetSpeed=GG_MiniCar_MaxSpeed-abs(this->_Right_SFC);	//可設定的最大速率
	this->_MinSetSpeed=abs(this->_Right_SFC);	//可設定的最小速率
	if (this->_Wheel==4) {		
		this->_LeftFrontPWM=this->_rate+this->_Left_SFC;	//左輪速率=設定速率+左輪直線修正值
		this->_RightFrontPWM=this->_rate-this->_Right_SFC;	//右輪速率=設定速率-右輪直線修正值
	}
	this->_LeftRearPWM=this->_rate+this->_Left_SFC;	//左輪速率=設定速率+左輪直線修正值
	this->_RightRearPWM=this->_rate-this->_Right_SFC;	//右輪速率=設定速率-右輪直線修正值
}

void DC_Car::pwmForward() {
	if (this->_CarAllPWMPin) {
		pwmDrive(this->_LeftFrontPWM,0,this->_RightFrontPWM,0,this->_LeftRearPWM,0,this->_RightRearPWM,0);
	} else {
		pwmDrive(HIGH,this->_LeftFrontPWM,HIGH,this->_RightFrontPWM,HIGH,this->_LeftRearPWM,HIGH,this->_RightRearPWM);
	}
}

void DC_Car::pwmBackward() {
	if (this->_CarAllPWMPin) {
		pwmDrive(0,this->_LeftFrontPWM,0,this->_RightFrontPWM,0,this->_LeftRearPWM,0,this->_RightRearPWM);
	} else {
		pwmDrive(LOW,this->_LeftFrontPWM,LOW,this->_RightFrontPWM,LOW,this->_LeftRearPWM,LOW,this->_RightRearPWM);
	}
}

void DC_Car::pwmTurnLeftLow() {
	if (this->_CarAllPWMPin) {
		pwmDrive(0,0,this->_RightFrontPWM,0,0,0,this->_RightRearPWM,0);
	} else {
		pwmDrive(HIGH,0,HIGH,this->_RightFrontPWM,HIGH,0,HIGH,this->_RightRearPWM);
	}
}

void DC_Car::pwmTurnLeftHigh() {
	if (this->_CarAllPWMPin) {
		pwmDrive(0,this->_LeftFrontPWM,this->_RightFrontPWM,0,0,this->_LeftRearPWM,this->_RightRearPWM,0);
	} else {
		pwmDrive(LOW,this->_LeftFrontPWM,HIGH,this->_RightFrontPWM,LOW,this->_LeftRearPWM,HIGH,this->_RightRearPWM);
	}
}

void DC_Car::pwmTurnLeftArc(int sDifference) {
	int FrontDiff,RearDiff;
	if (sDifference<this->_LeftFrontPWM) {
		FrontDiff=sDifference;
	} else {
		FrontDiff=this->_LeftFrontPWM;
	}
	if (sDifference<this->_LeftRearPWM) {
		RearDiff=sDifference;
	} else {
		RearDiff=this->_LeftRearPWM;
	}
	if (this->_CarAllPWMPin) {
		pwmDrive(this->_LeftFrontPWM-FrontDiff,0,this->_RightFrontPWM,0,this->_LeftRearPWM-RearDiff,0,this->_RightRearPWM,0);
	} else {
		pwmDrive(HIGH,this->_LeftFrontPWM-FrontDiff,HIGH,this->_RightFrontPWM,HIGH,this->_LeftRearPWM-RearDiff,HIGH,this->_RightRearPWM);
	}
}

void DC_Car::pwmTurnRightLow() {
	if (this->_CarAllPWMPin) {
		pwmDrive(this->_LeftFrontPWM,0,0,0,this->_LeftRearPWM,0,0,0);
	} else {
		pwmDrive(HIGH,this->_LeftFrontPWM,HIGH,0,HIGH,this->_LeftRearPWM,HIGH,0);
	}
}

void DC_Car::pwmTurnRightHigh() {
	if (this->_CarAllPWMPin) {
		pwmDrive(this->_LeftFrontPWM,0,0,this->_RightFrontPWM,this->_LeftRearPWM,0,0,this->_RightRearPWM);
	} else {
		pwmDrive(HIGH,this->_LeftFrontPWM,LOW,this->_RightFrontPWM,HIGH,this->_LeftRearPWM,LOW,this->_RightRearPWM);
	}
}

void DC_Car::pwmTurnRightArc(int sDifference) {
	int FrontDiff,RearDiff;
	if (sDifference<this->_RightFrontPWM) {
		FrontDiff=sDifference;
	} else {
		FrontDiff=this->_RightFrontPWM;
	}
	if (sDifference<this->_RightRearPWM) {
		RearDiff=sDifference;
	} else {
		RearDiff=this->_RightRearPWM;
	}
	if (this->_CarAllPWMPin) {
		pwmDrive(this->_LeftFrontPWM,0,this->_RightFrontPWM-FrontDiff,0,this->_LeftRearPWM,0,this->_RightRearPWM-RearDiff,0);
	} else {
		pwmDrive(HIGH,this->_LeftFrontPWM,HIGH,this->_RightFrontPWM-FrontDiff,HIGH,this->_LeftRearPWM,HIGH,this->_RightRearPWM-RearDiff);
	}
}

void DC_Car::pwmStop() {
  pwmDrive(0,0,0,0,0,0,0,0);
}

void DC_Car::pwmWait() {
	if (this->_CarAllPWMPin) {
		pwmDrive(GG_MiniCar_MaxSpeed,GG_MiniCar_MaxSpeed,GG_MiniCar_MaxSpeed,GG_MiniCar_MaxSpeed,GG_MiniCar_MaxSpeed,GG_MiniCar_MaxSpeed,GG_MiniCar_MaxSpeed,GG_MiniCar_MaxSpeed);
	} else {
		pwmDrive(HIGH,0,HIGH,0,HIGH,0,HIGH,0);
	}
}

void DC_Car::SetJoystickMiddle(int MiddleX,int MiddleY,int Radius) {
	this->_JoystickMiddleX=MiddleX;
	this->_JoystickMiddleY=MiddleY;
	this->_JoystickRadius=Radius;
	this->_JoystickRadius=Radius;
	this->_JoystickTurnType=0;
	this->_JoystickStep1=Radius*0.4;  //30度 0.500 35度 0.573 40度0.642
	this->_JoystickStep2=Radius*0.8;	//60度 0.866 55度 0.819 50度0.766
}

void DC_Car::pwmBackTurn(bool Dir,int TurnType) {
	if (this->_CarAllPWMPin) {
		if (Dir) {	//左轉
			if (TurnType==1) {				//原地轉
			  pwmDrive(0,this->_LeftFrontPWM,0,0,0,this->_LeftRearPWM ,0,0 );
			} else if (TurnType==2) {	//小角度轉
			  pwmDrive(0,this->_LeftFrontPWM,this->_RightFrontPWM,0,0,this->_LeftRearPWM ,this->_RightRearPWM ,0);
			}
		} else {				//右轉
			if (TurnType==1) {				//原地轉
			  pwmDrive(0,0,0,this->_RightFrontPWM,0,0,0,this->_RightRearPWM  );
			} else if (TurnType==2) {	//小角度轉
			  pwmDrive(this->_LeftFrontPWM,0,0,this->_RightFrontPWM,this->_LeftRearPWM ,0,0,this->_RightRearPWM );
			}
		}
	} else {
		if (Dir) {	//左轉
			if (TurnType==1) {				//原地轉
				pwmDrive(0,this->_LeftFrontPWM,1,0,
				         0,this->_LeftRearPWM ,1,0);
			} else if (TurnType==2) {	//小角度轉
				pwmDrive(0,this->_LeftFrontPWM,1,this->_RightFrontPWM,0,this->_LeftRearPWM,1,this->_RightRearPWM);
			}
		} else {				//右轉
			if (TurnType==1) {				//原地轉
				pwmDrive(1,0,0,this->_RightFrontPWM,1,0,0,this->_RightRearPWM);
			} else if (TurnType==2) {	//小角度轉
				pwmDrive(1,this->_LeftFrontPWM,0,this->_RightFrontPWM,1,this->_LeftRearPWM,0,this->_RightRearPWM);
			}
		}
	}
}

void DC_Car::JoystickDrive(int StickX,int StickY) {
	int DirX,DirY,Dist,Cmd,Full,Half;
	float PWMRatio,TurnRatio;

	DirY=this->_JoystickMiddleY-StickY;	//上->下，>0為上,上=0,下=255
	DirX=this->_JoystickMiddleX-StickX;	//左->右，>0為左,左=0,右=255
	Dist=abs(DirX);
	if (Dist>this->_JoystickStep2) {
		Cmd=2;
	} else if (Dist>this->_JoystickStep1) {
		Cmd=1;
	} else {
		Cmd=0;
	}
	Dist=abs(DirY);
	if (Dist>this->_JoystickStep2) {
		Cmd+=20;
	} else if (Dist>this->_JoystickStep1) {
		Cmd+=10;
	}
	Full=this->_rate;
	Half=60+(Full-60)/2;
	switch (Cmd) {
  case 1:
		// 半速小角度轉
		SetSpeed(Half);
		if (DirY>0) { 	//前進
			if (DirX>0) {				//左轉
				pwmTurnLeftHigh();
			} else {						//右轉
				pwmTurnRightHigh();
			}
		} else {				//後退
			pwmBackTurn(DirX>0,2);
		}
		SetSpeed(Full);
    break;
  case 2:
    // 全速小角度轉
		if (DirY>0) { 	//前進
			if (DirX>0) {				//左轉
				pwmTurnLeftHigh();
			} else {						//右轉
				pwmTurnRightHigh();
			}
		} else {				//後退
			pwmBackTurn(DirX>0,2);
		}
    break;
  case 10:
    // 半速前進、後退
		SetSpeed(Half);
	  if (DirY>0) {	//前進
			pwmForward();
		} else {	//後退
			pwmBackward();
		}
		SetSpeed(Full);
    break;
  case 11:
  case 12:
  case 21:
  case 22:
    // 原地轉
		if (DirY>0) {
			if (DirX>0) {	//前進原地左轉
				pwmTurnLeftLow();
			} else {			//前進原地右轉
				pwmTurnRightLow();
			}
		} else {
			if (DirX>0) { //後退原地左轉
				pwmBackTurn(DirX>0,1);
			} else {			//後退原地右轉
				pwmBackTurn(DirX>0,1);
			}
		}
    break;
  case 20:
    // 全速前進、後退
	  if (DirY>0) {	//前進
			pwmForward();
		} else {	//後退
			pwmBackward();
		}
    break;
  default:
    // 停止
		pwmStop();
    break;
	}
}

void DC_Car::MecanumForwardLeft() {
	if (this->_CarAllPWMPin) {
		pwmDrive(0,0,this->_RightFrontPWM,0,this->_LeftRearPWM,0,0,0);
	} else {
		pwmDrive(LOW,0,HIGH,this->_RightFrontPWM,HIGH,this->_LeftRearPWM,LOW,0);
	}
}

void DC_Car::MecanumForwardRight() {
	if (this->_CarAllPWMPin) {
		pwmDrive(this->_LeftFrontPWM,0,0,0,0,0,this->_RightRearPWM,0);
	} else {
		pwmDrive(HIGH,this->_LeftFrontPWM,LOW,0,LOW,0,HIGH,this->_RightRearPWM);
	}
}

void DC_Car::MecanumBackwardLeft() {
	if (this->_CarAllPWMPin) {
		pwmDrive(0,this->_LeftFrontPWM,0,0,0,0,0,this->_RightRearPWM);
	} else {
		pwmDrive(LOW,this->_LeftFrontPWM,LOW,0,LOW,0,LOW,this->_RightRearPWM);
	}
}

void DC_Car::MecanumBackwardRight() {
	if (this->_CarAllPWMPin) {
		pwmDrive(0,0,0,this->_RightFrontPWM,0,this->_LeftRearPWM,0,0);
	} else {
		pwmDrive(LOW,0,LOW,this->_RightFrontPWM,LOW,this->_LeftRearPWM,LOW,0);
	}
}

void DC_Car::MecanumLeft() {
	if (this->_CarAllPWMPin) {
		pwmDrive(0,this->_LeftFrontPWM,this->_RightFrontPWM,0,this->_LeftRearPWM,0,0,this->_RightRearPWM);
	} else {
		pwmDrive(LOW,this->_LeftFrontPWM,HIGH,this->_RightFrontPWM,HIGH,this->_LeftRearPWM,LOW,this->_RightRearPWM);
	}
}

void DC_Car::MecanumRight() {
	if (this->_CarAllPWMPin) {
		pwmDrive(this->_LeftFrontPWM,0,0,this->_RightFrontPWM,0,this->_LeftRearPWM,this->_RightRearPWM,0);
	} else {
		pwmDrive(HIGH,this->_LeftFrontPWM,LOW,this->_RightFrontPWM,LOW,this->_LeftRearPWM,HIGH,this->_RightRearPWM);
	}
}

void DC_Car::JoystickMecanumDrive(int StickX,int StickY) {
	int DirX,DirY,Dist,Cmd,Full,Half;
	float PWMRatio,TurnRatio;

	DirY=this->_JoystickMiddleY-StickY;	//上->下，>0為上,上=0,下=255
	DirX=this->_JoystickMiddleX-StickX;	//左->右，>0為左,左=0,右=255
	Dist=abs(DirX);
	if (Dist>this->_JoystickStep2) {
		Cmd=2;
	} else if (Dist>this->_JoystickStep1) {
		Cmd=1;
	} else {
		Cmd=0;
	}
	Dist=abs(DirY);
	if (Dist>this->_JoystickStep2) {
		Cmd+=20;
	} else if (Dist>this->_JoystickStep1) {
		Cmd+=10;
	}
	Full=this->_rate;
	Half=60+(Full-60)/2;
	switch (Cmd) {
  case 1:
    // 半速左右移
		SetSpeed(Half);
		if (DirX>0) {	//左移
			MecanumLeft();
		} else {			//右移
			MecanumRight();
		}
		SetSpeed(Full);
    break;
  case 2:
    // 全速左右移
		if (DirX>0) {	//左移
			MecanumLeft();
		} else {	//右移
			MecanumRight();
		}
    break;
  case 10:
    // 半速前進、後退
		SetSpeed(Half);
	  if (DirY>0) {	//前進
			pwmForward();
		} else {			//後退
			pwmBackward();
		}
		SetSpeed(Full);
    break;
  case 11:
  case 12:
  case 21:
  case 22:
    // 斜向前進、後退
		if (DirY>0) {
			if (DirX>0) { //前左
				MecanumForwardLeft();
			} else {			//前右
				MecanumForwardRight();
			}
		} else {
			if (DirX>0) { //後左
				MecanumBackwardLeft();
			} else {			//後右
				MecanumBackwardRight();
			}
		}
    break;
  case 20:
    // 全速前進、後退
	  if (DirY>0) {	//前進
			pwmForward();
		} else {	//後退
			pwmBackward();
		}
    break;
  default:
    // 停止
		pwmStop();
    break;
	}
}
/*
void DC_Car::MecanumTurnLeft() {
	if (this->_CarAllPWMPin) {
		pwmDrive(0,this->_LeftFrontPWM,this->_RightFrontPWM,0,0,this->_LeftRearPWM,this->_RightRearPWM,0);
	} else {
		pwmDrive(LOW,this->_LeftFrontPWM,HIGH,this->_RightFrontPWM,LOW,this->_LeftRearPWM,HIGH,this->_RightRearPWM);
	}
}

void DC_Car::MecanumTurnRight() {
	if (this->_CarAllPWMPin) {
		pwmDrive(this->_LeftFrontPWM,0,0,this->_RightFrontPWM,this->_LeftRearPWM,0,0,this->_RightRearPWM);
	} else {
		pwmDrive(HIGH,this->_LeftFrontPWM,LOW,this->_RightFrontPWM,HIGH,this->_LeftRearPWM,LOW,this->_RightRearPWM);
	}
}

void DC_Car::Drive(bool left_forward,bool left_backward,bool right_forward,bool right_backward) {
//以下左輪 =========================================================================
  pinMode(this->_LF_Pin,OUTPUT);
	if (this->_CarAllPWMPin) {
	  digitalWrite(this->_LF_Pin,left_forward);
	} else {
	  digitalWrite(this->_LF_Pin,this->_LeftReverse ? !left_forward : left_forward);
	}
  pinMode(this->_LB_Pin,OUTPUT);
  digitalWrite(this->_LB_Pin,left_backward);
//以下右輪 =========================================================================
  pinMode(this->_RF_Pin,OUTPUT);
	if (this->_CarAllPWMPin) {
	  digitalWrite(this->_RF_Pin,right_forward);
	} else {
	  digitalWrite(this->_RF_Pin,_RightReverse ? !right_forward : right_forward);
	}
  pinMode(this->_RB_Pin,OUTPUT);
  digitalWrite(this->_RB_Pin,right_backward);
}

void DC_Car::Forward() {
	if (this->_CarAllPWMPin) {
		Drive(HIGH,LOW,HIGH,LOW);
	} else {
		Drive(HIGH,HIGH,HIGH,HIGH);
	}
}

void DC_Car::Backward() {
	Drive(LOW,HIGH,LOW,HIGH);
}

void DC_Car::TurnLeftLow() {
	if (this->_CarAllPWMPin) {
		Drive(LOW,LOW,HIGH,LOW);
	} else {
		Drive(LOW,LOW,HIGH,HIGH);
	}
}

void DC_Car::TurnLeftHigh() {
	if (this->_CarAllPWMPin) {
		Drive(LOW,HIGH,HIGH,LOW);
	} else {
		Drive(LOW,HIGH,HIGH,HIGH);
	}
}

void DC_Car::TurnRightLow() {
	Drive(HIGH,LOW,LOW,LOW);
}

void DC_Car::TurnRightHigh() {
	Drive(HIGH,LOW,LOW,HIGH);
}

void DC_Car::Stop() {
	Drive(LOW,LOW,LOW,LOW);
}

void DC_Car::Wait() {
	if (this->_CarAllPWMPin) {
		Drive(HIGH,HIGH,HIGH,HIGH);
	} else {
		Drive(HIGH,LOW,HIGH,LOW);
	}
}
*/
//==============================================================================
DC_Motor::DC_Motor(int in1,int in2,bool isReverse,bool All_PWM_Pin) {
	this->_DirReverse=isReverse;
	this->_MotorAllPWMPin=All_PWM_Pin;
	if (isReverse && this->_MotorAllPWMPin) {
		this->_MotorIN1=in2;
		this->_MotorIN2=in1;
	} else {
		this->_MotorIN1=in1;
		this->_MotorIN2=in2;
	}
}
void DC_Motor::Drive(bool forward,bool backward) {
  pinMode(this->_MotorIN1,OUTPUT);
	if (this->_MotorAllPWMPin) {
	  digitalWrite(this->_MotorIN1,forward);
	} else {
	  digitalWrite(this->_MotorIN1,this->_DirReverse ? !forward : forward);
	}
  pinMode(this->_MotorIN2,OUTPUT);
  digitalWrite(this->_MotorIN2,backward);
}

void DC_Motor::pwmDrive(int forward,int backward) {
	if (this->_MotorAllPWMPin) {
		analogWrite(this->_MotorIN1,forward);
	} else {
		pinMode(this->_MotorIN1,OUTPUT);
	  digitalWrite(this->_MotorIN1,this->_DirReverse ? !forward : forward);
	}
  analogWrite(this->_MotorIN2,backward);
}
//==============================================================================
Trace::Trace(int IrPin) {
  this->_ir_pin=IrPin;
}

bool Trace::isDetectWhite() {
  pinMode(this->_ir_pin,INPUT);
  return digitalRead(this->_ir_pin);
}
//==============================================================================
Avoid::Avoid(int IrPin) {
  this->_AvoidIr_pin=IrPin;
}

bool Avoid::isDetectAvoid() {
  pinMode(this->_AvoidIr_pin,INPUT);
  return digitalRead(this->_AvoidIr_pin);
}
