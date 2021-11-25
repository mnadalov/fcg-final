const left = 1 << 0, // 1
      right = 1 << 1, // 2
      backward = 1 << 2, // 4
      forward = 1 << 3; // 8

let cellsWallsData, remainingCellsIdx, previousCellInWalk, rndmWalkStartCellIdx, currCellXCoord, currCellYCoord, canvas, context, mazeWidth, mazeLength, currCellIdx;
let mazeComplete = 0, randomWalkFirstCellSelected = 1, continueRandomWalk = 2;

function shuffleArray(array) {
    for (let i = array.mazeLength - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
function range(size, startAt = 0) {
    return [...Array(size).keys()].map(i => i + startAt);
}

function generateMaze(width, length){
  mazeWidth = width, mazeLength = length;
  cellsWallsData = new Array(mazeWidth * mazeLength);
  remainingCellsIdx = shuffleArray(range(mazeWidth * mazeLength));
  previousCellInWalk = new Array(mazeWidth * mazeLength);

  var start = remainingCellsIdx.pop();
  cellsWallsData[start] = 0;

  while(loopErasedRandomWalk()!=mazeComplete) {}
  return cellsWallsData;

}

function loopErasedRandomWalk() {

  let pickingCellRes = pickNewStartingCell();
  if(pickingCellRes!=continueRandomWalk){
    return pickingCellRes;
  }

  randomStep();

  addCellToWalkOrEraseLoop();

  addWalkIfReachedMaze();

  return continueRandomWalk;
}

function eraseWalk(rndmWalkStartCellIdx, lastCellIdxBeforeLoop) {
  let currCellIdxToErase;
  do {
    currCellIdxToErase = previousCellInWalk[rndmWalkStartCellIdx];
    previousCellInWalk[rndmWalkStartCellIdx] = NaN;
    rndmWalkStartCellIdx = currCellIdxToErase;
  } while (currCellIdxToErase !== lastCellIdxBeforeLoop);
}

function pickNewStartingCell(){
  if (rndmWalkStartCellIdx == null) {
    do{
      rndmWalkStartCellIdx = remainingCellsIdx.pop();
      if (rndmWalkStartCellIdx == null) return mazeComplete;
    }while (cellIndexAlreadyVisited(rndmWalkStartCellIdx));
    previousCellInWalk[rndmWalkStartCellIdx] = rndmWalkStartCellIdx;
    currCellXCoord = rndmWalkStartCellIdx % mazeWidth;
    currCellYCoord = rndmWalkStartCellIdx / mazeWidth | 0;
    return randomWalkFirstCellSelected;
  }
  return continueRandomWalk;
}

function randomStep(){
  let option;
  while (true) {
    option = Math.floor(Math.random() * 4);
    if (option === 0) { if (currCellYCoord <= 0) continue; --currCellYCoord, currCellIdx = rndmWalkStartCellIdx - mazeWidth; }
    else if (option === 1) { if (currCellYCoord >= mazeLength - 1) continue; ++currCellYCoord, currCellIdx = rndmWalkStartCellIdx + mazeWidth; }
    else if (option === 2) { if (currCellXCoord <= 0) continue; --currCellXCoord, currCellIdx = rndmWalkStartCellIdx - 1; }
    else { if (currCellXCoord >= mazeWidth - 1) continue; ++currCellXCoord, currCellIdx = rndmWalkStartCellIdx + 1; }
    break;
  }
}

function addCellToWalkOrEraseLoop(){
  if (previousCellInWalk[currCellIdx] >= 0){
    eraseWalk(rndmWalkStartCellIdx, currCellIdx)
  }else {
    previousCellInWalk[currCellIdx] = rndmWalkStartCellIdx;
  }
}

function addWalkIfReachedMaze(){
  if (cellsWallsData[currCellIdx] >= 0) {
    while ((rndmWalkStartCellIdx = previousCellInWalk[currCellIdx]) !== currCellIdx) {
      if (currCellIdx === rndmWalkStartCellIdx + 1) cellsWallsData[rndmWalkStartCellIdx] |= forward, cellsWallsData[currCellIdx] |= backward;
      else if (currCellIdx === rndmWalkStartCellIdx - 1) cellsWallsData[rndmWalkStartCellIdx] |= backward, cellsWallsData[currCellIdx] |= forward;
      else if (currCellIdx === rndmWalkStartCellIdx + mazeWidth) cellsWallsData[rndmWalkStartCellIdx] |= right, cellsWallsData[currCellIdx] |= left;
      else cellsWallsData[rndmWalkStartCellIdx] |= left, cellsWallsData[currCellIdx] |= right;
      previousCellInWalk[currCellIdx] = NaN;
      currCellIdx = rndmWalkStartCellIdx;
    }

    previousCellInWalk[currCellIdx] = NaN;
    rndmWalkStartCellIdx = null;
  } else {
    rndmWalkStartCellIdx = currCellIdx;
  }
}


function cellIndexAlreadyVisited(index){
  return cellsWallsData[index] >= 0
}