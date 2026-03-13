#ifndef _TCA5405_H_
#define _TCA5405_H_
#include <Arduino.h>

#define TCA5405_DEFAULT_OUTPUT      0b00011111
#define TCA5405_DEFAULT_CYCLE       34 //for in range 34 NOP equals 1us
#define TCA5405_TRAN_DELAY          for(int i=0;i<_cycle;i++){NOP();}
// #define TCA5405_TRAN_DELAY          delayMicroseconds(2)

typedef enum {
  TCQ5405_Q0=0,
  TCQ5405_Q1,
  TCQ5405_Q2,
  TCQ5405_Q3,
  TCQ5405_Q4,
  TCQ5405_GPO_ERR
} TCA5405_GPO;

#define PIXELBIT_TFT_BACKLIGHT    TCQ5405_Q0
#define PIXELBIT_TFT_CHIPSELECT   TCQ5405_Q1
#define PIXELBIT_328P_RESET       TCQ5405_Q2
#define PIXELBIT_STATUS_LED       TCQ5405_Q3
#define PIXELBIT_CAMERA_POWER     TCQ5405_Q4
#define PIXELBIT_TCA5405_INPUT    21

#define _TCA5405_SET_BIT(x, n)    ( (x) |= (1UL << n))
#define _TCA5405_CLR_BIT(x, n)    ( (x) &= ~(1UL << n))
#define _TCA5405_GET_BIT(x, n)    ((x >> n) & 1U)


class TCA5405 {
private:
  // output level for Q0~Q4, LSB first
  uint8_t   _output = TCA5405_DEFAULT_OUTPUT;
  // delay cycle
  uint8_t   _cycle = TCA5405_DEFAULT_CYCLE;
  // TCA5405 input pin
  uint8_t   _pin = PIXELBIT_TCA5405_INPUT;
public:
  int8_t    init(uint8_t pin = PIXELBIT_TCA5405_INPUT, uint8_t output = TCA5405_DEFAULT_OUTPUT);
  int8_t    set_gpo(TCA5405_GPO gpo, int level);
  int8_t    transmit();
};

#endif  //_TCA5405_H_
