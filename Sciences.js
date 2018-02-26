//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (Why the numbers? counts columns, helps me keep 80-char-wide listings)
//

// John Franklin
// Open "Garden_of_Eden.html" with a browser to run program
//
// Vertex shader program----------------------------------
var VSHADER_SOURCE = 
  'uniform mat4 u_ModelMatrix;\n' +
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_ModelMatrix * a_Position;\n' +
  '  gl_PointSize = 10.0;\n' +
  '  v_Color = a_Color;\n' +
  '}\n';

// Fragment shader program----------------------------------
var FSHADER_SOURCE = 
//  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
//  '#endif GL_ES\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

// Global Variables
var ANGLE_STEP = 10.0;		// Rotation angle rate (degrees/second)
var SUN_ANGLE_STEP = 10.0;
var floatsPerVertex = 7;	// # of Float32Array elements used for each vertex
		
var scalar = 0;
var direction = -0.01;	
var speed = 1;
var height = .5;
var now = 0;
var elapsed = 0; 
var paused = false;											
var align = false;
var showPoles = true;

// Global vars for mouse click-and-drag for rotation.
var mouseDown=false;		// mouse-drag: true when user holds down mouse button
var isDrag = false;
var xMclik=0.0;			// last mouse button-down position (in CVV coords)
var yMclik=0.0;   
var xMdragTot=0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var yMdragTot=0.0;
var xRotationAngle = 0;
var yRotationAngle = 0;
var zRotationAngle = 0;
var xRot = 0;
var yRot = 0;
var zRot = 0;

function main() {
//==============================================================================
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // 
  var n = initVertexBuffer(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

 canvas.onmousedown	=	function(ev){myMouseDown( ev, gl, canvas) }; 
  
  					// when user's mouse button goes down call mouseDown() function
  canvas.onmousemove = 	function(ev){myMouseMove( ev, gl, canvas) };
  
											// call mouseMove() function					
  canvas.onmouseup = 		function(ev){myMouseUp(   ev, gl, canvas)};
  					// NOTE! 'onclick' event is SAME as on 'mouseup' event
  					// in Chrome Brower on MS Windows 7, and possibly other 
  					// operating systems; use 'mouseup' instead.
  					
  // Next, register all keyboard events found within our HTML webpage window:
	window.addEventListener("keydown", myKeyDown, false);
	window.addEventListener("keyup", myKeyUp, false);
	window.addEventListener("keypress", myKeyPress, false);

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

	// NEW!! Enable 3D depth-test when drawing: don't over-draw at any pixel 
	// unless the new Z value is closer to the eye than the old one..
//	gl.depthFunc(gl.LESS);			 // WebGL default setting: (default)
	gl.enable(gl.DEPTH_TEST); 	  
	
  // Get handle to graphics system's storage location of u_ModelMatrix
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) { 
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }
  // Create a local version of our model matrix in JavaScript 
  var modelMatrix = new Matrix4();
  
  // Create, init current rotation angle value in JavaScript
  var currentAngle = 0.0;
  var plantRotationAngle = 0.0;
  var sunRotationAngle = 0.0;

//-----------------  

  // Start drawing: create 'tick' variable whose value is this function:
  var tick = function() {
    currentAngle = animate(currentAngle);  // Update the rotation angle
    //plantRotationAngle = animateRotation(plantRotationAngle);
    if (!xRot && !yRot && !zRot) sunRotationAngle = animateRotation(sunRotationAngle);

    draw(gl, n, currentAngle, plantRotationAngle, sunRotationAngle, modelMatrix, u_ModelMatrix);
    // report current angle on console
    //console.log('currentAngle=',currentAngle);
    requestAnimationFrame(tick, canvas);   
    									// Request that the browser re-draw the webpage
  };
  tick();							// start (and continue) animation: draw current image
	
}

function initVertexBuffer(gl) {
//==============================================================================
// Create one giant vertex buffer object (VBO) that holds all vertices for all
// shapes.
 
  sphsVerts = [];
  var sunColr = new Float32Array([1, 1, 0.1]);	// sph:    yellow
  var saturnColr = new Float32Array([0.6, 0.3, 0.2]);
  var neptuneColr = new Float32Array([0.4, 0.6, 0.6]);
  var rockColr = new Float32Array([0.3, 0.3, 0.1]);
  var sphColrs = [sunColr, saturnColr, neptuneColr, rockColr];
 	// Make each 3D shape in its own array of vertices:
  makeCylinder();					
  makeVase();
  makePole();
  makeSphere(sphColrs);
  makeRing();

  sunVerts = sphsVerts[0];
  saturnVerts = sphsVerts[1];
  neptuneVerts = sphsVerts[2];
  rockVerts = sphsVerts[3];
  // how many floats total needed to store all shapes?
    var planetsLengths = sunVerts.length + saturnVerts.length + neptuneVerts.length + rockVerts.length;
	var mySiz = cylVerts.length + vaseVerts.length + planetsLengths + poleVerts.length + ringVerts.length;						

	// How many vertices total?
	var nn = mySiz / floatsPerVertex;
	console.log('nn is', nn, 'mySiz is', mySiz, 'floatsPerVertex is', floatsPerVertex);
	// Copy all shapes into one big Float32 array:
  var colorShapes = new Float32Array(mySiz);
	// Copy them:  remember where to start for each shape:
	cylStart = 0;							// we stored the cylinder first.
  for(i=0,j=0; j< cylVerts.length; i++,j++) {
  	colorShapes[i] = cylVerts[j];
		}
		vaseStart = i;						// next we'll store the ground-plane;
	for(j=0; j< vaseVerts.length; i++, j++) {
		colorShapes[i] = vaseVerts[j];
		}
		poleStart = i;						// next, we'll store the sphere;
	for(j=0; j< poleVerts.length; i++, j++) {// don't initialize i -- reuse it!
		colorShapes[i] = poleVerts[j];
		}
		sunStart = i;						// next, we'll store the sphere;
	for(j=0; j< sunVerts.length; i++, j++) {// don't initialize i -- reuse it!
		colorShapes[i] = sunVerts[j];
		}
		saturnStart = i;						// next, we'll store the sphere;
	for(j=0; j< saturnVerts.length; i++, j++) {// don't initialize i -- reuse it!
		colorShapes[i] = saturnVerts[j];
		}
		neptuneStart = i;						// next, we'll store the sphere;
	for(j=0; j< neptuneVerts.length; i++, j++) {// don't initialize i -- reuse it!
		colorShapes[i] = neptuneVerts[j];
		}
		rockStart = i;						// next, we'll store the sphere;
	for(j=0; j< rockVerts.length; i++, j++) {// don't initialize i -- reuse it!
		colorShapes[i] = rockVerts[j];
		}
		ringStart = i;						// next, we'll store the torus;
	for(j=0; j< ringVerts.length; i++, j++) {
		colorShapes[i] = ringVerts[j];
		}

  // Create a buffer object on the graphics hardware:
  var shapeBufferHandle = gl.createBuffer();  
  if (!shapeBufferHandle) {
    console.log('Failed to create the shape buffer object');
    return false;
  }

  // Bind the the buffer object to target:
  gl.bindBuffer(gl.ARRAY_BUFFER, shapeBufferHandle);
  // Transfer data from Javascript array colorShapes to Graphics system VBO
  // (Use sparingly--may be slow if transfering large shapes stored in files)
  gl.bufferData(gl.ARRAY_BUFFER, colorShapes, gl.STATIC_DRAW);
    
  //Get graphics system's handle for our Vertex Shader's position-input variable: 
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }

  var FSIZE = colorShapes.BYTES_PER_ELEMENT; // how many bytes per stored value?

  // Use handle to specify how to retrieve **POSITION** data from our VBO:
  gl.vertexAttribPointer(
  		a_Position, 	// choose Vertex Shader attribute to fill with data
  		4, 						// how many values? 1,2,3 or 4.  (we're using x,y,z,w)
  		gl.FLOAT, 		// data type for each value: usually gl.FLOAT
  		false, 				// did we supply fixed-point data AND it needs normalizing?
  		FSIZE * floatsPerVertex, // Stride -- how many bytes used to store each vertex?
  									// (x,y,z,w, r,g,b) * bytes/value
  		0);						// Offset -- now many bytes from START of buffer to the
  									// value we will actually use?
  gl.enableVertexAttribArray(a_Position);  
  									// Enable assignment of vertex buffer object's position data

  // Get graphics system's handle for our Vertex Shader's color-input variable;
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  // Use handle to specify how to retrieve **COLOR** data from our VBO:
  gl.vertexAttribPointer(
  	a_Color, 				// choose Vertex Shader attribute to fill with data
  	3, 							// how many values? 1,2,3 or 4. (we're using R,G,B)
  	gl.FLOAT, 			// data type for each value: usually gl.FLOAT
  	false, 					// did we supply fixed-point data AND it needs normalizing?
  	FSIZE * 7, 			// Stride -- how many bytes used to store each vertex?
  									// (x,y,z,w, r,g,b) * bytes/value
  	FSIZE * 4);			// Offset -- how many bytes from START of buffer to the
  									// value we will actually use?  Need to skip over x,y,z,w
  									
  gl.enableVertexAttribArray(a_Color);  
  									// Enable assignment of vertex buffer object's position data

	//--------------------------------DONE!
  // Unbind the buffer object 
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return nn;
}

