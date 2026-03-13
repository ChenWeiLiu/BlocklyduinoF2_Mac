#ifndef _TCA5405_H
#define _TCA5405_H
#include <Arduino.h>

#define _TCA5405_TRAN_DELAY_NUM 34 //for in range 34 NOP equals 1us
#define _TCA5405_TRAN_PIN 21 //GPIO33 is TCA5405 Din

#define _TCA5405_TRAN_DELAY for(int i=0;i<_TCA5405_TRAN_DELAY_NUM;i++){NOP();}

void TCA5405_init(int pin = _TCA5405_TRAN_PIN);
void TCA5405_tran(int pin = _TCA5405_TRAN_PIN);
void TCA5405_campwr_set(void);
void TCA5405_campwr_clr(void);
void TCA5405_state_toggle(void);
void TCA5405_state_set(void);
void TCA5405_state_clr(void);
void TCA5405_unorst_set(void);
void TCA5405_unorst_clr(void);
void TCA5405_lcdcs_set(void);
void TCA5405_lcdcs_clr(void);
void TCA5405_lcdbl_set(void);
void TCA5405_lcdbl_clr(void);
#endif