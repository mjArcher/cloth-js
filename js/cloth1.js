
var offsetxm;
var offsetym;
// all rectangles
var boxes = []; 
var boxes_old = [];
var discs = []; 
var discs_old = [];
// all connections
var conns = []; 

var canvas;
var offsetx;// = canvas.width/2;
var offsety;// = 50; //canvas.height/2;

var ctx;
var WIDTH;
var HEIGHT;
var INTERVAL = 12;  // how often, in milliseconds, we check to see if a redraw is needed - VARY 

var isDrag = false;
var mx, my; // mouse coordinates

// when set to true, the canvas will redraw everything
// invalidate() just sets this to false right now
// we want to call invalidate() whenever we make a change
var canvasValid = false;

// The node (if any) being selected.
// If in the future we want to select multiple object, turn into array
var mySel; 
var mySeli;

// The selection color and width. Right now we have a red selection with a small width
var mySelColor = '#CC0000';
var mySelWidth = 2;

// we use a fake canvas to draw individual shapes for selection testing
var ghostcanvas;
var gctx; // fake canvas context
var gap = 30;
var gapsq = gap*gap;
var gappsq = 2*gapsq;
var diag = Math.sqrt(gappsq);
var xnodes = 15;
var ynodes = 10;
var NUM_ITERATIONS=1;
var GRAVITY=0.01;
var m_fTimeStep = 4;

// since we can drag from anywhere in a node
// instead of just its x/y corner, we need to save
// the offset of the mouse when we start dragging.
var offsetmx, offsetmy;

// Padding and border style widths for mouse offsets
var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;


function Box() 
{
	this.x = 0;
	this.y = 0;
	this.w = 5; // default width and height?
	this.h = 5;
	this.fill = '#000000';
}

function addDisc(px, py, pr){

  var disc = {
    x: px,
    y: py,
    radius: pr
  };

  boxes.push(disc);

  var disc_old = {
    x: px,
    y: py,
    radius: pr
  };

  boxes_old.push(disc_old);
  invalidate();
}