function randColr(perc) {
	return 1 - Math.random()*perc;
}

function makeCylinder() {
//==============================================================================
// Make a cylinder shape from one TRIANGLE_STRIP drawing primitive, using the
// 'stepped spiral' design described in notes.
// Cylinder center at origin, encircles z axis, radius 1, top/bottom at z= +/-1.
//
 var colorPerc = 0.2;
 var ctrColr = new Float32Array([0.7, 0.7, 0.0]);	// dark gray
 var topColr = new Float32Array([0.5, 0.7, 0.0]);	// light green
 var midColr = new Float32Array([0.0, 0.3, 0.0]);	// light blue
 var capVerts = 24;	// # of vertices aroun3d the topmost 'cap' of the shape
 var topRadius = .3;
 var midRadius = .4;		// radius of bottom of cylinder (top always 1.0)
 
 // Create a (global) array to hold this cylinder's vertices;
 cylVerts = new Float32Array(  ((capVerts*6) -2) * floatsPerVertex);
										// # of vertices * # of elements needed to store them. 

	// Create circle-shaped top cap of cylinder at z=+1.0, radius 1.0
	// v counts vertices: j counts array elements (vertices * elements per vertex)
	for(v=1,j=0; v<2*capVerts; v++,j+=floatsPerVertex) {	
		// skip the first vertex--not needed.
		if(v%2==0)
		{				// put even# vertices at center of cylinder's top cap:
			cylVerts[j  ] = 0.0; 			// x,y,z,w == 0,0,1,1
			cylVerts[j+1] = 0.0;	
			cylVerts[j+2] = 1.0*height; 
			cylVerts[j+3] = 1.0;			// r,g,b = topColr[]
			cylVerts[j+4]=ctrColr[0]*randColr(colorPerc); 
			cylVerts[j+5]=ctrColr[1]*randColr(colorPerc); 
			cylVerts[j+6]=ctrColr[2]*randColr(colorPerc);
		}
		else { 	// put odd# vertices around the top cap's outer edge;
						// x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
						// 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
			cylVerts[j  ] = topRadius*Math.cos(Math.PI*(v-1)/capVerts);			// x
			cylVerts[j+1] = topRadius*Math.sin(Math.PI*(v-1)/capVerts);			// y
			//	(Why not 2*PI? because 0 < =v < 2*capVerts, so we
			//	 can simplify cos(2*PI * (v-1)/(2*capVerts))
			cylVerts[j+2] = 1.0*height;	// z
			cylVerts[j+3] = 1.0;	// w.
			// r,g,b = topColr[]
			cylVerts[j+4]=topColr[0]*randColr(colorPerc); 
			cylVerts[j+5]=topColr[1]*randColr(colorPerc); 
			cylVerts[j+6]=topColr[2]*randColr(colorPerc);			
		}
	}
	// Create the cylinder side walls, made of 2*capVerts vertices.
	// v counts vertices within the wall; j continues to count array elements
	for(v=0; v< 2*capVerts; v++, j+=floatsPerVertex) {
		if(v%2==0)	// position all even# vertices along top cap:
		{		
				cylVerts[j  ] = topRadius*Math.cos(Math.PI*(v)/capVerts);		// x
				cylVerts[j+1] = topRadius*Math.sin(Math.PI*(v)/capVerts);		// y
				cylVerts[j+2] = 1.0*height;	// z
				cylVerts[j+3] = 1.0;	// w.
				// r,g,b = topColr[]
				cylVerts[j+4]=topColr[0]*randColr(colorPerc); 
				cylVerts[j+5]=topColr[1]*randColr(colorPerc); 
				cylVerts[j+6]=topColr[2]*randColr(colorPerc);			
		}
		else		// position all odd# vertices along the bottom cap:
		{
				cylVerts[j  ] = midRadius * Math.cos(Math.PI*(v-1)/capVerts);		// x
				cylVerts[j+1] = midRadius * Math.sin(Math.PI*(v-1)/capVerts);		// y
				cylVerts[j+2] =-1.0*height;	// z
				cylVerts[j+3] = 1.0;	// w.
				// r,g,b = topColr[]
				cylVerts[j+4]=midColr[0]*randColr(colorPerc); 
				cylVerts[j+5]=midColr[1]*randColr(colorPerc); 
				cylVerts[j+6]=midColr[2]*randColr(colorPerc);			
		}
	}
	// Create the cylinder bottom cap, made of 2*capVerts -1 vertices.
	// v counts the vertices in the cap; j continues to count array elements
	for(v=0; v < (2*capVerts -1); v++, j+= floatsPerVertex) {
		if(v%2==0) {	// position even #'d vertices around bot cap's outer edge
			cylVerts[j  ] = midRadius * Math.cos(Math.PI*(v)/capVerts);		// x
			cylVerts[j+1] = midRadius * Math.sin(Math.PI*(v)/capVerts);		// y
			cylVerts[j+2] =-1.0*height;	// z
			cylVerts[j+3] = 1.0;	// w.
			// r,g,b = topColr[]
			cylVerts[j+4]=midColr[0]*randColr(colorPerc); 
			cylVerts[j+5]=midColr[1]*randColr(colorPerc); 
			cylVerts[j+6]=midColr[2]*randColr(colorPerc);		
		}
		else {				// position odd#'d vertices at center of the bottom cap:
			cylVerts[j  ] = 0.0; 			// x,y,z,w == 0,0,-1,1
			cylVerts[j+1] = 0.0;	
			cylVerts[j+2] =-1.0*height; 
			cylVerts[j+3] = 1.0;			// r,g,b = midColr[]
			cylVerts[j+4]=midColr[0]*randColr(colorPerc); 
			cylVerts[j+5]=midColr[1]*randColr(colorPerc); 
			cylVerts[j+6]=midColr[2]*randColr(colorPerc);
		}
	}
}

