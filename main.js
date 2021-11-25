const ambientLight = new THREE.AmbientLight( 0x404040 );
let camera, scene, renderer, mesh, spotLight = new THREE.SpotLight();
let zWidth = 5, xWidth = 5;
const subWallSeparation = 2;
const wallLength = 80;
const wallHeight = 80;
const wallWidth = 6;
const colWidth = wallWidth*2;
const startSize = wallLength/3;
const finishSize = Math.min(wallHeight,wallLength)/6;
const limit = Math.max(wallWidth, colWidth)+1;
const movement = wallLength/5;
const angle = Math.PI/20;
let target = {x:-50, y:0, z:0};
let keysPressed = {"KeyA":false, "KeyW":false, "KeyD":false, "KeyS":false, "KeyQ":false, "KeyE": false};
let geometrys = []
let meshes = []
const wallTexture = new THREE.TextureLoader().load( 'textures/wall.jpg' );
const ceilingTexture = new THREE.TextureLoader().load( 'textures/ceiling.jpg' );
const floorTexture = new THREE.TextureLoader().load( 'textures/floor.jpg' );
const columnTexture = new THREE.TextureLoader().load( 'textures/column.jpeg' );
const doorTexture = new THREE.TextureLoader().load( 'textures/steel_door.jpg' );
const startTexture = new THREE.TextureLoader().load( 'textures/windows_maze_start.png' );
const finishTexture = new THREE.TextureLoader().load( 'textures/smiley_face.jpg' );
const wallMaterial = new THREE.MeshLambertMaterial( { map: wallTexture } );
const ceilingMaterial = new THREE.MeshLambertMaterial( { map: ceilingTexture } );
const floorMaterial = new THREE.MeshLambertMaterial( { map: floorTexture } );
const columnMaterial = new THREE.MeshLambertMaterial( { map: columnTexture } );
const doorMaterial = new THREE.MeshLambertMaterial( { map: doorTexture } );
const startMaterial = new THREE.MeshLambertMaterial( { map: startTexture, opacity: 0.5, transparent: true } );
const finishMaterial = new THREE.MeshLambertMaterial( { map: finishTexture, opacity: 0.5, transparent: true } );
let maze;

init();
animate();

function init() {

    start()

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    window.addEventListener( 'resize', onWindowResize );
    window.addEventListener( 'resize', onWindowResize );
    document.addEventListener('keydown', function(e) {keysPressed[e.code] = true});
    document.addEventListener('keyup', function(e) {keysPressed[e.code] = false});

}

function changeWidth(newWidth){
    xWidth = parseInt(newWidth);
}

function changeDepth(newDepth){
    zWidth = parseInt(newDepth);
}

function start(){
    createScene();

    setCamera();
    
    drawMaze();

    setLights();
}

function createScene(){
    scene = new THREE.Scene();
    scene.add( spotLight );
    scene.add( ambientLight );
    scene.add( spotLight.target );
}

function setCamera(){
    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.z = 0;
    camera.position.x = 0;
    camera.lookAt(target.x, target.y, target.z);
}

function setLights(){
    spotLight.distance = wallLength*3;
    spotLight.angle = Math.PI/4;
    spotLight.position.set( 0, 0, 5);
    spotLight.target = camera;
}

function drawMaze(){
    maze = generateMaze(zWidth, xWidth);
    for(let i = 0; i<maze.length; i++){
        let cellPosition = {x: i % zWidth, z: i / zWidth | 0};
        

        drawFloorAndCeiling(cellPosition);

        if(hasWall(i,forward)){
            drawWalls(cellPosition, {x: wallLength/2, z: 0}, {width: wallWidth, length: wallLength}, i<maze.length-1);
        }
        if((i % zWidth) == 0){
            drawWalls(cellPosition, {x: -wallLength/2, z: 0}, {width: wallWidth, length: wallLength}, i>0);
        }
        if(hasWall(i,right)){
            drawWalls(cellPosition, {x: 0, z: wallLength/2}, {width: wallLength, length: wallWidth}, true);
        }
        if(i<zWidth){
            drawWalls(cellPosition, {x: 0, z: -wallLength/2}, {width: wallLength, length: wallWidth}, true);
        }
    }
    drawColumns();
    drawStartAndFinish();
}

