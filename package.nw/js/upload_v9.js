'user strict'

document.addEventListener('DOMContentLoaded', function () {
	var uploadBtn = document.querySelector('#button_upload');
	if (uploadBtn && uploadBtn.parentNode) {
		// Replace node to remove any old click handlers bound by legacy scripts.
		var freshUploadBtn = uploadBtn.cloneNode(true);
		uploadBtn.parentNode.replaceChild(freshUploadBtn, uploadBtn);
		freshUploadBtn.addEventListener('click', function (e) {
			e.preventDefault();
			e.stopImmediatePropagation();
			handleUploadButton();
		});
	}
	document.addEventListener('click', function (e) {
		var t = e.target;
		if (!t || !t.closest) return;
		var mainUploadBtn = t.closest('#button_upload');
		if (mainUploadBtn) {
			e.preventDefault();
			e.stopImmediatePropagation();
			handleUploadButton();
			return;
		}
		var paneBtn = t.closest('.ui-dialog-buttonpane button');
		if (!paneBtn) return;
		var txt = (paneBtn.textContent || '').trim();
		if (txt === Blockly.Msg.BUTTON_UPLOAD) {
			e.preventDefault();
			e.stopImmediatePropagation();
			if (!currentUploadInoPath) {
				currentUploadInoPath = path.join(tmpInoDir, tmpInoFilename);
			}
			runCliUploadFlow(currentUploadInoPath);
		}
	}, true);
	document.querySelector('#button_launch_ide')
		.addEventListener('click', openArduinoIDE);
	document.querySelector('#button_launch_serial')
		.addEventListener('click', openSerialMonitor);

	window.__UPLOAD_ENGINE__ = 'v12-cli';
	var brand = document.querySelector('.brand-logo');
	if (brand && !document.getElementById('upload-engine-tag')) {
		var tag = document.createElement('span');
		tag.id = 'upload-engine-tag';
		tag.style.fontSize = '0.8rem';
		tag.style.marginLeft = '8px';
		tag.style.color = '#ffeb3b';
		tag.style.fontFamily = 'monospace';
		tag.textContent = 'UP-V12';
		brand.appendChild(tag);
	}

	forceTakeoverV9();
	setInterval(forceTakeoverV9, 1000);

});

function forceTakeoverV9() {
	try {
		window.handleUploadButton = handleUploadButton;
		window.startUploading = startUploading;
		var btn = document.getElementById('button_upload');
		if (btn) {
			btn.onclick = function (e) {
				if (e) {
					e.preventDefault();
					e.stopImmediatePropagation();
				}
				handleUploadButton();
				return false;
			};
		}
		var stateEl = document.getElementById('upload_state');
		var dlg = document.getElementById('dialog_upload');
		if (
			stateEl && dlg && dlg.style.display !== 'none' &&
			!uploadRunning &&
			(!stateEl.value || stateEl.value.trim() === '')
		) {
			stateEl.value = "[UP-V12 READY]\n按右下角「下載」開始。\n";
		}
	} catch (e) {}
}

var nwGui = require('nw.gui'), nwShell = nwGui.Shell,
	child_process = require('child_process'), exec = child_process.exec,
	execSync = child_process.execSync, execFile = child_process.execFile,
	execFileSync = child_process.execFileSync, spawn = child_process.spawn;
var iconv = require('iconv-lite');
// var fs = require('fs');
var fs = require('fs-extra');
var path = require('path');
var os = require('os');

var availPorts = [], nextAvailPorts = [];
var selectedPort = null;
var isPortScanning = false;
var hasPortScanCompleted = false;
var hasRenderedPortList = false;
var cmd_encoding = 'Big5';
var childTask;

var appRootDir = (function () {
	try {
		if (typeof process !== 'undefined' && process.cwd) {
			return process.cwd();
		}
	} catch (e) {}
	try {
		if (nwGui && nwGui.App && nwGui.App.startPath) {
			return nwGui.App.startPath;
		}
	} catch (e2) {}
	return '.';
})();
var tmpInoDir = path.join(appRootDir, 'sketches', 'tmp');
var tmpInoFilename = 'tmp.ino';
var tmpBuildDir = path.join(appRootDir, 'build', 'tmp');
var uploadDebugLog = path.join(appRootDir, 'sketches', 'upload_debug.log');
var currentUploadInoPath = null;
var localUploadScript = path.join(appRootDir, 'tools', 'mac', 'upload_cli.sh');
var uploadRunning = false;

