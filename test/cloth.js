<script>
//Box object to hold data for all drawn rects

function Box() {
	this.x = 0;
	this.y = 0;
	this.w = 1; // default width and height?
	this.h = 1;
	this.fill = '#444444';
}

// we're going to need an array of old coordinates 
// doing the cloth here should be quite straight-forward

// just need an array of old coordinates
function moveFirst()
{
	firstSel = boxes[0];	
  //difference between old coords and new
  
  console.log(mx_e, my_e);
	firstSel.x = mx;
	firstSel.y = my;
}


//Initialize a new Box, add it, and invalidate the canvas
function addRect(x, y, w, h, fill) {
	var rect = new Box;
	rect.x = x;
	rect.y = y;
	rect.w = w
  rect.h = h;
	rect.fill = fill;
	boxes.push(rect);
  // also initialise boxes_old function
  boxes_old.push(rect);
	invalidate();
}


// these are all the global variables specific to the cloth problem

var nodes = 5;

// holds all our rectangles
var boxes = []; 
var boxes_old = [];
// holds all our connections
var conns = []; 

var canvas;
var ctx;
var WIDTH;
var HEIGHT;
var INTERVAL = 50;  // how often, in milliseconds, we check to see if a redraw is needed

var isDrag = false;
var mx, my; // mouse coordinates

// when set to true, the canvas will redraw everything
// invalidate() just sets this to false right now
// we want to call invalidate() whenever we make a change
var canvasValid = false;

// The node (if any) being selected.
// If in the future we want to select multiple objects, this will get turned into an array
var mySel; 

// The selection color and width. Right now we have a red selection with a small width
var mySelColor = '#CC0000';
var mySelWidth = 2;

// we use a fake canvas to draw individual shapes for selection testing
var ghostcanvas;
var gctx; // fake canvas context

// since we can drag from anywhere in a node
// instead of just its x/y corner, we need to save
// the offset of the mouse when we start dragging.
var offsetx, offsety;

// Padding and border style widths for mouse offsets
var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;

// initialize our canvas, add a ghost canvas, set draw loop
// then add everything we want to intially exist on the canvas
function init() {
  canvas = document.getElementById('myCanvas');
  HEIGHT = canvas.height;
  WIDTH = canvas.width;
  ctx = canvas.getContext('2d');
  ghostcanvas = document.createElement('canvas');
  ghostcanvas.height = HEIGHT;
  ghostcanvas.width = WIDTH;
  gctx = ghostcanvas.getContext('2d');

  //fixes a problem where double clicking causes text to get selected on the canvas
  canvas.onselectstart = function () { return false; }

  // fixes mouse co-ordinate problems when there's a border or padding
  // see getMouse for more detail
  if (document.defaultView && document.defaultView.getComputedStyle) {
    stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10)      || 0;
    stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10)       || 0;
    styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10)  || 0;
    styleBorderTop   = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10)   || 0;
  }

  // make draw() fire every INTERVAL milliseconds
  setInterval(draw, INTERVAL);

  // set our events. Up and down are for dragging,
  // double click is for making new boxes
  canvas.onmousedown = myDown;
  canvas.onmouseup = myUp;
  canvas.ondblclick = myDblClick;

  // add custom initialization here:

  // add an orange rectangle
  var ynodes = nodes;
  var xnodes = nodes;
  var len = 50; // 50 pixels 

  var offsetx = 400;
  var offsety = 400;

  for (var i = 0; i < ynodes; i++) {
    var y = i*len + offsety;
    for (var j = 0; j < xnodes; j++) {
      var x = j*len + offsetx;
      addRect(x, y, 10, 10, '#FFC02B' );
    }
  }
  connectivitySetup();
}

function constraint(a, b, restlen)
{
  this.partA = a;
  this.partB = b;
  this.restLength = restlen; 
}

// for the time integration step we need to 
function Verlet() {
  var NUM_PARTICLES = nodes*nodes;
  //length of boxes should be the same as nodes*nodes
  console.log(NUM_PARTICLES + " " + boxes.length);

  for(var i=0; i < NUM_PARTICLES; i++)
  {
    // get the current position of the rectangle
    var x = boxes[i].x;
    var y = boxes[i].y;
    var tx = x;
    var ty = y;
    var ox = boxes_old[i].x;
    var oy = boxes_old[i].y;
    var ax = 0;
    var ay = 9.81;
    boxes[i].x += x - ox*m_fTimeStep*m_fTimeStep; 
    boxes[i].y += y - oy*m_fTimeStep*m_fTimeStep; 
    ox = tx;
    oy = ty;
    boxes_old[i].x = ox;
    boxes_old[i].x = oy;
  }
}

//need to specify timestep somewhere

function SatisfyConstraints() 
{
  
  for(var j=0; j<NUM_ITERATIONS; j++) {
    for(var i=0; i<NUM_CONSTRAINTS; i++) {
      var a = conns[i].a;
      var b = conns[i].b;
      var boxa = boxes[a];
      var boxb = boxes[b];
      var deltax = boxb.x - boxa.x;
      var deltay = boxb.y - boxa.y;
      //implement vector dot
      var deltaLength = Math.sqrt(deltax*deltax + deltay*deltay);

    }
  }

  // constrain a few of the the cloth particles to the origin 
}

