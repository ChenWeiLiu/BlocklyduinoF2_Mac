var openButton, saveButton;
var fileEntry;
var Entryflg;
var hasWriteAccess;
var timer1;
var nodeSaveDirPath = null;
var nodeProjectName = null;
var fs = require('fs-extra');
var path = require('path');

function errorHandler(e) {
  var msg = "";

  switch (e.code) {
    case FileError.QUOTA_EXCEEDED_ERR:
      msg = "QUOTA_EXCEEDED_ERR";
      break;
    case FileError.NOT_FOUND_ERR:
      msg = "NOT_FOUND_ERR";
      break;
    case FileError.SECURITY_ERR:
      msg = "SECURITY_ERR";
      break;
    case FileError.INVALID_MODIFICATION_ERR:
      msg = "INVALID_MODIFICATION_ERR";
      break;
    case FileError.INVALID_STATE_ERR:
      msg = "INVALID_STATE_ERR";
      break;
    default:
      msg = "Unknown Error";
      break;
  };

  console.log("Error: " + msg);
}

function handleDocumentChange(title) {
  if (title) {
    title = title.match(/[^/]+$/)[0];
    document.getElementById("info_title").innerHTML = title;
    document.title = title;
  } else {
    document.getElementById("info_title").innerHTML = Blockly.Msg.INFO_TITLE;
  }
}

function newFile() {
  fileEntry = null;
  hasWriteAccess = false;
  Entryflg = 0;
  handleDocumentChange(null);
  if (Blockly.Blocks.board_initializes_setup)
    var xmlDoc = Blockly.Xml.textToDom('<xml xmlns="https://developers.google.com/blockly/xml"><block type="board_initializes_setup" id="0" x="100" y="50"><next><block type="initializes_loop" id="1"></block></next></block></xml>');
  else
    var xmlDoc = Blockly.Xml.textToDom('<xml xmlns="https://developers.google.com/blockly/xml"><block type="initializes_setup" id="0" x="100" y="50"><next><block type="initializes_loop" id="1"></block></next></block></xml>');

  var checkInit = function () {
    if (Blockly.mainWorkspace == null) {
      setTimeout(checkInit, 200);
    } else {
      Blockly.Xml.domToWorkspace(xmlDoc, Blockly.mainWorkspace);
    }
  };
  var initFail = function () {
    if (Blockly.mainWorkspace == null)
      $('#modal0').openModal();
  };
  checkInit();
  setTimeout(initFail, 3000);
}

function setFile(theFileEntry, isWritable) {
  fileEntry = theFileEntry;
  hasWriteAccess = isWritable;
}

function supportsChromeFileSystem() {
  return typeof chrome !== 'undefined' &&
    chrome.fileSystem &&
    typeof chrome.fileSystem.chooseEntry === 'function';
}

function useNodeFileSystem() {
  return (typeof process !== 'undefined' && process.platform === 'darwin') ||
    !supportsChromeFileSystem();
}

function chooseDirectoryNode(callback) {
  var input = document.createElement('input');
  input.type = 'file';
  input.setAttribute('nwdirectory', '');
  input.style.display = 'none';
  input.addEventListener('change', function () {
    var dirPath = null;
    if (input.files && input.files[0] && input.files[0].path) {
      dirPath = input.files[0].path;
    } else if (input.value) {
      dirPath = input.value;
    }
    if (input.parentNode) {
      input.parentNode.removeChild(input);
    }
    callback(dirPath);
  });
  document.body.appendChild(input);
  input.click();
}

function chooseSaveFileNode(defaultName, callback) {
  var input = document.createElement('input');
  input.type = 'file';
  input.setAttribute('nwsaveas', defaultName || 'project.xml');
  input.setAttribute('accept', '.xml');
  input.style.display = 'none';
  input.addEventListener('change', function () {
    var filePath = null;
    if (input.files && input.files[0] && input.files[0].path) {
      filePath = input.files[0].path;
    } else if (input.value) {
      filePath = input.value;
    }
    if (input.parentNode) {
      input.parentNode.removeChild(input);
    }
    callback(filePath);
  });
  document.body.appendChild(input);
  input.click();
}

function getWorkspaceXmlText() {
  var xmlDom = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace);
  var xmlText = Blockly.Xml.domToPrettyText(xmlDom);
  var board = document.getElementById('board-selector');
  if (board && board.options && board.selectedIndex >= 0) {
    xmlText = xmlText.replace('xmlns', 'version="F2" board="' +
      board.options[board.selectedIndex].text + '" xmlns');
  }
  return xmlText;
}

