/*
	simple interface for ESP8666 and IFTTT website
*/

#ifndef ESP8266_IFTTT_h
#define ESP8266_IFTTT_h
#include "Arduino.h"

String setWifiInfo(String ssid, String password);
// void setIFTTTKey(String key);
void sendIFTTTMessage(String key, String event, String value1, String value2, String value3);
void sendThingSpeakMessage(String key, String field1, String field2, String field3,String field4,String field5,String field6,String field7,String field8);
String sendGoogleSheet(String action, String sheetID, String range, String value1="", String value2="", String value3="");
bool listenUdpPort(String remoteIp,uint32_t remotePort);
bool stopUDP();
void sendUDPmessage(String udpMessage);
String checkUDPmessage();
String getQunoDatime(byte type=0);
#endif