#include "tca5405.h"
#include <esp_idf_version.h>

portMUX_TYPE TCA5405_interrupt_mux = portMUX_INITIALIZER_UNLOCKED;

int8_t TCA5405::transmit()
{
#if ESP_IDF_VERSION_MAJOR >= 4
  taskENTER_CRITICAL(&TCA5405_interrupt_mux);
#elif ESP_IDF_VERSION_MAJOR <= 3
  portENTER_CRITICAL(&TCA5405_interrupt_mux);
#endif

  // 2 cycle square wave for ramp up. low first
  digitalWrite(_pin, LOW);
  TCA5405_TRAN_DELAY;
  digitalWrite(_pin, HIGH);
  TCA5405_TRAN_DELAY;
  digitalWrite(_pin, LOW);
  TCA5405_TRAN_DELAY;
  digitalWrite(_pin, HIGH);
  TCA5405_TRAN_DELAY;

  digitalWrite(_pin, _TCA5405_GET_BIT(_output, 4));
  TCA5405_TRAN_DELAY;
  digitalWrite(_pin, _TCA5405_GET_BIT(_output, 3));
  TCA5405_TRAN_DELAY;
  digitalWrite(_pin, _TCA5405_GET_BIT(_output, 2));
  TCA5405_TRAN_DELAY;
  digitalWrite(_pin, _TCA5405_GET_BIT(_output, 1));
  TCA5405_TRAN_DELAY;
  digitalWrite(_pin, _TCA5405_GET_BIT(_output, 0));
  TCA5405_TRAN_DELAY;
  digitalWrite(_pin, HIGH);
  
#if ESP_IDF_VERSION_MAJOR >= 4
  taskEXIT_CRITICAL(&TCA5405_interrupt_mux);
#elif ESP_IDF_VERSION_MAJOR <= 3
  portEXIT_CRITICAL(&TCA5405_interrupt_mux);
#endif
  
  return 0;
}

int8_t TCA5405::init(uint8_t pin, uint8_t output)
{
  _pin  = pin;
  _output = output;
  pinMode(_pin, OUTPUT);
  digitalWrite(_pin, HIGH);
  return 0;
}

int8_t TCA5405::set_gpo(TCA5405_GPO gpo, int level)
{
  if (gpo >= TCQ5405_GPO_ERR) {
    return -1;
  }
  _TCA5405_CLR_BIT(_output, gpo);
  if (level) {
    _TCA5405_SET_BIT(_output, gpo);
  }

  return 0;
}
