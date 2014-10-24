
var host = '192.168.0.15'
//var host = '192.168.0.27'	
var URL = "ws://"+host+":8888/drive_websocket";

function RemoteRobot (URL, canvas) {
	console.log("create new remote robot on "+URL);
	this.canvas = canvas;
	this.ws = new WebSocket(URL);
	this.down = false;
	this.canvas = canvas;
	this.ctx = this.canvas.getContext('2d');
	this.ongoingTouches = new Array;
	this.mode = true;
	this.modeLabels = {true:'multi touch',false:'single touch'};
	
	canvas.addEventListener("touchstart", this.handleStart.bind(this), false);
	canvas.addEventListener("touchend", this.handleEnd.bind(this), false);
	canvas.addEventListener("touchcancel", this.handleCancel.bind(this), false);
	canvas.addEventListener("touchleave", this.handleLeave.bind(this), false);
	canvas.addEventListener("touchmove", this.handleMove.bind(this), false);
	canvas.addEventListener('mousedown',this.handleMouseDown.bind(this), false );
	canvas.addEventListener('mouseout',this.handleMouseOut.bind(this), false );
	canvas.addEventListener('mouseup',this.handleMouseUp.bind(this), false );
	canvas.addEventListener('mousemove',this.handleMouseMove.bind(this), false );
	
	this.ws.onopen = function() {
	   console.log("connected");
	};
	
	this.ws.onmessage = function (evt) {
	   //console.log("received data "+evt.data);
	};
	
	this.drawStuff();
}
    
RemoteRobot.prototype.ongoingTouchIndexById = function(idToFind) {
    for (var i=0; i<this.ongoingTouches.length; i++) {
        var id = this.ongoingTouches[i].identifier;
        
        if (id == idToFind) {
            return i;
        }
    }
    return -1;    // not found
};

RemoteRobot.prototype.sendTouch = function(x,y,touch){
        var xcomp = Math.round(255*x/this.canvas.width);
        var ycomp = 255-Math.round(255*y/this.canvas.height); 
        this.ws.send(JSON.stringify({'type':'touch','x':xcomp,'y':ycomp,'control':touch}));
};

RemoteRobot.prototype.handleMouseDown = function(e) {
    this.down = true;
};

RemoteRobot.prototype.handleMouseOut = function(e) {
    //console.log('out!');
    //down = false;
}
	
RemoteRobot.prototype.handleMouseUp = function(e) {
    this.down = false;
	this.ws.send(JSON.stringify({'type':'stop'}));
};

RemoteRobot.prototype.handleMouseMove = function(e) {
    if(this.down) {
        this.sendTouch(e.clientX,e.clientY,0);
    }
};

RemoteRobot.prototype.handleStart = function(evt) {
  evt.preventDefault();
  var touches = evt.changedTouches;
         
  for (var i=0; i<touches.length; i++) {
    this.ongoingTouches.push(touches[i]);
    this.sendTouch(touches[i].pageX-2, touches[i].pageY-2,i);
  }
};

RemoteRobot.prototype.handleMove = function(evt) {
  evt.preventDefault();
  var touches = evt.changedTouches;
   
  for (var i=0; i<touches.length; i++) {
    var idx = this.ongoingTouchIndexById(touches[i].identifier);
 

    this.sendTouch(touches[i].pageX, touches[i].pageY, idx);
    this.ongoingTouches.splice(idx, 1, touches[i]);  // swap in the new touch record
  }
};

RemoteRobot.prototype.handleEnd = function(evt) {
  evt.preventDefault();
  var touches = evt.changedTouches;
   
  this.ctx.lineWidth = 4;
         
  for (var i=0; i<touches.length; i++) {
    this.sendTouch(touches[i].pageX, touches[i].pageY, i);
    this.ongoingTouches.splice(i, 1);  // remove it; we're done
  }
  if(this.ongoingTouches.length == 0) {
	this.ws.send(JSON.stringify({'type':'stop'}));
  }
};

RemoteRobot.prototype.handleCancel = function(evt) {
  evt.preventDefault();
  var touches = evt.changedTouches;
   
  for (var i=0; i<touches.length; i++) {
    this.ongoingTouches.splice(i, 1);  // remove it; we're done
  }
};

RemoteRobot.prototype.handleLeave = function(evt) {
  evt.preventDefault();
};

RemoteRobot.prototype.drawStuff = function() {
	this.ctx.fillStyle = "#FFFFFF";
	this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
	this.ctx.strokeRect(this.canvas.width/2, 0, 1, this.canvas.height);
	this.ctx.strokeRect(0, this.canvas.height/2, this.canvas.width, 1);
};

RemoteRobot.prototype.updateUI = function(){
	this.modeButton.innerHTML = 'use '+this.modeLabels[!this.mode];
}

RemoteRobot.prototype.setModeButton = function(btn) {
	this.modeButton = btn;
	this.modeButton.addEventListener('click',this.toggleMode.bind(this),false);
	this.updateUI();
};

RemoteRobot.prototype.toggleMode = function(){
	this.mode = !this.mode;
	this.ws.send(JSON.stringify({'type':'mode','mode':this.modeLabels[this.mode]}));
	this.updateUI();
}


window.addEventListener('load',function(){ 
	var canvas = document.getElementById('c1');
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	var rr = new RemoteRobot(URL, canvas);

	document.getElementById('fullscreen').addEventListener('click', function() {
		if (canvas.requestFullscreen) {
		  canvas.requestFullscreen();
		} else if (canvas.mozRequestFullScreen) {
		  canvas.mozRequestFullScreen();
		} else if (elem.webkitRequestFullscreen) {
		  canvas.webkitRequestFullscreen();
		}
	}.bind(this), false);
	
	var modeBtn = document.getElementById('mode');
	
	rr.setModeButton(modeBtn);

    window.addEventListener('resize', resizeCanvas, false);

    function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            rr.drawStuff(); 
    }
    resizeCanvas();
	
}, false);