function downloadExportXml() {
  var xmlText = $('#textarea_export').val() || '';
  if (!xmlText.trim()) {
    Materialize.toast(Blockly.Msg.ERROR_FILENAME, 2500);
    return;
  }

  if (useNodeFileSystem()) {
    var defaultName = (nodeProjectName || 'project') + '.xml';
    chooseSaveFileNode(defaultName, function (filePath) {
      if (!filePath) {
        Materialize.toast('Please choose a file path', 2500);
        return;
      }
      if (!/\.xml$/i.test(filePath)) {
        filePath += '.xml';
      }
      try {
        fs.writeFileSync(filePath, xmlText, 'utf8');
        Materialize.toast(Blockly.Msg.POPUP_SAVE_DONE, 2500);
      } catch (err) {
        console.log(err);
        Materialize.toast('Download failed', 2500);
      }
    });
    return;
  }

  var blob = new Blob([xmlText], { type: 'text/xml;charset=utf-8' });
  var link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = (nodeProjectName || 'project') + '.xml';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function saveFilesNode(filename) {
  filename = filename.replace(/[^a-zA-Z0-9]+/ig, '_');
  if (!nodeSaveDirPath) {
    Materialize.toast(Blockly.Msg.ERROR_FILENAME, 4000);
    return;
  }

  var projectDir = path.join(nodeSaveDirPath, filename);
  fs.ensureDirSync(projectDir);
  fs.writeFileSync(path.join(projectDir, filename + '.ino'),
    Blockly.Arduino.workspaceToCode());
  fs.writeFileSync(path.join(projectDir, filename + '.xml'),
    getWorkspaceXmlText());

  nodeProjectName = filename;
  Entryflg = 2;
  hasWriteAccess = true;
  handleDocumentChange(filename + '.ino');
  Materialize.toast(Blockly.Msg.POPUP_SAVE_DONE, 4000);
}

function saveCurrentNodeProject() {
  if (!nodeSaveDirPath || !nodeProjectName) {
    return false;
  }
  saveFilesNode(nodeProjectName);
  return true;
}

function resetNodeSaveTarget() {
  nodeSaveDirPath = null;
  nodeProjectName = null;
}

function readFileIntoEditor(theFileEntry) {
  var filepath = "";

  //File list in directory
  if (!theFileEntry) return;
  var reader = theFileEntry.createReader();
  reader.readEntries(function (entries) {
    for (var i = 0; i < entries.length; ++i) {
      if (entries[i].name.indexOf('.xml') != -1) {
        Entryflg = 1;
        setFile(theFileEntry, true);
        handleDocumentChange(entries[i].name.split('.')[0] + '.ino');
        filepath = entries[i].fullPath;
        writeXmlContent(theFileEntry, filepath);
      }
      if (i == entries.length - 1 & filepath == "") {
        Materialize.toast(Blockly.Msg.DIALOG3_TITLE, 4000) // 4000 is the duration of the toast
        newFile();
      }
    }
  }, errorHandler);
}

function loadWorkspaceFromXmlText(xmlText) {
  Blockly.mainWorkspace.clear();
  Materialize.toast(Blockly.Msg.POPUP_LOADING || 'Loading...', 2000);

  var xmlDoc = Blockly.Xml.textToDom(xmlText);
  window.isLoadingFile = true;
  Blockly.Events.disable();
  if (Blockly.mainWorkspace.setResizesEnabled) {
    Blockly.mainWorkspace.setResizesEnabled(false);
  }

  try {
    Blockly.Xml.domToWorkspace(xmlDoc, Blockly.mainWorkspace);
  } finally {
    Blockly.Events.enable();
    if (Blockly.mainWorkspace.setResizesEnabled) {
      Blockly.mainWorkspace.setResizesEnabled(true);
    }
    Blockly.svgResize(Blockly.mainWorkspace);
    setTimeout(function () {
      window.isLoadingFile = false;
    }, 500);
  }
}

function openNodeProject(dirPath) {
  try {
    var entries = fs.readdirSync(dirPath);
    var xmlFiles = entries.filter(function (name) {
      return /\.xml$/i.test(name);
    }).sort();
    if (!xmlFiles.length) {
      Materialize.toast(Blockly.Msg.DIALOG3_TITLE, 4000);
      newFile();
      return;
    }

    var folderName = path.basename(dirPath);
    var preferredXml = folderName + '.xml';
    var xmlFileName = xmlFiles.indexOf(preferredXml) >= 0 ? preferredXml : xmlFiles[0];
    var xmlPath = path.join(dirPath, xmlFileName);
    var xmlText = fs.readFileSync(xmlPath, 'utf8');

    loadWorkspaceFromXmlText(xmlText);

    var projectName = xmlFileName.replace(/\.xml$/i, '');
    nodeSaveDirPath = path.dirname(dirPath);
    nodeProjectName = projectName;
    fileEntry = null;
    hasWriteAccess = true;
    Entryflg = 2;
    handleDocumentChange(projectName + '.ino');
  } catch (err) {
    console.log(err);
    Materialize.toast('Open project failed', 3000);
  }
}

function writeXmlContent(theFileEntry, filepath) {
  //open xml file and write xml_textarea
  theFileEntry.getFile(filepath, {}, function (fileEntry) {
    fileEntry.file(function (file) {
      var reader = new FileReader();
      reader.onloadend = function (e) {
        loadWorkspaceFromXmlText(this.result);
      };
      reader.readAsText(file);
    }, errorHandler);
  }, errorHandler);
}

function writeEditorToFile(theFileEntry, filename, blob) {
  theFileEntry.getFile(filename, {
    create: true
  }, function (entry) {
    entry.createWriter(function (writer) {
      writer.onerror = function (e) {
        console.log("Write failed: " + e.toString());
      }
      writer.truncate(blob.size);
      writer.onwriteend = function () {
        writer.onwriteend = function (e) {
          if (filename.indexOf(".xml") != -1) {
            Materialize.toast(Blockly.Msg.POPUP_SAVE_DONE, 4000) // 4000 is the duration of the toast
          }
        };
        writer.write(blob);
      }
    }, errorHandler);
  });
}

var onChosenFileToOpen = function (theFileEntry) {
  setFile(theFileEntry, false);
  readFileIntoEditor(theFileEntry);
};

var onWritableFileToOpen = function (theFileEntry) {
  readFileIntoEditor(theFileEntry);
};

var onChosenFileToSave = function (theFileEntry) {
  setFile(theFileEntry, true);
  writeEditorToFile(theFileEntry);
};

function handleOpenButton() {
  if (!useNodeFileSystem()) {
    chrome.fileSystem.chooseEntry({
      type: 'openDirectory'
    }, onWritableFileToOpen);
  } else {
    chooseDirectoryNode(function (dirPath) {
      if (dirPath) {
        openNodeProject(dirPath);
      }
    });
  }
}

function handleSaveButton() {
  var filename;
  var blob;
  if (useNodeFileSystem()) {
    if (saveCurrentNodeProject()) {
      return;
    }
    chooseDirectoryNode(function (dirPath) {
      if (!dirPath) {
        Materialize.toast('Please choose a folder', 2500);
        return;
      }
      nodeSaveDirPath = dirPath;
      $('#modal2').openModal();
    });
    return;
  }

  if (fileEntry && hasWriteAccess) {
    if (Entryflg == 1) {
      filename = fileEntry.name + '.ino';
      blob = new Blob([Blockly.Arduino.workspaceToCode()]);
      writeEditorToFile(fileEntry, filename, blob);

      filename = fileEntry.name + '.xml';
      var xmlDom = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace);
      var xmlText = Blockly.Xml.domToPrettyText(xmlDom);
      blob = new Blob([xmlText]);
      writeEditorToFile(fileEntry, filename, blob);
    } else {
      filename = document.getElementById("info_title").innerHTML;
      saveFiles(filename.split('.')[0]);
    }
  } else {
    chrome.fileSystem.chooseEntry({
      type: 'openDirectory'
    }, function (entry) {
      if (entry) {
        fileEntry = entry;
        $('#modal2').openModal();
      }
    });
  }
}

