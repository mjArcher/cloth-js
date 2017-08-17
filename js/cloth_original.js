
//Cloth based on Advanced Character Physics guide:
//boolean value determines whether it is fixed or not
// https://codepen.io/mjreachr/pen/xqwywM 
// Flag with warped graphics - needs to be a lot faster though
// graphics on flag 
// https://gamedevelopment.tutsplus.com/tutorials/simulate-tearable-cloth-and-ragdolls-with-simple-verlet-integration--gamedev-519

var nodes = []; 
var connx = []; 
var offsetx;
var offsety;
var ctx;
var WIDTH;
var HEIGHT;
var isDrag = false;
var mx, my; 

var mySel; 
var active_node;

var xnodes = 25;
var ynodes = 25;

var TWO_PI=2*Math.PI;
var node_count=xnodes*ynodes;
var num_constraints;
var iterations = 3;
var gravity = 9.8;
var RADIUS = 0.5;
var LINEDWIDTH=0.2;

var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;

var dx, dy;
var canvas = canvas = document.getElementById('myCanvas');
// canvas.height = window.innerHeight;
// canvas.width = window.innerWidth;
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

function init() 
{
  canvas = document.getElementById('myCanvas');
  canvas.height = window.innerHeight;
  canvas.width = window.innerWidth;
  delta = Math.min((canvas.width-20)/xnodes, (canvas.height-20)/ynodes);
  dx = delta;
  dy = delta;
  dxsq = dx*dx;
  dxroot = Math.sqrt(dxsq);
  console.log(delta);
  HEIGHT = canvas.height;
  WIDTH = canvas.width;
  offsetx = WIDTH/2 - xnodes*dx/2;
  offsety = HEIGHT/2 - ynodes*dy/2;
  ctx = canvas.getContext('2d');
  canvas.onselectstart = function () { return false; }

  if (document.defaultView && document.defaultView.getComputedStyle) {
    stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10)      || 0;
    stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10)       || 0;
    styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10)  || 0;
    styleBorderTop   = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10)   || 0;
  }
  canvas.addEventListener('mousemove', mouse_track);
  canvas.addEventListener('mousedown', mouse_down);
  canvas.addEventListener('mouseup', mouse_up);

  canvas.onmousemove = null;
  canvas.onmousedown = mouse_down;
  canvas.onmouseup = mouse_up;

  for (var i = 0; i < node_count; i++) {
    var x = Math.floor(i%xnodes)*dx + offsetx;
    var y = Math.floor(i/ynodes)*dy + offsety;
    addNode(x, y, RADIUS);
  }

  nodes[0].fixed = true;
  nodes[xnodes-1].fixed = true;
  nodes[Math.floor(xnodes/2)].fixed = true; 
  nodes[Math.floor(xnodes/4)].fixed = true; 
  nodes[Math.floor(xnodes/4) + Math.floor(xnodes/2)].fixed = true; 


  connectivitySetup();
  window.requestAnimationFrame(draw);
}


function move(dt)
{
  var x, y, temp_x, temp_y;
  var acc_x = 0, acc_y = gravity;

  for(var i = 0; i < node_count; i++) {
    if(i!=active_node){
      if(!nodes[i].fixed) { //don't have to check every time : efficiency?
        x = nodes[i].x;
        y = nodes[i].y;
        temp_x = x;
        temp_y = y;
        nodes[i].x += x - nodes[i].oldx + acc_x * dt; 
        nodes[i].y += y - nodes[i].oldy + acc_y * dt; 
        nodes[i].oldx = temp_x;
        nodes[i].oldy = temp_y;
      }
    }
  }
}

function resolve_constraints() {
  var dx, dy, dsq;
  var diff;
  var transX;
  var transY;

  for(var j=0; j < iterations; j++){
    for(var i=0; i < num_constraints; i++) {
      var first = nodes[connx[i].first];
      var second = nodes[connx[i].second];
      // sqrt approximation
      dx = second.x - first.x;
      dy = second.y - first.y;
      dsq = dx*dx + dy*dy;
      d = Math.sqrt(dsq);

      if(dsq > dxsq) // prevents snapping
      {
        // diff=((dxsq/(dsq+dxsq))-0.5);
        diff=(delta - d)/d;
        transX = dx * 0.5 * diff;
        transY = dy * 0.5 * diff;
        if(connx[i].first == active_node || nodes[connx[i].first].fixed == true){
          second.x += transX;
          second.y += transY;
        }
        else if(connx[i].second == active_node || nodes[connx[i].second].fixed == true){
          first.x -= transX;
          first.y -= transY;
        }
        else{
          first.x -= transX;
          first.y -= transY;
          second.x += transX;
          second.y += transY;
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


function connectivitySetup() 
{
  connx = [];
  // console.log("connectivity setup");
  var a, b;
  var restLength = dx; 
  var offset;
  
  for(var i = 0; i < nodes.length; i++) {
    if(((i+1) % xnodes) != 0) {
      var conx = {
        first: i,
        second: i+1
      };
      connx.push(conx);
    }
  }

  for(var i = 0; i < nodes.length - xnodes; i++) {
    var conx = {
      first: i,
      second: i+xnodes
    };
    connx.push(conx);
  }
 
  num_constraints=connx.length;
}

function constraint(first, second, restLength) 
{
  this.first = first;
  this.second = second;
}

var time = Date.now();
var dt = 1/60;
var fps;
var newtime;
var frametime;
var accumulator = 0;
var alpha;
var step = 0;

function draw() 
{
  step += 0.5;
  newtime = Date.now();
  frametime = newtime - time;
  fps = 1000 / (frametime);
  time = newtime;

  //Effectively pause simulation when tab is out of focus
 
  if (fps > 10) {
    accumulator += frametime/1000;
    while ( accumulator >= dt ){
      resolve_constraints();
      move(dt);
      accumulator -= dt;
    }
    alpha = accumulator / dt;
  }

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  HEIGHT = canvas.height;
  WIDTH =  canvas.width;

  offsetx = WIDTH/2 - xnodes*dx/2;
  offsety = HEIGHT/2 - ynodes*dy/2;

  ctx.fillStyle = '#000';
  ctx.fill();
  for (var i = 0; i < nodes.length; i++) {
    ctx.beginPath();
    ctx.arc(nodes[i].x, nodes[i].y,nodes[i].radius,0,TWO_PI);
    ctx.stroke();
  }

  //<!-- AccumulateForces(); -->
  drawLines(ctx);
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
function mouse_move(e)
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

function mouse_down(e)
{
  console.log(mx, my);
  getMouse(e);

  var l = node_count;
  for (var i = l-1; i >= 0; i--) {
    if(dist(mx-nodes[i].x, my-nodes[i].y) < 20)
    {
      nodes[i].x = mx; 
      nodes[i].y = my;
      nodes[i].oldx = mx; 
      nodes[i].oldy = my;
      mySel = nodes[i];
      active_node = i;
      isDrag = true;
      canvas.onmousemove = mouse_move;
      break;
    }
  }
}

function mouse_up(e)
{
  active_node=null;
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

