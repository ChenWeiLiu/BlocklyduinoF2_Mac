'user strict'

document.addEventListener('DOMContentLoaded', function () {
	document.querySelector('#button_upload')
		.addEventListener('click', handleUploadButton);
	document.querySelector('#button_launch_ide')
		.addEventListener('click', openArduinoIDE);
	document.querySelector('#button_launch_serial')
		.addEventListener('click', openSerialMonitor);

});

var nwGui = require('nw.gui'), nwShell = nwGui.Shell,
	child_process = require('child_process'), exec = child_process.exec,
	execSync = child_process.execSync, execFile = child_process.execFile,
	execFileSync = child_process.execFileSync, spawn = child_process.spawn;
var iconv = require('iconv-lite');
// var fs = require('fs');
var fs = require('fs-extra');
var path = require('path');

var availPorts = [], nextAvailPorts = [];
var selectedPort = null;
var cmd_encoding = 'Big5';
var process;

var tmpInoDir = 'sketches/tmp/';
var tmpInoFilename = 'tmp.ino';
var tmpBuildDir = 'build/tmp/';

function closeSerialMonitor() {
	return new Promise(function (resolve, reject) {
		process = exec('taskkill /F /IM putty.exe', { encoding: 'buffer' });
		// wait for taskkill to terminate
		process.on('exit', resolve);
	});
}

function handleUploadButton() {
	closeSerialMonitor().then(function () {
		fs.ensureDirSync(tmpBuildDir);
		writeInoFile(tmpInoDir, tmpInoFilename);
		startUploading(tmpInoDir + tmpInoFilename);
	});
}

function openArduinoIDE() {
	// check if user has saved the INO file
	if (!fileEntry) {
		Materialize.toast(
			Blockly.Msg.SAVE_FIRST, 4000)  // 4000 is the duration of the toast
		return
	}

	// Open the INO file with Arduino.exe
	closeSerialMonitor().then(function () {
		// the "fileEntry" is actually a directly entry.
		// so we search the INO file name within the directory entry first
		var filename = document.getElementById('info_title').innerHTML;
		var dirname = filename.split('.')[0]
		var searchname = filename
		if (Entryflg == 2) {
			searchname = dirname + '/' + filename
		}
		fileEntry.getFile(searchname, { create: false }, function (inoEntry) {
			// The inoEntry is a chrome-specific file path
			// we need to convert it to the "display path",
			// which is UNC Path under Windows,
			// before passing the path to Arduino.exe
			chrome.fileSystem.getDisplayPath(inoEntry, function (inoPath) {
				if (inoPath.indexOf("~\\Desktop") != -1) {
					const os = require('os');
					const path = require('path');
					const desktopDir = path.join(os.homedir(), "Desktop");
					inoPath = inoPath.replace("~\\Desktop", desktopDir);
				}

				console.log('arduino.exe ' + inoPath);
				let command = '"arduino-' + arduino_ide + '\\arduino.exe"'
				let parameter = inoPath;
				var process = exec(command + ' ' + parameter, { encoding: 'buffer' });
			});
		}, errorHandler);
	});
}

function getSerialBaudRate() {
	// This function scans for "serial.begin" blocks and determines the 
	// baudrate of the sketch.
	var baudrate = 9600;

	// get the converted code
	var code = Blockly.Arduino.workspaceToCode();
	// scan for the Serial
	var matches = code.match(/Serial\.begin\((\d+)\)/);
	console.log(matches);
	if (matches) {
		// extract sub-string matches, if any.
		baudrate = matches[1]
	}

	return baudrate.toString()
}

