#include "esp8266_ifttt.h"
#include "encodeuri.h"
#include <ESP8266.h>
#include <SoftwareSerial.h>

String SSID = "";
String PASSWORD = "";
// String KEY = "";
#define host F("xie.single-rd.club")
const int httpPort = 80;
SoftwareSerial esp8266Serial(12, 13); /* RX:D3, TX:D2 */
ESP8266 wifi(esp8266Serial);
/**check current free memory **/
// int freeRam () 
// {
//   extern int __heap_start, *__brkval; 
//   int v; 
//   return (int) &v - (__brkval == 0 ? (int) &__heap_start : (int) __brkval); 
// }

/** 
 * set both SW serialport(to esp8266) and HW serialport(to PC) with same baudrate 
 * baudrate : serialport baudrate
 */


// void setSerialBaudRate(int baudrate)
// {
//     Serial.begin(baudrate);
//     esp8266Serial.begin(baudrate);
//     delay(1000);
// }

/** set esp8266 to 9600 baudrate **/
void set8266BaudRate9600()
{
    // esp8266Serial.println("AT");
    //if (wifi.restart()) {Serial.println(F("Restart ESP8266 ... OK"));}  //重啟 ESP8266
    //else {Serial.println(F("Restart ESP8266 ... Error"));} 
    // esp8266Serial.println("AT+RST");
    for(int i=0; i<2;i++)
    {
        esp8266Serial.println("AT+UART_DEF=9600,8,1,0,0");
        delay(300);
    }
}

/** 
 * initialize esp8266 module and join AP with certain information
 * ssid: Access point SSID
 * password: Access point password 
 */
String setWifiInfo(String ssid, String password)
{
    // Serial.print(F("setWifiInfo Start: "));
    // Serial.println(freeRam());
    String myIP="";
    SSID = ssid;
    PASSWORD = password;
    esp8266Serial.begin(115200);
    delay(200);
    set8266BaudRate9600();
    esp8266Serial.begin(9600);
    delay(200);
    // Serial.println(F("9600 done"));
    if (wifi.restart()) {Serial.println(F("Restart ESP8266 ... OK"));}  //重啟 ESP8266
    else {Serial.println(F("Restart ESP8266 ... Error"));} 
    // Serial.println("Firmware Version ... " + wifi.getVersion()); //傳回 AT 韌體版本  
    //設定為單一連線模式
    if (wifi.setOprToStation()) {Serial.println(F("Set Operation Mode=Station ... OK"));}
    else {Serial.println(F("Set Operation Mode=Station ... Error"));}
    if (wifi.disableMUX()) {Serial.println(F("disable Mux (single connection) ... OK"));}
    else {Serial.println(F("disable Mux (single connection) ... Error"));}
    while (!wifi.joinAP (SSID, PASSWORD)) {
      Serial.println("Connect to AP: "+SSID+" failed!");
      delay(500);
    }
    myIP=wifi.getLocalIP();
    Serial.println("Local IP ... " + myIP); //傳回本地 IP
    return myIP;
    // Serial.print(F("setWifiInfo End: "));
    // Serial.println(freeRam());
}

/** reset and initialize esp8266 module **/

void setWifiRestart()
{
    if (wifi.restart()) {Serial.println(F("Restart ESP8266 ... OK"));}  //重啟 ESP8266
    else {Serial.println(F("Restart ESP8266 ... Error"));} 
    // Serial.println("Firmware Version ... " + wifi.getVersion()); //傳回 AT 韌體版本  
    //設定為單一連線模式
    if (wifi.setOprToStation()) {Serial.println(F("Set Operation Mode=Station ... OK"));}
    if (wifi.disableMUX()) {Serial.println(F("disable Mux (single connection) ... OK"));}
    else {Serial.println(F("disable Mux (single connection) ... Error"));} 
    wifi.joinAP (SSID, PASSWORD);
    // Serial.println("Local IP ... " + wifi.getLocalIP()); //傳回本地 IP
}


/**
 * Send data to ifttt webhook via gcp redirect
 * key: ifttt webhook key
 * event: registered event in ifttt webhook
 * values: values sent to ifttt
 */