function makeVase() {
//==============================================================================
// Make a cylinder shape from one TRIANGLE_STRIP drawing primitive, using the
// 'stepped spiral' design described in notes.
// Cylinder center at origin, encircles z axis, radius 1, top/bottom at z= +/-1.
//
 var colorPerc = 0.2;
 var ctrColr = new Float32Array([0.30, 0.25, 0.15]);	// brown
 var topColr = new Float32Array([0.19, 0.37, 0.34]);	// light blue
 var midColr = new Float32Array([0.04, 0.4, 0.4]);	// dark blue
 var botColr = new Float32Array([0.00, 0.25, 0.25]);	// dark blue
 var capVerts = 70;	// # of vertices aroun3d the topmost 'cap' of the shape
 var layer1Height = .3;
 var layer2Height = .7;
 var topRadius = 1.3;
 var midRadius = 1.4;		// radius of bottom of cylinder (top always 1.0)
 var botRadius = 1;
 
 // Create a (global) array to hold this cylinder's vertices;
 vaseVerts = new Float32Array(  ((capVerts*6) -2) * floatsPerVertex);
										// # of vertices * # of elements needed to store them. 

	// Create circle-shaped top cap of cylinder at z=+1.0, radius 1.0
	// v counts vertices: j counts array elements (vertices * elements per vertex)

	for(v=1,j=0; v<2*capVerts; v++,j+=floatsPerVertex) {	
		// skip the first vertex--not needed.
		if(v%2==0)
		{				// put even# vertices at center of cylinder's top cap:
			vaseVerts[j  ] = 0.0; 			// x,y,z,w == 0,0,1,1
			vaseVerts[j+1] = 0.0;	
			vaseVerts[j+2] = 1.0*layer1Height; 
			vaseVerts[j+3] = 1.0;			// r,g,b = topColr[]
			vaseVerts[j+4]=ctrColr[0]*randColr(colorPerc); 
			vaseVerts[j+5]=ctrColr[1]*randColr(colorPerc); 
			vaseVerts[j+6]=ctrColr[2]*randColr(colorPerc);
		}
		else { 	// put odd# vertices around the top cap's outer edge;
						// x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
						// 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
			vaseVerts[j  ] = topRadius*Math.cos(Math.PI*(v-1)/capVerts);			// x
			vaseVerts[j+1] = topRadius*Math.sin(Math.PI*(v-1)/capVerts);			// y
			//	(Why not 2*PI? because 0 < =v < 2*capVerts, so we
			//	 can simplify cos(2*PI * (v-1)/(2*capVerts))
			vaseVerts[j+2] = 1.0*layer1Height;	// z
			vaseVerts[j+3] = 1.0;	// w.
			// r,g,b = topColr[]
			vaseVerts[j+4]=ctrColr[0]*randColr(colorPerc); 
			vaseVerts[j+5]=ctrColr[1]*randColr(colorPerc); 
			vaseVerts[j+6]=ctrColr[2]*randColr(colorPerc);			
		}
	}
	// Create the cylinder side walls, made of 2*capVerts vertices.
	// v counts vertices within the wall; j continues to count array elements
	for(v=0; v< 2*capVerts; v++, j+=floatsPerVertex) {
		if(v%2==0)	// position all even# vertices along top cap:
		{		
				vaseVerts[j  ] = topRadius*Math.cos(Math.PI*(v)/capVerts);		// x
				vaseVerts[j+1] = topRadius*Math.sin(Math.PI*(v)/capVerts);		// y
				vaseVerts[j+2] = 1.0*layer1Height;	// z
				vaseVerts[j+3] = 1.0;	// w.
				// r,g,b = topColr[]
				vaseVerts[j+4]=topColr[0]*randColr(colorPerc); 
				vaseVerts[j+5]=topColr[1]*randColr(colorPerc); 
				vaseVerts[j+6]=topColr[2]*randColr(colorPerc);			
		}
		else		// position all odd# vertices along the bottom cap:
		{
				vaseVerts[j  ] = midRadius * Math.cos(Math.PI*(v-1)/capVerts);		// x
				vaseVerts[j+1] = midRadius * Math.sin(Math.PI*(v-1)/capVerts);		// y
				vaseVerts[j+2] =-1.0*layer1Height;	// z
				vaseVerts[j+3] = 1.0;	// w.
				// r,g,b = topColr[]
				vaseVerts[j+4]=midColr[0]*randColr(colorPerc); 
				vaseVerts[j+5]=midColr[1]*randColr(colorPerc); 
				vaseVerts[j+6]=midColr[2]*randColr(colorPerc);			
		}
	}
	////
	// Create the cylinder side walls, made of 2*capVerts vertices.
	// v counts vertices within the wall; j continues to count array elements
	for(v=0; v< 2*capVerts; v++, j+=floatsPerVertex) {
		if(v%2==0)	// position all even# vertices along top cap:
		{		
				vaseVerts[j  ] = midRadius*Math.cos(Math.PI*(v)/capVerts);		// x
				vaseVerts[j+1] = midRadius*Math.sin(Math.PI*(v)/capVerts);		// y
				vaseVerts[j+2] = 1.0*layer2Height;	// z
				vaseVerts[j+3] = 1.0;	// w.
				// r,g,b = topColr[]
				vaseVerts[j+4]=midColr[0]*randColr(colorPerc); 
				vaseVerts[j+5]=midColr[1]*randColr(colorPerc); 
				vaseVerts[j+6]=midColr[2]*randColr(colorPerc);			
		}
		else		// position all odd# vertices along the bottom cap:
		{
				vaseVerts[j  ] = botRadius * Math.cos(Math.PI*(v-1)/capVerts);		// x
				vaseVerts[j+1] = botRadius * Math.sin(Math.PI*(v-1)/capVerts);		// y
				vaseVerts[j+2] =-1.0*layer2Height;	// z
				vaseVerts[j+3] = 1.0;	// w.
				// r,g,b = topColr[]
				vaseVerts[j+4]=botColr[0]*randColr(colorPerc); 
				vaseVerts[j+5]=botColr[1]*randColr(colorPerc); 
				vaseVerts[j+6]=botColr[2]*randColr(colorPerc);			
		}
	}
	// Create the cylinder bottom cap, made of 2*capVerts -1 vertices.
	// v counts the vertices in the cap; j continues to count array elements
	for(v=0; v < (2*capVerts -1); v++, j+= floatsPerVertex) {
		if(v%2==0) {	// position even #'d vertices around bot cap's outer edge
			vaseVerts[j  ] = botRadius * Math.cos(Math.PI*(v)/capVerts);		// x
			vaseVerts[j+1] = botRadius * Math.sin(Math.PI*(v)/capVerts);		// y
			vaseVerts[j+2] =-1.0*layer2Height;	// z
			vaseVerts[j+3] = 1.0;	// w.
			// r,g,b = topColr[]
			vaseVerts[j+4]=botColr[0]*randColr(colorPerc); 
			vaseVerts[j+5]=botColr[1]*randColr(colorPerc); 
			vaseVerts[j+6]=botColr[2]*randColr(colorPerc);		
		}
		else {				// position odd#'d vertices at center of the bottom cap:
			vaseVerts[j  ] = 0.0; 			// x,y,z,w == 0,0,-1,1
			vaseVerts[j+1] = 0.0;	
			vaseVerts[j+2] =-1.0*layer2Height; 
			vaseVerts[j+3] = 1.0;			// r,g,b = botColr[]
			vaseVerts[j+4]=botColr[0]*randColr(colorPerc); 
			vaseVerts[j+5]=botColr[1]*randColr(colorPerc); 
			vaseVerts[j+6]=botColr[2]*randColr(colorPerc);
		}
	}

}

