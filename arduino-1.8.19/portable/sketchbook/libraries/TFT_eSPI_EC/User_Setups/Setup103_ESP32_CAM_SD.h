// Setup for the ESP32-CAM ~ 1.3" 240x240 SPI TFT

// See SetupX_Template.h for all options available

#define ST7789_DRIVER

#define TFT_WIDTH  240
#define TFT_HEIGHT 240

#define CGRAM_OFFSET      		// Library will add offsets required

#define TFT_MISO -1

// #define TFT_MOSI            13	// Data out / MOSI(SDA)
// #define TFT_SCLK            14	// SCL
// #define TFT_CS              15	// -1 
// #define TFT_DC              2
// #define TFT_RST             12

// ESP32-CAM SD 14.SCK, 2.MISO, 15.MOSI, 13.SS
// #define TFT_MOSI            15	// 15 Data out / MOSI(SDA)
// #define TFT_SCLK            14	// Clock out / SCLK(SCK)
// #define TFT_CS              -1	// -1
// #define TFT_DC              2	// 13 
// #define TFT_RST             13	// 2, Or set to -1 and connect to Arduino RESET pin
// RST 接 -1 到 ESP32-CAM_MB 的 RST 不行用-111.01.19-CGH
//     接 12, SD Card Mount Failed
// 	   接 2, 13 OK
// 目前的配置不穩, 會暗掉

//-尤老師 	
// #define TFT_MOSI            13	// Data out / MOSI(SDA)
// #define TFT_SCLK            14	// Clock out / SCLK(SCK)
// #define TFT_CS              -1	// 15
// #define TFT_DC              2
// #define TFT_RST             15	// 16 Or set to -1 and connect to Arduino RESET pin
// TFT_RST 接16 Camera capture failed

//-JarutEx - 目前顯示最 OK
#define TFT_MOSI            12	// Data out / MOSI(SDA)
#define TFT_SCLK            14	// Clock out / SCLK(SCK)
#define TFT_CS              -1	// 15
#define TFT_DC              15
#define TFT_RST             13	// 16 Or set to -1 and connect to Arduino RESET pin

//-ESP32-CAM & MicroSD - 111.07.24	
//#define TFT_MOSI            15	// Data out / MOSI(SDA)
//#define TFT_SCLK            14	// Clock out / SCLK(SCK)
//#define TFT_CS              -1	// 15
//#define TFT_DC              2
//#define TFT_RST             12	//12, 16 Or set to -1 and connect to Arduino RESET pin
// RST-GPIO12 - 沒多久畫面就 停or亂了 -111.07.24
// RST-GPIO13 - Camera capture failed
// RST-GPIO00 - Camera capture failed, 有時 OK 但沒畫面
// RST-GPIO04 - LED 一直亮著, Camera capture failed

// GPIO2	-	RES(RST)
// GPIO14	-	MOSI(SDA)
// GPIO15	-	SCLK(SCK)
// GPIO13	-	DC

//-OK
//#define TFT_MOSI            12	// 15 Data out / MOSI(SDA)
//#define TFT_SCLK            14	// 14 Clock out / SCLK(SCK)
//#define TFT_CS              -1	// -1
//#define TFT_DC              13
//#define TFT_RST             2		// Or set to -1 and connect to Arduino RESET pin

#define TFT_BL          	-1 	//-1 Display backlight control pin

#define TFT_BACKLIGHT_ON HIGH 	// HIGH or LOW are options
//#define TFT_BACKLIGHT_ON LOW  		// HIGH or LOW are options

#define LOAD_GLCD
#define LOAD_FONT2
#define LOAD_FONT4
#define LOAD_FONT6
#define LOAD_FONT7
#define LOAD_FONT8
#define LOAD_GFXFF

#define SMOOTH_FONT

//---------------------------------
// E (2307) spi_master: spi_bus_add_device(460): When work in full-duplex mode at frequency > 26.7MHz, device cannot read correct data.
// Try to use IOMUX pins to increase the frequency limit, or use the half duplex mode.

// Define the SPI clock frequency, this affects the graphics rendering speed. Too
// fast and the TFT driver will not keep up and display corruption appears.
// With an ILI9341 display 40MHz works OK, 80MHz sometimes fails
// With a ST7735 display more than 27MHz may not work (spurious pixels and lines)
// With an ILI9163 display 27 MHz works OK.

// #define SPI_FREQUENCY   1000000
// #define SPI_FREQUENCY   5000000
// #define SPI_FREQUENCY  10000000
// #define SPI_FREQUENCY  20000000

#define SPI_FREQUENCY  27000000

// #define SPI_FREQUENCY  40000000
// #define SPI_FREQUENCY  55000000 // STM32 SPI1 only (SPI2 maximum is 27MHz)
// #define SPI_FREQUENCY  80000000

// Optional reduced SPI frequency for reading TFT
#define SPI_READ_FREQUENCY  20000000
// #define SPI_READ_FREQUENCY  6000000 	// 6 MHz is the maximum SPI read speed for the ST7789V

// The XPT2046 requires a lower SPI clock rate of 2.5MHz so we define that here:
#define SPI_TOUCH_FREQUENCY  2500000

//#define SUPPORT_TRANSACTIONS