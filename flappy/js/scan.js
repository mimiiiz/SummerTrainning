// enchant.js用スキャンライブラリ


var SpriteScanner = enchant.Class.create(enchant.Sprite, {
    //初期化処理
    initialize: function(_game) {
        this.game = _game || game;
        enchant.Sprite.call(this, this.game.width, this.game.height);
        // プロパティ
        this.scanTargets = [];	// スキャン対象配列
        this.horizonGroups = [];
        this.verticalGroups = [];
        this.scanTargetsNum = 0  // スキャン対象数
        this.horizonGroupsNum = 0  // スキャン対象数
        this.verticalGroupsNum = 0  // スキャン対象数
        this.scanTargetsIndex = -1; // スキャン対象配列の現在値インデックス(初期値-1)
        this.horizonGroupsIndex = -1; // スキャン対象配列グループの現在値インデックス(初期値-1)
        this.verticalGroupsIndex = -1; // スキャン対象配列グループの現在値インデックス(初期値-1)
        this.timeCount = 0; // 何フレームたったかカウント
        this.repeatCount = 0; // スキャンの周回数をカウント
        this.state = 'stop'; // スキャンの状態（run:動作中, stop:停止, pause:一時停止, select:選択中, wait:開始待ち）
		this.ev = new Event('scanselect'); // touchイベント発火用

        // スキャンの設定
        this.scanType = 'auto'; // スキャン方式（auto:オートスキャン, step:ステップスキャン, step1: 1スイッチステップスキャン, mouse:マウス滞留）
        this.scanSE = 1; // スキャン時のSE（0:OFF、1:ON）
        this.selectSE = 1; // 決定時のSE（0:OFF、1:ON）
        this.scanVoice = 0; // scan時のスキャン対象の音声読み上げ（0:OFF、1:ON）
        this.firstWait = 1; // 最初のスキャンまでの待ち時間[秒]
        this.scanInterval = 1.0; // オートスキャンの間隔[秒]
        this.oneSwitchStepScanWait = 2; // 1スイッチステップスキャンの決定までの待ち時間[秒]
        this.mouseHoverWait = 2; // マウス滞留入力の決定までの待ち時間[秒]
        this.selectWait = 1.0; // 選択後の待ち時間[秒]
        this.frameWidth = 10;  // スキャン枠の太さ[px]
        this.selectFrameWidth = 15;  // スキャン枠の選択時の太さ[px]
        this.scanPattern = 'linear';    // スキャンパターン（horizon:水平グループ、vertical:垂直グループ、linear:単体）
        this.scanRepaet = -1;    // 何週スキャンして停止するか（-1で無限リピート）
        this.stepScanType = 'touch' // ステップスキャンで使うスイッチインターフェース（touch:ipadタッチャーなどの画面タッチの代替え機器, key:キーボードやBluetoothなどの外部入力機器）
        this.iPadToucherArea = 'right-bottom' // iPadタッチャーを使う際にフォーカス移動が可能なエリア(1:左上, 2:右上, 3:左下, 4:右下)
        this.hover = new Sprite(10, 10); // hover判定用

        // フォーカスの設定
        this.focusType = 'frame'; // フォーカスの種類（frame:枠線、background:背景色変更）
        this.focusColor = '#ff0000'; // フォーカスの色
        // this.backgroundWidth = null;
        // this.backgroundHeight = null;

        // スキャン設定ファイルがあるときはそれを読み込む
        this.setScanSettingData();

        // SEの設定
        this.scan_se = '/sounds/scan/cursor8.mp3';
        this.select_se = '/sounds/scan/decision1.mp3';
        var ASSETS = [
        	this.scan_se,
        	this.select_se
        ];
        this.game.preload(ASSETS);

        // Surfaceオブジェクトの作成
        this.surface = new Surface(this.width, this.height);
        this.image = this.surface;
        this.context = this.surface.context;

        //キーバインドの設定(a:決定, b:ステップ)
        this.initialKeyBind();
        // スイッチ入力対応
        var obj = this;
        this.game.addEventListener('abuttondown', function(){obj.aButtonDown();});
        this.game.addEventListener('bbuttondown', function(){obj.bButtonDown();});

        // canvas外のタッチにも対応する
        this.touchEnabled = false; // htmlのクリックイベントとspriteのタッチイベントが重複するのでspriteのタッチイベントはOFFにしておく
        var _touch = ('ontouchstart' in document) ? 'touchstart' : 'click';
        $('html').on(_touch, function(e){
            if($(e.target).hasClass("touchable")) {
                // touchableクラスの要素がタッチされたときはタッチイベントを発火しない
            } else {
                // タッチイベント発火
                obj.ontouchstart();
            }
        });

        // ゲームがロードされた後に行いたい処理
        this.game.addEventListener('load', function(){
        	// スキャンタイプごとの前処理
        	obj.prepareScan();
        });
    },
    ontouchstart: function(){
        // console.log('click or touch');
        switch(this.scanType) {
            case 'auto': this.dispatchTouchEvent(); break;
            case 'step': this.dispatchTouchEvent(); break;
            case 'step1':
            	if(this.state == 'run') {
            		this.scan();
            		this.timeCount = 0;
            	}
            	break;
            case 'mouse': break;
            default: break;
        }

    },
    onenterframe: function() {
        switch(this.state) {
            case 'run': this.run(); break;
            case 'stop': break;
            case 'pause': break;
            case 'select': this.select();break;
            case 'wait': break;
            default: break;
        }
    },
    aButtonDown: function() {
        // console.log('a button down');
    	switch(this.scanType) {
            case 'auto': this.dispatchTouchEvent(); break;
            case 'step': this.dispatchTouchEvent(); break;
            case 'step1':
            	if(this.state == 'run') {
            		this.scan();
            		this.timeCount = 0;
            	}
            	break;
            case 'mouse': break;
            default: break;
        }
    },
    bButtonDown: function() {
        // console.log('b button down');
        if(this.scanType == 'step' && this.state == 'run') {
        	this.scan();
        }
    },
    // 決定
    dispatchTouchEvent: function() {
    	switch(this.state) {
            case 'run':
                // なにもスキャンしていないときはbreak
                if(this.scanTargetsIndex == -1) {
                    break;
                }
                // select状態にしつつ、待ち時間の後、スキャン中のターゲットのタッチイベント発火
                if(this.selectSE === 1) {
                    this.game.assets[this.select_se].clone().play();
                }
                this.scanSelect();
                var obj = this;
                this.game.currentScene.tl.delay(this.selectWait*this.game.fps)
                 .then(function(){
                 	var scanTargetsIndex = obj.scanTargetsIndex;
                    obj.scanStop();
                    obj.scanTargets[scanTargetsIndex].dispatchEvent(obj.ev);
                });
                break;
            case 'stop': break;
            case 'pause': break;
            case 'select': break;
            case 'wait': this.scanStart(); break;
            default: break;
        }
    },
    // 次の選択肢をスキャン
    scan: function(_index) {
        var index = _index || 0;
        // スキャン対象を更新
        if(this.scanType === 'mouse') {
            // マウス滞留の場合
            this.scanTargetsIndex = index;
        } else {
            // オートスキャン、ステップスキャンの場合
            this.scanTargetsIndex = (this.scanTargetsIndex+1) % this.scanTargetsNum;
        }

        // スキャン対象の各パラメータを取得
        var t = this.scanTargets[this.scanTargetsIndex];
        var x = this.realCordinateX(t);
        var y = this.realCordinateY(t);
        var width = t.width*t.scaleX;
        var height = t.height*t.scaleY;
        var lineWidth = this.frameWidth
        // spriteそのものではなく一定範囲をスキャンする場合の値更新
        /*
        if(this.backgroundWidth != null) {
            x -= (this.backgroundWidth - width)/2;
            width = this.backgroundWidth;
        }
        if(this.backgroundHeight != null) {
            y -= (this.backgroundHeight - height)/2;
            height = this.backgroundHeight;
        }
        */

        // スキャン時の音
        if(this.scanVoice === 1) {
            // スキャン時の音声読み上げファイルが設定されている場合
            if('voice' in this.scanTargets[this.scanTargetsIndex]) {
                this.scanTargets[this.scanTargetsIndex].voice.clone().play();
            }
        } else if(this.scanSE === 1) {
            // スキャン時のSE
            this.game.assets[this.scan_se].clone().play();
        }

        // フォーカスタイプごとのフォーカスを当てる
        switch(this.focusType) {
            case 'frame':
                this.createFrame(x, y, width, height, lineWidth);
                break;
            case 'background':
                this.createRectangle(x, y, width, height);
                break;
            default: break;
        }
    },
/* 毎フレーム呼び出される各状態ごとのメソッド */
    run: function() {
        // スキャン方式ごとに処理
        switch(this.scanType) {
            case 'auto':
                // 指定時間経過した場合にスキャンを進める
                this.timeCount++;
                if(this.scanInterval <= this.timeCount/this.game.fps) {
                    // スキャン対象がある　かつ　スキャンの繰り返し回数に達していない場合スキャン実行
                    if(this.scanTargetsNum != 0 && this.scanScanContinue()) {
                        this.scan();
                    }
                    // フレーム数のカウントを初期化
                    this.timeCount = 0;
                }
                break;
            case 'step': break;
            case 'step1':
                this.timeCount++;
                // 指定時間経過した場合にタッチイベントを発火
                if(this.oneSwitchStepScanWait <= this.timeCount/this.game.fps) {
                    // タッチイベント発火
                    this.dispatchTouchEvent();
                    // フレーム数のカウントを初期化
                    this.timeCount = 0;
                }
                break;
            case 'mouse':
                var obj = this;
                // マウスの移動に合わせてhover（Sprite)を移動する
                window.document.onmousemove = function(e){
                    var mouse = obj.getMousePosition(e);
                    obj.hover.moveTo( mouse.x, mouse.y );
                }
                // マウスが乗っているスキャン対象にフォーカス枠を当てる
                this.checkHober();
                // フォーカス枠が当たっている場合
                if(this.scanTargetsIndex != -1) {
                    this.timeCount++;
                    // 指定時間経過した場合にタッチイベントを発火
                    if(this.mouseHoverWait <= this.timeCount/this.game.fps) {
                        // タッチイベント発火
                        this.dispatchTouchEvent();
                        // フレーム数のカウントを初期化
                        this.timeCount = 0;
                    }
                }
                break;
            default: break;
        }
    },
    stop: function() {

    },
    pause: function() {

    },
    select: function() {
        var t = this.scanTargets[this.scanTargetsIndex];
        var x = this.realCordinateX(t);
        var y = this.realCordinateY(t);
        var width = t.width*t.scaleX;
        var height = t.height*t.scaleY;
        var lineWidth = this.selectFrameWidth
        // spriteそのものではなく一定範囲をスキャンする場合の値更新
        /*
        if(this.backgroundWidth != null) {
            x -= (this.backgroundWidth - width)/2;
            width = this.backgroundWidth;
        }
        if(this.backgroundHeight != null) {
            y -= (this.backgroundHeight - height)/2;
            height = this.backgroundHeight;
        }
        */
        this.createFrame(x, y, width, height, lineWidth);
    },
    wait: function() {

    },
/* スキャン対象の制御メソッド */
    setScanTargets: function(scanTargets) {
        // 引数が配列かどうか判定
        if(Array.isArray(scanTargets)) {
            // 配列の場合は代入
            this.scanTargets = scanTargets;
        } else {
            // 変数の場合は再定義
            this.scanTargets = [scanTargets];
        }
        // スキャン対象数を更新
        this.scanTargetsNum = this.scanTargets.length;
    },
    addScanTargets: function(scanTargets) {
    	// 引数が配列かどうか判定
    	if(Array.isArray(scanTargets)) {
            // 配列の場合は連結
    		Array.prototype.push.apply(this.scanTargets, scanTargets);
    	} else {
            // 変数の場合はプッシュ
    		this.scanTargets.push(scanTargets);
    	}
        // スキャン対象数を更新
        this.scanTargetsNum = this.scanTargets.length;
    },
    removeScanTarget: function(scanTarget) {
        for (var i=0; i < this.scanTargetsNum; i++) {
            if(this.scanTargets[i] == scanTarget) {
                this.scanTargets.splice(i, 1);
                // フレームが残ってしまうので消しておく
                this.context.clearRect(0, 0, this.width, this.height);
            }
        }
        // スキャン対象数を更新
        this.scanTargetsNum = this.scanTargets.length;
        // スキャン対象が0になった場合はスキャンを停止
        if(this.scanTargetsNum == 0) {
            this.scanStop();
        }
    },
    resetScanTarget: function() {
        this.scanTargets = [];
        this.scanTargetsNum = 0;
        //this.state = 'stop';
    },
    setHorizonGroups : function() {
/*****  今はIndexを使っているがNumを使うべきかもしれん  ****/
        var groupY = [];
        for (var i=0; i < this.scanTargetsNum; i++) {
            var flag = 0;

            for(var j=0; j < this.horizonGroupsIndex+1; j++) {
                // 既存のグループに属せる場合は追加
                if(groupY[j] == this.scanTargets[i].y) {
                    this.horizonGroups[j].push(this.scanTargets[i]);
                    // グループのプロパティ更新
                    var t = this.scanTargets[i];
                    var x = t.x+((t.width-t.width*t.scaleX)/2);
                    var width = t.width*t.scaleX;
                    this.horizonGroups[j].width = x + width - this.horizonGroups[j].x;
                    flag = 1;
                    j = this.horizonGroupsIndex+1;
                }
            }
            if(flag == 0) {
                // 新しいグループを作成
                this.horizonGroupsIndex++;
                groupY[this.horizonGroupsIndex] = this.scanTargets[i].y;
                this.horizonGroups[this.horizonGroupsIndex] = [];   // 二次元配列の宣言
                this.horizonGroups[this.horizonGroupsIndex].push(this.scanTargets[i]);
                // グループのプロパティ設定
                var t = this.scanTargets[i];
                var x = t.x+((t.width-t.width*t.scaleX)/2);
                var y = t.y+((t.height-t.height*t.scaleY)/2);
                var height = t.height*t.scaleY;
                this.horizonGroups[this.horizonGroupsIndex].x = x;
                this.horizonGroups[this.horizonGroupsIndex].y = y;
                this.horizonGroups[this.horizonGroupsIndex].height = height;
            }
        }
    },
    setVerticalGroups : function() {

    },
/* スキャンの制御メソッド */
    scanStart: function() {
        this.state = 'run';
        // スキャンタイプによって最初の項目のスキャンを実行し待ち時間を長めにとる
        if(this.scanType == 'auto' || this.scanType == 'step' || this.scanType == 'step1') {
        	// 最初の項目をスキャン
	        this.scan();
	        // スキャン開始時の最初の項目だけ個別に待ち時間を設定可能
	        this.timeCount = -( this.firstWait * this.game.fps);
        }
    },
    scanStop: function() {
        this.state = 'stop';
        this.scanTargetsIndex = -1;
        this.timeCount = 0;
        this.repeatCount = 0;
        this.context.clearRect(0, 0, this.width, this.height);
    },
    scanPause: function() {
        this.state = 'pause';
    },
    scanSelect: function() {
        this.state = 'select';
    },
    scanWait: function() {
        this.state = 'wait';
        this.scanTargetsIndex = -1;
        this.timeCount = 0;
        this.repeatCount = 0;
        this.context.clearRect(0, 0, this.width, this.height);
    },
/* スキャタイプ変更処理メソッド */
	prepareScan: function() {
		switch(this.scanType) {
			case 'auto':
				// ステップスキャンの移動ボタンを除去
				this.hideStepButton();
				// マウス滞留用のホバーSpriteを除去
				this.game.currentScene.removeChild(this.hover);
				// オートスキャン用のキーバインドを再設定
				this.initialKeyBind();
				break;
			case 'step':
				// iPadタッチャーを使う場合はステップスキャンの移動ボタンを表示
				if(this.stepScanType == 'touch') {
					this.showStepButton();
				}else {
					this.hideStepButton();
				}
				// マウス滞留用のホバーSpriteを除去
				this.game.currentScene.removeChild(this.hover);
				// 2スイッチステップスキャン用のキーバインドを再設定
				this.stepScanKeyBind();
				break;
			case 'step1':
				// ステップスキャンの移動ボタンを除去
				this.hideStepButton();
				// マウス滞留用のホバーSpriteを除去
				this.game.currentScene.removeChild(this.hover);
				// オートスキャン用のキーバインドを再設定
				this.initialKeyBind();
				break;
			case 'mouse':
				// ステップスキャンの移動ボタンを除去
				this.hideStepButton();
				// マウス滞留用のホバーSpriteを追加
				this.game.currentScene.addChild(this.hover);
				// キーバインドを削除
				this.keyUnBind();
				break;
			default: break;
		}
	},
/* フォーカスタイプ変更メソッド */
    // フォーカスタイプをframeに変更
    focusFrame: function() {
        this.focusType = 'frame';
    },
    // フォーカスタイプをbackgroundに変更
    focusBackground: function() {
        this.focusType = 'background';
    },
    /* 一定のフォーカス範囲をスキャンするスキャンする際のフォーカスサイズを設定 */
    /*
    setBackgroundSize: function(width, height) {
        this.backgroundWidth = width;
        this.backgroundHeight = height;
    },
    resetBackgroundSize: function() {
        this.backgroundWidth = null;
        this.backgroundHeight = null;
    },
    */
/* スキャンの設定変数セッタ */
    setScanInterval: function(scanInterval) {
        this.scanInterval = Number(scanInterval);
    },
    setScanType: function(scanType) {
        if(scanType == 'auto' || scanType == 'step' || scanType == 'step1' || scanType == 'mouse') {
            this.scanType = scanType;
            this.prepareScan();
        }else {
            console.log("undefined scanType");
        }
    },
    setOneSwitchStepScanWait: function(oneSwitchStepScanWait) {
        this.oneSwitchStepScanWait = Number(oneSwitchStepScanWait);
    },
    setMouseHoverWait: function(mouseHoverWait) {
        this.mouseHoverWait = Number(mouseHoverWait);
    },
    setFirstWait: function(firstWait) {
        this.firstWait = Number(firstWait);
    },
    setSelectWait: function(selectWait) {
        this.selectWait = Number(selectWait);
    },
    setScanRepaet: function(scanRepaet) {
        this.scanRepaet = Number(scanRepaet);
    },
    setStepScanType: function(stepScanType) {
        this.stepScanType = String(stepScanType);
        this.prepareScan();
    },
    setIPadToucherArea: function(iPadToucherArea) {
        this.iPadToucherArea = String(iPadToucherArea);
        this.prepareScan();
    },
    setFocusType: function(focusType) {
        this.focusType = String(focusType);
    },
    setFrameWidth: function(frameWidth) {
        this.frameWidth = Number(frameWidth);
    },
    setSelectFrameWidth: function(selectFrameWidth) {
        this.selectFrameWidth = Number(selectFrameWidth);
    },
    setFocusColor: function(focusColor) {
        this.focusColor = String(focusColor);
    },
    setScanSE: function(scanSE) {
        this.scanSE = Number(scanSE);
    },
    setSelectSE: function(selectSE) {
        this.selectSE = Number(selectSE);
    },

/* 関数 */
    // スキャンが続行可能か確認する
    scanScanContinue: function() {
        // 周回数をカウントし、以降スキャンしない場合はfalseを返す
        if(this.scanTargetsIndex+1 == this.scanTargetsNum) {
            // 1周した
            this.repeatCount++;
            if(this.repeatCount == this.scanRepaet) {
                this.scanWait();
                return false;
            } else {
                return true;
            }
        } else {
            return true;
        }
    },
    createFrame: function(x, y, width, height, _lineWidth) {
        // var lineWidth = _lineWidth; // もとのgameサイズに依存する値
        var lineWidth = _lineWidth * (width/150); // スキャン動作確認画面の「スキャン対象」と「フォーカスの幅」の比率を維持する値
        // var lineWidth = _lineWidth / this.game.scale; // 絶対値　どんなに拡大縮小してもその幅で表示される

    	this.context.clearRect(0, 0, this.width, this.height);

        var frameX = x - lineWidth;
        var frameY = y - lineWidth;
    	var frameWidth = width + (lineWidth*2);
    	var frameHeight = height + (lineWidth*2);

    	this.context.fillStyle = this.focusColor;
    	this.context.fillRect( frameX, frameY, frameWidth, frameHeight);
    	this.context.clearRect(frameX+lineWidth, frameY+lineWidth, width, height);
    },
    createRectangle: function(x, y, width, height) {
        this.context.clearRect(0, 0, this.width, this.height);

        var frameX = x;
        var frameY = y;
        var frameWidth = width;
        var frameHeight = height;

        this.context.fillStyle = this.focusColor;
        this.context.fillRect( frameX, frameY, frameWidth, frameHeight);
    },
    clearContext: function() {
        this.context.clearRect(0, 0, this.width, this.height);
    },
    // 実際に見たときのSpriteのx座標の取得
    realCordinateX: function(sprite) {
        var x = sprite.x;
        var w = sprite.width;
        var scaleX = sprite.scaleX;
        var originX = sprite.originX;
        if(originX != null) {
            return x + (w-w*scaleX)*(originX/w);
        } else {
            return x + (w-w*scaleX)/2;
        }
    },
    // 実際に見たときのSpriteのy座標の取得
    realCordinateY: function(sprite) {
        var y = sprite.y;
        var h = sprite.height;
        var scaleY = sprite.scaleY;
        var originY = sprite.originY;
        if(originY != null) {
            return y + (h-h*scaleY)*(originY/h);
        } else {
            return y + (h-h*scaleY)/2;
        }
    },
    // マウス座標取得関数
    getMousePosition: function(e) {
        var obj = new Object();
        if(e) {
            obj.x = e.pageX;
            obj.y = e.pageY;
        }
        else {
            obj.x = event.x + document.body.scrollLeft;
            obj.y = event.y + document.body.scrollTop;
        }
        // enchant-stageのスケールと座標を考慮してマウス位置を調整
        var offset = $('#enchant-stage').offset();
        obj.x = (obj.x - offset.left) / this.game.scale;
        obj.y = (obj.y - offset.top) / this.game.scale;
        return obj;
    },
    // スキャン対象のマウスホバーを判定しフォーカス枠を付けたり消したりする関数
    checkHober: function() {
        var flag = 0;
        for (var i=0; i < this.scanTargetsNum; i++) {
            if(this.scanTargets[i].intersect(this.hover)) {
                if(this.scanTargetsIndex != i) {
                    this.timeCount = 0;
                    this.scan(i);
                }
                flag = 1;
            }
        }
        // マウスがどのスキャン対象にも乗っていない場合はスキャンしない
        if(flag === 0) {
            this.scanTargetsIndex = -1;
            this.timeCount = 0;
            this.context.clearRect(0, 0, this.width, this.height);
        }
    },
/* 外部ファイルからデータ読み込み */
    setScanSettingData: function() {
        if(typeof getScanSettingData == 'function') {
            var settingData = getScanSettingData(); // 変数受け渡し用のグローバル関数
            if(Object.keys(settingData).length > 0) {
                if(settingData["scan_type"] !== void 0) {
                    this.scanType = settingData["scan_type"];
                    this.prepareScan();
                }
                if(settingData["scan_interval"] !== void 0) {
                    this.scanInterval = Number(settingData["scan_interval"]);
                }
                if(settingData["mouse_hover_wait"] !== void 0) {
                    this.mouseHoverWait = Number(settingData["mouse_hover_wait"]);
                }
                if(settingData["one_switch_step_scan_wait"] !== void 0) {
                    this.oneSwitchStepScanWait = Number(settingData["one_switch_step_scan_wait"]);
                }
                if(settingData["first_wait"] !== void 0) {
                    this.firstWait = Number(settingData["first_wait"]);
                }
                if(settingData["select_wait"] !== void 0) {
                    this.selectWait = Number(settingData["select_wait"]);
                }
                if(settingData["scan_repaet"] !== void 0) {
                    this.scanRepaet = Number(settingData["scan_repaet"]);
                }
                if(settingData["step_scan_Type"] !== void 0) {
                    this.stepScanType = settingData["step_scan_Type"];
                    this.prepareScan();
                }
                if(settingData["iPad_toucher_area"] !== void 0) {
                    this.iPadToucherArea = settingData["iPad_toucher_area"];
                    this.prepareScan();
                }
                if(settingData["scan_se"] !== void 0) {
                    this.scanSE = Number(settingData["scan_se"]);
                }
                if(settingData["select_se"] !== void 0) {
                    this.selectSE = Number(settingData["select_se"]);
                }
                if(settingData["focus_type"] !== void 0) {
                    this.focusType = settingData["focus_type"];
                }
                if(settingData["frame_width"] !== void 0) {
                    this.frameWidth = Number(settingData["frame_width"]);
                }
                if(settingData["select_frame_width"] !== void 0) {
                    this.selectFrameWidth = Number(settingData["select_frame_width"]);
                }
                if(settingData["focus_color"] !== void 0) {
                    this.focusColor = settingData["focus_color"];
                }

                // this.scanVoice = Number(settingData["scan_voice"]);
            }
        }
    },
/* 現在の設定値を連想配列形式で取得 */
    getScanSettingData: function() {
        var data = {
            "scan_type":this.scanType,
            "scan_interval":this.scanInterval,
            "mouse_hover_wait":this.mouseHoverWait,
            "one_switch_step_scan_wait":this.oneSwitchStepScanWait,
            "first_wait":this.firstWait,
            "select_wait":this.selectWait,
            "scan_repaet":this.scanRepaet,
            "step_scan_Type":this.stepScanType,
            "iPad_toucher_area":this.iPadToucherArea,
            "scan_se":this.scanSE,
            "select_se":this.selectSE,
            "focus_type":this.focusType,
            "frame_width":this.frameWidth,
            "select_frame_width":this.selectFrameWidth,
            "focus_color":this.focusColor
        };
        return data;
    },
/* ステップスキャンをiPadタッチャーで使うためのステップボタン表示 */
    showStepButton: function() {
        this.hideStepButton();
        // ステップキャンにおけるiPadタッチャー用のタッチパネルを表示
        $('body').append('<div id="ipad-toucher-area" class="touchable">フォーカス移動</div>');
        var obj = this;
        var _touch = ('ontouchstart' in document) ? 'touchstart' : 'click';
        var ratio;
        window.devicePixelRatio ? ratio = window.devicePixelRatio : ratio = 1 ;
        // 画面の向きに応じて切り替え
        var orient = window.onorientation;
        if(Math.abs(window.orientation) === 0){
            var areaWidth =  30*ratio*(screen.height/screen.width);
            var areaHeight =  45*ratio*(screen.height/screen.width);
        } else {
            var areaWidth =  30*ratio;
            var areaHeight =  45*ratio;
        }
        $('#ipad-toucher-area').css({
            "position":"fixed",
            "width": areaWidth+"px",
            "height": areaHeight+"px",
            "z-index": "999",
            "background-color":"#dddddd",
            "border":"solid 1px #353535",
            "border-radius":"4px 4px",
            "text-align":"center",
            "font-size": "12px",
            "line-hight": "12px",
            "overflow": "hidden"
        }).on(_touch, function(event){
            obj.game.dispatchEvent(new Event('bbuttondown'));
            // ダブルタップキャンセル
            event.preventDefault();
            event.stopPropagation();
        });
        switch(this.iPadToucherArea) {
            case 'left-top': $('#ipad-toucher-area').css({"top":"0px","left":"0px",}); break;
            case 'right-top': $('#ipad-toucher-area').css({"top":"0px","right":"0px",}); break;
            case 'left-bottom': $('#ipad-toucher-area').css({"bottom":"0px","left":"0px",}); break;
            case 'right-bottom': $('#ipad-toucher-area').css({"bottom":"0px","right":"0px",}); break;
            default: $('#ipad-toucher-area').css({"bottom":"0px","right":"0px",}); break;
        }
    },
    hideStepButton: function() {
    	$('#ipad-toucher-area').remove();
    },
/* 2スイッチステップスキャンの場合は1,spaceキーをフォーカス移動（bボタン）に割り当てる */
    stepScanKeyBind: function() {
        this.game.keybind(49, 'b');   // 1
        this.game.keybind(32, 'b');   // space
    },
/* 1スイッチスキャンの場合は1,3,space,enterキーを決定（aボタン）に割り当てる */
    initialKeyBind: function() {
        //キーバインドの初期設定
        this.game.keybind(49, 'a');   // 1
        this.game.keybind(51, 'a');   // 3
        this.game.keybind(32, 'a');   // space
        this.game.keybind(10, 'a');   // Enter
        this.game.keybind(13, 'a');   // Enter windows
    },
/* キーバインドを消去 */
    keyUnBind: function() {
    	//キーバインドの削除
        this.game.keyunbind(49);   // 1
        this.game.keyunbind(51);   // 3
        this.game.keyunbind(32);   // space
        this.game.keyunbind(10);   // Enter
        this.game.keyunbind(13);   // Enter windows
    }
});