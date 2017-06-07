// 1 - Start enchant.js
enchant();

// 2 - On document load 
window.onload = function() {

	// 3 - Starting point
	var game = new Game(320, 440);
	// 4 - Preload resources
	game.preload('res/BG.png',
             'res/penguinSheet.png',
             'res/Ice.png');
	// 5 - Game settings
	game.fps = 30;
	game.scale = 1;
	game.onload = function() {
		// Once Game finishes loading
		console.log("Hi, Ocean!");
		var scene = new SceneGame();
		game.pushScene(scene);
	}
	// 7 - Start
	game.start();   

	// SceneGame  //class
	var SceneGame = Class.create(Scene, {
	     // The main gameplay scene.     
	    initialize: function() {
	        var game, label, bg, penguin, iceGroup;
	        // 1 - Call superclass constructor
	        Scene.apply(this);
	        // 2 - Access to the game singleton instance
	        game = Game.instance;
	        // 3 - Create child nodes
	        // Label
			label = new Label('SCORE<br>0');
			label.x = 9;
			label.y = 32;        
			label.color = 'white';
			label.font = '16px strong';
			label.textAlign = 'center';
			label._style.textShadow ="-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black";
			this.scoreLabel = label;

	        bg = new Sprite(320,440);
	        bg.image = game.assets['res/BG.png'];
	        // 4 - Add child nodes        
	        this.addChild(bg);        
	        this.addChild(label);

			// Penguin
			penguin = new Penguin();
			penguin.x = game.width/2 - penguin.width/2;
			penguin.y = 280;
			this.penguin = penguin;
			this.addChild(penguin);

	        // Touch listener
			this.addEventListener(Event.TOUCH_START,this.handleTouchControl); //for animetion

			// Update
			this.addEventListener(Event.ENTER_FRAME, this.update); //update ice
			// Instance variables
			this.generateIceTimer = 0;

			// Ice group
			iceGroup = new Group();
			this.iceGroup = iceGroup;
			this.addChild(iceGroup);

			this.scoreTimer = 0;
			this.score = 0;
	    },
	    handleTouchControl: function (evt) {
		    var laneWidth, lane;
		    laneWidth = 320/3;
		    lane = Math.floor(evt.x/laneWidth);
		    lane = Math.max(Math.min(2,lane),0);
		    this.penguin.switchToLaneNumber(lane);
		},
		update: function(evt) {
			this.scoreTimer += evt.elapsed * 0.001;
			if (this.scoreTimer >= 0.5) {
			    this.setScore(this.score + 1);
			    this.scoreTimer -= 0.5;
			}
		    // Check if it's time to create a new set of obstacles
		    this.generateIceTimer += evt.elapsed * 0.001;
		    if (this.generateIceTimer >= 0.5) {
		        var ice;
		        this.generateIceTimer -= 0.5;
		        ice = new Ice(Math.floor(Math.random()*3));
			    this.iceGroup.addChild(ice);
		    }
		    // Check collision
			for (var i = this.iceGroup.childNodes.length - 1; i >= 0; i--) {
			    var ice;
			    ice = this.iceGroup.childNodes[i];
			    if (ice.intersect(this.penguin)){
			        this.iceGroup.removeChild(ice);
			        // Game over
			        //stop sound
					// this.bgm.stop(); 
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

	 // Penguin
	var Penguin = Class.create(Sprite, {
	    // The player character.     
	    initialize: function() {
	        // 1 - Call superclass constructor
	        Sprite.apply(this,[30, 43]);
	        this.image = Game.instance.assets['res/penguinSheet.png'];
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
		switchToLaneNumber: function(lane){     
		    var targetX = 160 - this.width/2 + (lane-1)*90;
		    this.x = targetX;
		}		
	});

	 // Ice Boulder
	var Ice = Class.create(Sprite, {
	    // The obstacle that the penguin must avoid
	    initialize: function(lane) {
	        // Call superclass constructor
	        Sprite.apply(this,[48, 49]);
	        this.image  = Game.instance.assets['res/Ice.png'];      
	        this.rotationSpeed = 0;
	        this.setLane(lane);
	        this.addEventListener(Event.ENTER_FRAME, this.update);
	    },
	    setLane: function(lane) {
			var game, distance;
			game = Game.instance;        
			distance = 90;

			this.rotationSpeed = Math.random() * 100 - 50;

		    this.x = game.width/2 - this.width/2 + (lane - 1) * distance;
		    this.y = -this.height;    
		    this.rotation = Math.floor( Math.random() * 360 );    
		},
		update: function(evt) { 
			var ySpeed, game;

			game = Game.instance;
		    ySpeed = 300;
		    
			this.y += ySpeed * evt.elapsed * 0.001;
			this.rotation += this.rotationSpeed * evt.elapsed * 0.001;           
		    if (this.y > game.height) {
		        this.parentNode.removeChild(this);          // remove when it  beyond the bottom of the screen
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