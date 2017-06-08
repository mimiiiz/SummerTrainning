enchant();

var PIPE = 'images/pipeLower.png';
var PIPE_UPPER = 'images/pipeUpper.png';
var SHIBA = 'images/shiba.png';

window.onload = function() {

    var game = new Game(950, 400);
    // 4 - Preload resources
    game.preload(
        PIPE, 
        PIPE_UPPER,
        SHIBA
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
            var game, pipeBG;
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
            this.addChild(label);

            // Instance variables
            this.generatePipeTimer = 0;

            // Update
            this.addEventListener(Event.ENTER_FRAME, this.update); //update ice

        },

        update: function(evt) {
            // Check if it's time to create a new set of obstacles
            this.generatePipeTimer += evt.elapsed * 0.001;
            if (this.generatePipeTimer >= 1) {
                var pipe;
                this.generatePipeTimer -= 1;
                pipe = new PipeBG(Math.random() * 3  + 1);
                this.addChild(pipe);
            }
}
    });

     // Pipe
    var PipeBG = Class.create(Sprite, {
        //create pipe 
        initialize: function(rand) {
            // Call superclass constructor
            Sprite.apply(this,[400, 400]);
            this.image  = Game.instance.assets[PIPE];   
            this.scaleX = 0.3;
            this.scaleY = 0.23 + rand * 0.1;   
            // this.scaleY = 0.3;   
            console.log("scaleY = " + this.scaleY);
            this.rotationSpeed = 0;
            this.addEventListener(Event.ENTER_FRAME, this.update);
            this.x = 950; // create pipe begin from right of window
            this.y = (400-(this.height*this.scaleY)/2) - 200;
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