function openSerialMonitor() {
	document.getElementById('baudrate').innerHTML = '' +
		'<select id="serial_baud" style="display:block; text-align-last: right; direction: rtl;">' +
		'	<option value="9600">9600</option>' +
		'	<option value="115200">115200</option>' +
		'	<option value="300">300</option>' +
		'	<option value="1200">1200</option>' +
		'	<option value="2400">2400</option>' +
		'	<option value="4800">4800</option>' +
		'	<option value="19200">19200</option>' +
		'	<option value="38400">38400</option>' +
		'	<option value="57600">57600</option>' +
		'	<option value="74880">74880</option>' +
		'	<option value="230400">230400</option>' +
		'	<option value="250000">250000</option>' +
		'	<option value="500000">500000</option>' +
		'	<option value="1000000">1000000</option>' +
		'	<option value="2000000">2000000</option>' +
		'</select>';
	document.getElementById('serial_baud').value = getSerialBaudRate();

	var opt = {
		draggable: true,
		autoOpen: false,
		resizable: true,
		modal: false,
		//show: "blind",
		//hide: "blind",			
		width: 250,
		height: 200,
		buttons: [
			{
				text: Blockly.Msg.BUTTON_CLOSE,
				click: function () {
					var process = require('child_process');
					process.exec('taskkill /F /IM putty.exe', { encoding: 'buffer' });
					$(this).dialog("close");
				}
			},
			{
				text: Blockly.Msg.BUTTON_SERIAL_OPEN,
				click: function () {
					var com = document.getElementById('com-selector');
					var baud = document.getElementById('serial_baud');
					var process = require('child_process');
					process.execFile('putty.exe',
						[
							'-serial', selectedPort,
							'-sercfg', baud.value + ',8,n,1,N'
						],
						{ encoding: 'buffer' },
						function (error, stdout, stderr) {
							if (error) {
								console.error(error);
							}
							console.error(decode(stdout));
							console.error(decode(stderr));
						}
					);
				}
			}
		],
		title: Blockly.Msg.BUTTON_SERIAL_TITLE
	};

	document.getElementById('baudrate_title').innerHTML = Blockly.Msg.BAUDRATE;

	$("#dialog_putty").dialog(opt).dialog("open");
	event.preventDefault();
}

function outputUploaderMsg(message, className = null) {
	let el_output = document.getElementById('terminal-body');
	let node = document.createElement('DIV');
	if (className) {
		node.classList.add(className);
	}
	let textnode = document.createTextNode(message);
	node.appendChild(textnode);
	el_output.appendChild(node);
	el_output.scrollTop = el_output.scrollHeight;
}

function clearUploaderMsg() {
	$('#terminal-body').empty();
}

// by default, convert 'Big5' to 'utf8'
function decode(buf, encoding = cmd_encoding) {
	return iconv.decode(buf, encoding);
}

function startUploading(inoPath) {
	document.getElementById('upload_code').style.display = "block";
	document.getElementById('upload_state').style.display = "none";
	var opt = {
		draggable: true,
		autoOpen: false,
		resizable: true,
		modal: false,
		//show: "blind",
		//hide: "blind",			
		width: 700,
		height: 500,
		buttons: [
			{
				text: Blockly.Msg.BUTTON_CLOSE,
				click: function () {
					$(this).dialog("close");
				}
			},
			{
				text: Blockly.Msg.BUTTON_UPLOAD_STATE,
				click: function () {
					document.getElementById('upload_code').style.display = "none";
					document.getElementById('upload_state').style.display = "block";
				}
			},
			{
				text: Blockly.Msg.BUTTON_UPLOAD_CODE,
				click: function () {
					document.getElementById('upload_code').style.display = "block";
					document.getElementById('upload_state').style.display = "none";
				}
			},
			{
				text: Blockly.Msg.BUTTON_UPLOAD,
				click: function () {
					var code = document.getElementById('upload_code').value;
					document.getElementById('upload_code').style.display = "none";
					document.getElementById('upload_state').style.display = "block";

					var fs = require('fs');
					fs.writeFile(inoPath, code, function (err) {
						if (err) console.log(err);
					});

					document.getElementById('upload_state').value = Blockly.Msg.BUTTON_UPLOAD_START + "\n";

					let board = document.getElementById('board-selector');
					var com = document.getElementById('com-selector');
					var baud = document.getElementById('serial_baud');

					var process = require('child_process');
					var upload = process.execFile(
						'arduino-' + arduino_ide + '\\arduino_debug.exe',
						[
							'--upload', inoPath,
							'--board', board.value,
							'--port', selectedPort,
							'--pref', 'build.path=build/tmp/'
						],
						{ encoding: 'binary' }
						/*, 
						function (error, stdout, stderr) {
							var response = document.getElementById('upload_state');
							if (error) {
								console.error(error);
							}
							response.value += decode(new Buffer(stdout,'binary'), 'utf-8');
							response.value += decode(new Buffer(stderr,'binary'), 'utf-8');
							response.value = response.value.replace(/DEBUG StatusLogger/g,"");
							response.scrollTop = response.scrollHeight;
						}*/
					);

					upload.stdout.on('data', function (data) {
						var response = document.getElementById('upload_state');
						response.value += decode(new Buffer(data, 'binary'), 'utf-8');
						response.scrollTop = response.scrollHeight;
					});

					upload.stderr.on('data', function (data) {
						var response = document.getElementById('upload_state');
						response.value += decode(new Buffer(data, 'binary'), 'utf-8');
						response.scrollTop = response.scrollHeight;
					});

					upload.on('exit', function (code, signal) {
						var response = document.getElementById('upload_state');
						response.value += "\nFinish";
						response.scrollTop = response.scrollHeight;
					});
				}
			}
		],
		title: Blockly.Msg.BUTTON_UPLOAD_TITLE
	};
	$("#dialog_upload").dialog(opt).dialog("open");

	document.getElementById('upload_code').value = Blockly.Arduino.workspaceToCode();
	document.getElementById('upload_code').scrollTop = 0;
	document.getElementById('upload_state').value = "";
}