function makePole() {
//==============================================================================
// Make a cylinder shape from one TRIANGLE_STRIP drawing primitive, using the
// 'stepped spiral' design described in notes.
// Cylinder center at origin, encircles z axis, radius 1, top/bottom at z= +/-1.
//
 var colorPerc = 0.1;
 var ctrColr = new Float32Array([0.65, 0.65, 0.65]);	// brown
 var topColr = new Float32Array([0.65, 0.65, 0.65]);	// light blue
 var botColr = new Float32Array([0.65, 0.65, 0.65]);	// dark blue
 var capVerts = 24;	// # of vertices aroun3d the topmost 'cap' of the shape
 var radius = .02;
 
 // Create a (global) array to hold this cylinder's vertices;
 poleVerts = new Float32Array(  ((capVerts*6) -2) * floatsPerVertex);
										// # of vertices * # of elements needed to store them. 

	// Create circle-shaped top cap of cylinder at z=+1.0, radius 1.0
	// v counts vertices: j counts array elements (vertices * elements per vertex)
	for(v=1,j=0; v<2*capVerts; v++,j+=floatsPerVertex) {	
		// skip the first vertex--not needed.
		if(v%2==0)
		{				// put even# vertices at center of cylinder's top cap:
			poleVerts[j  ] = 0.0; 			// x,y,z,w == 0,0,1,1
			poleVerts[j+1] = 0.0;	
			poleVerts[j+2] = 1.0*height; 
			poleVerts[j+3] = 1.0;			// r,g,b = topColr[]
			poleVerts[j+4]=ctrColr[0]*randColr(colorPerc); 
			poleVerts[j+5]=ctrColr[1]*randColr(colorPerc); 
			poleVerts[j+6]=ctrColr[2]*randColr(colorPerc);
		}
		else { 	// put odd# vertices around the top cap's outer edge;
						// x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
						// 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
			poleVerts[j  ] = radius*Math.cos(Math.PI*(v-1)/capVerts);			// x
			poleVerts[j+1] = radius*Math.sin(Math.PI*(v-1)/capVerts);			// y
			//	(Why not 2*PI? because 0 < =v < 2*capVerts, so we
			//	 can simplify cos(2*PI * (v-1)/(2*capVerts))
			poleVerts[j+2] = 1.0*height;	// z
			poleVerts[j+3] = 1.0;	// w.
			// r,g,b = topColr[]
			poleVerts[j+4]=topColr[0]*randColr(colorPerc); 
			poleVerts[j+5]=topColr[1]*randColr(colorPerc); 
			poleVerts[j+6]=topColr[2]*randColr(colorPerc);			
		}
	}
	// Create the cylinder side walls, made of 2*capVerts vertices.
	// v counts vertices within the wall; j continues to count array elements
	for(v=0; v< 2*capVerts; v++, j+=floatsPerVertex) {
		if(v%2==0)	// position all even# vertices along top cap:
		{		
				poleVerts[j  ] = radius*Math.cos(Math.PI*(v)/capVerts);		// x
				poleVerts[j+1] = radius*Math.sin(Math.PI*(v)/capVerts);		// y
				poleVerts[j+2] = 1.0*height;	// z
				poleVerts[j+3] = 1.0;	// w.
				// r,g,b = topColr[]
				poleVerts[j+4]=topColr[0]*randColr(colorPerc); 
				poleVerts[j+5]=topColr[1]*randColr(colorPerc); 
				poleVerts[j+6]=topColr[2]*randColr(colorPerc);			
		}
		else		// position all odd# vertices along the bottom cap:
		{
				poleVerts[j  ] = radius * Math.cos(Math.PI*(v-1)/capVerts);		// x
				poleVerts[j+1] = radius * Math.sin(Math.PI*(v-1)/capVerts);		// y
				poleVerts[j+2] =-1.0*height;	// z
				poleVerts[j+3] = 1.0;	// w.
				// r,g,b = topColr[]
				poleVerts[j+4]=botColr[0]*randColr(colorPerc); 
				poleVerts[j+5]=botColr[1]*randColr(colorPerc); 
				poleVerts[j+6]=botColr[2]*randColr(colorPerc);			
		}
	}
	// Create the cylinder bottom cap, made of 2*capVerts -1 vertices.
	// v counts the vertices in the cap; j continues to count array elements
	for(v=0; v < (2*capVerts -1); v++, j+= floatsPerVertex) {
		if(v%2==0) {	// position even #'d vertices around bot cap's outer edge
			poleVerts[j  ] = radius * Math.cos(Math.PI*(v)/capVerts);		// x
			poleVerts[j+1] = radius * Math.sin(Math.PI*(v)/capVerts);		// y
			poleVerts[j+2] =-1.0*height;	// z
			poleVerts[j+3] = 1.0;	// w.
			// r,g,b = topColr[]
			poleVerts[j+4]=botColr[0]*randColr(colorPerc); 
			poleVerts[j+5]=botColr[1]*randColr(colorPerc); 
			poleVerts[j+6]=botColr[2]*randColr(colorPerc);		
		}
		else {				// position odd#'d vertices at center of the bottom cap:
			poleVerts[j  ] = 0.0; 			// x,y,z,w == 0,0,-1,1
			poleVerts[j+1] = 0.0;	
			poleVerts[j+2] =-1.0*height; 
			poleVerts[j+3] = 1.0;			// r,g,b = midColr[]
			poleVerts[j+4]=botColr[0]*randColr(colorPerc); 
			poleVerts[j+5]=botColr[1]*randColr(colorPerc); 
			poleVerts[j+6]=botColr[2]*randColr(colorPerc);
		}
	}
}