void sendIFTTTMessage(String key,String event, String value1, String value2, String value3)
{
    String iftttHost="maker.ifttt.com";
    // Serial.print(F("sendIFTTTMessage Start: "));
    // Serial.println(freeRam());
    uint8_t buf[32]={0}; // 設過大會無法建立tcpip連線, out of memory
    if (wifi.kick()) {Serial.println(F("Kick ESP8266 ... OK"));}  //喚醒 ESP8266
    else {Serial.println(F("Kick ESP8266 ... Error"));}
    String message = F("GET /trigger/");
    message += event;
    message += F("/with/key/");
    message += key;
    message += F("?value1=");
    message += urlencode(value1);
    message += F("&value2=");
    message += urlencode(value2);
    message += F("&value3=");
    message += urlencode(value3);
    message += F(" HTTP/1.1\r\nHost: maker.ifttt.com\r\n\r\n");
    // Serial.println("Message:");
    // Serial.println(message);
    if (wifi.createTCP(iftttHost, httpPort)) 
    {
        Serial.println(F("Create TCP connection ... OK"));
        char* data = message.c_str();
        wifi.send((const uint8_t*)data, strlen(data));  //傳送資料
    }
    else 
    {
        Serial.println(F("Create TCP connection ... Error"));
        setWifiRestart();
    }
    if (wifi.releaseTCP()) {Serial.println(F("Release TCP ... OK"));}  //關閉連線
        else {Serial.println("Release TCP ... Error");}  
    // Serial.print(F("sendIFTTTMessage End: "));
    // Serial.println(freeRam());
}

void sendThingSpeakMessage(String key, String field1, String field2, String field3,String field4,String field5,String field6,String field7,String field8)
{
    String thingSpeakHost="api.thingspeak.com";
    // Serial.print(F("sendIFTTTMessage Start: "));
    // Serial.println(freeRam());
    uint8_t buf[32]={0}; // 設過大會無法建立tcpip連線, out of memory
    if (wifi.kick()) {Serial.println(F("Kick ESP8266 ... OK"));}  //喚醒 ESP8266
    else {Serial.println(F("Kick ESP8266 ... Error"));}
    String message = F("GET /update?api_key=");
    message += key;
    message += F("&field1=");
    message += urlencode(field1);
    message += F("&field2=");
    message += urlencode(field2);
    message += F("&field3=");
    message += urlencode(field3);
    message += F("&field4=");
    message += urlencode(field4);
    message += F("&field5=");
    message += urlencode(field5);
    message += F("&field6=");
    message += urlencode(field6);
    message += F("&field7=");
    message += urlencode(field7);
    message += F("&field8=");
    message += urlencode(field8);
    message += F(" HTTP/1.1\r\nHost: api.thingspeak.com\r\n\r\n");
    // Serial.println("Message:");
    // Serial.println(message);
    if (wifi.createTCP(thingSpeakHost, httpPort)) 
    {
        Serial.println(F("Create TCP connection ... OK"));
        char* data = message.c_str();
        wifi.send((const uint8_t*)data, strlen(data));  //傳送資料
    }
    else 
    {
        Serial.println(F("Create TCP connection ... Error"));
        setWifiRestart();
    }
    if (wifi.releaseTCP()) {Serial.println(F("Release TCP ... OK"));}  //關閉連線
        else {Serial.println("Release TCP ... Error");}  
    // Serial.print(F("sendIFTTTMessage End: "));
    // Serial.println(freeRam());
}


/**
 * Send data to google sheet via gcp redirect
 * action: append/update/read
 * sheetID: target google sheet id
 * range: target range in google sheet, use A1 notation
 * values: values sent to ifttt
 */
