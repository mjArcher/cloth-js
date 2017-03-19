//Cloth based on Advanced Character Physics guide:
//boolean value determines whether it is fixed or not
// https://codepen.io/mjreachr/pen/xqwywM 
//
// Extend
// Flag
// timestep
// graphics on flag 
// like a fluid? 
// toggle options:
// sliders for elasticity (number of iterations)
// wind speed (how to do this for the perlin noise)
// wind amplitude
// switch between disturbances. 

// add node and remove fixed node
//

var offsetxm;
var offsetym;
var nodes = []; 
var connx = []; 
var gaussian = [];
var wind = [];
var offsetx;
var offsety;
var ctx;
var WIDTH;
var HEIGHT;
var isDrag = false;
var mx, my; 

var mySel; 
var mySeli;

var canvas;
var gap = 10;
var gapsq = gap*gap;
var gappsq = 2*gapsq;
var diag = Math.sqrt(gappsq);
var xnodes = 25;
var ynodes = 25;
var dts = 0.01;

var TWO_PI=2*Math.PI;
var NUM_PARTICLES=xnodes*ynodes;
var NUM_CONSTRAINTS;
var GRAVITY=9.8;
var RADIUS=0.5;
var LINEDWIDTH=0.2;

var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;

canvas = document.getElementById('myCanvas');

function dist(x,y){
  return Math.sqrt(x*x+y*y);
}

function addNode(px, py, r){
  var node = {
    x: px,
    y: py,
    oldx: px,
    oldy: py,
    radius: r,
    fixed: false
  };
  nodes.push(node);
}

// initialize our canvas, add a ghost canvas, set draw loop
// then add everything we want to intially exist on the canvas
function init() 
{
  canvas = document.getElementById('myCanvas');
  canvas.height = window.innerHeight;
  canvas.width = window.innerWidth;
  canvas.addEventListener('mousemove', mouse_track);
  HEIGHT =  canvas.height;
  WIDTH =  canvas.width;
  offsetx = WIDTH/2 - xnodes*gap/2;
  offsety = HEIGHT/2 - ynodes*gap/2;
  ctx = canvas.getContext('2d');
  canvas.onselectstart = function () { return false; }

  if (document.defaultView && document.defaultView.getComputedStyle) {
    stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10)      || 0;
    stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10)       || 0;
    styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10)  || 0;
    styleBorderTop   = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10)   || 0;
  }

  canvas.onmousemove = null;
  canvas.onmousedown = myDown;
  canvas.onmouseup = myUp;

  var count = 0;
  for (var i = 0; i < ynodes; i++) {
    var y = i*gap + offsety;
    for (var j = 0; j < xnodes; j++) {
      var x = j*gap + offsetx;
      addNode(x, y, RADIUS);
      count++;
    }
  }

  setupFlag();
  connectivitySetup();
}

function setupFlag()
{
  for(var i = 0; i < ynodes; i++)
  {
    nodes[i*xnodes].fixed = true;
  }
}

//wind speed?


var mean1 = 0.25;
var mean2 = 0.75;
var sigmasq = 0.09;
var windSpeed = 1.0;

//create sliders on dt, amp
// use this as the waving flag looks artificial 

var _noise = [];
var noise_repeat = 20; // compute perlin noise for 20 xnodes cycles 
var noise_length = xnodes*noise_repeat;
var beginPtj_init = xnodes*(noise_repeat-1); 
var beginPtj = beginPtj_init;

//wind direction?
var wind_params = { 
  strength : 20, //0-100
  speed : 1, // 0-1
  mode : "sine";
}
// initialise arrays, wind
for(var i = 0; i < NUM_PARTICLES; i++)
{
  wind.push(0);
  // _noise.push(0); // actually much bigger than this 
}

function genNoise()
{
  noise.seed(Math.random());
  for(var i = 0; i < ynodes; i++)
  {
    for(var j = 0; j < noise_length; j++)
    {
      _noise.push((1+noise.simplex2(j/xnodes,i/ynodes))/2);
    }
  }
}

function gaussianDisturbance(x, mean, sigma)
{
  return (1/(sigma*Math.sqrt(TWO_PI)))*Math.exp(-(Math.pow(x-mean,2))/(2*Math.pow(sigma,2)));
}


function set_wind()
{
  var index;
  var windamp = wind_params.strength;
  if(wind_params.mode = "sine")
  {
    for(var i=0; i < ynodes; i++)
      for(var j=0; j < xnodes; j++)
      {
        index = i*xnodes+j;
        wind[index] = windamp*gaussian[i];
      }
  }
  else if (wind_params.mode = "simplex")
  {

    for(var i=0; i < ynodes; i++)
      for(var j=0; j < xnodes; j++)
      {
        var index = i*noise_length+beginPtj+j;
        wind[i*xnodes+j] = _noise[index];
      }
  }
}