function logUpload(msg) {
	try {
		var line = '[' + new Date().toISOString() + '] ' + msg + '\n';
		fs.appendFileSync(uploadDebugLog, line);
	} catch (e) {
		// ignore logging failures
	}
}

function closeSerialMonitor() {
	return new Promise(function (resolve, reject) {
		if (os.platform() !== 'win32') {
			resolve();
			return;
		}
		childTask = exec('taskkill /F /IM putty.exe', { encoding: 'buffer' });
		// wait for taskkill to terminate
		childTask.on('exit', resolve);
	});
}

function handleUploadButton() {
	closeSerialMonitor().then(function () {
		fs.ensureDirSync(tmpBuildDir);
		writeInoFile(tmpInoDir, tmpInoFilename);
		startUploading(path.join(tmpInoDir, tmpInoFilename));
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

function appendUploadState(response, text) {
	if (!response) return;
	response.value += text;
	response.scrollTop = response.scrollHeight;
}

function runCliUploadFlow(inoPath) {
	var response = document.getElementById('upload_state');
	try {
		if (uploadRunning) {
			appendUploadState(response, "\n[V12-CLI] Upload is already running.\n");
			return;
		}
		uploadRunning = true;
		logUpload('click upload button');
		var code = document.getElementById('upload_code').value;
		document.getElementById('upload_code').style.display = "none";
		document.getElementById('upload_state').style.display = "block";
		document.getElementById('upload_state').value = '';
		response = document.getElementById('upload_state');
		appendUploadState(response, "[V12-CLI] " + Blockly.Msg.BUTTON_UPLOAD_START + "\n");

		fs.writeFileSync(inoPath, code);
		logUpload('write ino: ' + inoPath);

		let board = document.getElementById('board-selector');
		var boardFqbn = board ? board.value : '';
		if ((!boardFqbn || !boardFqbn.trim()) && board && board.options && board.selectedIndex >= 0) {
			boardFqbn = board.options[board.selectedIndex].value || '';
		}
		appendUploadState(response, "Board: " + (boardFqbn || '(empty)') + "\n");
		appendUploadState(response, "Port: " + (selectedPort || '(empty)') + "\n");
		logUpload('board=' + (boardFqbn || '(empty)') + ' port=' + (selectedPort || '(empty)'));

		if (!selectedPort) {
			appendUploadState(response, "\nNo serial port selected.\n");
			return;
		}
		if (!boardFqbn || !boardFqbn.trim()) {
			appendUploadState(response, "\nNo board selected. Please choose BOARD first.\n");
			return;
		}
		if (os.platform() !== 'darwin') {
			appendUploadState(response, "\nThis uploader is currently macOS-only.\n");
			return;
		}
		if (!fs.existsSync(localUploadScript)) {
			appendUploadState(response, "\nLocal upload script missing: " + localUploadScript + "\n");
			appendUploadState(response, "Run ./install_mac.sh first.\n");
			return;
		}

		var cleanEnv = Object.assign({}, global.process.env);
		delete cleanEnv.PYTHONHOME;
		delete cleanEnv.PYTHONPATH;
		delete cleanEnv.PYTHONEXECUTABLE;
		delete cleanEnv.DYLD_LIBRARY_PATH;
		delete cleanEnv.DYLD_FRAMEWORK_PATH;
		cleanEnv.TMPDIR = path.join(appRootDir, 'build', 'tmp_py') + path.sep;
		fs.ensureDirSync(cleanEnv.TMPDIR);
		fs.ensureDirSync(tmpBuildDir);
		logUpload('spawn local wrapper: ' + localUploadScript);
		appendUploadState(response, "\n[V12-CLI] using local mac toolchain\n");
		var p = spawn('bash', [
			localUploadScript,
			'--board', boardFqbn,
			'--port', selectedPort,
			'--sketch-dir', tmpInoDir,
			'--build-path', tmpBuildDir
		], {
			cwd: appRootDir,
			env: cleanEnv,
			shell: false
		});
		p.stdout.on('data', function (data) {
			var text = data.toString('utf8');
			appendUploadState(response, text);
			logUpload('wrapper stdout: ' + text.slice(0, 300));
		});
		p.stderr.on('data', function (data) {
			var text = data.toString('utf8');
			appendUploadState(response, text);
			logUpload('wrapper stderr: ' + text.slice(0, 300));
		});
		p.on('error', function (err) {
			appendUploadState(response, "\nUpload process error: " + (err && err.message ? err.message : String(err)) + "\n");
			logUpload('wrapper error: ' + (err && err.message ? err.message : String(err)));
			uploadRunning = false;
		});
		p.on('exit', function (code) {
			if (code === 0) {
				appendUploadState(response, "\nUpload finished successfully.\n");
			} else {
				appendUploadState(response, "\nUpload failed (exit " + code + ").\n");
			}
			logUpload('wrapper exit code=' + code);
			uploadRunning = false;
		});
	} catch (err) {
		appendUploadState(response, "\nException: " + (err && err.message ? err.message : String(err)) + "\n");
		logUpload('exception: ' + (err && err.stack ? err.stack : String(err)));
		uploadRunning = false;
	}
}

function ensureUploadToolbarV9(inoPath) {
	var dialog = document.getElementById('dialog_upload');
	if (!dialog) return;
	var toolbar = document.getElementById('upload_toolbar_v9');
	if (!toolbar) {
		toolbar = document.createElement('div');
		toolbar.id = 'upload_toolbar_v9';
		toolbar.style.textAlign = 'right';
		toolbar.style.paddingTop = '8px';
		toolbar.innerHTML =
			'<button type="button" id="upload_btn_close_v9"></button> ' +
			'<button type="button" id="upload_btn_state_v9"></button> ' +
			'<button type="button" id="upload_btn_code_v9"></button> ' +
			'<button type="button" id="upload_btn_run_v9"></button>';
		dialog.appendChild(toolbar);
	}

	var btnClose = document.getElementById('upload_btn_close_v9');
	var btnState = document.getElementById('upload_btn_state_v9');
	var btnCode = document.getElementById('upload_btn_code_v9');
	var btnRun = document.getElementById('upload_btn_run_v9');
	if (!btnClose || !btnState || !btnCode || !btnRun) return;

	btnClose.textContent = Blockly.Msg.BUTTON_CLOSE;
	btnState.textContent = Blockly.Msg.BUTTON_UPLOAD_STATE;
	btnCode.textContent = Blockly.Msg.BUTTON_UPLOAD_CODE;
	btnRun.textContent = Blockly.Msg.BUTTON_UPLOAD;

	btnClose.onclick = function () { $("#dialog_upload").dialog("close"); };
	btnState.onclick = function () {
		document.getElementById('upload_code').style.display = "none";
		document.getElementById('upload_state').style.display = "block";
	};
	btnCode.onclick = function () {
		document.getElementById('upload_code').style.display = "block";
		document.getElementById('upload_state').style.display = "none";
	};
	btnRun.onclick = function () {
		runCliUploadFlow(inoPath);
	};
}

// by default, convert 'Big5' to 'utf8'
function decode(buf, encoding = cmd_encoding) {
	return iconv.decode(buf, encoding);
}

function getCoreFromFqbn(fqbn) {
	if (!fqbn) return null;
	var parts = String(fqbn).split(':');
	if (parts.length < 2) return null;
	return parts[0] + ':' + parts[1];
}

function isCoreInstalled(coreName, callback) {
	execFile('arduino-cli', ['core', 'list'], { encoding: 'utf8' }, function (error, stdout, stderr) {
		if (error) {
			callback(error, false);
			return;
		}
		var re = new RegExp('^' + coreName.replace(':', '\\:') + '\\s', 'm');
		callback(null, re.test(stdout || ''));
	});
}

function shellEscape(arg) {
	return "'" + String(arg).replace(/'/g, "'\\''") + "'";
}

function runArduinoCliWithOutput(args, response, onExit) {
	logUpload('spawn arduino-cli ' + args.join(' '));
	var cleanEnv = Object.assign({}, global.process.env);
	delete cleanEnv.PYTHONHOME;
	delete cleanEnv.PYTHONPATH;
	delete cleanEnv.PYTHONEXECUTABLE;
	delete cleanEnv.DYLD_LIBRARY_PATH;
	delete cleanEnv.DYLD_FRAMEWORK_PATH;
	var tmpPyDir = path.join(appRootDir, 'build', 'tmp_py');
	fs.ensureDirSync(tmpPyDir);
	cleanEnv.TMPDIR = tmpPyDir + path.sep;
	var cmd = 'unset PYTHONHOME PYTHONPATH PYTHONEXECUTABLE DYLD_LIBRARY_PATH DYLD_FRAMEWORK_PATH; ' +
		'arduino-cli ' + args.map(shellEscape).join(' ');
	logUpload('exec shell cmd=' + cmd);
	var p = spawn('zsh', ['-lc', cmd], { shell: false, env: cleanEnv });
	p.stdout.on('data', function (data) {
		logUpload('stdout: ' + data.toString('utf8').slice(0, 500));
		response.value += data.toString('utf8');
		response.scrollTop = response.scrollHeight;
	});
	p.stderr.on('data', function (data) {
		logUpload('stderr: ' + data.toString('utf8').slice(0, 500));
		response.value += data.toString('utf8');
		response.scrollTop = response.scrollHeight;
	});
	p.on('error', function (err) {
		logUpload('spawn error: ' + (err && err.message ? err.message : String(err)));
		onExit(err, -1);
	});
	p.on('exit', function (code) {
		logUpload('process exit code=' + code);
		onExit(null, code);
	});
}

function sanitizeMacToolchain(boardFqbn, response, callback) {
	if (os.platform() !== 'darwin') {
		callback(null);
		return;
	}
	var coreName = getCoreFromFqbn(boardFqbn) || '';
	if (coreName !== 'esp32:esp32') {
		callback(null);
		return;
	}

	var esp32Pkg = path.join(os.homedir(), 'Library', 'Arduino15', 'packages', 'esp32');
	if (!fs.existsSync(esp32Pkg)) {
		callback(null);
		return;
	}
	var gatekeeperMarker = path.join(appRootDir, 'sketches', '.esp32_gatekeeper_done');
	if (fs.existsSync(gatekeeperMarker)) {
		callback(null);
		return;
	}

	response.value += "\nApplying macOS Gatekeeper fix (first run only)...\n";
	response.scrollTop = response.scrollHeight;
	logUpload('gatekeeper fix start: ' + esp32Pkg);
	execFile('xattr', ['-dr', 'com.apple.quarantine', esp32Pkg], { encoding: 'utf8', timeout: 15000 }, function (err) {
		if (err) {
			response.value += "\nWarning: failed to clear Gatekeeper quarantine on esp32 toolchain.\n";
			logUpload('gatekeeper fix warning: ' + (err && err.message ? err.message : String(err)));
		} else {
			response.value += "\nGatekeeper fix applied for esp32 toolchain.\n";
			try {
				fs.ensureDirSync(path.join(appRootDir, 'sketches'));
				fs.writeFileSync(gatekeeperMarker, 'ok');
			} catch (e) {}
			logUpload('gatekeeper fix done');
		}
		response.scrollTop = response.scrollHeight;
		callback(null);
	});
}

function ensureArduinoCliAndCore(boardFqbn, response, callback) {
	sanitizeMacToolchain(boardFqbn, response, function () {
		execFile('arduino-cli', ['version'], { encoding: 'utf8' }, function (error, stdout, stderr) {
		if (error) {
			response.value += "\narduino-cli not found. Please run ./install_mac.sh first.\n";
			response.scrollTop = response.scrollHeight;
			callback(error);
			return;
		}
		response.value += "\narduino-cli: " + String(stdout || '').trim() + "\n";
		response.scrollTop = response.scrollHeight;

		var coreName = getCoreFromFqbn(boardFqbn);
		if (!coreName) {
			response.value += "\nInvalid board setting. Please re-select BOARD first.\n";
			response.scrollTop = response.scrollHeight;
			callback(new Error('Invalid board fqbn'));
			return;
		}

		isCoreInstalled(coreName, function (listErr, installed) {
			if (listErr) {
				response.value += "\nFailed to query installed cores.\n";
				response.scrollTop = response.scrollHeight;
				callback(listErr);
				return;
			}
			if (installed) {
				response.value += "\nCore " + coreName + " is installed.\n";
				response.scrollTop = response.scrollHeight;
				callback(null);
				return;
			}

			response.value += "\nInstalling core " + coreName + " ...\n";
			response.scrollTop = response.scrollHeight;
			runArduinoCliWithOutput(['core', 'install', coreName], response, function (installErr, installCode) {
				if (installErr || installCode !== 0) {
					response.value += "\nCore installation failed: " + coreName + "\n";
					response.scrollTop = response.scrollHeight;
					callback(installErr || new Error('core install failed'));
					return;
				}
				response.value += "\nCore installed: " + coreName + "\n";
				response.scrollTop = response.scrollHeight;
				callback(null);
			});
		});
	});
	});
}

function startUploading(inoPath) {
	currentUploadInoPath = inoPath;
	try {
		fs.ensureDirSync(path.join(appRootDir, 'sketches'));
		fs.writeFileSync(uploadDebugLog, '');
		logUpload('open upload dialog');
	} catch (e) {}
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
		buttons: [],
		title: Blockly.Msg.BUTTON_UPLOAD_TITLE + " V12-CLI"
	};
	var $dialog = $("#dialog_upload");
	try {
		if ($dialog.hasClass("ui-dialog-content")) {
			$dialog.dialog("destroy");
		}
	} catch (e) {}
	$dialog.dialog(opt).dialog("open");
	ensureUploadToolbarV9(inoPath);
	try {
		$dialog.dialog("widget").find(".ui-dialog-buttonpane").hide();
	} catch (e2) {}

	document.getElementById('upload_code').value = Blockly.Arduino.workspaceToCode();
	document.getElementById('upload_code').scrollTop = 0;
	document.getElementById('upload_state').value = "[UP-V12 READY]\n按右下角「下載」開始。\n";
	setTimeout(function () {
		document.getElementById('upload_state').value = "[UP-V12 READY]\n按右下角「下載」開始。\n";
	}, 100);
}

function uiStartUploading() {
	clearInterval(detectTimer);

	$('#button_upload').hide();
	$('#uploading-spinner').addClass('active');
}

function uiFinishUploading() {
	$('#uploading-spinner').removeClass('active');
	$('#button_upload').show();
	detectTimer = setInterval(detectPort, 1500);
}

/* port detect */

function detectPort(showScanning) {
	showScanning = !!showScanning;
	if (isPortScanning) {
		return;
	}
	isPortScanning = true;
	// Do not force "scanning..." placeholder on mac; keep last known list usable.
	updatePortSelector(availPorts, selectedPort, false);
	var scanDone = false;

	function finishDetect(ports) {
		if (scanDone) {
			return;
		}
		scanDone = true;
		nextAvailPorts = ports || [];
		hasPortScanCompleted = true;
		isPortScanning = false;
		updateAvailPorts();
	}
	// Prevent scan lock if any async path never returns.
	setTimeout(function () {
		finishDetect(availPorts);
	}, 1200);

	let platform = os.platform();
	if (platform === 'win32') {
		exec('mode', { encoding: 'buffer' }, (error, stdout, stderr) => {
			let output = decode(stdout || Buffer.alloc(0));
			finishDetect(parsePorts(output));
		});
		return;
	}

	if (platform === 'darwin') {
		try {
			var entries = fs.readdirSync('/dev');
			var lines = entries
				.filter(function (name) { return name.indexOf('cu.') === 0; })
				.map(function (name) { return '/dev/' + name; });
			var ports = lines.filter(function (name) {
				return /usb|serial|modem|wch|cp21|ch34|uart/i.test(name) &&
					!/bluetooth|debug-console/i.test(name);
			});
			finishDetect(ports);
		} catch (e) {
			finishDetect([]);
		}
		return;
	}

	// macOS / Linux: read serial devices directly from /dev.
	fs.readdir('/dev', function (error, entries) {
		if (error || !entries) {
			finishDetect([]);
			return;
		}

		let ports = [];
		if (platform === 'darwin') {
			// macOS: prefer callout devices and ignore system virtual ports.
			ports = entries
				.filter(name => name.indexOf('cu.') === 0)
				.filter(name =>
					/usb|serial|modem|wch|cp21|ch34|uart/i.test(name) &&
					!/bluetooth|debug-console/i.test(name))
				.map(name => '/dev/' + name);
		} else {
			ports = entries
				.filter(name =>
					/^tty(USB|ACM|AMA|S)\d+$/i.test(name) ||
					/^rfcomm\d+$/i.test(name))
				.map(name => '/dev/' + name);
		}

		finishDetect(ports);
	});
}

function parsePorts(str) {
	return str.match(/COM\d+/g) || [];
}

function updateAvailPorts() {
	// check if availPorts equal to nextAvailPorts
	if (availPorts.length == nextAvailPorts.length &&
		availPorts.every((v, i) => v === nextAvailPorts[i])) {
		// Always clear "scanning..." text even when list is unchanged.
		updatePortSelector(availPorts, selectedPort, false);
		hasRenderedPortList = true;
		return;
	}
	//console.log('Available ports is changed. Update port-selector...');
	//console.log('nextAvailPorts:', nextAvailPorts);    
	availPorts = nextAvailPorts;
	updatePortSelector(availPorts, selectedPort, false);
	hasRenderedPortList = true;

	// If previously selected port disappears, reset and reselect.
	if (selectedPort && availPorts.indexOf(selectedPort) === -1) {
		selectedPort = null;
		var portLabel = document.querySelector('#port-selected-text');
		portLabel.textContent = 'COM? ';
		portLabel.classList.toggle('blinking-text', true);
	}

	// Select first detected port by default if there is no selected port.
	if (!selectedPort && availPorts.length > 0) {
		selectUploadPort(availPorts[0]);
	}
}

function selectUploadPort(port) {
	selectedPort = port;

	var portLabel = document.querySelector('#port-selected-text')
	portLabel.textContent = formatPortLabel(selectedPort) + ' ';
	portLabel.classList.toggle('blinking-text', false);

	// Save upload COM port setting to local storage
	chrome.storage.local.set({ 'COM': selectedPort }, function () {
		console.log('store COM port setting to ' + selectedPort);
	});

	console.log('change upload port to ' + selectedPort);
}

function formatPortLabel(port) {
	if (!port) {
		return 'COM?';
	}
	return port.replace('/dev/', '');
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

function updatePortSelector(availPorts, selectedPort, scanning) {
	let $dropdownPort = $('#dropdownPort');
	$dropdownPort.empty();
	if (availPorts.length) {
		availPorts.forEach(port => {
			// upload dropdown button's list
			let item_str = '<li><a href="#!" onclick="selectUploadPort(\'' + port + '\')">' + port + '</a>'
			item_str += '<li class="divider">'
			$dropdownPort.append($(item_str))
		});
	} else {
		// upload dropdown button's list
		let text = 'No serial ports found';
		let item_str = '<li><a href="#!">' + text + '</a>';
		$dropdownPort.append($(item_str))
	}
}

detectPort(true);
detectTimer = setInterval(function () { detectPort(false); }, 1500);

var portBtn = document.getElementById('port-btn');
if (portBtn) {
	portBtn.addEventListener('click', function () { detectPort(true); });
}

function writeInoFile(dir, filename) {
	fs.ensureDirSync(dir);
	let code = Blockly.Arduino.workspaceToCode();
	fs.writeFileSync(path.join(dir, filename), code);
}
