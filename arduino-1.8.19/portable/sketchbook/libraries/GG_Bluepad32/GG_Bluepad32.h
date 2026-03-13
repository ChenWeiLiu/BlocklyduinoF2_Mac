#ifndef GG_Bluepad32_h
#define GG_Bluepad32_h

GamepadPtr ggGamepadBP32;

void onConnectedBluepad32(GamepadPtr gp) {
	if (ggGamepadBP32 == nullptr) {
		Serial.println("CALLBACK: Gamepad is connected");
		GamepadProperties properties = gp->getProperties();
		Serial.printf("Gamepad model: %s, VID=0x%04x, PID=0x%04x\n", gp->getModelName().c_str(), properties.vendor_id,properties.product_id);
		ggGamepadBP32 = gp;
		BP32.enableNewBluetoothConnections(false);
	} else {
		Serial.println("CALLBACK: Another Gamepad connected, but another one is used");
	}
}

void onDisconnectedBluepad32(GamepadPtr gp) {
	if (ggGamepadBP32 == gp) {
		Serial.println("CALLBACK: Gamepad is disconnected.");
		ggGamepadBP32 = nullptr;
		BP32.enableNewBluetoothConnections(true);
	} else {
		Serial.println("CALLBACK: Gamepad disconnected, but not useed");
	}
}

bool ggBP32dpadButton(int shift_right) {
	uint8_t dpad;
	if (shift_right == 0) {
		dpad=ggGamepadBP32->dpad();
	} else {
		dpad=ggGamepadBP32->dpad() >> shift_right;
	}
  return dpad & 0b00001;
}
#endif