function move()
{
  // update noise and gaussian wind and do verlet

  mean1 += windSpeed/(2*xnodes); //changes the wind speed
  mean2 += windSpeed/(2*xnodes);

  // plot the gaussian between 0 and 0.5
  if (mean1 > 0.75)
    mean1 = -0.25;
  if (mean2 > 0.75)
    mean2 = -0.25;

  for(var i = 0; i < xnodes; i++)
  {
    gaussian[i] = Math.max(gaussianDisturbance((i/xnodes)/2,mean1,sigmasq),
      gaussianDisturbance((i/xnodes)/2,mean2,sigmasq));
  }

  // perlin noise
  //
  
  beginPtj-=1;
  if(beginPtj < xnodes)
    beginPtj = beginPtj_init

  // do the verlet bit 
  var x, y, temp_x, temp_y;
  var acc_x, acc_y = GRAVITY;

  for(var i=0; i < NUM_PARTICLES; i++)
  {
    if(i!=mySeli){
      if(!nodes[i].fixed)
      {
        acc_x = wind[i];
        x = nodes[i].x;
        y = nodes[i].y;
        temp_x = x;
        temp_y = y;
        nodes[i].x += x - nodes[i].oldx + acc_x * dts; 
        nodes[i].y += y - nodes[i].oldy + acc_y * dts; 
        nodes[i].oldx = temp_x;
        nodes[i].oldy = temp_y;
      }
    }
  }
}


function SatisfyConstraints() {
  var dx, dy, dsq;
  for(var j=0; j<NUM_ITERATIONS; j++) {
    for(var i=0; i<NUM_CONSTRAINTS; i++) {
      var first = connx[i].first;
      var second = connx[i].second;
      var box1 = nodes[first];
      var box2 = nodes[second];
      dx = box2.x - box1.x;
      dy = box2.y - box1.y;
      dsq = dx*dx + dy*dy;
      if(dsq > gapsq)
      {
        var diff=((gapsq/(dsq+gapsq))-0.5);
        dx*=diff;
        dy*=diff;
        if(first == mySeli || nodes[first].fixed == true){
          box2.x += dx;
          box2.y += dy;
        }
        else if(second == mySeli || nodes[second].fixed == true){
          box1.x -= dx;
          box1.y -= dy;
        }
        else{
          box1.x -= dx;
          box1.y -= dy;
          box2.x += dx;
          box2.y += dy;
        }
      }
    }
  }

  for(var i=0; i < nodes.length; i++)
  {
    if(nodes[i].x > WIDTH - 10)
      nodes[i].x = WIDTH - 10;
    if(nodes[i].x < 10)
      nodes[i].x = 10;
    if(nodes[i].y > HEIGHT - 10)
      nodes[i].y = HEIGHT - 10;
    if(nodes[i].y < 10)
      nodes[i].y = 10;
  }
}

function constraint(first, second, restLength) 
{
  this.first = first;
  this.second = second;
  this.restLength = restLength; 
}

//needs to be rethought
function connectivitySetup() 
{
  connx = [];
  // console.log("connectivity setup");
  var a, b;
  var restLength = gap; 
  var offset;
  //horizontal connections
  for (var i = 0; i <= xnodes-1; i++){
    for (var off = 0; off < ynodes-1; off++) {
      a = off*xnodes + i;
      b = (off+1)*xnodes + i; 
      // console.log("a " + a + " b " + b);
      var con = new constraint(a,b,restLength);
      connx.push(con);
    }
  }
 
  //vertical connections
  for(var off=0; off <= ynodes-1; off++) {
    offset = off*xnodes;
    for(var i=0; i<xnodes-1; i++) {
      a = i + offset; //next row
      b = i + 1 + offset;
      // console.log("a " + a + " b " + b);
      // <!-- console.log(a + " " + b); -->
      var con = new constraint(a,b,restLength);
      connx.push(con);
    }
  }
  NUM_CONSTRAINTS=connx.length;
  genNoise();
  plotNoise();
  // genGaussianWind();
  window.requestAnimationFrame(draw);
}

// wipes the canvas context
function clear(c) 
{
  c.clearRect(0, 0, WIDTH, HEIGHT);
}

function draw() 
{
  clear(ctx);
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  HEIGHT = canvas.height;
  WIDTH =  canvas.width;

  ctx.fillStyle = '#000';
  ctx.fill();
  for (var i = 0; i < nodes.length; i++) {
    ctx.beginPath();
    ctx.arc(nodes[i].x, nodes[i].y,nodes[i].radius,0,TWO_PI);
    ctx.stroke();
  }
  //<!-- AccumulateForces(); -->
  plotNoise();
  // genGaussianWind();
  Verlet();
  SatisfyConstraints();
  // drawLines(ctx);
  window.requestAnimationFrame(draw);
}

function drawLines(ctx)
{
  ctx.lineWidth = LINEDWIDTH;
  ctx.strokeStyle = '#000';
  for(i=0; i<connx.length; ++i)
  {
    var a = connx[i].first;
    var b = connx[i].second;
    ctx.beginPath();
    ctx.moveTo(nodes[a].x,nodes[a].y);
    ctx.lineTo(nodes[b].x,nodes[b].y);
    ctx.stroke();
  }
}

// Mouse activity
function myMove(e)
{
  if (isDrag){
    getMouse(e);
    mySel.x = mx;
    mySel.y = my; 
  }
}

function mouse_track(e) {
  mx = e.clientX;
  my = e.clientY;
}

function myDown(e)
{
  console.log(mx, my);
  getMouse(e);

  var l = NUM_PARTICLES
  for (var i = l-1; i >= 0; i--) {
    if(dist(mx-nodes[i].x, my-nodes[i].y) < 20)
    {
      nodes[i].x = mx; 
      nodes[i].y = my;
      mySel = nodes[i];
      mySeli = i;
      isDrag = true;
      canvas.onmousemove = myMove;
      break;
    }
  }
}

function myUp(e)
{
  mySeli=null;
  isDrag = false;
  canvas.onmousemove = null;
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