function makeSphere(colrs) {
//==============================================================================
// Make a sphere from one OpenGL TRIANGLE_STRIP primitive.   Make ring-like 
// equal-lattitude 'slices' of the sphere (bounded by planes of constant z), 
// and connect them as a 'stepped spiral' design (see makeCylinder) to build the
// sphere from one triangle strip.
  var slices = 100;		// # of slices of the sphere along the z axis. >=3 req'd
											// (choose odd # or prime# to avoid accidental symmetry)
  var sliceVerts = 100;	// # of vertices around the top edge of the slice
											// (same number of vertices on bottom of slice, too)

  var colorPerc = 0.1;

  var sliceAngle = Math.PI/slices;	// lattitude angle spanned by one slice.

  for (i=0; i<colrs.length; i++) {
  	colr = colrs[i]
    if (i > 0) {
      slices = 30;
      sliceVerts = 30;
      colorPerc = 0.2;
      sliceAngle = Math.PI/slices
    }
		// Create a (global) array to hold this sphere's vertices:
	  sphVerts = new Float32Array(  ((slices * 2* sliceVerts) -2) * floatsPerVertex);
											// # of vertices * # of elements needed to store them. 
											// each slice requires 2*sliceVerts vertices except 1st and
											// last ones, which require only 2*sliceVerts-1.
											
		// Create dome-shaped top slice of sphere at z=+1
		// s counts slices; v counts vertices; 
		// j counts array elements (vertices * elements per vertex)
		var cos0 = 0.0;					// sines,cosines of slice's top, bottom edge.
		var sin0 = 0.0;
		var cos1 = 0.0;
		var sin1 = 0.0;	
		var j = 0;							// initialize our array index
		var isLast = 0;
		var isFirst = 1;
		for(s=0; s<slices; s++) {	// for each slice of the sphere,
			// find sines & cosines for top and bottom of this slice
			if(s==0) {
				isFirst = 1;	// skip 1st vertex of 1st slice.
				cos0 = 1.0; 	// initialize: start at north pole.
				sin0 = 0.0;
			}
			else {					// otherwise, new top edge == old bottom edge
				isFirst = 0;	
				cos0 = cos1;
				sin0 = sin1;
			}								// & compute sine,cosine for new bottom edge.
			cos1 = Math.cos((s+1)*sliceAngle);
			sin1 = Math.sin((s+1)*sliceAngle);
			// go around the entire slice, generating TRIANGLE_STRIP verts
			// (Note we don't initialize j; grows with each new attrib,vertex, and slice)
			if(s==slices-1) isLast=1;	// skip last vertex of last slice.
			for(v=isFirst; v< 2*sliceVerts-isLast; v++, j+=floatsPerVertex) {	
				if(v%2==0)
				{				// put even# vertices at the the slice's top edge
								// (why PI and not 2*PI? because 0 <= v < 2*sliceVerts
								// and thus we can simplify cos(2*PI(v/2*sliceVerts))  
					sphVerts[j  ] = sin0 * Math.cos(Math.PI*(v)/sliceVerts); 	
					sphVerts[j+1] = sin0 * Math.sin(Math.PI*(v)/sliceVerts);	
					sphVerts[j+2] = cos0;		
					sphVerts[j+3] = 1.0;			
				}
				else { 	// put odd# vertices around the slice's lower edge;
								// x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
								// 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
					sphVerts[j  ] = sin1 * Math.cos(Math.PI*(v-1)/sliceVerts);		// x
					sphVerts[j+1] = sin1 * Math.sin(Math.PI*(v-1)/sliceVerts);		// y
					sphVerts[j+2] = cos1;																				// z
					sphVerts[j+3] = 1.0;																				// w.		
				}

        var colr1 = randColr(colorPerc);
        var colr2 = randColr(colorPerc);
        if (i == 0) colr2 = colr1*randColr(0.25);

				if(s==0) {	// finally, set some interesting colors for vertices:
  				sphVerts[j+4]=colr[0]*colr1; 
  				sphVerts[j+5]=colr[1]*colr2; 
					sphVerts[j+6]=colr[2];	
					}
				else if(s==slices-1) {
					sphVerts[j+4]=colr[0]*colr1; 
					sphVerts[j+5]=colr[1]*colr2; 
					sphVerts[j+6]=colr[2];	
				}
				else {
					sphVerts[j+4]=colr[0]*colr1;// colr[0]; 
					sphVerts[j+5]=colr[1]*colr2;// colr[1]; 
					sphVerts[j+6]=colr[2];// colr[2];					
				}
			}
		}
		sphsVerts[i] = sphVerts;
	}
}

