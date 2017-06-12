enchant();

var PIPE = 'images/cactus01.png';
var PIPE_UPPER = 'images/pipeUpper.png';
var SHIBA = 'images/shiba0.png';
var BG = 'images/bg11.png';
var SOUND_BG = 'sounds/comedy.mp3'

var posY = 115;						//キャラクタの初期位置縦
var posX = 0;						//キャラクタの初期位置横
var vy = 0;							//キャラクタの初速度初期値
var speed = 5;						//ジャンプ中の初速度
var jump = false;	

window.onload = function() {

    var game = new Game(700, 400);
    // 4 - Preload resources
    game.preload(
        PIPE, 
        PIPE_UPPER,
        SHIBA,
        BG,
        SOUND_BG
        );

    game.fps = 32;

    game.onload = function() {
        
        game.rootScene.backgroundColor = "#000";
        var scene = new SceneGame();
        game.pushScene(scene);

    }
    
    game.start();   

    var SceneGame = Class.create(Scene, {
         // The main gameplay scene.     
        initialize: function() {
            var game, pipeBG, shiba, sound_bg , pipeGroup;
            // var posY = 200, posX = 40, vy = 0, speed = 5, jump = false;

            // 1 - Call superclass constructor
            Scene.apply(this);
            // 2 - Access to the game singleton instance
            game = Game.instance;
            this.sound_bg = game.assets[SOUND_BG];
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
            // 4 - Add child nodes        
            this.addChild(bg);  
            this.addChild(label);      

            // Instance variables
            this.generatePipeTimer = 0;

            // Shiba
            shiba = new Shiba();
            // shiba.x = game.width/2 - shiba.width/2;
            shiba.x = 0;
            shiba.y = 115;
            this.shiba = shiba;
            this.addChild(shiba);

            // Update
            this.addEventListener(Event.ENTER_FRAME, this.update); //update pipe

            shiba.x = posX;
    		shiba.y = posY;

    		this.addEventListener("touchstart",function(e){
	        	if(shiba.y === posY){
		        	vy = speed; 								//タッチされた際の初速度
	            	jump = true;							//ジャンプ中フラグを立てる
	        	}
			});

            this.scoreTimer = 0;
            this.score = 0;

            // pipe group
			pipeGroup = new Group();
			this.pipeGroup = pipeGroup;
			this.addChild(pipeGroup);

        },

        update: function(evt) {

            this.scoreTimer += evt.elapsed * 0.001;
            if (this.scoreTimer >= 1) {
                this.setScore(this.score + 1);
                this.scoreTimer -= 1;
            }

            // Check if it's time to create a new set of obstacles
            this.generatePipeTimer += evt.elapsed * 0.001;
            if (this.generatePipeTimer >= 2) {
                var pipe;
                this.generatePipeTimer -= 2;
                pipe = new PipeBG(Math.floor(Math.random() * 2  + 1));
				this.pipeGroup.addChild(pipe);

            }

            // Loop sound_bg
            if (this.sound_bg.currentTime >= this.sound_bg.duration ){
                this.sound_bg.play();
            }

            //  JUMPING  //
            // speed++;
            // speed%=15; 
            if(jump === true){						//ジャンプ中
            	this.shiba.y -= vy;						//加速度分キャラ位置移動(引き算なのは軸の方向のせい)
            	vy-=0.25;								//加速度調整(マイナスもあるよ)
            }else{							//ジャンプ中以外の処理
                if(game.frame%5 === 0){				//5フレームごとに姿勢を変えよう
                    if(this.shiba.frame === 1){
                        this.shiba.frame = 2;
                    }else{
                        this.shiba.frame = 1;
                    }//1フレームと2フレームを交互に
                }
            }
            if(this.shiba.y > posY){						//下に落っこちないように
                this.shiba.y = posY;						//位置調整(加速度によっては食い込むよ)
                vy = 0;								//次のジャンプまでは加速度0に
                jump = false;						//ジャンプフラグも元に戻す
            }
            // end JUMPING

            // Check collision
			for (var i = this.pipeGroup.childNodes.length - 1; i >= 0; i--) {
			    var pipe;
			    pipe = this.pipeGroup.childNodes[i];

			    // if (pipe.intersect(this.shiba)){
			    if (pipe.within(this.shiba, 50)){
			        
			        // Game over
			        //stop sound
					this.sound_bg.stop(); 
					this.pipeGroup.removeChild(pipe);
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

     // Shiba
    var Shiba = Class.create(Sprite, {
        // The player character.     
        initialize: function() {
            // 1 - Call superclass constructor
            Sprite.apply(this,[270, 210]);
            this.image = Game.instance.assets[SHIBA];
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

    // Pipe Lower
    var PipeBG = Class.create(Sprite, {
        //create pipe 
        initialize: function(rand) {
            // Call superclass constructor
            Sprite.apply(this,[161, 196]);
            // Sprite.apply(this,[161, 196]);
            this.image  = Game.instance.assets[PIPE];   
            this.scaleX = 0.3;
            this.scaleY = 0.13 + rand * 0.1;   
            this.rotationSpeed = 0;
            this.addEventListener(Event.ENTER_FRAME, this.update);
            this.x = 700; // create pipe begin from right of window
            this.y = (327-(this.height*this.scaleY)/2) - 343/2; //the bottom of pipe begin at edge of window
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
			gameOverLabel.x = 8;
			gameOverLabel.y = 128;
			gameOverLabel.color = 'white';
			gameOverLabel.font = '32px strong';
			gameOverLabel.textAlign = 'center';

			// Score label
			scoreLabel = new Label('SCORE<br>' + score);
			scoreLabel.x = 9;
			scoreLabel.y = 32;        
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