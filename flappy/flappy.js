enchant();
var SCREEN_W = 950;
var SCREEN_H = 500;
var game = null;

var PIPE = 'images/pipeLower.png';
var PIPE_UPPER = 'images/pipeUpper.png';
var SHIBA = 'images/shiba.png';

window.onload = function() {
    game = new Core(SCREEN_W, SCREEN_H);
    game.fps = 32;

    game.preload(
        PIPE, 
        PIPE_UPPER,
        SHIBA
    );

    game.onload = function() {
        game.rootScene.backgroundColor = "#FFFFFF";
        // game.rootScene.backgroundColor = "#CCFFFF";
        var pipe_scale = 0.3;
        var pipe_x = 200;
        var pipe_y = 0;
        var pipe_x_upper = 200;
        var pipe_y_upper = 0;

        for(var i=0; i<8; i++) {
	    	var rand1 = Math.random() * 3  + 1;
        	var pipe = new CreatePipe(rand1);
       		pipe.moveTo(pipe_x, pipe_y);
        	game.rootScene.addChild(pipe);
        	pipe_x += 400*0.3;

        	var rand2 = Math.random() * 1  + 1;
        	var pipeUpper = new CreatePipeUpper(rand2);
        	pipeUpper.moveTo(pipe_x_upper, pipe_y_upper);
        	game.rootScene.addChild(pipeUpper);
        	pipe_x_upper +=  400*0.3;
        }

        var shibaImg = new Sprite(300, 300);
        shibaImg.image = game.assets[SHIBA];
        shibaImg.originX = 20;
        shibaImg.originY = 0;
        shibaImg.scale(0.2, 0.2);
        shibaImg.x = 0;
        shibaImg.y = (SCREEN_H-shibaImg.height*shibaImg.scaleY)/2;
        game.rootScene.addChild(shibaImg);

    };
    game.start();
};

var CreatePipe = enchant.Class.create(enchant.Sprite, {

    initialize: function(rand) {
        enchant.Sprite.call(this, 400, 400);
        this.image = game.assets[PIPE];
        this.scaleX = 0.3;
        this.scaleY = 0.3+ rand * 0.1;
        this.moveTo(0, -rand);
        this.originX = 0;
        this.originY = (SCREEN_H - this.scaleY);
    }
});

var CreatePipeUpper = enchant.Class.create(enchant.Sprite, {

    initialize: function(rand) {
        enchant.Sprite.call(this, 400, 400);
        this.image = game.assets[PIPE_UPPER];
        this.scaleX = 0.3;
        this.scaleY = 0.3- rand * 0.1;
        this.moveTo(0, +rand);
        this.originX = 0;
        this.originY = 0;
    }
});