String sendGoogleSheet(String action, String sheetID, String range, String value1, String value2, String value3)
{
    // Serial.print(F("sendGoogleSheet Start: "));
    // Serial.println(freeRam());
    uint8_t buf[64]={0}; // 設過大會無法建立tcpip連線, out of memory
    String response="";
    if (wifi.kick()) {Serial.println(F("Kick ESP8266 ... OK"));}  //喚醒 ESP8266
    else {Serial.println(F("Kick ESP8266 ... Error"));}
    String message = F("GET /gsr/?action=");
    message += action;
    message += F("&sheetid=");
    message += sheetID;
    message += F("&range=");
    message += range;
    message += F("&value1=");
    message += urlencode(value1);
    message += F("&value2=");
    message += urlencode(value2);
    message += F("&value3=");
    message += urlencode(value3);
    message += F(" HTTP/1.1\r\nHost: xie.single-rd.club\r\n\r\n");
    // Serial.println("Message:");
    // Serial.println(message);
    if (wifi.createTCP(host, httpPort)) 
    {
        Serial.println(F("Create TCP connection ... OK"));
        char* data = message.c_str();
        wifi.send((const uint8_t*)data, strlen(data));  //傳送資料
        if(action==F("read"))
        {
            uint8_t len = wifi.recv(buf, sizeof(buf), 10000 ,String("TCP"));
            if (len > 0) {
              for(uint8_t i = 0; i < len; i++) {
                response += String((char)buf[i]);
                if((char)buf[i]=='\n')
                  response = "";
              }
            }
        }
    }
    else 
    {
        Serial.println(F("Create TCP connection ... Error"));
        setWifiRestart();
    }
    if (wifi.releaseTCP()) {Serial.println(F("Release TCP ... OK"));}  //關閉連線
        else {Serial.println(F("Release TCP ... Error"));} 
    // Serial.print(F("sendGoogleSheet End: "));
    // Serial.println(freeRam());
    return response;
}

bool listenUdpPort(String remoteIp,uint32_t remotePort)
{
  stopUDP();
  if (wifi.registerUDP(remoteIp, remotePort)) {
      Serial.print("register udp ok\r\n");
      return true;
  } else {
      Serial.print("register udp err\r\n");
      return false;
  }
  //return wifi.registerUDP(remoteIp, remotePort);
}

void sendUDPmessage(String udpMessage)
{
 const uint8_t* myMsg=(const uint8_t*)udpMessage.c_str();
 wifi.kick();
 wifi.send(myMsg, strlen(myMsg)); 
}

String checkUDPmessage()
{
  uint8_t buffer[128] = {0};
  uint32_t len = wifi.recv(buffer, sizeof(buffer),100,String("UDP"));
  if (len > 0) {
    String myStr="";
    for(uint32_t i = 0; i < len; i++) {
        myStr+=(char)buffer[i];
    }
    return myStr;
  }
  return "";
}

String getQunoDatime(byte type)
{
  String timeHost="worldtimeapi.org";
  uint8_t buf[290]={0}; // 設過大會無法建立tcpip連線, out of memory
  String response="";
  if (wifi.kick()) {Serial.println(F("Kick ESP8266 ... OK"));}  //喚醒 ESP8266
  else {Serial.println(F("Kick ESP8266 ... Error"));}
  String message = F("GET /api/timezone/Asia/Taipei");
  message += F(" HTTP/1.1\r\nHost: worldtimeapi.org\r\n\r\n");
  if (wifi.createTCP(timeHost, httpPort)) 
  {
    Serial.println(F("Create TCP connection ... OK"));
    char* data = message.c_str();
    wifi.send((const uint8_t*)data, strlen(data));  //傳送資料
    uint8_t len = wifi.recv(buf, sizeof(buf), 10000 ,String("TCP"));
    if (len > 0) {
      for(uint8_t i = 0; i < len; i++) {
        response += String((char)buf[i]);
        if((char)buf[i]=='\n')
          response = "";
      }
    }
  }
  else 
  {
    Serial.println(F("Create TCP connection ... Error"));
    setWifiRestart();
  }
  if (wifi.releaseTCP()) {Serial.println(F("Release TCP ... OK"));}  //關閉連線
  else {Serial.println(F("Release TCP ... Error"));} 
  byte tempIndex=response.indexOf("\":\"");
  response=response.substring(tempIndex+3);
  tempIndex=response.indexOf(".");
  response=response.substring(0,tempIndex);
  if (type==0)
    response.replace("T"," ");
  else if (type==1){
    tempIndex=response.indexOf("T");
    response=response.substring(0,tempIndex);
  } else if (type==2){
    tempIndex=response.indexOf("T");
    response=response.substring(tempIndex+1);
  }
  return response;
}

bool stopUDP()
{
  if (wifi.unregisterUDP()) {
    Serial.print("unregister udp ok\r\n");
    return true;
  } else {
    Serial.print("unregister udp err\r\n");
    return false;
  }
}