function connectivitySetup() {
  //first connect cols (easier to visualise
  var a, b;
  var n = nodes-1;
  var restLength = 10; // this will need changing 
  var offset;
  //n = 4
  for(var off=0; off <= n; off++) {
    offset = off*(n+1);
    for(var i=0; i<n; i++) {
      a = i + offset; //next row
      b = i + offset + 1;
      <!-- console.log(a + " " + b); -->
      var cons = new constraint(a,b, restLength);
      conns.push(cons);
    }
  }

  for (var i = 0; i <= n ; i++){
    for (var off = 0; off < n; off++) {
      a = off*nodes + i;
      b = (off+1)*nodes + i; 
      console.log(a + " " + b);
      var cons = new constraint(a,b, restLength);
      conns.push(cons);
    }
  }
}

//wipes the canvas context
function clear(c) {
  c.clearRect(0, 0, WIDTH, HEIGHT);
}

// While draw is called as often as the INTERVAL variable demands,
// It only ever does something if the canvas gets invalidated by our code
function draw() {
  if (canvasValid == false) {
    clear(ctx);

    // Add stuff you want drawn in the background all the time here

    // draw all boxes
    var l = boxes.length;
    for (var i = 0; i < l; i++) {
      drawshape(ctx, boxes[i], boxes[i].fill);
    }

    // draw selection
    // right now this is just a stroke along the edge of the selected box
    if (mySel != null) {
      ctx.strokeStyle = mySelColor;
      ctx.lineWidth = mySelWidth;
      ctx.strokeRect(mySel.x,mySel.y,mySel.w,mySel.h);
    }

    // Add stuff you want drawn on top all the time here

    canvasValid = true;
    //if(mySel != null)
    //  fall();
    timeStep();
  }
}

function timeStep()
{
  <!-- AccumulateForces(); -->
  Verlet();
  SatisfyConstraints();
}


function AccumulateForces()
{


}

function fall()
{
  if(mySel.y > 0)
  {
    mySel.y = mySel.y - 5; 
    <!-- console.log("fall"); -->
      invalidate(); 
  }
}

// Draws a single shape to a single context
// draw() will call this with the normal canvas
// myDown will call this with the ghost canvas
function drawshape(context, shape, fill) {
  context.fillStyle = fill;

  // We can skip the drawing of elements that have moved off the screen:
  if (shape.x > WIDTH || shape.y > HEIGHT) return; 
  if (shape.x + shape.w < 0 || shape.y + shape.h < 0) return;

  context.fillRect(shape.x,shape.y,shape.w,shape.h);
}

// Happens when the mouse is moving inside the canvas
function myMove(e){
  if (isDrag){
    getMouse(e);

    mySel.x = mx - offsetx;
    mySel.y = my - offsety;   
    //<!-- moveFirst() -->
      // something is changing position so we better invalidate the canvas!
      invalidate();
  }
}

mx_e=0;
my_e=0;

//

// Happens when the mouse is clicked in the canvas
function myDown(e){
  console.log(mx, my);
  mx_e = mx;
  my_e = my;
  getMouse(e);
  clear(gctx);
  var l = boxes.length;
  for (var i = l-1; i >= 0; i--) {
    // draw shape onto ghost context
    drawshape(gctx, boxes[i], 'black');

    // get image data at the mouse x,y pixel
    var imageData = gctx.getImageData(mx, my, 1, 1);
    var index = (mx + my * imageData.width) * 4;

    // if the mouse pixel exists, select and break
    if (imageData.data[3] > 0) {
      mySel = boxes[i];
      offsetx = mx - mySel.x;
      offsety = my - mySel.y;
      mySel.x = mx - offsetx;
      mySel.y = my - offsety;
      isDrag = true;
      canvas.onmousemove = myMove;
      invalidate();
      clear(gctx);
      return;
    }

  }

  // havent returned means we have selected nothing
  mySel = null;
  // clear the ghost canvas for next time
  clear(gctx);
  // invalidate because we might need the selection border to disappear
  invalidate();
}

function myUp(){
  //<!-- if(mySel != null) -->
  //<!--   console.log(mySel.x); -->
  //while(mySel.y != 0 && canvasValid == false){ 
  // fall();
  //invalidate(); 
  //clear(gctx);
  //setTimeout(hello, INTERVAL);
  //}


  if(mySel != null && mySel.y > 0) { 
    fall();
  }

  isDrag = false;
  canvas.onmousemove = null;
}

function hello(){
  console.log("Print");
}


// adds a new node
function myDblClick(e) {
  getMouse(e);
  // for this method width and height determine the starting X and Y, too.
  // so I left them as vars in case someone wanted to make them args for something and copy this code
  var width = 20;
  var height = 20;
  addRect(mx - (width / 2), my - (height / 2), width, height, '#77DD44');
}

function invalidate() {
  canvasValid = false;
}

// Sets mx,my to the mouse position relative to the canvas
// unfortunately this can be tricky, we have to worry about padding and borders
function getMouse(e) {
  var element = canvas, offsetX = 0, offsetY = 0;

  if (element.offsetParent) {
    do {
      offsetX += element.offsetLeft;
      offsetY += element.offsetTop;
    } while ((element = element.offsetParent));
  }

  // Add padding and border style widths to offset
  offsetX += stylePaddingLeft;
  offsetY += stylePaddingTop;

  offsetX += styleBorderLeft;
  offsetY += styleBorderTop;

  mx = e.pageX - offsetX;
  my = e.pageY - offsetY
}

// If you dont want to use <body onLoad='init()'>
// You could uncomment this init() reference and place the script reference inside the body tag
//init();

</script>

<body onload="init();">
  <canvas id="myCanvas" width="1000" height="1000">
  </canvas> 
</body>