function makeRing() {
//==============================================================================
var rbend = 1.5;										// Radius of circle formed by torus' bent bar
var rbar = 0.3;											// radius of the bar we bent to form torus
var barSlices = 40;									// # of bar-segments in the torus: >=3 req'd;
																		// more segments for more-circular torus
var barSides = 40;										
	// Create a (global) array to hold this torus's vertices:
 ringVerts = new Float32Array(floatsPerVertex*(2*barSides*barSlices +2));

var colorPerc = 0.4;
var ringColr = new Float32Array([0.30, 0.25, 0.25]);	// brown
var ringHeight = 0.3;

var phi=0, theta=0;										// begin torus at angles 0,0
var thetaStep = 2*Math.PI/barSlices;	// theta angle between each bar segment
var phiHalfStep = Math.PI/barSides;		// half-phi angle between each side of bar

	for(s=0,j=0; s<barSlices; s++) {		// for each 'slice' or 'ring' of the torus:
		for(v=0; v< 2*barSides; v++, j+=7) {		// for each vertex in this slice:
			if(v%2==0)	{	// even #'d vertices at bottom of slice,
				ringVerts[j  ] = (rbend + rbar*Math.cos((v)*phiHalfStep)) * 
																						 Math.cos((s)*thetaStep);
							  //	x = (rbend + rbar*cos(phi)) * cos(theta)
				ringVerts[j+1] = (rbend + rbar*Math.cos((v)*phiHalfStep)) *
																						 Math.sin((s)*thetaStep);
								//  y = (rbend + rbar*cos(phi)) * sin(theta) 
				ringVerts[j+2] = ringHeight*-rbar*Math.sin((v)*phiHalfStep);
								//  z = -rbar  *   sin(phi)
				ringVerts[j+3] = 1.0;		// w
			}
			else {				// odd #'d vertices at top of slice (s+1);
										// at same phi used at bottom of slice (v-1)
				ringVerts[j  ] = (rbend + rbar*Math.cos((v-1)*phiHalfStep)) * 
																						 Math.cos((s+1)*thetaStep);
							  //	x = (rbend + rbar*cos(phi)) * cos(theta)
				ringVerts[j+1] = (rbend + rbar*Math.cos((v-1)*phiHalfStep)) *
																						 Math.sin((s+1)*thetaStep);
								//  y = (rbend + rbar*cos(phi)) * sin(theta) 
				ringVerts[j+2] = ringHeight*-rbar*Math.sin((v-1)*phiHalfStep);
								//  z = -rbar  *   sin(phi)
				ringVerts[j+3] = 1.0;		// w
			}
			ringVerts[j+4] = ringColr[0]*randColr(colorPerc);		// random color 0.0 <= R < 1.0
			ringVerts[j+5] = ringColr[1]*randColr(colorPerc);		// random color 0.0 <= G < 1.0
			ringVerts[j+6] = ringColr[2]*randColr(colorPerc);		// random color 0.0 <= B < 1.0
		}
	}
	// Repeat the 1st 2 vertices of the triangle strip to complete the torus:
			ringVerts[j  ] = rbend + rbar;	// copy vertex zero;
						  //	x = (rbend + rbar*cos(phi==0)) * cos(theta==0)
			ringVerts[j+1] = 0.0;
							//  y = (rbend + rbar*cos(phi==0)) * sin(theta==0) 
			ringVerts[j+2] = 0.0;
							//  z = -rbar  *   sin(phi==0)
			ringVerts[j+3] = 1.0;		// w
			ringVerts[j+4] = ringColr[0]*randColr(colorPerc);		// random color 0.0 <= R < 1.0
			ringVerts[j+5] = ringColr[1]*randColr(colorPerc);		// random color 0.0 <= G < 1.0
			ringVerts[j+6] = ringColr[2]*randColr(colorPerc);		// random color 0.0 <= B < 1.0
			j+=7; // go to next vertex:
			ringVerts[j  ] = (rbend + rbar) * Math.cos(thetaStep);
						  //	x = (rbend + rbar*cos(phi==0)) * cos(theta==thetaStep)
			ringVerts[j+1] = (rbend + rbar) * Math.sin(thetaStep);
							//  y = (rbend + rbar*cos(phi==0)) * sin(theta==thetaStep) 
			ringVerts[j+2] = 0.0;
							//  z = -rbar  *   sin(phi==0)
			ringVerts[j+3] = 1.0;		// w
			ringVerts[j+4] = ringColr[0]*randColr(colorPerc);		// random color 0.0 <= R < 1.0
			ringVerts[j+5] = ringColr[1]*randColr(colorPerc);		// random color 0.0 <= G < 1.0
			ringVerts[j+6] = ringColr[2]*randColr(colorPerc);		// random color 0.0 <= B < 1.0
}

