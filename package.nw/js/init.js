/*
@license
Copyright 2022 Taiwan (ChungYi Fu)
SPDX-License-Identifier: Apache-2.0

@fileoverview Blocklyduino F2
@author https://www.facebook.com/francefu/
@Update 1/1/2022 00:00 (Taiwan Standard Time)
*/

/**
 * List of tab names.
 * @private
 */

'use strict';

// Apply platform-specific layout fixes for NW.js runtime.
if (typeof process !== 'undefined' && process.platform === 'darwin') {
	document.documentElement.classList.add('platform-macos');
}

var TABS_ = ['blocks', 'arduino', 'xml'];
var selected = 'blocks';
var chosenEntry = null;
var current_lang = "";
var customCategory = [];
var customCategoryInsertAfter = "category_servo";
var arduinoCore_ESP32 = 1;
var arduino_ide = "1.8.19";
var myTimer;
var myTimer1;
var categoryBlocks = [];
var categoryArray = [];
var categoryExpand = [];

/**
 * Switch the visible pane when a tab is clicked.
 * @param {string} clickedName Name of tab clicked.
 */
function tabClick(clickedName) {
	// Deselect all tabs and hide all panes.
	for (var i = 0; i < TABS_.length; i++) {
		var name = TABS_[i];
		document.getElementById('tab_' + name).className = 'taboff';
		document.getElementById('content_' + name).style.visibility = 'hidden';
	}

	// Select the active tab.
	selected = clickedName;
	document.getElementById('tab_' + clickedName).className = 'tabon';
	// Show the selected pane.
	document.getElementById('content_' + clickedName).style.visibility = 'visible';
	renderContent();
	Blockly.fireUiEvent(window, 'resize');
}

/**
 * Populate the currently selected pane with content generated from the blocks.
 */
function renderContent() {
	var content = document.getElementById('content_' + selected);
	// Initialize the pane.
	if (content.id == 'content_blocks') {
		// If the workspace was changed by the XML tab, Firefox will have performed
		// an incomplete rendering due to Blockly being invisible.  Rerender.
		Blockly.mainWorkspace.render();
	} else if (content.id == 'content_arduino') {
		//content.innerHTML = Blockly.Arduino.workspaceToCode();
		var arduinoTextarea = document.getElementById('content_arduino');
		arduinoTextarea.value = Blockly.Arduino.workspaceToCode();
		arduinoTextarea.focus();
	} else if (content.id == 'content_xml') {
		//content.innerHTML = Blockly.Arduino.workspaceToCode();
		var xmlTextarea = document.getElementById('content_xml');
		var xml = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace);
		var data = Blockly.Xml.domToPrettyText(xml);
		var board = document.getElementById('board-selector');
		data = data.replace('xmlns', 'version="F2" board="' + board.options[board.selectedIndex].text + '" xmlns')
		xmlTextarea.value = data;
		xmlTextarea.focus();
	}
}

/**
 * Compute the absolute coordinates and dimensions of an HTML element.
 * @param {!Element} element Element to match.
 * @return {!Object} Contains height, width, x, and y properties.
 * @private
 */
function getBBox_(element) {
	var height = element.offsetHeight;
	var width = element.offsetWidth;
	var x = 0;
	var y = 0;
	do {
		x += element.offsetLeft;
		y += element.offsetTop;
		element = element.offsetParent;
	} while (element);
	return {
		height: height,
		width: width,
		x: x,
		y: y
	};
}

/**
 * Initialize Blockly.  Called on page load.
 */
