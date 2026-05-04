#include <TFT_eSPI.h>
TFT_eSPI tft = TFT_eSPI();
void setup(){
  tft.init();
  tft.setRotation(1);
  tft.fillScreen(TFT_BLACK);
  tft.setTextColor(TFT_WHITE, TFT_BLACK);
  tft.drawString("ILI9486 eval", 10, 10, 2);
}
void loop(){}