function draw(gl, n, currentAngle, plantRotationAngle, sunRotationAngle, modelMatrix, u_ModelMatrix) {
//==============================================================================
  gl.clear(gl.COLOR_BUFFER_BIT);	
  var plantCenter = -0.3;
  var stemHeight = -0.05-0.15*scalar;
  var leaveHeight = height-0.05*scalar;
  var a = 1;
  var b = 0;
  var c = 0;

  //-------Draw Vase:
  modelMatrix.setTranslate(plantCenter, plantCenter-0.3, .7);
  var dist = Math.sqrt(xMdragTot*xMdragTot + yMdragTot*yMdragTot);
  modelMatrix.rotate(dist*120.0, -yMdragTot+0.0001, xMdragTot+0.0001, 0.0);
  modelMatrix.rotate(90, a, b, c);
  pushMatrix(modelMatrix);
  modelMatrix.scale(1,1,-1);												
  modelMatrix.scale(0.2, 0.2, 0.2);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
  							vaseStart/floatsPerVertex, // start at this vertex number, and
  							vaseVerts.length/floatsPerVertex);	// draw this many vertices.

  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);
  //-------Draw Spinning Cylinder Center:
  modelMatrix.translate(0, 0, stemHeight);
  modelMatrix.scale(1,1,-1);												
  modelMatrix.scale(0.2*scalar, 0.2*scalar, 0.21*scalar);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
  							cylStart/floatsPerVertex, // start at this vertex number, and
  							cylVerts.length/floatsPerVertex);	// draw this many vertices. 
  for (i=0; i<5; i++){
  	  modelMatrix.translate(0, 0, 1.5*leaveHeight); 	
	  modelMatrix.scale(0.7*scalar,0.7*scalar,0.71*scalar);																								
	  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	  gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
	  							cylStart/floatsPerVertex, // start at this vertex number, and
	  							cylVerts.length/floatsPerVertex);	// draw this many vertices. 
  }

  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);
  //-------Draw Spinning Cylinder Bottom Left:
  modelMatrix.translate(-0.1,-0.1, stemHeight);
  modelMatrix.rotate(plantRotationAngle*.3, 1, 0, 0);
  modelMatrix.scale(1,1,-1);												
  modelMatrix.scale(0.2*scalar, 0.2*scalar, 0.2*scalar);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
  							cylStart/floatsPerVertex, // start at this vertex number, and
  							cylVerts.length/floatsPerVertex);	// draw this many vertices. 
  for (i=0; i<5; i++){
  	  modelMatrix.translate(0, 0, 1.5*leaveHeight); 	
	  modelMatrix.scale(0.7*scalar,0.7*scalar,0.7*scalar);																			
	  modelMatrix.rotate(currentAngle, -1, 1, 0);
	  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	  gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
	  							cylStart/floatsPerVertex, // start at this vertex number, and
	  							cylVerts.length/floatsPerVertex);	// draw this many vertices. 
  }	

  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);
  //-------Draw Spinning Cylinder Bottom Right:
  modelMatrix.translate(0.1,-0.1, stemHeight);
  modelMatrix.rotate(plantRotationAngle*.3, 1, 0, 0);
  modelMatrix.scale(1,1,-1);												
  modelMatrix.scale(0.2*scalar, 0.2*scalar, 0.2*scalar);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
  							cylStart/floatsPerVertex, // start at this vertex number, and
  							cylVerts.length/floatsPerVertex);	// draw this many vertices. 
  for (i=0; i<5; i++){
  	  modelMatrix.translate(0, 0, 1.5*leaveHeight); 	
	  modelMatrix.scale(0.7*scalar,0.7*scalar,0.7*scalar);																									
	  modelMatrix.rotate(currentAngle, -1, -1, 0);
	  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	  gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
	  							cylStart/floatsPerVertex, // start at this vertex number, and
	  							cylVerts.length/floatsPerVertex);	// draw this many vertices. 
  }	

  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);
  //-------Draw Spinning Cylinder Top Right:
  //modelMatrix.setTranslate(-plantCenter,-plantCenter, 0.7);
  modelMatrix.rotate(plantRotationAngle*.3, 1, 0, 0);
  modelMatrix.translate(0.1,+0.1, stemHeight);
  modelMatrix.scale(1,1,-1);												
  modelMatrix.scale(0.2*scalar, 0.2*scalar, 0.2*scalar);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
  							cylStart/floatsPerVertex, // start at this vertex number, and
  							cylVerts.length/floatsPerVertex);	// draw this many vertices. 
  for (i=0; i<5; i++){
  	  modelMatrix.translate(0, 0, 1.5*leaveHeight); 	
	  modelMatrix.scale(0.7*scalar,0.7*scalar,0.7*scalar);																					
	  modelMatrix.rotate(currentAngle, 1, -1, 0);
	  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	  gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
	  							cylStart/floatsPerVertex, // start at this vertex number, and
	  							cylVerts.length/floatsPerVertex);	// draw this many vertices. 
  }	

  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);
  //-------Draw Spinning Cylinder Top Left:
  modelMatrix.rotate(plantRotationAngle*.3, 1, 0, 0);
  modelMatrix.translate(-0.1,0.1, stemHeight);
  modelMatrix.scale(1,1,-1);												
  modelMatrix.scale(0.2*scalar, 0.2*scalar, 0.2*scalar);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
  							cylStart/floatsPerVertex, // start at this vertex number, and
  							cylVerts.length/floatsPerVertex);	// draw this many vertices. 
  for (i=0; i<5; i++){
  	  modelMatrix.translate(0, 0, 1.5*leaveHeight); 	
	  modelMatrix.scale(0.7*scalar,0.7*scalar,0.7*scalar);																	
	  modelMatrix.rotate(currentAngle, 1, 1, 0);
	  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	  gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
	  							cylStart/floatsPerVertex, // start at this vertex number, and
	  							cylVerts.length/floatsPerVertex);	// draw this many vertices. 
  }	

    //--------Draw Spinning Sun
  var sunSize = 0.25;
  modelMatrix.setTranslate( 0.3, 0.3, 0.0); 
  modelMatrix.scale(sunSize,sunSize,-sunSize);	
  if (xRot != 0) {
  	xRotationAngle += xRot; 
  	xRotationAngle %= 360;
  }
  if (yRot != 0) {
  	yRotationAngle += yRot; 
  	yRotationAngle %= 360;
  }
  if (zRot != 0) {
  	zRotationAngle += zRot; 
  	zRotationAngle %= 360;
  }
  modelMatrix.rotate(xRotationAngle, 1, 0, 0); 
  modelMatrix.rotate(yRotationAngle, 0, 1, 0);  
  modelMatrix.rotate(zRotationAngle, 0, 0, 1); 
  modelMatrix.rotate(sunRotationAngle, 1, 1, 0); 
  pushMatrix(modelMatrix);	
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
  							sunStart/floatsPerVertex,	// start at this vertex number, and 
  							sunVerts.length/floatsPerVertex);

  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);
  //-------Draw Spinning Pole:
  modelMatrix.rotate(sunRotationAngle, 0, 1, 0);
  modelMatrix.translate(1, 0, 0);
  modelMatrix.rotate(90, 0, 1, 0); 
  modelMatrix.scale(1,1,-1);												
  modelMatrix.scale(1, 1, 0.7);
  if (showPoles) {
  	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  	gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
  							poleStart/floatsPerVertex, // start at this vertex number, and
  							poleVerts.length/floatsPerVertex);	// draw this many vertices. 
  }

  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);
  //-------Draw Spinning Pole:
  modelMatrix.rotate(sunRotationAngle-45, 1, 0, 0);
  modelMatrix.translate(0, 1.1, 0);
  modelMatrix.rotate(90, 1, 0, 0); 
  modelMatrix.scale(1,1,-1);												
  modelMatrix.scale(1, 1, 0.7);
  if (showPoles) {
  	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  	gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
  							poleStart/floatsPerVertex, // start at this vertex number, and
  							poleVerts.length/floatsPerVertex);	// draw this many vertices. 
  }

  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);	
  //--------Draw Spinning Neptune
  var neptuneSize = 0.4;
  modelMatrix.rotate(sunRotationAngle-45, 1, 0, 0);
  modelMatrix.translate(0.0, 1.8, 0.0); 
  modelMatrix.scale(neptuneSize,neptuneSize,-neptuneSize);		
  modelMatrix.rotate(sunRotationAngle, 1, 1, 0); 
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
  							neptuneStart/floatsPerVertex,	// start at this vertex number, and 
  							neptuneVerts.length/floatsPerVertex);

  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);
  //-------Draw Spinning Pole:
  modelMatrix.rotate(sunRotationAngle, 1, 0, 0);
  modelMatrix.translate(0, 1.6, 0);
  modelMatrix.rotate(90, 1, 0, 0); 
  modelMatrix.scale(1,1,-1);												
  modelMatrix.scale(1, 1, 1.2);
  if (showPoles) {
  	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  	gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
  							poleStart/floatsPerVertex, // start at this vertex number, and
  							poleVerts.length/floatsPerVertex);	// draw this many vertices. 
  }

  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);	
  //--------Draw Spinning Rock
  var rockSize = 0.15;
  modelMatrix.rotate(sunRotationAngle, 1, 0, 0);
  modelMatrix.translate(0.0, 2.2, 0.0); 
  modelMatrix.scale(rockSize,rockSize,-rockSize);		
  modelMatrix.rotate(sunRotationAngle, 1, 1, 0); 
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
  							rockStart/floatsPerVertex,	// start at this vertex number, and 
  							rockVerts.length/floatsPerVertex);

  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);	
  //--------Draw Spinning Saturn
  var saturnSize = 0.3;
  modelMatrix.rotate(sunRotationAngle, 0, 1, 0);
  modelMatrix.translate(1.5, 0.0, 0.0); 
  modelMatrix.scale(saturnSize,saturnSize,-saturnSize);		
  modelMatrix.rotate(sunRotationAngle, 1, 1, 0); 
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
  							saturnStart/floatsPerVertex,	// start at this vertex number, and 
  							saturnVerts.length/floatsPerVertex);

  pushMatrix(modelMatrix);	
  //-------Draw Spinning Pole:
  modelMatrix.rotate(sunRotationAngle*6, 0, 0, 1); 		
  modelMatrix.rotate(sunRotationAngle, 0, 1, 0); 
  modelMatrix.scale(1,1,-1);												
  modelMatrix.scale(2.3, 5, 5);
  modelMatrix.rotate(90, 0, 1, 0); 
  if (showPoles) {
  	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  	gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
  							poleStart/floatsPerVertex, // start at this vertex number, and
  							poleVerts.length/floatsPerVertex);	// draw this many vertices. 
  }

  modelMatrix = popMatrix();
  //--------Draw Spinning Ring
  var ringSize = 0.9;
  modelMatrix.rotate(sunRotationAngle*6, 0, 0, 1); 		
  modelMatrix.rotate(sunRotationAngle, 0, 1, 0); 
  modelMatrix.scale(1*ringSize,1*ringSize,-1*ringSize);		

  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, 				// use this drawing primitive, and
  						  ringStart/floatsPerVertex,	// start at this vertex number, and
  						  ringVerts.length/floatsPerVertex);	// draw this many vertices.
}