// initialize our canvas, add a ghost canvas, set draw loop
// then add everything we want to intially exist on the canvas
function init() 
{
  canvas = document.getElementById('myCanvas');
  canvas.height = window.innerHeight;
  canvas.width = window.innerWidth;
  HEIGHT =  canvas.height;
  WIDTH =  canvas.width;
  offsetx = WIDTH/2;
  offsety = HEIGHT/4;
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
  var count = 0;
  
  for (var i = 0; i < ynodes; i++) {
    var y = i*gap + offsety;
    for (var j = 0; j < xnodes; j++) {
      var x = j*gap + offsetx;
      // addRect(x, y, 10, 10, '#000000' );
      addDisc(x, y, 2.5);
      count++;
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


// REF: 
function Verlet() 
{
  var NUM_PARTICLES = xnodes*ynodes;


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

// REF:
function SatisfyConstraints() {
  var NUM_CONSTRAINTS = conns.length;
  for(var j=0; j<NUM_ITERATIONS; j++) {
    for(var i=0; i<NUM_CONSTRAINTS; i++) {
      var a = conns[i].partA;
      var b = conns[i].partB;
      var box1 = boxes[a];
      var box2 = boxes[b];
      var deltax = box2.x - box1.x;
      var deltay = box2.y - box1.y;
      
      // Original Sqrt method:
      // console.log(a + " " + boxa.x);  
      // var deltaLength = Math.sqrt(deltax*deltax + deltay*deltay); // CHANGE: This sqr root
      // var diff = (deltaLength-gap)/deltaLength;
      // console.log(deltax + " " + boxb.x);
   
      // distance between two points - sqrt replaced
      // with Netwon Raphson iteration. 
      var dsq = deltax*deltax + deltay*deltay;
      gapsq = conns[i].restLength*conns[i].restLength;
      var diff=((gapsq/(dsq+gapsq))-0.5);
      
      deltax*=diff;
      deltay*=diff;
      
      // ensures that the 
      if(a == mySeli){
        box2.x += deltax;
        box2.y += deltay;
      }
      else if(b == mySeli)
      {
        box1.x -= deltax;
        box1.y -= deltay;
      }
      else{
        box1.x -= deltax;
        box1.y -= deltay;
        box2.x += deltax;
        box2.y += deltay;
      }
    }
    
    // Boundary conditions
    boxes[0].x = offsetx;
    boxes[0].y = offsety;
    boxes[Math.round(xnodes/2)-1].x = ((xnodes-1)*gap/2) + offsetx;
    boxes[Math.round(xnodes/2)-1].y = offsety;
    boxes[xnodes-1].x = ((xnodes-1)*gap) + offsetx;
    boxes[xnodes-1].y = offsety;
  }
}

//initialise the rest connections/constraints
function connectivitySetup() 
{
  //first connect columns
  console.log("connectivity setup");
  var a, b;
  
  var restLength = gap; 
  var offset;
  //horizontal connections
  for (var i = 0; i <= xnodes-1; i++){
    for (var off = 0; off < ynodes-1; off++) {
      a = off*xnodes + i;
      b = (off+1)*xnodes + i; 
      console.log("a " + a + " b " + b);
      var cons = new constraint(a,b, restLength);
      conns.push(cons);
    }
  }
 
  //vertical connections
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

  //diagonal connections
  // for(var off=0; off < ynodes-1; off++){
  //   offset = off*xnodes;
  //   for(var k=0; k < xnodes-1; k++){
  //     a = k + offset;
  //     b = k + (off+1)*xnodes + 1;
  //     console.log(a,b);
  //     var cons = new constraint(a,b,diag); 
  //     conns.push(cons);
  //   }
  // }

  //diagonal constraints 
  //check code
  console.log(conns.length);
  // for(var i = 0; i < conns.length; i++)
  // {
  //   console.log(conns[i].partA + " " + conns[i].partB);
  //   var a = conns[i].partA;
  //   var b = conns[i].partB;
  //   console.log(boxes[a].x + " " + boxes[b].x);
  // }
}

// wipes the canvas context
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

    // Constant background graphics drawn here

    // draw all boxes
    // var l = boxes.length;
    // for (var i = 0; i < boxes.length; i++) {
    //    drawshape(ctx, boxes[i], boxes[i].fill);
    // }
    for (var i = 0; i < boxes.length; i++) {
       drawshape(ctx, boxes[i], '#fff');
    }

    // draw selection
    // right now this is just a stroke along the edge of the selected box
    // if (mySel != null) {
    //   ctx.strokeStyle = mySelColor;
    //   ctx.lineWidth = mySelWidth;
    //   ctx.strokeRect(mySel.x,mySel.y,mySel.w,mySel.h);
    // }
    // canvasValid = true;
    //if(mySel != null)
    //  fall();
    timeStep();
    drawLines(ctx);
  }
}

function drawLines(ctx)
{
  for(i=0; i<conns.length;i++)
  {
    var a = conns[i].partA;
    var b = conns[i].partB;
    ctx.beginPath();
    var boxa = boxes[a];
    var boxb = boxes[b];
    ctx.moveTo(boxa.x,boxa.y);
    ctx.lineTo(boxb.x,boxb.y);

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000';
    ctx.stroke();
  }
}

function timeStep()
{
  //<!-- AccumulateForces(); -->
  Verlet();
  SatisfyConstraints();
}

// Draws a single shape to a single context
// draw() will call this with the normal canvas
// myDown will call this with the ghost canvas
function drawshape(ctx, shape, fill) 
{
  ctx.fillStyle = '#000';

  // We can skip the drawing of elements that have moved off the screen:
  // if (shape.x > WIDTH || shape.y > HEIGHT) return; 
  // if (shape.x + shape. < 0 || shape.y + shape.h < 0) return;

  // context.fillRect(shape.x,shape.y,shape.w,shape.h);
  // context.fillRect(shape.x,shape.y,shape.w,shape.h);
  ctx.beginPath();
  ctx.arc(shape.x,shape.y,shape.radius,0,2*Math.PI);
  ctx.stroke();
  ctx.fill();

}

// Mouse activity
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
    var index = (mx + my * imageData.width) * 4; 

    // if the mouse pixel exists, select and break
    if (imageData.data[3] > 0) {
      console.log("Down" + i);
      mySel = boxes[i];
      mySeli=i;
      var offsetxm = mx - mySel.x;
      var offsetym = my - mySel.y;
      // mySel.x = mx - offsetxm;
      // mySel.y = my - offsetym;
      isDrag = true;//;
      canvas.onmousemove = myMove;
      invalidate();
      clear(gctx);
      return;
    }
  }

  // if haven't returned this means we have selected nothing
  mySel = null;
  // clear the ghost canvas for next time
  clear(gctx);
  // invalidate because we might need the selection border to disappear
  invalidate();
}

function myUp(e)
{
  // console.log(mx,my);
  // console.log("My selection " + mySel.y);
  // console.log(mySel.x);
  mySeli=null;
  isDrag = false;
  canvas.onmousemove = null;
}

// adds new node
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
  my = e.pageY - offsetY;
}
