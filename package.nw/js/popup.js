"user strict"

document.addEventListener('DOMContentLoaded', function() {
	$.ajax({
		type: "GET" ,
		url: "category/category_F2.xml" ,
		dataType: "xml",
		timeout: 3000,
		async: false,
		success: function(xml, textStatus) {
			if (xml.firstChild) {
				var toolbox_ = document.getElementById('toolbox');
				var Nodes = xml.firstChild.childNodes;
				for (var i=0;i<Nodes.length;i++){
					if (Nodes[i].nodeName!="#text") {
						toolbox_.appendChild(Nodes[i]);
					}							
				}
			}
		},
		error: function (jqXHR, textStatus, errorThrown) {
			console.log(errorThrown);
		}
	});	
		
  var blocks = document.getElementById('tab_blocks');
  // onClick's logic below:
  blocks.addEventListener('click', function() {
    tabClick('blocks');
  });

  var arduino = document.getElementById('tab_arduino');
  // onClick's logic below:
  arduino.addEventListener('click', function() {
    tabClick('arduino');
  });  

  var xml = document.getElementById('tab_xml');
  // onClick's logic below:
  xml.addEventListener('click', function() {
    tabClick('xml');
  });   

  document.querySelector('#open-setting').addEventListener("click", function(evt) {
    var keys = ['autosave', 'interval'];
    // localStorageから読込
    chrome.storage.local.get(keys, function(item) {
      if (!item.autosave) {
        $("#checkbox-auto-save").prop('checked', false);
      } else {
        if (item.autosave == 'on') $("#checkbox-auto-save").prop('checked', true);
        else $("#checkbox-auto-save").prop('checked', false);
      }
      if (!item.interval) {
        $("#save-time").val("1");
      } else {
        $("#save-time").val(item.interval);
      }
    });
    $('#modal3').openModal();
  });

  document.querySelector('#setting').addEventListener("click", function(evt) {
    var checkbox = $('.filled-in:checked').map(function() {
      return $(this).val();
    }).get();
    var str = checkbox.join(',');

    var val = $('[class="with-gap"]:checked').map(function() {
      //$(this)でjQueryオブジェクトが取得できる。val()で値をvalue値を取得。
      return $(this).val();
    }).get();
    var autosave = 'off';
    var interval = $("#save-time").val();
    if ($("#checkbox-auto-save:checked").val() == 'on') {
      autosave = 'on';
      chrome.alarms.create("myAlarm", {
        periodInMinutes: Number(interval)
      });
    } else {
      chrome.alarms.clear("myAlarm");
    }
	var version = $('[class="with-gap1"]:checked').map(function() {
      return $(this).val();
    }).get();
	
	var ide = $('[class="with-gap2"]:checked').map(function() {
      return $(this).val();
    }).get();	

    // localStorageから読込
    var new_item = {
      'lang': val[0],
      'esp32': version[0],	 
      'ide': ide[0],	  
      'autosave': autosave,
      'interval': interval,
      'toolboxids': str
    };
    // localStorageへ保存
    chrome.storage.local.set(new_item, function() {
      console.log('item saved.');
    });
    chrome.runtime.reload();
  });

  document.querySelector('#setting-cancel').addEventListener("click", function(evt) {
    $('#modal3').closeModel();
  });
  
  document.querySelector('#setting-close').addEventListener("click", function(evt) {
    $('#modal5').closeModel();
  });  

  document.querySelector('#button_new').addEventListener("click", function(evt) {
    var count = Blockly.mainWorkspace.getAllBlocks().length;
    if (count > 0 || Entryflg != 0) {
      $('#modal1').openModal();
    }
  });

  // document.querySelector('#dialog0_ok').addEventListener("click", function(evt) {
  //   newFile();
  // });

  document.querySelector('#dialog1_yes').addEventListener("click", function(evt) {
    Blockly.mainWorkspace.clear();
    renderContent();
    newFile();
  });

  $('#dialog2_ok').click(function() {
    var input = document.getElementById('dialog2_filename');
    var filename = input.value.trim();
    if (false === input.checkValidity()) {
      input.value = "";
      setFile(null, false);
      Materialize.toast(Blockly.Msg.ERROR_FILENAME2, 4000) // 4000 is the duration of the toast
      return;
    }
    if (filename.length > 0) {
      saveFiles(filename);
    } else {
      setFile(null, false);
      Materialize.toast(Blockly.Msg.ERROR_FILENAME, 4000) // 4000 is the duration of the toast
    }
  });

  $('#dialog2_filename').keydown(function(event){
    if ((event.keyCode || event.which) == 13) {
      $('#dialog2_ok').click();
    }
  });

  document.querySelector('#dialog2_cancel').addEventListener("click", function(evt) {
    setFile(null, false);
    console.log("dialog2_cansel");
  });

  // document.querySelector('#button_discard').addEventListener("click", function(evt) {
  //   var count = Blockly.mainWorkspace.getAllBlocks().length;
  //   if (count > 0) {
  //     $('#modal4').openModal();
  //   }
  // });

  document.querySelector('#dialog4_yes').addEventListener("click", function(evt) {
     chrome.runtime.reload(); //Reset for defaul.
    //Blockly.mainWorkspace.clear();
    //renderContent();
  });

  document.querySelector('#dialog_var_ok').addEventListener("click", function(evt) {
    set_variable();
  });

  document.querySelector('#button_import').addEventListener("click", function(evt) {
    $('#modal_import').openModal();
  });

  document.querySelector('#dialog_import_ok').addEventListener("click", function(evt) {
    import_xml();
  });

  document.querySelector('#button_export').addEventListener("click", function(evt) {
    export_xml();
  });

  document.querySelector('#dialog_export_ok').addEventListener("click", function(evt) {
    if (typeof downloadExportXml === 'function') {
      downloadExportXml();
    }
  });
  
  document.querySelector('#button_copycode').addEventListener("click", function(evt) {
	  var text = document.getElementById('terminal-body').innerText;
	  navigator.clipboard.writeText(text).then(function() {
		alert(Blockly.Msg["BUTTON_COPYCODE_SUCCESS"]);
	  }, function(err) {
		alert("Not support!");
	  });
  });
	
  document.querySelector('#button_open').addEventListener("click", handleOpenButton);
  document.querySelector('#button_save').addEventListener("click", handleSaveButton);
  document.querySelector('#button_save_as').addEventListener("click", function(evt) {
    setFile(null, false);
    if (typeof resetNodeSaveTarget === 'function') {
      resetNodeSaveTarget();
    }
    handleSaveButton();
  });
  
  document.querySelector('#button_toolbox').addEventListener("click", function(evt) {
	toolboxCategory();
    $('#modal5').openModal();
  }); 
  
  //Web Serial
  document.getElementById('button_webSerial').addEventListener("click", function(evt) {
	if (typeof nw !== "undefined")
		nw.Shell.openExternal("https://fustyles.github.io/webduino/WebSerial.html")
	else
		window.open("https://fustyles.github.io/webduino/WebSerial.html")
  });  
  
  //Web Bluetooth
  document.getElementById('button_webBluetooth').addEventListener("click", function(evt) {
	if (typeof nw !== "undefined")
		nw.Shell.openExternal("https://fustyles.github.io/webduino/WebBluetooth.html")
	else
		window.open("https://fustyles.github.io/webduino/WebBluetooth.html")
  });

  //Web MQTT
  document.getElementById('button_webMQTT').addEventListener("click", function(evt) {
	if (typeof nw !== "undefined")
		nw.Shell.openExternal("http://127.0.0.1:3000/WebMQTT.html")
	else
		window.open("https://fustyles.github.io/webduino/mqtt_basic_page.html")
  });    
  
  //開啟Blocklyduino F2網頁
  document.querySelector('#button_openF2Page').addEventListener("click", function(evt) {
	if (typeof nw !== "undefined")
		nw.Shell.openExternal("https://fustyles.github.io/webduino/SpBlocklyF1/index.html");
	else
		window.open("https://fustyles.github.io/webduino/SpBlocklyF1/index.html");
  });
  
  //開啟SpBlocklyJS網頁
  document.querySelector('#button_spBlocklyJS').addEventListener("click", function(evt) {
	if (typeof nw !== "undefined")
		nw.Shell.openExternal("https://fustyles.github.io/webduino/SpBlocklyJS/index.html");
	else
		window.open("https://fustyles.github.io/webduino/SpBlocklyJS/index.html");
  });

  //開啟SpBlockly tool網頁
  document.querySelector('#button_spBlocklyTool').addEventListener("click", function(evt) {
	if (typeof nw !== "undefined")
		nw.Shell.openExternal("https://fustyles.github.io/webduino/SPduino_tool/index.html");
	else
		window.open("https://fustyles.github.io/webduino/SPduino_tool/index.html");
  });  


  /*  
  document.querySelector('#button_previous').addEventListener("click", function(evt) {
    Blockly.mainWorkspace.undo(false);
  });
  document.querySelector('#button_next').addEventListener("click", function(evt) {
    Blockly.mainWorkspace.undo(true);
  });
  document.querySelector('#button_downloadpng').addEventListener("click", function(evt) {
	Blockly.downloadScreenshot(Blockly.mainWorkspace);
  });  
  */  

  $('.dropdown-button').dropdown({
      coverTrigger: false,
      constrainWidth: true,
      hover: false,
      belowOrigin: true,
      gutter: 0,
    }
  );
  
  document.querySelector('#arduino_code').addEventListener("click", function(evt) {
	var div = document.getElementById('resizable');	
	var code = document.getElementById('showCodeState');
	if (div.style.display == "block"||div.style.display == "")
		div.style.display = "none";
	else
		div.style.display = "block";		  
	$('#text_uploader_status').text(Blockly.Msg.ARDUINO_CODE);
	$('#showCodeState').html('1');
  }); 

/*
  setInterval(function(){
		var code = Blockly.Arduino.workspaceToCode();			
		document.getElementById('terminal-body').innerHTML = code.replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br>").replace(/ /g,"&nbsp;");
  },500);
*/
  
  //程式碼顯示區塊調整大小功能	
  $(function() {
	$( "#resizable" ).draggable();
  });

  //程式碼顯示區塊拖曳功能
  $(function() {
	$( "#resizable" ).resizable();
  });
  
	//Double Click關閉彈出積木選單
	setTimeout(function() {
		var blocklyWorkspace = document.getElementsByClassName("blocklyFlyout");
		for (var f=0;f<blocklyWorkspace.length;f++) {
			blocklyWorkspace[f].addEventListener('dblclick', function(){ 
				Blockly.hideChaff();
			});
		}
	}, 3000);
});
