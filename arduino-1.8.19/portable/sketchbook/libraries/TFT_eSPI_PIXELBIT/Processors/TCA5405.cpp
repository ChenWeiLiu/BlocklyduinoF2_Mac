

portMUX_TYPE tca5405_tftespi_mux = portMUX_INITIALIZER_UNLOCKED;
bool TCA5405_pins[5] = {1,1,1,1,1};

void TCA5405_init(int pin){
  pinMode(pin,OUTPUT);
  digitalWrite(pin,1);
}

void TCA5405_tran(int pin){
#if ESP_IDF_VERSION_MAJOR >= 4
  taskENTER_CRITICAL(&tca5405_tftespi_mux);
#elif ESP_IDF_VERSION_MAJOR <= 3
  portENTER_CRITICAL(&tca5405_tftespi_mux);
#endif
  digitalWrite(pin,0);
  _TCA5405_TRAN_DELAY;
  digitalWrite(pin, 1);
  _TCA5405_TRAN_DELAY;
  digitalWrite(pin,0);
  _TCA5405_TRAN_DELAY;
  digitalWrite(pin, 1);
  _TCA5405_TRAN_DELAY;
  digitalWrite(pin, TCA5405_pins[4]);
  _TCA5405_TRAN_DELAY;
  digitalWrite(pin, TCA5405_pins[3]);
  _TCA5405_TRAN_DELAY;
  digitalWrite(pin, TCA5405_pins[2]);
  _TCA5405_TRAN_DELAY;
  digitalWrite(pin, TCA5405_pins[1]);
  _TCA5405_TRAN_DELAY;
  digitalWrite(pin, TCA5405_pins[0]);
  _TCA5405_TRAN_DELAY;
  digitalWrite(pin, 1);
  //TCA5405_TRAN_DELAY;

#if ESP_IDF_VERSION_MAJOR >= 4
  taskEXIT_CRITICAL(&tca5405_tftespi_mux);
#elif ESP_IDF_VERSION_MAJOR <= 3
  portEXIT_CRITICAL(&tca5405_tftespi_mux);
#endif
}

void TCA5405_campwr_set(void){
  TCA5405_pins[4] = 1;
  TCA5405_tran();
}

void TCA5405_campwr_clr(void){
  TCA5405_pins[4] = 0;
  TCA5405_tran();
}

void TCA5405_state_toggle(void){
  TCA5405_pins[3] = !TCA5405_pins[3];
  TCA5405_tran();
}

void TCA5405_state_set(void){
  TCA5405_pins[3] = 1;
  TCA5405_tran();
}

void TCA5405_state_clr(void){
  TCA5405_pins[3] = 0;
  TCA5405_tran();
}

void TCA5405_unorst_set(void){
  TCA5405_pins[2] = 1;
  TCA5405_tran();
}

void TCA5405_unorst_clr(void){
  TCA5405_pins[2] = 0;
  TCA5405_tran();
}

void TCA5405_lcdcs_set(void){
  TCA5405_pins[1] = 1;
  TCA5405_tran();
}

void TCA5405_lcdcs_clr(void){
  TCA5405_pins[1] = 0;
  TCA5405_tran();
}

void TCA5405_lcdbl_set(void){
  TCA5405_pins[0] = 1;
  TCA5405_tran();
}

void TCA5405_lcdbl_clr(void){
  TCA5405_pins[0] = 0;
  TCA5405_tran();
}
