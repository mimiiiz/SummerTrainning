enchant();

var PIPE = 'images/pipeLower.png';
var PIPE_UPPER = 'images/pipeUpper.png';
var SHIBA = 'images/shiba0.png';
var BG = 'images/bg.png';

window.onload = function() {

    var game = new Game(950, 400);
    // 4 - Preload resources
    game.preload(
        PIPE, 
        PIPE_UPPER,
        SHIBA,
        BG
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
            var game, pipeBG, shiba;
            // 1 - Call superclass constructor
            Scene.apply(this);
            // 2 - Access to the game singleton instance
            game = Game.instance;
            // 3 - Create child nodes
            // Label
            label = new Label('SCORE<br>0');
            label.x = 30;
            label.y = 30;        
            label.color = 'white';
            label.font = '16px strong';

            bg = new Sprite(950, 400);
            bg.image = game.assets[BG];
            // 4 - Add child nodes        
            this.addChild(bg);  
            this.addChild(label);      

            // Instance variables
            this.generatePipeTimer = 0;

            // Update
            this.addEventListener(Event.ENTER_FRAME, this.update); //update ice

            // Shiba
            shiba = new Shiba();
            // shiba.x = game.width/2 - shiba.width/2;
            shiba.x = 0;
            shiba.y = 70;
            this.shiba = shiba;
            this.addChild(shiba);

        },

        update: function(evt) {
            // Check if it's time to create a new set of obstacles
            this.generatePipeTimer += evt.elapsed * 0.001;
            if (this.generatePipeTimer >= 1) {
                var pipe;
                this.generatePipeTimer -= 1;
                pipe = new PipeBG(Math.random() * 2  + 1);
                this.addChild(pipe);

                pipeUpper = new PipeUpperBG(Math.random() * 3  + 1);
                this.addChild(pipeUpper);

            }
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
        switchToLaneNumber: function(lane){     
            var targetX = 160 - this.width/2 + (lane-1)*90;
            this.x = targetX;
        }       
    });

    // Pipe Lower
    var PipeBG = Class.create(Sprite, {
        //create pipe 
        initialize: function(rand) {
            // Call superclass constructor
            Sprite.apply(this,[400, 400]);
            this.image  = Game.instance.assets[PIPE];   
            this.scaleX = 0.3;
            this.scaleY = 0.13 + rand * 0.1;   
            this.rotationSpeed = 0;
            this.addEventListener(Event.ENTER_FRAME, this.update);
            this.x = 950; // create pipe begin from right of window
            this.y = (400-(this.height*this.scaleY)/2) - 200; //the bottom of pipe begin at edge of window
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
        }
    });

    // PipeUpper
    var PipeUpperBG = Class.create(Sprite, {
        //create pipe 
        initialize: function(rand) {
            // Call superclass constructor
            Sprite.apply(this,[400, 400]);
            this.image  = Game.instance.assets[PIPE_UPPER];   
            this.scaleX = 0.3;
            this.scaleY = 0.02 + rand * 0.1;   
            this.rotationSpeed = 0;
            this.addEventListener(Event.ENTER_FRAME, this.update);
            this.x = 950; // create pipe begin from right of window
            this.y = (0 - (200-(this.height*this.scaleY)/2 )); //the bottom of pipe begin at edge of window
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
        }
    });
}