function uiStartUploading() {
	clearInterval(detectTimer);

	$('#button_upload').hide();
	$('#uploading-spinner').addClass('active');
}

function uiFinishUploading() {
	$('#uploading-spinner').removeClass('active');
	$('#button_upload').show();
	detectTimer = setInterval(detectPort, 5000);
}

/* port detect */

function detectPort() {
	let command = 'mode';

	exec(command, { encoding: 'buffer' }, (error, stdout, stderr) => {
		let output = decode(stdout);
		nextAvailPorts = parsePorts(output);
		updateAvailPorts();
	})
}

function parsePorts(str) {
	return str.match(/COM\d+/g) || [];
}

function updateAvailPorts() {
	// check if availPorts equal to nextAvailPorts
	if (availPorts.length == nextAvailPorts.length &&
		availPorts.every((v, i) => v === nextAvailPorts[i])) {
		return;
	}
	//console.log('Available ports is changed. Update port-selector...');
	//console.log('nextAvailPorts:', nextAvailPorts);    
	availPorts = nextAvailPorts;
	updatePortSelector(availPorts, selectedPort);
}

function selectUploadPort(port) {
	selectedPort = port;

	portLabel = document.querySelector('#port-selected-text')
	portLabel.textContent = selectedPort + ' ';
	portLabel.classList.toggle('blinking-text', false);

	// Save upload COM port setting to local storage
	chrome.storage.local.set({ 'COM': selectedPort }, function () {
		console.log('store COM port setting to ' + selectedPort);
	});

	console.log('change upload port to ' + selectedPort);
}

function selectBoard(board) {
	var boardLabel = document.querySelector('#board-selected-text')
	boardLabel.textContent = board + ' ';
	boardLabel.classList.toggle('blinking-text', false);

	dropdownSetValue(board);

	// Save upload COM port setting to local storage
	chrome.storage.local.set({ 'BOARD': board }, function () {
		console.log('store board setting to ' + board);
	});
	console.log('change board to ' + board);

	if (Blockly.getMainWorkspace()) {
		var xml = Blockly.Xml.workspaceToDom(Blockly.getMainWorkspace());
		Blockly.getMainWorkspace().clear();
		Blockly.Xml.domToWorkspace(xml, Blockly.getMainWorkspace());
	}
}

function updatePortSelector(availPorts, selectedPort) {
	let $dropdownPort = $('#dropdownPort');
	$dropdownPort.empty();
	var len = availPorts.length;
	if (availPorts.length) {
		var len = availPorts.length;
		availPorts.forEach(port => {
			// upload dropdown button's list
			let item_str = '<li><a href="#!" onclick="selectUploadPort(\'' + port + '\')">' + port + '</a>'
			item_str += '<li class="divider">'
			$dropdownPort.append($(item_str))
		});
	} else {
		// upload dropdown button's list
		let item_str = '<li><a href="#!">' + Blockly.Msg.DROPDOWN_SCANNING + '</a>';
		$dropdownPort.append($(item_str))
	}
}

detectPort();
detectTimer = setInterval(detectPort, 5000);

function writeInoFile(dir, filename) {
	fs.ensureDirSync(dir);
	let code = Blockly.Arduino.workspaceToCode();
	fs.writeFileSync(dir + filename, code);
}