function buildBlocks(xmlValue) {
	//window.onbeforeunload = function() {
	//  return 'Leaving this page will result in the loss of your work.';
	//};
	var container = document.getElementById('content_area');
	var onresize = function (e) {
		var bBox = getBBox_(container);
		for (var i = 0; i < TABS_.length; i++) {
			var el = document.getElementById('content_' + TABS_[i]);
			el.style.top = bBox.y + 'px';
			el.style.left = bBox.x + 'px';
			// Height and width need to be set, read back, then set again to
			// compensate for scrollbars.
			el.style.height = bBox.height + 'px';
			el.style.height = (2 * bBox.height - el.offsetHeight) + 'px';
			el.style.width = bBox.width + 'px';
			el.style.width = (2 * bBox.width - el.offsetWidth) + 'px';
		}
		// Make the 'Blocks' tab line up with the toolbox.
		if (Blockly.mainWorkspace.toolbox_.width) {
			document.getElementById('tab_blocks').style.minWidth = (Blockly.mainWorkspace.toolbox_.width - 38) + 'px';
			// Account for the 19 pixel margin and on each side.
		}
	};
	window.addEventListener('resize', onresize, false);

	//----------------------------------------------------

	//新增系統自訂積木
	if (typeof systemBlocks != "undefined") {
		for (var i = 0; i < systemBlocks.length; i++) {
			var customBlocksPath = systemBlocks[i][0];  //自訂積木連結
			var insertAfterCategoryName = systemBlocks[i][1];  //可將自訂積木插入在指定目錄後
			addSystemBlocks(customBlocksPath, insertAfterCategoryName);
		}
	}

	//載入系統自訂積木
	function addSystemBlocks(customBlocksPath, insertAfterCategoryName) {
		var blocks_path = customBlocksPath + "blocks.js";   //載入自訂積木定義檔	
		var javascript_path = customBlocksPath + "javascript.js";   //載入自訂積木轉出程式碼檔	
		var toolbox_path = customBlocksPath + "toolbox.xml";  //載入自訂積木目錄檔	
		var en_path = customBlocksPath + "en.js";  //載入積木文字英文語系設定檔	
		var en_category_path = customBlocksPath + "en_category.xml";  //載入積木目錄文字英文語系設定檔
		var zhhant_path = customBlocksPath + "zh-hant.js";  //載入積木文字繁體語系設定檔(預設繁體語系)
		var zhhant_category_path = customBlocksPath + "zh-hant_category.xml";  //載入積木目錄文字繁體語系設定檔(預設繁體語系)

		if (document.getElementById('select-lang-en').checked)
			addScript(en_path);
		else
			addScript(zhhant_path);

		addScript(blocks_path);
		addScript(javascript_path);

		$.ajax({
			type: "GET",
			url: toolbox_path,
			dataType: "xml",
			timeout: 3000,
			async: false,
			success: function (xml, textStatus) {
				//if (new XMLSerializer().serializeToString(xml.firstChild))
				//customCategory.push([new XMLSerializer().serializeToString(xml.firstChild) ,insertAfterCategoryName ,'']);

				try {
					var len = new DOMParser().parseFromString(xmlValue, "text/xml").firstChild.childNodes.length;
					var xmlNewValue = '<xml id="toolbox">';
					if (len > 0) {
						var exist = false;
						for (var i = 0; i < len; i++) {
							if (insertAfterCategoryName == "") {
								xmlNewValue += new XMLSerializer().serializeToString(xml.firstChild);
								insertAfterCategoryName = "insertTop";
								exist = true;
							}
							var node = new XMLSerializer().serializeToString(new DOMParser().parseFromString(xmlValue, "text/xml").firstChild.childNodes[i]);
							xmlNewValue += node;
							if (node.indexOf(insertAfterCategoryName) != -1 && insertAfterCategoryName != "") {
								xmlNewValue += new XMLSerializer().serializeToString(xml.firstChild);
								exist = true;
							}
						}
						if (exist == false)
							xmlNewValue += new XMLSerializer().serializeToString(xml.firstChild);
					}
					xmlNewValue += '</xml>';
					xmlValue = xmlNewValue;

					categoryArray = [];
					categoryArray.push(xmlValue);
					updateCategoryBlocks(categoryArray);

				} catch (error) {
					console.log(error);
				}
			},
			error: function (jqXHR, textStatus, errorThrown) {
				console.log(jqXHR.statusText);
			}
		});
	}


	//-------------------------
	const workspace = Blockly.inject(
		document.getElementById('content_blocks'),
		{
			media: filepath.media
			, toolbox: xmlValue
			, grid: { spacing: 20, length: 3, colour: '#eee', snap: true }
			, zoom: { controls: true, wheel: false, startScale: 1.0, maxScale: 3, minScale: 0.3, scaleSpeed: 1.2 }
			, trashcan: true
			, move: {
				scrollbars: {
					horizontal: true,
					vertical: true
				},
				drag: true,
				wheel: true
			}
			, plugins: {
				'blockDragger': ScrollBlockDragger,
				'metricsManager': ScrollMetricsManager,
			}
		}
	);

	//const AutoScrollOptionsPlugin = new AutoScroll(workspace);
	const scrollOptionsPlugin = new ScrollOptions(workspace);
	scrollOptionsPlugin.init({ enableWheelScroll: true, enableEdgeScroll: true });
	ScrollBlockDragger.edgeScrollEnabled = false;

	// 效能優化：安全版 fireChangeListener 節流
	// BLOCK_CREATE 事件：全部同步執行（積木建立必須）
	// 其他事件：積木 onchange handler 節流，最多每 200ms 執行一次
	(function patchFireChangeListener() {
		var onchangeThrottleTimer = null;
		var latestNonCreateEvent = null;
		var workspaceRef = null;

		Blockly.Workspace.prototype.fireChangeListener = function (event) {
			// undo/redo stack 處理（保持原始行為）
			if (event.recordUndo) {
				this.undoStack_.push(event);
				this.redoStack_.length = 0;
				while (this.undoStack_.length > this.MAX_UNDO && 0 <= this.MAX_UNDO)
					this.undoStack_.shift();
			}

			// BLOCK_CREATE 事件：全部同步執行（積木初始化需要）
			if (event.type === Blockly.Events.BLOCK_CREATE) {
				for (var i = 0, c; c = this.listeners_[i]; i++) c(event);
				return;
			}

			// 其他事件：非 onchange listener 立即執行，onchange 節流
			for (var i = 0, c; c = this.listeners_[i]; i++) {
				if (c.name === 'bound onchange') {
					// 跳過，稍後節流執行
				} else {
					c(event);
				}
			}

			// 節流執行積木 onchange（最多每 200ms 一次）
			workspaceRef = this;
			latestNonCreateEvent = event;
			if (!onchangeThrottleTimer) {
				onchangeThrottleTimer = setTimeout(function () {
					onchangeThrottleTimer = null;
					if (workspaceRef && latestNonCreateEvent) {
						var listeners = workspaceRef.listeners_;
						for (var j = 0, fn; fn = listeners[j]; j++) {
							if (fn.name === 'bound onchange') {
								try { fn(latestNonCreateEvent); } catch (e) { }
							}
						}
					}
				}, 200);
			}
		};
	})();


	//auto_save_and_restore_blocks();
	setCheckbox();

	setTimeout(function () { newFile(); }, 1000);

	//當工作區變動
	var blockChange = {};
	var pendingBlockIds = new Set(); // 效能優化：收集受影響的積木 ID
	var myTimerPending = false; // 效能優化：標記是否有 timer 正在等待
	function onBlocksChange(event) {
		// 效能優化：載入檔案時跳過所有處理
		if (window.isLoadingFile) {
			return;
		}
		// 效能優化：忽略拖曳中的事件，避免拖曳時重複執行
		if (event.type === Blockly.Events.BLOCK_DRAG && event.isStart) {
			return;
		}
		// 忽略 UI 事件（如選取、點擊等）
		if (event.isUiEvent) {
			return;
		}
		// 效能優化：忽略 mutation 事件（在 Mutator 編輯積木結構時）
		if (event.type === Blockly.Events.CHANGE && event.element === 'mutation') {
			return;
		}

		// 效能優化：收集受影響的積木 ID
		if (event.blockId) {
			pendingBlockIds.add(event.blockId);
		}

		// 效能優化：如果已有 timer 在等待，只收集 ID，不建立新 timer
		// 這樣密集事件（如 mutator compose、拖曳等）不會不斷重置 timer
		if (myTimerPending) {
			return;
		}
		myTimerPending = true;

		// 效能優化：固定間隔觸發，不被後續事件重置
		myTimer = setTimeout(function () {
			blockChange = {};
			var enabledBlockList = ["initializes_loop"];
			var variableBlockList = ["variables_set", "variables_set1", "variables_set7"];
			var variableGlobalBlockList = ["variables_set", "variables_set1"];

			// 效能優化：只處理受影響的積木及其整條鏈，而非遍歷所有積木
			var blocksToProcess = [];
			var processedIds = new Set();

			// 從受影響的積木出發，收集所有相關的積木（自身 + 所有子積木）
			pendingBlockIds.forEach(function (blockId) {
				var block = Blockly.mainWorkspace.getBlockById(blockId);
				if (!block) return;
				// 找到頂層積木
				var topBlock = block;
				while (topBlock.getParent()) {
					topBlock = topBlock.getParent();
				}
				// 收集頂層積木下的所有子積木
				var descendants = topBlock.getDescendants(false);
				for (var j = 0; j < descendants.length; j++) {
					if (!processedIds.has(descendants[j].id)) {
						processedIds.add(descendants[j].id);
						blocksToProcess.push(descendants[j]);
					}
				}
			});
			pendingBlockIds.clear();

			var p;
			for (var i = 0; i < blocksToProcess.length; i++) {
				p = blocksToProcess[i];
				if (enabledBlockList.includes(p.type) || variableBlockList.includes(p.type) || (p.previousConnection == null && p.outputConnection == null)) {
					if (topCheck && blocksToProcess[i].getParent() && !blocksToProcess[i].isEnabled())
						blockChange[blocksToProcess[i].id] = true;
					if (variableGlobalBlockList.includes(blocksToProcess[i].type) && blocksToProcess[i].getField("POSITION")) {
						if (blocksToProcess[i].getFieldValue("POSITION") == "global")
							continue;
					}
					else
						continue;
				}
				p = p.getParent() || p.getPreviousBlock() ? p.getParent() || p.getPreviousBlock() : "";
				while (p) {
					if ((enabledBlockList.includes(p.type) || variableBlockList.includes(p.type) || (p.previousConnection == null && p.outputConnection == null)) && !p.getParent()) {
						if (topCheck && blocksToProcess[i].getParent() && !blocksToProcess[i].isEnabled())
							blockChange[blocksToProcess[i].id] = true;
						break;
					}
					p = p.getParent() || p.getPreviousBlock() ? p.getParent() || p.getPreviousBlock() : "";
				}
				if ((!blocksToProcess[i].getParent() || !blocksToProcess[i].getParent().isEnabled()) && (blocksToProcess[i].targetConnection == null || blocksToProcess[i].outputConnection == null)) {
					if (topCheck && (!blocksToProcess[i].getParent() || !blocksToProcess[i].outputConnection || blocksToProcess[i].previousConnection) && blocksToProcess[i].isEnabled())
						blockChange[blocksToProcess[i].id] = false;
				}
				if (blocksToProcess[i].getParent() && blocksToProcess[i].getPreviousBlock()) {
					if (variableBlockList.includes(p.type) && variableBlockList.includes(blocksToProcess[i].getParent().type)) {
						if (topCheck)
							blocksToProcess[i].unplug();
					}
				}
			}
		}, 800);

		myTimer1 = setTimeout(function () {
			myTimerPending = false; // timer 完成，允許下次建立新 timer
			if (topCheck) {
				for (var i in blockChange) {
					var block = workspace.getBlockById(i);
					if (!block) continue; // 安全檢查：積木可能已被刪除
					if (block.parentBlock_) {
						while (block.parentBlock_) {
							block = block.parentBlock_;
						}
						if (block.isEnabled())
							workspace.getBlockById(i).setEnabled(true);
						else
							workspace.getBlockById(i).setEnabled(blockChange[i]);
					}
					else
						workspace.getBlockById(i).setEnabled(blockChange[i]);
				}
			}
		}, 1200);
	}
	workspace.addChangeListener(onBlocksChange);


	//工具箱目錄執行顯示狀態
	setTimeout(function () {
		chrome.storage.local.get(['CATEGORY'], function (item) {
			if (item.CATEGORY) {
				var category = Blockly.getMainWorkspace().getToolbox().getToolboxItems();
				for (var i = 0; i < category.length; i++) {
					for (var j = 0; j < item.CATEGORY.length; j++) {
						if (category[i].toolboxItemDef_.id == item.CATEGORY[j][0]) {
							if (item.CATEGORY[j][1] == 0) {
								category[i].hide();
							}
						}
					}
				}
			}
			Blockly.getMainWorkspace().resize();
		});
	}, 1000);

	//載入遠端自訂積木
	function addCustomRemoteBlocks(customBlocksPath, insertAfterCategoryName) {
		var blocks_path = customBlocksPath + "blocks.js";   //載入自訂積木定義檔	
		var javascript_path = customBlocksPath + "javascript.js";   //載入自訂積木轉出程式碼檔	
		var toolbox_path = customBlocksPath + "toolbox.xml";  //載入自訂積木目錄檔	
		var en_path = customBlocksPath + "en.js";  //載入積木文字英文語系設定檔	
		var en_category_path = customBlocksPath + "en_category.xml";  //載入積木目錄文字英文語系設定檔
		var zhhant_path = customBlocksPath + "zh-hant.js";  //載入積木文字繁體語系設定檔(預設繁體語系)
		var zhhant_category_path = customBlocksPath + "zh-hant_category.xml";  //載入積木目錄文字繁體語系設定檔(預設繁體語系)

		var lang_path = zhhant_path;
		if (document.getElementById('select-lang-en').checked)
			lang_path = en_path;

		$.getScript(lang_path, function () {
			addScript(blocks_path);
			addScript(javascript_path);

			$.ajax({
				type: "GET",
				url: toolbox_path,
				dataType: "xml",
				timeout: 3000,
				async: false,
				success: function (xml, textStatus) {
					if (xml.firstChild) {
						var category_ = new XMLSerializer().serializeToString(xml.firstChild);
						try {
							if (document.getElementById('select-lang-en').checked) {
								var xmlCustom = $.ajax({ url: en_category_path, async: false }).responseXML.firstChild;
							} else {
								var xmlCustom = $.ajax({ url: zhhant_category_path, async: false }).responseXML.firstChild;
							}
							for (var i = 0; i < xmlCustom.childNodes.length; i++) {
								if (xmlCustom.childNodes[i].nodeName.toLowerCase() == "category") {
									var ini = xmlCustom.childNodes[i].childNodes[0].firstChild.nodeValue;
									var rep = xmlCustom.childNodes[i].childNodes[1].firstChild.nodeValue;
									while (category_.indexOf('name="' + ini + '"') != -1 && ini != rep) {
										category_ = category_.replace('name="' + ini + '"', 'name="' + rep + '"');
									}
								}
							}
							updateCategoryBlocks(xmlCustom);
						}
						catch (e) {
							//console.log(e);
						}

						checkCategoryExist(customBlocksPath);
						customCategory.push([category_, insertAfterCategoryName, customBlocksPath]);

						var category = new DOMParser().parseFromString(xmlValue, "text/xml").firstChild;
						if (category.childNodes.length > 0) {
							for (var j = 0; j < customCategory.length; j++) {
								for (var i = 0; i < category.childNodes.length; i++) {
									if (category.childNodes[i].id == customCategory[j][1] && customCategory[j][0])
										category.insertBefore(new DOMParser().parseFromString(customCategory[j][0], "text/xml").firstChild, category.childNodes[i].nextSibling);
									else if (customCategory[j][1] == "") {
										category.insertBefore(new DOMParser().parseFromString(customCategory[j][0], "text/xml").firstChild, category.childNodes[0]);
										break;
									}
								}
							}
						}

						Blockly.getMainWorkspace().updateToolbox(category);

						categoryArray = [];
						categoryArray.push(new XMLSerializer().serializeToString(category));
						updateCategoryBlocks(categoryArray);
					}
				},
				error: function (jqXHR, textStatus, errorThrown) {
					console.log(jqXHR.statusText);
				}
			});
		});
	}

	function addScript(url) {
		var s = document.createElement("script");
		s.type = "text/javascript";
		s.src = url;
		$("body").append(s);
	}

	function checkCategoryExist(child) {
		for (var i = 0; i < customCategory.length; i++) {
			if (child == customCategory[i][2])
				customCategory.splice(i, 1);
		}
	}
	/*
		//新增擴充自訂積木
		document.querySelector('#button_addExtensionBlocks').addEventListener("click", function(evt) {
			if (typeof customBlocks != "undefined") {
				for (var i=0;i<customBlocks.length;i++) {
					addCustomRemoteBlocks(customBlocks[i][0], customBlocks[i][1]);
				}
			}
		});
		document.querySelector('#button_addExtensionBlocks').click();
	*/
	if (typeof customBlocks != "undefined") {
		for (var i = 0; i < customBlocks.length; i++) {
			addCustomRemoteBlocks(customBlocks[i][0], customBlocks[i][1]);
		}
	}

	//新增遠端自訂積木
	document.querySelector('#button_addRemoteBlocks').addEventListener("click", function (evt) {
		var customBlocksPath = prompt(Blockly.Msg["CUSTOMBLOCKS_TITLE"], '');
		if (customBlocksPath) {
			if (!customBlocksPath.endsWith("/"))
				customBlocksPath += "/";
			var lang = "en";
			addCustomRemoteBlocks(customBlocksPath, customCategoryInsertAfter);
		}
	});

	function updateMsg() {
		if (typeof msg != "undefined") {
			console.log(document.getElementById(msg[i][0]));
			for (var i = 0; i < msg.length; i++) {
				if (msg[i][1] == "innerHTML")
					document.getElementById(msg[i][0]).innerHTML = msg[i][2];
				else if (msg[i][1] == "title")
					document.getElementById(msg[i][0]).title = msg[i][2];
			}

		}
	}

	//切換語言
	function changeLanguage() {
		addScript(languageList);
		if (typeof language != "undefined") {
			for (var i = 0; i < language.length; i++) {
				if (language[i][0] == lang) {
					addScript(language[i][1]);
				}
			}
		}

		if (typeof systemBlocks != "undefined") {
			for (var i = 0; i < systemBlocks.length; i++) {
				if (document.getElementById('lang-selector').value == "en")
					addScript(systemBlocks[i][0] + "en.js");
				else
					addScript(systemBlocks[i][0] + "zh-hant.js");
			}
		}

		flashToolbox();

		var xml = Blockly.Xml.workspaceToDom(Blockly.getMainWorkspace());
		Blockly.getMainWorkspace().clear();
		Blockly.Xml.domToWorkspace(xml, Blockly.getMainWorkspace());
	}

	function flashToolbox() {
		var category = new DOMParser().parseFromString(xmlValue, "text/xml").firstChild;
		Blockly.getMainWorkspace().updateToolbox(category);

		var category = JSON.parse(JSON.stringify(customCategory));
		for (var i = 0; i < category.length; i++) {
			if (category[i][2]) addCustomRemoteBlocks(category[i][2], "");
		}
	}

	//新增初始化積木
	newFile();

	//load from url parameter (single param)
	//http://stackoverflow.com/questions/2090551/parse-query-string-in-javascript
	var dest = unescape(location.search.replace(/^.*\=/, '')).replace(/\+/g, " ");
	if (dest) {
		//load_by_url(dest);
	}

	function updateCategoryBlocks(newCategory) {
		categoryBlocks = [];
		for (var i = 0; i < newCategory.length; i++) {
			var categoryString = newCategory[i].replace(/(?:\r\n|\r|\n|\t)/g, "");
			var xml = new DOMParser().parseFromString(categoryString, "text/xml");
			searchCategoryBlocks(xml.firstChild.childNodes);
		}
	}
	function searchCategoryBlocks(nodes) {
		if (nodes.length > 0) {
			for (var j = 0; j < nodes.length; j++) {
				if (nodes[j].nodeName == "category")
					searchCategoryBlocks(nodes[j].childNodes);
				else if (nodes[j].nodeName == "block")
					categoryBlocks.push(new XMLSerializer().serializeToString(nodes[j]));
			}
		}
	}
}