function hasWall(cell, direction){
    if(direction){
        return !(maze[cell] == (maze[cell] | direction));
    }
    return false;
}

function canMove(oldPosition, newPosition){
    let oldRoom = room(oldPosition);
    let newRoom = roomMinusWalls(oldPosition, newPosition);
    let canMove = oldRoom==newRoom;
    canMove ||= notGoingThroughWall(oldRoom, newRoom);
    canMove &&= notGoingIntoColumn(oldPosition, newPosition);
    return canMove;
}

function notGoingIntoColumn(oldPosition, newPosition){
    let columnsCoordinates = columnsCoordinatesofRoom(oldPosition);
    for(column in columnsCoordinates){
        if(distanceXZ(columnsCoordinates[column],newPosition)<limit){
            return false;
        }
    }
    return true;
}

function distanceXZ(pointA, pointB){
    var a = pointB.x - pointA.x;
    var b = pointB.z - pointA.z;
    return Math.sqrt( a*a + b*b );
}

function columnsCoordinatesofRoom(position){
    let fourColumns = {};
    let xPosition = position.x/wallLength;
    let zPosition = position.z/wallLength;
    let lColumn = Math.floor(xPosition)*wallLength-wallLength/2;
    let rColumn = Math.ceil(xPosition)*wallLength-wallLength/2;
    let bColumn = Math.floor(zPosition)*wallLength-wallLength/2;
    let fColumn = Math.ceil(zPosition)*wallLength-wallLength/2;
    fourColumns.LB = {x: lColumn, z: bColumn};
    fourColumns.LF = {x: lColumn, z: fColumn};
    fourColumns.RB = {x: rColumn, z: bColumn};
    fourColumns.RF = {x: rColumn, z: fColumn};
    return fourColumns;
}

function notGoingThroughWall(oldRoom, newRoom){
    if(oldRoom-newRoom==1){
        return !hasWall(oldRoom,backward);
    }else if(oldRoom-newRoom==-1){
        return !hasWall(oldRoom,forward);
    }else if(oldRoom-newRoom==zWidth){
        return !hasWall(oldRoom,left);
    }else if(oldRoom-newRoom==-zWidth){
        return !hasWall(oldRoom,right);
    }
    return false;
}

function room(position){
    xCell = Math.floor((position.x+wallLength/2)/wallLength);
    zCell = Math.floor((position.z+wallLength/2)/wallLength);
    return zCell*zWidth+xCell
}

function roomMinusWalls(oldPosition, newPosition){
    if(oldPosition.x-newPosition.x<0){
        xCell = Math.floor((newPosition.x+limit+wallLength/2)/wallLength);
        zCell = Math.floor((newPosition.z+wallLength/2)/wallLength);
    }else if(oldPosition.x-newPosition.x>0){
        xCell = Math.floor((newPosition.x-limit+wallLength/2)/wallLength);
        zCell = Math.floor((newPosition.z+wallLength/2)/wallLength);
    }else if(oldPosition.z-newPosition.z<0){
        xCell = Math.floor((newPosition.x+wallLength/2)/wallLength);
        zCell = Math.floor((newPosition.z+limit+wallLength/2)/wallLength);
    }else if(oldPosition.z-newPosition.z>0){
        xCell = Math.floor((newPosition.x+wallLength/2)/wallLength);
        zCell = Math.floor((newPosition.z-limit+wallLength/2)/wallLength);
    }
    return zCell*zWidth+xCell
}

function drawFloorAndCeiling(cellPosition){
    drawPlane(cellPosition, -wallHeight/2);
    drawPlane(cellPosition, wallHeight/2);
}

function drawPlane(cellPosition, yPosition){
    geometrys.push(new THREE.PlaneGeometry(wallLength, wallLength));
    meshes.push(new THREE.Mesh( geometrys[geometrys.length-1], floorMaterial ));
    meshes[meshes.length-1].material.side = THREE.DoubleSide;
    scene.add( meshes[meshes.length-1] );
    meshes[meshes.length-1].rotation.set(-Math.PI/2, 0, Math.PI); 
    meshes[meshes.length-1].position.set(cellPosition.x*wallLength, yPosition, cellPosition.z*wallLength);
}

