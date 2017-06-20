enchant();

// var ENEMY, HERO, BG;
var ENEMY = 'images/1_cactus.png';
var HERO = 'images/1_shiba.png';
var BG = 'images/1_bg.png';

var ENEMY2 = 'images/2_tree.png';
var HERO2 = 'images/2_deer.png';
var BG2 = 'images/2_bg.png';

var ENEMY3 = 'images/3_fence.png';
var HERO3 = 'images/3_sheep.png';
var BG3 = 'images/3_bg.png';

var SELECT_THEME_BG = 'images/selectTheme_bg.png';
var SOUND_BG = 'sounds/comedy.mp3'
var SOUND_LOST = 'sounds/lost.mp3'
var THEME_1 = 'images/1_theme.png';
var THEME_2 = 'images/2_theme.png';
var THEME_3 = 'images/3_theme.png';

var posY, posX;
var vy = 0;							//キャラクタの初速度初期値
var speed = 5;						//ジャンプ中の初速度
var jump = false;
var bg = new Sprite(950, 400);
var scanner = null;

var scaleHero, scaleEnemy, speedEnemy;

window.onload = function() {

    var game = new Game(700, 400);
    var settings = Settings.create();

    var btn = document.getElementById('open_settings')
    btn.addEventListener('click', function(event) {
    	event.stopPropagation();
        settings.open()
    })

    var sizeHero = settings.addRadio({
        title: 'Size of character',
        key: 'sizeHero',
        description: 'change size of game\'s character',
        choices: ['small', 'medium', 'large'],
        defaultValue: 'medium'
    })
    sizeHero.on('settingsChange', function(event) {
        scaleHero = event.value;
		console.log('selected scaleHero = ' + scaleHero);
		})


    var sizeEnemy = settings.addRadio({
        title: 'Size of enemy',
        key: 'sizeEnemy',
        description: 'change size of game\'s enemy character',
        choices: ['small', 'medium', 'large'],
        defaultValue: 'medium'
    })
    sizeEnemy.on('settingsChange', function(event) {
        scaleEnemy = event.value;
        console.log('selected scaleEnemy = ' + scaleEnemy);
		})

    var speed1 = settings.addCounter({
        title: 'speed',
        key: 'speedEnemy',
        description: 'change speed of enemy character',
        min: 1,
        max: 5,
        defaultValue: 3
    })
    speed1.on('settingsChange', function(event) {
        speedEnemy = event.value;
        console.log('selected speedEnemy = ' + speedEnemy);

    })



    // 4 - Preload resources
    game.preload(
        ENEMY,
        HERO,
        BG,
        ENEMY2,
        HERO2,
        BG2,
        ENEMY3,
        HERO3,
        BG3,
        SELECT_THEME_BG,
        SOUND_BG,
        SOUND_LOST,
        THEME_1, THEME_2, THEME_3
        );

    game.fps = 32;

    scanner = new SpriteScanner(game);
    // scanner.scanSE = 1; // sound scanning ; 1 = sound on , 0 = sound off
    // scanner.selectSE = 1; // sound selected
    scanner.firstWait = 2; //delay of scanning
    scanner.scanInterval = 1.0;
    scanner.selectWait = 1.0;
    scanner.frameWidth = 10;
    scanner.selectFrameWidth = 15;
    scanner.scanRepeat = -1; //infinite loop
    scanner.focusType = 'frame'; //frame or background
    scanner.focusColor = '#ff0000';

    game.onload = function() {

        game.rootScene.backgroundColor = "#000";
        var scene = new ThemeSelectScene();
        game.pushScene(scene);

    }

    game.start();

    var SceneGame = Class.create(Scene, {
         // The main gameplay scene.
        initialize: function() {
            var game, EnemyBG, hero, sound_bg , enemyGroup, sound_lost;

            Scene.apply(this);

            game = Game.instance;
            this.sound_bg = game.assets[SOUND_BG];
            this.sound_lost = game.assets[SOUND_LOST];
            this.sound_bg.play();

            label = new Label('SCORE<br>0');
            label.x = 30;
            label.y = 30;
            label.color = 'black';
            label.font = '16px strong';
            this.scoreLabel = label;

	        this.addChild(bg);

            this.addChild(label);

            this.generateEnemyTimer = 0;

            // hero
            hero = new Hero();
            this.hero = hero;
            this.addChild(hero);

            // Update
            this.addEventListener(Event.ENTER_FRAME, this.update); //update enemy
    		this.addEventListener("touchstart",function(e){
	        	if(hero.y === posY){
		        	vy = speed; 								//タッチされた際の初速度
	            	jump = true;
	            	this.score += 4;								//ジャンプ中フラグを立てる
	        	}
			});

            this.scoreTimer = 0;
            this.score = 0;

            // enemy group
			enemyGroup = new Group();
			this.enemyGroup = enemyGroup;
			this.addChild(enemyGroup);

        },

        update: function(evt) {

            this.scoreTimer += evt.elapsed * 0.001;
            if (this.scoreTimer >= 1) {
                this.setScore(this.score + 1);
                this.scoreTimer -= 1;
            }

            // Check if it's time to create a new set of obstacles
            this.generateEnemyTimer += evt.elapsed * 0.001;
            if (this.generateEnemyTimer >= 4) {
                var enemy;
                this.generateEnemyTimer -= 4;
                enemy = new EnemyBG(Math.floor(Math.random() * 2  + 1));
				this.enemyGroup.addChild(enemy);

            }

            // Loop sound_bg
            if (this.sound_bg.currentTime >= this.sound_bg.duration ){
                this.sound_bg.play();
            }

            //  JUMPING   speed++;  speed%=15;
            if(jump === true){						//ジャンプ中
            	this.hero.y -= vy;						//加速度分キャラ位置移動(引き算なのは軸の方向のせい)
            	vy-=0.15;							//加速度調整(マイナスもあるよ)
            }else{							//ジャンプ中以外の処理
                if(game.frame%5 === 0){				//5フレームごとに姿勢を変えよう
                    if(this.hero.frame === 1){
                        this.hero.frame = 2;
                    }else{
                        this.hero.frame = 1;
                    }//1フレームと2フレームを交互に
                }
            }
            if(this.hero.y > posY){						//下に落っこちないように
                this.hero.y = posY;						//位置調整(加速度によっては食い込むよ)
                vy = 0;								//次のジャンプまでは加速度0に
                jump = false;						//ジャンプフラグも元に戻す
            }
     //        //背景処理
     //        if(game.frame%950 ===0){
 				// bg.x -= 950;							//背景を右にずらす（ループさせる）
     //        }
     //        bg.x++
            // end JUMPING

            // Check collision
			for (var i = this.enemyGroup.childNodes.length - 1; i >= 0; i--) {
			    var enemy;
			    enemy = this.enemyGroup.childNodes[i];

			    // if (enemy.intersect(this.hero)){
			    if (enemy.within(this.hero, 50)){

			        // Game over stop sound
					this.sound_bg.stop();
					this.sound_lost.play();
					this.enemyGroup.removeChild(enemy);
					game.replaceScene(new SceneGameOver(this.score));
					break;
			    }
			    // Score increase as time passes
			}
        },

        setScore: function (value) {
            this.score = value;
            this.scoreLabel.text = 'SCORE<br>' + this.score;

        }
    });

	var ThemeSelectScene = Class.create(Scene, {
		initialize: function(){
			var theme_select, theme_1, theme_2, theme_3 ;
			Scene.apply(this);

	        select_theme_bg = new Sprite(700, 400);
            select_theme_bg.image = game.assets[SELECT_THEME_BG];
            this.addChild(select_theme_bg);

	        theme_1 = new Theme1();
	        theme_1.x = 15;
	        theme_1.y = 150;

	        theme_2 = new Theme2();
	        theme_2.x = 245;
	        theme_2.y = 150;

	        theme_3 = new Theme3();
	        theme_3.x = 475;
	        theme_3.y = 150;

	        this.addChild(theme_1);
	        this.addChild(theme_2);
	        this.addChild(theme_3);

	        scanner.addScanTargets([theme_1, theme_2, theme_3]);
	        this.addChild(scanner);
            scanner.scanStart();
		}

	});

	var Theme1 = Class.create(Sprite,{
		initialize: function(){
			Sprite.apply(this, [205, 125]);
			this.image = Game.instance.assets[THEME_1];
			this.addEventListener("scanselect",function(e){
				currentTheme = 1;
	            bg.image = game.assets[BG];
				game.replaceScene(new SceneGame());
	        });

		}
	});
	var Theme2 = Class.create(Sprite,{
		initialize: function(){
			Sprite.apply(this, [205, 125]);
			this.image = Game.instance.assets[THEME_2];
			this.addEventListener("scanselect",function(e){
				currentTheme = 2;
	            bg.image = game.assets[BG2];
				game.replaceScene(new SceneGame());
	        });

		}
	});
	var Theme3 = Class.create(Sprite,{
		initialize: function(){
			Sprite.apply(this, [205, 125]);
			this.image = Game.instance.assets[THEME_3];
			this.addEventListener("scanselect",function(e){
				currentTheme = 3;
	            bg.image = game.assets[BG3];
				game.replaceScene(new SceneGame());
	        });

		}
	});


     // Hero
    var Hero = Class.create(Sprite, {
        // The player character.
        initialize: function() {
            // 1 - Call superclass constructor

            if(currentTheme == 1){
            	Sprite.apply(this,[270, 210]);
            	this.image = Game.instance.assets[HERO];
            } else if(currentTheme == 2){
            	Sprite.apply(this,[255, 240]);
            	this.image = Game.instance.assets[HERO2];
            } else if(currentTheme == 3){
            	Sprite.apply(this,[221.5, 210]);
            	this.image = Game.instance.assets[HERO3];
            }

            console.log("scaleHero = " + scaleHero);

            if (scaleHero == 'small') {
            	this.scaleX = 0.15;
        		this.scaleY = 0.15;
        		this.x = 0;
				this.y = 130;

            }else if (scaleHero == 'large') {
            	this.scaleX = 0.45;
        		this.scaleY = 0.45;
        		this.x = 0;
				this.y = 105;

            }else {
            	this.scaleX = 0.3;
        		this.scaleY = 0.3;
        		this.x = 0;
				this.y = 115;
            }
        	

            posX = this.x;
    		posY = this.y;
            // 2 - Animate
            this.animationDuration = 0;
            this.addEventListener(Event.ENTER_FRAME, this.updateAnimation);
        },
        updateAnimation: function (evt) {
            this.animationDuration += evt.elapsed * 0.001;
            if (this.animationDuration >= 0.25) {
                this.frame = (this.frame + 1) % 2;  //frame1 = up , frame2 = down
                this.animationDuration -= 0.25;
            }
        },
    });

    // enemy Lower
    var EnemyBG = Class.create(Sprite, {
        //create enemy
        initialize: function(rand) {
            // Call superclass constructor

            if(currentTheme == 1){
            	Sprite.apply(this,[161, 196]);
            	this.image  = Game.instance.assets[ENEMY];
            } else if(currentTheme == 2){
            	Sprite.apply(this,[150, 196]);
            	this.image = Game.instance.assets[ENEMY2];
            } else if(currentTheme == 3){
            	Sprite.apply(this,[196, 196]);
            	this.image = Game.instance.assets[ENEMY3];
            }

            if (scaleEnemy == 'small') {
            	this.scaleX = 0.3;
            	this.scaleY = 0.15 + rand * 0.1;
            	this.x = 700; // create enemy begin from right of window
            	this.y = (327-(this.height*this.scaleY)/2) - 343/2; //the bottom of enemy begin at edge of window
            

            }else if (scaleEnemy == 'large') {
            	this.scaleX = 0.45;
            	this.scaleY = 0.45 + rand * 0.1;
            	this.x = 700; // create enemy begin from right of window
            	this.y = (330-(this.height*this.scaleY)/2) - 343/2; //the bottom of enemy begin at edge of window
            

            }else {
            	this.scaleX = 0.3;
            	this.scaleY = 0.13 + rand * 0.1;
            	this.x = 700; // create enemy begin from right of window
            	this.y = (327-(this.height*this.scaleY)/2) - 343/2; //the bottom of enemy begin at edge of window
            
            }
            console.log("scaleEnemy = " + scaleEnemy);

            this.rotationSpeed = 0;
            this.animationDuration = 0;
            this.addEventListener(Event.ENTER_FRAME, this.update);

        },
        update: function(evt) {
            var xSpeed, game;

            game = Game.instance;

            if (speedEnemy == 1) {
            	xSpeed = 70;
            } else if (speedEnemy == 2) {
            	xSpeed = 100;
            } else if (speedEnemy == 4) {
            	xSpeed = 270;
            } else if (speedEnemy == 5) {
            	xSpeed = 320;
            } else {
            	xSpeed = 200;
            }
            console.log("speedEnemy = " + xSpeed);


            this.x -= xSpeed * evt.elapsed * 0.001;
            this.rotation += this.rotationSpeed * evt.elapsed * 0.001;
            if (this.x > game.width) {
                this.parentNode.removeChild(this);  // remove when it  beyond the bottom of the screen
            }

            this.animationDuration += evt.elapsed * 0.001;
            if (this.animationDuration >= 0.25) {
                this.frame = (this.frame + 1) % 2;  //frame1 = up , frame2 = down
                this.animationDuration -= 0.25;
            }
        }
    });

	// SceneGameOver
	var SceneGameOver = Class.create(Scene, {
	    initialize: function(score) {
	        var gameOverLabel, scoreLabel;
	        Scene.apply(this);
	        this.backgroundColor = 'black';
	        // Game Over label
			gameOverLabel = new Label("GAME OVER<br><br><br>Tap to Restart");
			gameOverLabel.x = 200;
			gameOverLabel.y = 110;
			gameOverLabel.color = 'white';
			gameOverLabel.font = '32px strong';
			gameOverLabel.textAlign = 'center';

			// Score label
			scoreLabel = new Label('SCORE<br>' + score);
			scoreLabel.x = 205;
			scoreLabel.y = 182;
			scoreLabel.color = 'white';
			scoreLabel.font = '16px strong';
			scoreLabel.textAlign = 'center';

			// Add labels
			this.addChild(gameOverLabel);
			this.addChild(scoreLabel);

			// Listen for taps
			this.addEventListener(Event.TOUCH_START, this.touchToRestart);

	    },
	    touchToRestart: function(evt) {
		    var game = Game.instance;
		    game.replaceScene(new ThemeSelectScene());
		}
	});
};