function searchBlocks() {
	var opt = {
		dialogClass: "dlg-no-close",
		draggable: true,
		autoOpen: false,
		resizable: true,
		modal: false,
		//show: "blind",
		//hide: "blind",			
		width: 260,
		height: 180,
		buttons: [
			{
				text: Blockly.Msg.BUTTON_CLOSE,
				click: function () {
					$(this).dialog("close");
				}
			},
			{
				text: Blockly.Msg.BUTTON_CLEAR,
				click: function () {
					document.getElementById('searchblocks_keyword').value = "";
				}
			},
			{
				text: Blockly.Msg["MYSEARCH"],
				click: function () {
					mySearchBlocks(document.getElementById('searchblocks_keyword').value);
				}
			}
		],
		title: Blockly.Msg["MYSEARCH_QUERY"]
	};
	$("#dialog_searchblocks").dialog(opt).dialog("open");
	event.preventDefault();
}

function toolboxCategory() {
	var categorymenu = '<table><tr><td colspan="4"><p id="category-title">' + Blockly.Msg.TOOLBOX_DISPLAY + '</p></td></tr><tr><td colspan="4">　</td></tr>';
	var items = Blockly.getMainWorkspace().getToolbox().getToolboxItems();
	var j = 0;
	var checked = "";
	for (var i = 0; i < items.length; i++) {
		if (items[i].toolboxItemDef_.kind == "CATEGORY" && !items[i].parent_) {
			checked = items[i].isHidden_ ? "" : " checked";
			j++;
			if (j % 2 == 1) categorymenu += "<tr>";
			if (items[i].toolboxItemDef_.name.indexOf("%{BKY_") != -1)
				categorymenu += '<td>' + eval(items[i].toolboxItemDef_.name.replace("%{BKY_", "Blockly.Msg[\"").replace("}", "\"]")) + '</td><td><div class="switch"><label><input type="checkbox" onchange="toolbox_display(this,\'' + items[i].toolboxItemDef_.id + '\')" ' + checked + '><span class="lever"></span></label></div></td>';
			else
				categorymenu += '<td>' + items[i].toolboxItemDef_.name + '</td><td><div class="switch"><label><input type="checkbox" onchange="toolbox_display(this,\'' + items[i].toolboxItemDef_.id + '\')" ' + checked + '><span class="lever"></span></label></div></td>';
			if (j % 2 == 0) categorymenu += "</tr>";
		}

	}
	if (j % 2 != 0) categorymenu += "</tr>";
	categorymenu += "<table>";
	document.getElementById('categorymenu').innerHTML = categorymenu;
}

