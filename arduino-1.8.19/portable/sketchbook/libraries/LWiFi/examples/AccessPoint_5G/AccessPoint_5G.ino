#include <LWiFi.h>
#include <WiFiClient.h>
// #include <LWebServer.h>

/* Set these to your desired credentials. */
const char *ssid = "LinkitAP";
const char *password = "yourpassword";
const int channel = 100; // 5G: CH 36~64 100~140 149~165

WiFiServer server(80);

void setup() {
    Serial.begin(115200);
    Serial.println();
    Serial.println("Configuring access point...");

    /* You can remove the password parameter if you want the AP to be open. */
    //WiFi.softAP_5G(ssid, NULL, channel);
    WiFi.softAP_5G(ssid, password, channel);
    IPAddress myIP = WiFi.softAPIP();
    Serial.println("AP ready.");
    Serial.print("Please Connect to AP: ");
    Serial.println(ssid);
    Serial.print("And visit http://");
    Serial.println(myIP);

    Serial.print("AP MAC=");
    Serial.println(WiFi.softAPmacAddress());

    server.begin();
}

void loop() {
    // server.handleClient();
    // listen for incoming clients
    WiFiClient client = server.available();
    if (client) {
        // an http request ends with a blank line
        boolean currentLineIsBlank = true;
        while (client.connected()) {
            if (client.available()) {
                char c = client.read();
                Serial.write(c);
                // if you've gotten to the end of the line (received a newline
                // character) and the line is blank, the http request has ended,
                // so you can send a reply
                if (c == '\n' && currentLineIsBlank) {
                    // send a standard http response header
                    client.println("HTTP/1.1 200 OK");
                    client.println("Content-Type: text/html");
                    client.println("Connection: close");  // the connection will be closed after completion of the response
                    client.println();
                    client.println("<!DOCTYPE HTML>");
                    client.println("<html>");
                    client.println("<p>Hello from LinkIt 7697!</p>");
                    client.println("<p>Wi-Fi SSID: ");
                    client.print(ssid);
                    client.println("</p>");
                    client.print("<p>Connected STA #: ");
                    client.print((int)WiFi.softAPgetStationNum());
                    client.println("</p>");
                    client.println("</html>");
                    break;
                }
                if (c == '\n') {
                    // you're starting a new line
                    currentLineIsBlank = true;
                } else if (c != '\r') {
                    // you've gotten a character on the current line
                    currentLineIsBlank = false;
                }
            }
        }
        // give the web browser time to receive the data
        delay(300);

        // close the connection:
        client.stop();
        Serial.println("client disconnected");
    }
}
