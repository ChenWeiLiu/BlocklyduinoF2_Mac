#include <Arduino.h>
#line 1 "/Users/white/school-develop/BlocklyduinoF2_Mac/sketches/tmp_eval_ili9486/tmp_eval_ili9486.ino"
#include <TFT_eSPI.h>
TFT_eSPI tft = TFT_eSPI();
#line 3 "/Users/white/school-develop/BlocklyduinoF2_Mac/sketches/tmp_eval_ili9486/tmp_eval_ili9486.ino"
void setup();
#line 10 "/Users/white/school-develop/BlocklyduinoF2_Mac/sketches/tmp_eval_ili9486/tmp_eval_ili9486.ino"
void loop();
#line 3 "/Users/white/school-develop/BlocklyduinoF2_Mac/sketches/tmp_eval_ili9486/tmp_eval_ili9486.ino"
void setup(){
  tft.init();
  tft.setRotation(1);
  tft.fillScreen(TFT_BLACK);
  tft.setTextColor(TFT_WHITE, TFT_BLACK);
  tft.drawString("ILI9486 eval", 10, 10, 2);
}
void loop(){}