function versionCompare(v1, v2, options) {
	var lexicographical = options && options.lexicographical,
		zeroExtend = options && options.zeroExtend,
		v1parts = v1.split('.'),
		v2parts = v2.split('.');

	function isValidPart(x) {
		return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);
	}

	if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
		return NaN;
	}

	if (zeroExtend) {
		while (v1parts.length < v2parts.length) v1parts.push("0");
		while (v2parts.length < v1parts.length) v2parts.push("0");
	}

	if (!lexicographical) {
		v1parts = v1parts.map(Number);
		v2parts = v2parts.map(Number);
	}

	for (var i = 0; i < v1parts.length; ++i) {
		if (v2parts.length == i) {
			return 1;
		}

		if (v1parts[i] == v2parts[i]) {
			continue;
		}
		else if (v1parts[i] > v2parts[i]) {
			return 1;
		}
		else {
			return -1;
		}
	}

	if (v1parts.length != v2parts.length) {
		return -1;
	}

	return 0;
}

function init() {
	var loadIds;
	var base = "category_logic,category_loops,category_array,category_math,category_text,category_cast,category_variables,category_procedures,category_sep_main,category_initializes,category_digital,category_analog,category_serial,category_others,category_time,category_interrupts,category_servo,category_sep,category_linkit_wifi,category_linkit_mcs,category_linkit_lremote,category_linkit_ble,category_linkit_ble_ibeacon,category_sep,category_sensor,category_display,category_transceiver,category_sep,category_grove,category_sep,category_external,category_sep";

	try {
		var manifestData = chrome.runtime.getManifest();
		var updateURL = manifestData.update_url;
		var isPreRelease = false;
		if (manifestData.version_name.indexOf('b', manifestData.version_name.length - 1) !== -1) {
			isPreRelease = true;
			updateURL = updateURL.replace('/master/', '/dev/');
			base += ",category_sep,category_beta";
			Materialize.toast(Blockly.Msg.ERROR_BETA_WARNING, 10000);
		}

		if (manifestData.version.length > 0) {
			var client = new XMLHttpRequest();
			client.open('GET', updateURL);
			client.onreadystatechange = function () {
				if (client.readyState == 4 && client.status == 200) {
					if (client.responseText) {
						var resp = JSON.parse(client.responseText);
						if (versionCompare(resp.version, manifestData.version) > 0) {
							var message = Blockly.Msg.MESSAGE_UPDATE + resp.version;
							if (isPreRelease) {
								message += Blockly.Msg.SETTINGS_VERSION_PRE_RELEASE;
							}
							message += Blockly.Msg.MESSAGE_UPDATE_APPEND;
							Materialize.toast(message, 10000);
						}
					}
				}
			}
			client.send();
		}
	}
	catch (err) {

	}
	finally {

	}

	chrome.storage.local.get('toolboxids', function (value) {
		var option = value.toolboxids;
		// set the default toolbox if none
		if (option === undefined || option === "") {
			loadIds = base;
		} else {
			loadIds = base + ',' + option;
		}
		var xmlValue = '<xml id="toolbox">';
		var xmlids = loadIds.split(",");
		for (var i = 0; i < xmlids.length; i++) {
			if ($('#' + xmlids[i]).length) {
				xmlValue += $('#' + xmlids[i])[0].outerHTML;
			}
		}
		xmlValue += '</xml>';
		buildBlocks(xmlValue);
		tabClick('blocks');
	})
};