function set_variable() {
  var input = document.getElementById('dialog_var_name');
  var newVar = input.value;
  if (newVar) {
    newVar = newVar.replace(/[\s\xa0]+/g, ' ').replace(/^ | $/g, '');
    if (newVar == Blockly.Msg.RENAME_VARIABLE ||
      newVar == Blockly.Msg.NEW_VARIABLE) {
      // Ok, not ALL names are legal...
    } else {
      Blockly.Variables.renameVariable(Blockly.Msg.Valiable_text, newVar, Blockly.FieldVariable_workspace);
    }
  }
}

function saveFiles(filename) {
  filename = filename.replace(/[^a-zA-Z0-9]+/ig, '_');
  if (useNodeFileSystem()) {
    saveFilesNode(filename);
    return;
  }

  var blob;
  setFile(fileEntry, true);
  Entryflg = 2;
  chrome.fileSystem.getWritableEntry(fileEntry, function (entry) {
    entry.getDirectory(filename, {
      create: true
    }, function (dirEntry) {
      var ino_filename = filename + '.ino';
      blob = new Blob([Blockly.Arduino.workspaceToCode()]);
      writeEditorToFile(dirEntry, ino_filename, blob);
      handleDocumentChange(ino_filename);

      var xml_filename = filename + '.xml';
      var xmlDom = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace);
      var xmlText = Blockly.Xml.domToPrettyText(xmlDom);
      var board = document.getElementById('board-selector');
      xmlText = xmlText.replace('xmlns', 'version="F2" board="' + board.options[board.selectedIndex].text + '" xmlns');
      blob = new Blob([xmlText]);
      writeEditorToFile(dirEntry, xml_filename, blob);
    }, errorHandler);
  });
}