function drawWalls(cellPosition, wallRelativePosition, wallSize, regularWall){
    geometrys.push(new THREE.BoxGeometry(wallSize.width, wallHeight, wallSize.length));
    if(regularWall){
        meshes.push(new THREE.Mesh( geometrys[geometrys.length-1], wallMaterial ));    
    }else{
        meshes.push(new THREE.Mesh( geometrys[geometrys.length-1], doorMaterial ));
    }
    
    scene.add( meshes[meshes.length-1] );
    meshes[meshes.length-1].position.set(cellPosition.x*wallLength+wallRelativePosition.x, 0, cellPosition.z*wallLength+wallRelativePosition.z);
}

function drawColumns(){
    for(let i=0; i<=zWidth; i+=1){
        for(let j=0; j<=xWidth; j+=1){
            geometrys.push(new THREE.BoxGeometry(colWidth, wallHeight, colWidth));
            meshes.push(new THREE.Mesh( geometrys[geometrys.length-1], columnMaterial ));
            meshes[meshes.length-1].position.set(i*wallLength-wallLength/2, 0, j*wallLength-wallLength/2);        
            scene.add( meshes[meshes.length-1] );
        }
    }
}

function drawStartAndFinish(){
    let widthStart = 0;
    let lengthStart = startSize;
    let xStart = wallLength/2;
    let zStart = 0;
    if(hasWall(0, forward)){
        widthStart = startSize;
        lengthStart = 0;
        xStart = 0;
        zStart = wallLength/2;
    }
    geometrys.push(new THREE.BoxGeometry(widthStart, wallHeight/4, lengthStart));
    meshes.push(new THREE.Mesh( geometrys[geometrys.length-1], startMaterial ));
    meshes[meshes.length-1].position.set(xStart, 0, zStart);        
    scene.add( meshes[meshes.length-1] );
    let angleFinish = Math.PI;
    if(hasWall(xWidth*zWidth-1, backward)){
        angleFinish = Math.PI/2;
    }
    geometrys.push(new THREE.SphereGeometry(finishSize, finishSize, finishSize, phiStart=angleFinish));
    meshes.push(new THREE.Mesh( geometrys[geometrys.length-1], finishMaterial ));
    meshes[meshes.length-1].position.set(wallLength*(xWidth-1), 0, wallLength*(zWidth-1));  
    scene.add( meshes[meshes.length-1] );
}

function move(key) {
    let newPositionX = camera.position.x;
    let newPositionZ = camera.position.z;
    switch (key) {
        case "KeyA":
            newPositionX -= target.z*movement/100.0;
            newPositionZ += target.x*movement/100.0;
            break;
        case "KeyW":
            newPositionX -= target.x*movement/100.0;
            newPositionZ -= target.z*movement/100.0;
            break;
        case "KeyD":
            newPositionX += target.z*movement/100.0;
            newPositionZ -= target.x*movement/100.0;
            break;
        case "KeyS":
            newPositionX +=target.x*movement/100.0;
            newPositionZ += target.z*movement/100.0;
            break;
        case "KeyQ":
            target = {x:target.z*Math.sin(angle)+target.x*Math.cos(angle), y:target.y, z:target.z*Math.cos(angle)-target.x*Math.sin(angle)};
            break;
        case "KeyE":
            target = {x:target.x*Math.cos(angle)-target.z*Math.sin(angle), y:target.y, z:target.x*Math.sin(angle)+target.z*Math.cos(angle)};
            break;
        case "KeyR":
            target = {x:target.x, y:Math.min(target.y+1+Math.abs(target.y*0.05), wallHeight*10), z:target.z};
            break;
        case "KeyF":
            target = {x:target.x, y:Math.max(target.y-(1+Math.abs(target.y*0.05)), -wallHeight*10), z:target.z};
            break;
    }
    if(canMove({x: camera.position.x, z: camera.position.z}, {x: newPositionX, z: camera.position.z})){
        camera.position.x = newPositionX;
    }
    if(canMove({x: camera.position.x, z: camera.position.z}, {x: camera.position.x, z: newPositionZ})){
        camera.position.z = newPositionZ;
    }
    camera.lookAt(camera.position.x-target.x, target.y, camera.position.z-target.z);
    spotLight.position.set(camera.position.x+target.x, target.y, camera.position.z+target.z);
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

    requestAnimationFrame( animate );
    renderer.render( scene, camera );
    for(key in keysPressed){
        if(keysPressed[key]){
            move(key);
        }
    }
}