function setCheckbox() {
	var option;

	chrome.storage.local.get("toolboxids", function (value) {
		option = value.toolboxids;
		if (option === undefined || option === "") {
			return;
		}
		var options = option.split(",");
		for (var i = 0; i < options.length; i++) {
			$('#chbox_' + options[i]).prop("checked", true);
		}
	})
}

function setScript(param) {
	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.id = 'msg';
	script.src = filepath["msg_" + param];
	var str = "#select-lang-" + param;
	$(str).prop('checked', true);
	current_lang = param;

	var firstScript = document.getElementsByTagName('head')[0].appendChild(script);
	firstScript.parentNode.insertBefore(script, firstScript);
	script.onload = function (e) {
		setCharacter();
		init();
	}
}

function setCharacter() {
	setCategoryCharacter();

	try {
		var manifestData = chrome.runtime.getManifest();
		$("#version").on('click', function () {
			nw.Shell.openExternal(manifestData.update_url);
			return false;
		});
		if (manifestData.version_name.indexOf('b', manifestData.version_name.length - 1) !== -1) {
			$("#version").text(Blockly.Msg.SETTINGS_VERSION + manifestData.version + Blockly.Msg.SETTINGS_VERSION_PRE_RELEASE);
		} else {
			$("#version").text(Blockly.Msg.SETTINGS_VERSION + manifestData.version);
		}
	}
	catch (err) {
		$("#version").remove();
	}
	finally {

	}

	$("#tab_blocks").text(Blockly.Msg.BLOCKS);
	$("#tab_arduino").text(Blockly.Msg.ARDUINO);
	$("#tab_xml").text(Blockly.Msg.XML);

	$("#go-to-web").attr("data-tooltip", Blockly.Msg.GO_TO_WEB);
	$("#go-to-sample").attr("data-tooltip", Blockly.Msg.GO_TO_SAMPLE);
	$("#open-setting").attr("data-tooltip", Blockly.Msg.SETTING);
	$("#dialog-lang-title").text(Blockly.Msg.DIALOG_LANG_TITLE);
	$("#dialog-esp32-title").text(Blockly.Msg["DIALOG_ESP32_TITLE"]);
	$("#dialog-ide-title").text(Blockly.Msg["DIALOG_IDE_TITLE"]);
	$("#dialog-block-title").text(Blockly.Msg.DIALOG_BLOCK_TITLE);

	$("#auto-save-title").text(Blockly.Msg.AUTO_SAVE_TITLE);
	$("#range-title").html(Blockly.Msg.RANGE_TITLE + '<input type="range" id="save-time" min="1" max="10" />');

	$("#setting-cancel").text(Blockly.Msg.SETTINGS_CANCEL);
	$("#setting").text(Blockly.Msg.SETTINGS_OK);
	$("#setting-close").text(Blockly.Msg.DIALOG_EXPORT_OK);

	$("#button_copycode").attr("data-tooltip", Blockly.Msg.BUTTON_COPYCODE);
	$("#button_new").attr("data-tooltip", Blockly.Msg.BUTTON_NEW);
	$("#button_save").attr("data-tooltip", Blockly.Msg.BUTTON_SAVE);
	$("#button_open").attr("data-tooltip", Blockly.Msg.BUTTON_OPEN);
	$("#button_toolbox").attr("data-tooltip", Blockly.Msg.TOOLBOX_DISPLAY);
	//$("#button_discard").text(Blockly.Msg.DROPDOWN_DISCARD);
	$("#button_save_as").text(Blockly.Msg.DROPDOWN_SAVE_AS);
	$("#dialog0_title").text(Blockly.Msg.DIALOG0_TITLE);
	$("#dialog1_title").text(Blockly.Msg.DIALOG1_TITLE);
	$("#dialog1_yes").text(Blockly.Msg.DIALOG1_YES);
	$("#dialog1_no").text(Blockly.Msg.DIALOG1_NO);
	$("#dialog4_title").text(Blockly.Msg.DIALOG4_TITLE);
	$("#dialog4_yes").text(Blockly.Msg.DIALOG1_YES);
	$("#dialog4_no").text(Blockly.Msg.DIALOG1_NO);
	$("#info_filename").html(Blockly.Msg.INFO_FILENAME);
	$("#info_title").html(Blockly.Msg.INFO_TITLE);
	$("#dialog2_title").text(Blockly.Msg.DIALOG2_TITLE);

	$("#button_import").text(Blockly.Msg.BUTTON_IMPORT);
	$("#button_export").text(Blockly.Msg.BUTTON_EXPORT);
	$('#textarea_import_label').text(Blockly.Msg.TEXTAREA_IMPORT_LABEL);
	$('#textarea_export_label').text(Blockly.Msg.TEXTAREA_EXPORT_LABEL);
	$('#dialog_import_ok').text(Blockly.Msg.DIALOG_IMPORT_OK);
	$('#dialog_import_cancel').text(Blockly.Msg.DIALOG_IMPORT_CANCEL);
	$('#dialog_export_ok').text(Blockly.Msg.DIALOG_EXPORT_OK);

	$("#button_launch_serial").attr("data-tooltip", Blockly.Msg.LAUNCHSERIAL);
	$("#button_copycode").attr("title", Blockly.Msg["BUTTON_COPYCODE"]);
	$("#button_showhide").attr("title", Blockly.Msg["BUTTON_SHOWHIDE"]);

	$("#arduino_code").attr("data-tooltip", Blockly.Msg.ARDUINO_CODE);
	/*
	$("#button_previous").attr("data-tooltip",Blockly.Msg.PREVIOUSSTEP);
	$("#button_next").attr("data-tooltip",Blockly.Msg.NEXTSTEP);  
	$("#button_downloadpng").attr("data-tooltip",Blockly.Msg.DOWNLOAD);  
	*/
	$("#button_addRemoteBlocks").attr("data-tooltip", Blockly.Msg["BUTTON_CUSTOMBLOCKS"]);
	$("#button_addExtensionBlocks").attr("data-tooltip", Blockly.Msg["BUTTON_ADDEXTENSIONBLOCKS"]);
	$("#button_launch_ide").attr("data-tooltip", Blockly.Msg.BUTTON_LAUNCH_IDE);
	$("#button_upload").attr("data-tooltip", Blockly.Msg.BUTTON_UPLOAD);
	$("#button_board_settings").attr("data-tooltip", Blockly.Msg.BUTTON_BOARD_SETTINGS);
	$("#modal_text_board_settings").text(Blockly.Msg.BUTTON_BOARD_SETTINGS);

	$("#button_webSerial").attr("data-tooltip", Blockly.Msg["BUTTON_WEBSERIAL"]);
	$("#button_webBluetooth").attr("data-tooltip", Blockly.Msg["BUTTON_WEBBLUETOOTH"]);
	$("#button_webMQTT").attr("data-tooltip", Blockly.Msg["BUTTON_WEBMQTT"]);
	$("#button_openF2Page").attr("data-tooltip", Blockly.Msg["BUTTON_OPENF2PAGE"]);
	$("#button_spBlocklyJS").attr("data-tooltip", Blockly.Msg["BUTTON_SPBLOCKLYJS"]);
	$("#button_spBlocklyTool").attr("data-tooltip", Blockly.Msg["BUTTON_SPBLOCKLYTOOL"]);

	//$("#text_uploader_status").text(Blockly.Msg.TEXT_UPLOADER_STATUS);
	$('#text_uploader_status').text(Blockly.Msg.ARDUINO_CODE);
	$('#showCodeState').html('1');

	$("#label_text_board").text(Blockly.Msg.TEXT_BOARD);
	$("#label_text_com_port").text(Blockly.Msg.TEXT_COM_PORT);
	$("#dropdown_item_scanning").text(Blockly.Msg.DROPDOWN_SCANNING);

	$("#tab_code").text(Blockly.Msg.BUTTON_UPLOAD_CODE);
	$("#tab_state").text(Blockly.Msg.BUTTON_UPLOAD_STATE);


	//吉哥積木版本檢查
	$.ajax({
		type: "GET",
		url: "https://lioujj.github.io/LinkIt7697/extensions/version.txt",
		dataType: "text",
		timeout: 3000,
		async: false,
		success: function (latestVersion, textStatus) {
			var version = "20250322";
			console.log(latestVersion);
			if ($("#info_filename") && latestVersion > version)
				$("#info_filename").html("<font color=yellow>請更新吉哥積木:" + latestVersion + "版</font> " + Blockly.Msg.INFO_FILENAME);
		},
		error: function (jqXHR, textStatus, errorThrown) {
			console.log(errorThrown);
		}
	});


	// Load upload COM port setting from local storage
	try {
		chrome.storage.local.get(['COM'], function (item) {
			if (availPorts.length == 1) {
				selectUploadPort(availPorts[0]);
			}
			else if (item.COM) {
				console.log("reload COM port setting to " + item.COM);
				selectUploadPort(item.COM);
			}
		});
	} catch (err) {
		console.log(err)
	}

	try {
		chrome.storage.local.get(['BOARD'], function (item) {
			if (item.BOARD) {
				console.log("reload board setting to " + item.BOARD);
				selectBoard(item.BOARD);
			}
		});
	} catch (err) {
		console.log(err)
	}

}

