//think of some damping you could do?
//problem is that the constraints are still satisfied if the bottom level settles above the next level up?
//move like a face?
var offsetxm;
var offsetym;
// holds all our rectangles
var boxes = []; 
var boxes_old = [];
// holds all our connections
var conns = []; 
mx_e=0;
my_e=0;
var offsetx = 100;
var offsety = 50;
var canvas;
var ctx;
var WIDTH;
var HEIGHT;
var INTERVAL = 50;  // how often, in milliseconds, we check to see if a redraw is needed - VARY 

var isDrag = false;
var mx, my; // mouse coordinates

// when set to true, the canvas will redraw everything
// invalidate() just sets this to false right now
// we want to call invalidate() whenever we make a change
var canvasValid = false;

// The node (if any) being selected.
// If in the future we want to select multiple objects, this will get turned into an array
var mySel; 
var mySeli;

// The selection color and width. Right now we have a red selection with a small width
var mySelColor = '#CC0000';
var mySelWidth = 2;

// we use a fake canvas to draw individual shapes for selection testing
var ghostcanvas;
var gctx; // fake canvas context
var gap = 30;
var xnodes = 15;
var ynodes = 8;

// since we can drag from anywhere in a node
// instead of just its x/y corner, we need to save
// the offset of the mouse when we start dragging.
var offsetx, offsety;

// Padding and border style widths for mouse offsets
var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;

function Box() 
{
	this.x = 0;
	this.y = 0;
	this.w = 0.5; // default width and height?
	this.h = 0.5;
	this.fill = '#000000';
}

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
function addRect(x, y, w, h, fill) 
{
  // console.log("called");
	var rect = new Box;
	rect.x = x;
	rect.y = y;
	rect.w = w;
  rect.h = h;
	rect.fill = fill;
	boxes.push(rect);
  // also initialise boxes_old function
  var recto = new Box;
  recto.x = x;
  recto.y = y;
  recto.w = w;
  recto.h = h;
  boxes_old.push(recto);
	invalidate();
}

