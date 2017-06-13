enchant();

var ENEMY = 'images/1_cactus.png';
var HERO = 'images/1_shiba.png';
var BG = 'images/bg11.png';
var SOUND_BG = 'sounds/comedy.mp3'
var SOUND_LOST = 'sounds/lost.mp3'
var THEME_1 = 'images/1_theme.png';
var THEME_2 = 'images/2_theme.png';
var THEME_3 = 'images/3_theme.png';

var posY = 115;						//キャラクタの初期位置縦
var posX = 0;						//キャラクタの初期位置横
var vy = 0;							//キャラクタの初速度初期値
var speed = 5;						//ジャンプ中の初速度
var jump = false;	

window.onload = function() {

    var game = new Game(700, 400);
    // 4 - Preload resources
    game.preload(
        ENEMY, 
        HERO,
        BG,
        SOUND_BG,
        SOUND_LOST,
        THEME_1, THEME_2, THEME_3
        );

    game.fps = 32;

    game.onload = function() {
        
        game.rootScene.backgroundColor = "#000";
        var scene = new SceneGame();
        // var scene = new ThemeSelectScene();
        game.pushScene(scene);

    }
    
    game.start();   

    var SceneGame = Class.create(Scene, {
         // The main gameplay scene.     
        initialize: function() {
            var game, EnemyBG, hero, sound_bg , enemyGroup, sound_lost;
            // var posY = 200, posX = 40, vy = 0, speed = 5, jump = false;

            // 1 - Call superclass constructor
            Scene.apply(this);
            // 2 - Access to the game singleton instance
            game = Game.instance;
            this.sound_bg = game.assets[SOUND_BG];
            this.sound_lost = game.assets[SOUND_LOST];
            this.sound_bg.play();
            // 3 - Create child nodes
            // Label
            label = new Label('SCORE<br>0');
            label.x = 30;
            label.y = 30;        
            label.color = 'black';
            label.font = '16px strong';
            this.scoreLabel = label;

            bg = new Sprite(950, 400);
            bg.image = game.assets[BG];
            // bg.x = 950
            // 4 - Add child nodes        
            this.addChild(bg);  
            this.addChild(label);      

            // Instance variables
            this.generateEnemyTimer = 0;

            // hero
            hero = new Hero();
            // hero.x = game.width/2 - hero.width/2;
            hero.x = 0;
            hero.y = 115;
            this.hero = hero;
            this.addChild(hero);

            // Update
            this.addEventListener(Event.ENTER_FRAME, this.update); //update enemy

            hero.x = posX;
    		hero.y = posY;

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

            //  JUMPING  //
            // speed++;
            // speed%=15; 
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
			        
			        // Game over
			        //stop sound
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
	        this.backgroundColor = '#72c0db';

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


		}

	});

	var Theme1 = Class.create(Sprite,{
		initialize: function(){
			Sprite.apply(this, [205, 125]);
			this.image = Game.instance.assets[THEME_1];

		}
	});
	var Theme2 = Class.create(Sprite,{
		initialize: function(){
			Sprite.apply(this, [205, 125]);
			this.image = Game.instance.assets[THEME_2];

		}
	});
	var Theme3 = Class.create(Sprite,{
		initialize: function(){
			Sprite.apply(this, [205, 125]);
			this.image = Game.instance.assets[THEME_3];

		}
	});


     // Hero
    var Hero = Class.create(Sprite, {
        // The player character.     
        initialize: function() {
            // 1 - Call superclass constructor
            Sprite.apply(this,[270, 210]);
            this.image = Game.instance.assets[HERO];
            this.scaleX = 0.3;
            this.scaleY = 0.3;
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
            Sprite.apply(this,[161, 196]);
            // Sprite.apply(this,[161, 196]);
            this.image  = Game.instance.assets[ENEMY];   
            this.scaleX = 0.3;
            this.scaleY = 0.13 + rand * 0.1;   
            this.rotationSpeed = 0;
            this.addEventListener(Event.ENTER_FRAME, this.update);
            this.x = 700; // create enemy begin from right of window
            this.y = (327-(this.height*this.scaleY)/2) - 343/2; //the bottom of enemy begin at edge of window
            this.animationDuration = 0;

        
        },
        update: function(evt) { 
            var xSpeed, game;

            game = Game.instance;
            xSpeed = 200;
            
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
		    game.replaceScene(new SceneGame());
		}
	});
};