function export_xml() {
	var xml = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace);
	var data = Blockly.Xml.domToPrettyText(xml);
	var board = document.getElementById('board-selector');
	data = data.replace('xmlns', 'version="F2" board="' + board.options[board.selectedIndex].text + '" xmlns');
	$('#textarea_export').val(data);
	$('#textarea_export').trigger('autoresize');
	$('#modal_export').openModal();
}

function import_xml() {
	var xml = $('#textarea_import').val();
	$('#textarea_import').val("");
	var xmlDoc = Blockly.Xml.textToDom(xml);
	// Blockly.mainWorkspace.clear();
	Blockly.Xml.domToWorkspace(Blockly.mainWorkspace, xmlDoc);
}

window.onload = function () {
	var keys = ['lang'];
	// load from localStorage
	chrome.storage.local.get(keys, function (item) {
		if (!item.lang) {
			var item = {
				'lang': 'zh'
			};
			// save to localStorage
			chrome.storage.local.set(item, function () {
				//console.log('item saved.');
			});
			setScript("zh");
		} else {
			setScript(item.lang);
		}
	});

	var keys = ['esp32'];
	// load from localStorage
	chrome.storage.local.get(keys, function (item) {
		if (!item.esp32) {
			var item = {
				'esp32': 'new'
			};
		}
		// save to localStorage
		chrome.storage.local.set(item, function () {
			//console.log('item saved.');
		});
		var str = "#select-esp32-" + item.esp32;
		$(str).prop('checked', true);
		arduinoCore_ESP32 = (item.esp32 == "new") ? 1 : null;
	})

	var keys = ['ide'];
	// load from localStorage
	chrome.storage.local.get(keys, function (item) {
		if (!item.ide) {
			var item = {
				'ide': '1.8.19'
			};
		}
		// save to localStorage
		chrome.storage.local.set(item, function () {
			//console.log('item saved.');
		});
		var str = ("#select-ide-" + item.ide).replace(/\./g, "-");
		$(str).prop('checked', true);
		arduino_ide = item.ide;
	})

	contentZoom('terminal');
};

chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
		if (request.method == "url") {
			var xhr = new XMLHttpRequest();
			xhr.open("GET", request.url, true);
			xhr.onreadystatechange = function () {
				if (xhr.readyState == 4) {
					// WARNING! Might be evaluating an evil script!
					newFile();
					Blockly.mainWorkspace.clear();
					var xml = xhr.responseText;
					xml = xml.replace("<html><head/><body><xml>", '');
					xml = xml.replace("</body></html>", '');
					var xmlDoc = Blockly.Xml.textToDom(xml);
					Blockly.Xml.domToWorkspace(xmlDoc, Blockly.mainWorkspace);
				}
			}
			xhr.send();
			sendResponse({ farewell: "goodbye" });
		} else if (request.method == "autosave") {
			if (Entryflg != 0 && hasWriteAccess) {
				handleSaveButton();
				//Materialize.toast(Blockly.Msg.POPUP_SAVE_DONE, 4000) // 4000 is the duration of the toast
			}
			sendResponse({ farewell: "goodbye" });
		}
	});

function toolbox_display(chk, categoryid) {
	var category = Blockly.getMainWorkspace().getToolbox().getToolboxItems();
	for (var i = 0; i < category.length; i++) {
		if (category[i].toolboxItemDef_.id == categoryid)
			chk.checked == false ? category[i].hide() : category[i].show();
	}
	Blockly.getMainWorkspace().resize();

	category = Blockly.getMainWorkspace().getToolbox().getToolboxItems();
	var items = [];
	for (var i = 0; i < category.length; i++) {
		if (category[i].toolboxItemDef_.id != "category_sep")
			items.push([category[i].toolboxItemDef_.id, category[i].isHidden_ == true ? 0 : 1]);
	}
	chrome.storage.local.set({ 'CATEGORY': items }, function () { });
}