// initialize our canvas, add a ghost canvas, set draw loop
// then add everything we want to intially exist on the canvas
function init() 
{
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
  // var ynodes = nodes;
  // var xnodes = nodes;

  var count = 0;
  
  for (var i = 0; i < ynodes; i++) {
    var y = i*gap + offsety;
    for (var j = 0; j < xnodes; j++) {
      var x = j*gap + offsetx;
      addRect(x, y, 4, 4, '#000000' );
      count += 1;
      // console.log(count);
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

// CHANGES
// ========
// Want to stop updating the particle we have selected
// Loop over array: 

//need to specify timestep somewhere
// var NUM_ITERATIONS=2;
// Variables that dictate how the cloth behaves:
// acceleration ay = 1 
// m_fTimeStep = 0.2;

var NUM_ITERATIONS=2;
var GRAVITY=0.1;
var m_fTimeStep = 2.9;


// for the time integration step we need to 
function Verlet() 
{
  var NUM_PARTICLES = xnodes*ynodes;
  //length of boxes should be the same as nodes*nodes
  // console.log(NUM_PARTICLES + " " + boxes.length);
  // console.log("called");
  // 72 constraints 

  for(var i=0; i < NUM_PARTICLES; i++)
  {
    // get the current position of the rectangle
    if(i!=mySeli){
      var x = boxes[i].x;
      var y = boxes[i].y;
      var temp_x = x;
      var temp_y = y;
      var ox = boxes_old[i].x;
      var oy = boxes_old[i].y;
      var ax = 0;
      var ay = GRAVITY;
      boxes[i].x += x - ox + ax * m_fTimeStep*m_fTimeStep; 
      boxes[i].y += y - oy + ay * m_fTimeStep*m_fTimeStep; 
      // console.log("1 " + y + " " + oy + " " + boxes[i].y)
      // // console.log( m_fTimeStep*m_fTimeStep);
      // console.log("2 " + boxes_old[i].y);
      ox = temp_x;
      oy = temp_y;
      // console.log("3 " + oy);
      boxes_old[i].x = ox;
      boxes_old[i].y = oy;
      // console.log(boxes_old[i].y + " " + boxes[i].y);
      // console.log(boxes[i].y - boxes_old[i].y);
    }
  }
}

function fastsqrt()
{
  var guess = 10;
}

//looping over
function SatisfyConstraints() 
{

  var NUM_CONSTRAINTS = conns.length;
  for(var j=0; j<NUM_ITERATIONS; j++) {
    for(var i=0; i<NUM_CONSTRAINTS; i++) {
      var a = conns[i].partA;
      var b = conns[i].partB;
      console.log(a + " " + b);
      var boxa = boxes[a];
      var boxb = boxes[b];
    
      var deltax = boxb.x - boxa.x;
      var deltay = boxb.y - boxa.y;
      //implement vector dot
      // console.log(a + " " + boxa.x);  
      var deltaLength = Math.sqrt(deltax*deltax + deltay*deltay); // CHANGE: This sqr root
      var diff = (deltaLength-gap)/deltaLength;
      // console.log(deltax + " " + boxb.x);
      //

      if(a == mySeli){
        boxb.x -= deltax*0.5*diff;
        boxb.y -= deltay*0.5*diff;
      }
      else if(b == mySeli)
      {
        boxa.x += deltax*0.5*diff;
        boxa.y += deltay*0.5*diff;
      }
      else{
        boxa.x += deltax*0.5*diff;
        boxa.y += deltay*0.5*diff;
        boxb.x -= deltax*0.5*diff;
        boxb.y -= deltay*0.5*diff;
      }
      // boxes[a] = boxa;
      // boxes[b] = boxb;
    }
    //constrain upper left and upper right particles to the origin (2)
    //
    //PINNED CLOTH PARTICLES:
    boxes[0].x = offsetx;
    boxes[0].y = offsety;
    boxes[Math.round(xnodes/2)-1].x = ((xnodes-1)*gap/2) + offsetx;
    boxes[Math.round(xnodes/2)-1].y = offsety;
    boxes[xnodes-1].x = ((xnodes-1)*gap) + offsetx;
    boxes[xnodes-1].y = offsety;
  }

  // constrain a few of the the cloth particles to the origin 
}

function connectivitySetup() 
{
  //first connect cols (easier to visualise
  console.log("connectivity setup");
  var a, b;
  var restLength = gap; // this will need changing 
  var offset;
  //n = 4
  for(var off=0; off <= ynodes-1; off++) {
    offset = off*xnodes;
    for(var i=0; i<xnodes-1; i++) {
      a = i + offset; //next row
      b = i + 1 + offset;
      console.log("a " + a + " b " + b);
      // <!-- console.log(a + " " + b); -->
      var cons = new constraint(a,b,restLength);
      conns.push(cons);
    }
  }

  for (var i = 0; i <= xnodes-1; i++){
    for (var off = 0; off < ynodes-1; off++) {
      a = off*xnodes + i;
      b = (off+1)*xnodes + i; 
      console.log("a " + a + " b " + b);
      var cons = new constraint(a,b, restLength);
      conns.push(cons);
    }
  }

  //number of constraints
  console.log(conns.length);

  //check code
  // console.log(conns.length);
  // for(var i = 0; i < conns.length; i++)
  // {
  //   console.log(conns[i].partA + " " + conns[i].partB);
  //   var a = conns[i].partA;
  //   var b = conns[i].partB;
  //   console.log(boxes[a].x + " " + boxes[b].x);
  // }
}

//wipes the canvas context
function clear(c) 
{
  c.clearRect(0, 0, WIDTH, HEIGHT);
}

//this is no longer valid:
// While draw is called as often as the INTERVAL variable demands,
// It only ever does something if the canvas gets invalidated by our code
function draw() 
{
  canvasValid = false;
  if (canvasValid == false) {
    clear(ctx);

    // Add stuff you want drawn in the background all the time here

    // draw all boxes
    // var l = boxes.length;
    // for (var i = 0; i < l; i++) {
    //   drawshape(ctx, boxes[i], boxes[i].fill);
    // }

    // draw selection
    // right now this is just a stroke along the edge of the selected box
    // if (mySel != null) {
    //   ctx.strokeStyle = mySelColor;
    //   ctx.lineWidth = mySelWidth;
    //   ctx.strokeRect(mySel.x,mySel.y,mySel.w,mySel.h);
    // }

    // Add stuff you want drawn on top all the time here

    // canvasValid = true;
    //if(mySel != null)
    //  fall();
    timeStep();
    drawLines();
  }
}

function drawLines()
{
  // ctx.moveTo(100, 150);
  // ctx.lineTo(450, 50);
  // ctx.strokeStyle = '#ff0000';
  // ctx.lineWidth = 1;

  // ctx.stroke();

  for(i=0; i<conns.length;i++)
  {
    // console.log("called");
    var a = conns[i].partA;
    var b = conns[i].partB;
    ctx.beginPath();
    var boxa = boxes[a];
    var boxb = boxes[b];
    ctx.moveTo(boxa.x,boxa.y);
    ctx.lineTo(boxb.x,boxb.y);

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000000';
    // ctx.moveTo(100, 150);
    // ctx.context.lineTo(450, 50);
    ctx.stroke();
  }
}

function timeStep()
{
  //<!-- AccumulateForces(); -->
  Verlet();
  SatisfyConstraints();
}


//we need to add 

// function AccumulateForces()
// {

//   //assign gravity to all particles
//   for(var i=0; i < nodes*nodes; i++)
// }

function fall()
{
  if(mySel.y > 0)
  {
    mySel.y = mySel.y - 5; 
    // <!-- console.log("fall"); -->
    invalidate(); 
  }
}

// Draws a single shape to a single context
// draw() will call this with the normal canvas
// myDown will call this with the ghost canvas
function drawshape(context, shape, fill) 
{
  context.fillStyle = fill;

  // We can skip the drawing of elements that have moved off the screen:
  if (shape.x > WIDTH || shape.y > HEIGHT) return; 
  if (shape.x + shape.w < 0 || shape.y + shape.h < 0) return;

  context.fillRect(shape.x,shape.y,shape.w,shape.h);
}

// Happens when the mouse is moving inside the canvas
function myMove(e)
{
  if (isDrag){
    getMouse(e);

    mySel.x = mx;// - offsetxm;
    mySel.y = my; //- offsetym;   
    //<!-- moveFirst() -->
      // something is changing position so we better invalidate the canvas!
    invalidate();
  }
}


// Happens when the mouse is clicked in the canvas
function myDown(e)
{
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
    var index = (mx + my * imageData.width) * 4; //what is this used for?

    // if the mouse pixel exists, select and break
    if (imageData.data[3] > 0) {
      console.log("Down" + i);
      mySel = boxes[i];
      mySeli=i;
      var offsetxm = mx - mySel.x;
      var offsetym = my - mySel.y;
      mySel.x = mx - offsetxm;
      mySel.y = my - offsetym;
      isDrag = true;//;
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

function myUp()
{
  //<!-- if(mySel != null) -->
  //<!--   console.log(mySel.x); -->
  //while(mySel.y != 0 && canvasValid == false){ 
  // fall();
  //invalidate(); 
  //clear(gctx);
  //setTimeout(hello, INTERVAL);
  //}


  // if(mySel != null && mySel.y > 0) { 
  //   fall();
  // }

  mySeli=null;
  isDrag = false;
  canvas.onmousemove = null;
}

function hello()
{
  console.log("Print");
}


// adds a new node
function myDblClick(e) 
{
  getMouse(e);
  // // for this method width and height determine the starting X and Y, too.
  // // so I left them as vars in case someone wanted to make them args for something and copy this code
  var width = 20;
  var height = 20;
  addRect(mx - (width / 2), my - (height / 2), width, height, '#77DD44');
}

function invalidate() 
{
  canvasValid = false;
}

// Sets mx,my to the mouse position relative to the canvas
// unfortunately this can be tricky, we have to worry about padding and borders
function getMouse(e) 
{
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