// Last time that this function was called:  (used for animation timing)
var g_last = Date.now();

function animate(angle) {
//==============================================================================
  // Calculate the elapsed time
  now = Date.now();
  elapsed = now - g_last;
  g_last = now;
  
  // Update the current rotation angle (adjusted by the elapsed time)
  //  limit the angle to move smoothly between +20 and -85 degrees:
  if(direction >= 0 && ANGLE_STEP > 0) ANGLE_STEP = -ANGLE_STEP;
  if(direction < 0 && ANGLE_STEP < 0) ANGLE_STEP = -ANGLE_STEP;
  
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  if(scalar > 1 || scalar <= 0) direction = -direction;
  if (!paused) scalar += direction * speed;
  return newAngle %= 360;
}

function animateRotation(angle) {
//==============================================================================
  var newAngle = angle + (SUN_ANGLE_STEP * elapsed) / 1000.0;
  return newAngle %= 360;
}

//==================HTML Button Callbacks
function fullSize() {
 scalar = 1; 
 currentAngle = 90;
}

function spinDown() {
  if (speed > 0.05) speed -= 0.05; 
}

function spinUp() {
  if (speed <= 2) speed += 0.5; 
}

function runStopPlant() {
  paused = !paused
  if(ANGLE_STEP*ANGLE_STEP > 1) {
    myTmp = ANGLE_STEP;
    ANGLE_STEP = 0;
  }
  else {
  	ANGLE_STEP = myTmp;
  }
}

//===================Mouse and Keyboard event-handling Callbacks

function myMouseDown(ev, gl, canvas) {
//==============================================================================
// Called when user PRESSES down any mouse button;
// 									(Which button?    console.log('ev.button='+ev.button);   )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  
  console.log("so far so good");
// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
  						 (canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
							 (canvas.height/2);
//	console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);
	
	mouseDown = true;											// set our mouse-dragging flag
	xMclik = x;													// record where mouse-dragging began
	yMclik = y;
};


function myMouseMove(ev, gl, canvas) {
//==============================================================================
// Called when user MOVES the mouse with a button already pressed down.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

	if(mouseDown==false) return;				// IGNORE all mouse-moves except 'dragging'

  isDrag = true;
	// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
  						 (canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
							 (canvas.height/2);
//	console.log('myMouseMove(CVV coords  ):  x, y=\t',x,',\t',y);

	// find how far we dragged the mouse:
	xMdragTot += (x - xMclik);					// Accumulate change-in-mouse-position,&
	yMdragTot += (y - yMclik);
	xMclik = x;													// Make next drag-measurement from here.
	yMclik = y;
};

function myMouseUp(ev, gl, canvas) {
//==============================================================================
// Called when user RELEASES mouse button pressed previously.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

  if (!isDrag) showPoles = !showPoles;

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseUp  (pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
    						 (canvas.width/2);			// normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
  						 (canvas.height/2);
  console.log('myMouseUp  (CVV coords  ):  x, y=\t',x,',\t',y);
  
  mouseDown = false;											// CLEAR our mouse-dragging flag, and
  isDrag = false;
  // accumulate any final bit of mouse-dragging we did:
  xMdragTot += (x - xMclik);
  yMdragTot += (y - yMclik);
  console.log('myMouseUp: xMdragTot,yMdragTot =',xMdragTot,',\t',yMdragTot);
};


function myKeyDown(ev) {
//===============================================================================
// Called when user presses down ANY key on the keyboard, and captures the 
// keyboard's scancode or keycode(varies for different countries and alphabets).

	switch(ev.keyCode) {			// keycodes !=ASCII, but are very consistent for 
	//	nearly all non-alphanumeric keys for nearly all keyboards in all countries.
	    case 32:
	    	if(SUN_ANGLE_STEP*SUN_ANGLE_STEP > 1) {
			    myTmp = SUN_ANGLE_STEP;
			    SUN_ANGLE_STEP = 0;
			  }
			  else {
			  	SUN_ANGLE_STEP = myTmp;
			  }
			break;
		case 37:		// left-arrow key
			zRot = -1;
			break;
		case 38:		// up-arrow key
			xRot = -1;
		case 39:		// right-arrow key
			zRot = 1;
  		break;
		case 40:		// down-arrow key
			xRot = 1;
  		break;
		default:
			break;
	}
}

function myKeyUp(ev) {
//===============================================================================
// Called when user releases ANY key on the keyboard; captures scancodes well

	xRot = 0;
	yRot = 0;
	zRot = 0;
}

function myKeyPress(ev) {
//===============================================================================
// Best for capturing alphanumeric keys and key-combinations such as 
// CTRL-C, alt-F, SHIFT-4, etc.
	console.log('myKeyPress():keyCode='+ev.keyCode  +', charCode=' +ev.charCode+
												', shift='    +ev.shiftKey + ', ctrl='    +ev.ctrlKey +
												', altKey='   +ev.altKey   +
												', metaKey(Command key or Windows key)='+ev.metaKey);
}
 