function dropdownSetValue(text) {
	var dropdown = document.getElementById('board-selector');
	var span = document.getElementById('board-selected-text');
	if (dropdown.options.length > 0) {
		for (var i = 0; i < dropdown.options.length; i++) {
			if (dropdown.options[i].innerText == text) {
				dropdown.value = dropdown.options[i].value;
				dropdown.selectedIndex = i;
				span.innerHTML = dropdown.options[i].innerText;
				break;
			}
		}
	}
}

var showCode = false;
var showCodeMessage = false;
var showCodeDelay = 6000;

//縮放視窗
function contentZoom(content) {
	const div_content = document.getElementById("resizable");
	const div_code = document.getElementById("terminal-body");
	if (div_content.style.height != "40px") {
		div_content.w = div_content.style.width;
		div_content.h = div_content.style.height;
		div_content.l = div_content.style.left;
		div_content.t = div_content.style.top;

		div_content.style.width = "calc(20vw)";
		div_content.style.height = "40px";
		div_code.style.display = "none";
		div_content.style.left = "calc(98% - 20vw)";
		div_content.style.top = "110px";
		showCode = false;
		document.getElementById('terminal-body').innerHTML = "";
	}
	else {
		div_content.style.width = div_content.w;
		div_content.style.height = div_content.h;
		div_code.style.display = "block";
		div_content.style.left = div_content.l;
		div_content.style.top = div_content.t;
		if (!showCodeMessage)
			document.getElementById('terminal-body').innerHTML = Blockly.Msg["MESSAGE_SHOWCODE"];
		setTimeout(function () {
			showCode = true;
			showCodeMessage = true;
			showCodeDelay = 0;
			var code = Blockly.Arduino.workspaceToCode();
			document.getElementById('terminal-body').innerHTML = code.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>").replace(/ /g, "&nbsp;");
		}, showCodeDelay);
	}
}

var gui = require('nw.gui');
var win = gui.Window.get();
win.show();
win.maximize();

win.on('close', function (event) {
	var xml = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace);
	var data = Blockly.Xml.domToText(xml);
	chrome.storage.local.set({ 'CODE': data }, function () { });
	var yes = confirm(Blockly.Msg.WINDOW_CLOSE_MESSAGE);
	if (yes) {
		win.close(true);
	}
});



var http = require('http');
var fs = require('fs');
var path = require('path');

http.createServer(function (request, response) {
	console.log('request ', request.url.split("?")[0]);

	var filePath = './package.nw' + request.url.split("?")[0];
	if (filePath == './package.nw/') {
		filePath = './package.nw/main.html'
	}

	var extname = String(path.extname(filePath)).toLowerCase();
	var mimeTypes = {
		'.html': 'text/html',
		'.js': 'text/javascript',
		'.css': 'text/css',
		'.json': 'application/json',
		'.png': 'image/png',
		'.jpg': 'image/jpg',
		'.gif': 'image/gif',
		'.svg': 'image/svg+xml',
		'.wav': 'audio/wav',
		'.mp4': 'video/mp4',
		'.woff': 'application/font-woff',
		'.ttf': 'application/font-ttf',
		'.eot': 'application/vnd.ms-fontobject',
		'.otf': 'application/font-otf',
		'.wasm': 'application/wasm'
	};

	var contentType = mimeTypes[extname] || 'application/octet-stream';

	fs.readFile(filePath, function (error, content) {
		if (error) {
			if (error.code == 'ENOENT') {
				fs.readFile('./404.html', function (error, content) {
					response.writeHead(404, { 'Content-Type': 'text/html' });
					response.end(content, 'utf-8');
				});
			}
			else {
				response.writeHead(500);
				response.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
			}
		}
		else {
			response.writeHead(200, { 'Content-Type': contentType });
			response.end(content, 'utf-8');
		}
	});

}).listen(3000);

// Server: http://127.0.0.1:3000 
