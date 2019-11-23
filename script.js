var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

WIDHT = 720;
HEIGHT = 720;

canvas.width = WIDHT;
canvas.height = HEIGHT;

canvas.addEventListener("click", (evt) => {
    var rect = canvas.getBoundingClientRect();
    var x = evt.clientX - rect.left
    var y = evt.clientY - rect.top
    
    if(currentTool == "addCurve"){
        curveBuff.push([x, y]);
    }  else if(touchedAnyControlPoint({x: x, y: y})){
        if(currentTool == "deletePoint"){
            findCurveAndRemovePoint({x: x, y: y});
        }
        if(currentTool == "deleteCurve"){
            findCurveAndDestroy({x: x, y: y});
        }
    }
    draw();
});

canvas.addEventListener("mousedown", (evt) => {
    var rect = canvas.getBoundingClientRect();
    var x = evt.clientX - rect.left
    var y = evt.clientY - rect.top
    if(touchedAnyControlPoint({x: x, y: y})){
        dragging = true;
    }
    draw();
});

canvas.addEventListener("mouseup", (evt) => {
    dragging = false;
    draw();
});

canvas.addEventListener("mousemove", (evt) => {
    var rect = canvas.getBoundingClientRect();
    var x = evt.clientX - rect.left
    var y = evt.clientY - rect.top
    if (dragging && currentTool == "movePoint") {
        allBezierCurves[moveIndexI][moveIndexJ][0] = x;
        allBezierCurves[moveIndexI][moveIndexJ][1] = y;
        draw();
    }
    document.getElementById("mouse-x").innerHTML = Math.floor(x);
    document.getElementById("mouse-y").innerHTML = Math.floor(y);
});

document.addEventListener("keydown", keyPush);
function keyPush(evt) {
    switch(evt.keyCode) {
        case 32:
            if(curveBuff.length > 1){
                allBezierCurves.pop();
                allBezierCurves.push(curveBuff);
                curveBuff = [];
                allBezierCurves.push(curveBuff);
            }
            enableAllToolButtons();
            currentTool = "none";
            break;
    }
}

var showCtrlPoints = document.getElementById('controlPoints');
showCtrlPoints.addEventListener(("change"), (evt) => {
    draw();
});

var showCtrlPoli = document.getElementById('controlPoli');
showCtrlPoli.addEventListener(("change"), (evt) => {
    draw();
});

var showCurves = document.getElementById('curve');
showCurves.addEventListener(("change"), (evt) => {
    draw();
});

var btnClean = document.getElementById('cleanCanvas');
btnClean.addEventListener(("click"), (evt) => {
    allBezierCurves = [];
    curveBuff = [];
    draw();
});

var evalConfig = document.getElementById('input-evaluations-number');
evalConfig.addEventListener("change", (e) => {
    configurableEvaluation = evalConfig.value;
    draw();
});

var moveIndexI = 0;
var moveIndexJ = 0;
var allBezierCurves = []
var curveBuff = []
var configurableEvaluation = 50;
var pointRadius = 6;
var currentTool = "none";
var toolState = 1;
var newPointBuffer = [-1,-1];
var dragging = false;


var btnToolAdd = document.getElementById("addCurve");
btnToolAdd.addEventListener(("click"), (evt) => {
    currentTool = "addCurve";
    disableAllToolButtons();
});

var btnToolMovePoint = document.getElementById('movePoint');
btnToolMovePoint.addEventListener(("click"), (evt) => {
    currentTool = "movePoint"
});

var btnToolErasePoint = document.getElementById('deletePoint');
btnToolErasePoint.addEventListener(("click"), (evt) => {
    currentTool = "deletePoint"
});

var btnToolEraseCurve = document.getElementById('deleteCurve');
btnToolEraseCurve.addEventListener(("click"), (evt) => {
    currentTool = "deleteCurve"
});


function deCasteljau(points, t) {
    if(points.length == 1){
        return points[0];
    } else {
        var nextpoints = []
        for(var i = 0; i < points.length-1; ++i){
            var px = (1-t)*points[i][0] + t*points[i+1][0];
            var py = (1-t)*points[i][1] + t*points[i+1][1];
            nextpoints.push([px,py]);
        }
        return deCasteljau(nextpoints, t);
    }
}

function drawPoints(points, color="#06d6a0"){
    var x = 0;
    var y = 1;
    for(var i = 0; i < points.length; ++i){
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(points[i][x], points[i][y], pointRadius , 0, 2*Math.PI);
        ctx.fill();
    }
}

function drawBufferedPoint(point){
    if(point != undefined){
        if(point[0] > 0 && point[1] > 0){
            drawPoints([[ point[0], point[1] ]], "gray");
        }
    }
}

function drawControlPolygons(points, color, width){
    var x = 0;
    var y = 1;
    for(var i = 0; i < points.length-1; ++i){
        auxDrawLine(points[i], points[i+1], color, width, 1);
    }
}

function findCurveAndRemovePoint(pointClicked){
    for (var i = 0; i < allBezierCurves.length; i++) {
        for(var j=0;j < allBezierCurves[i].length;j++){
            const element = allBezierCurves[i][j];
            if (insidePointRadius(element, pointClicked)){
                allBezierCurves[i].splice(j,1);
                draw();
                return;
            }
        }
    }
}

function drawBezier(points, iter){
    var t = 0;
    var step = 1.0/iter;
    var curvePoints = []
    for(var i = 0; i <= iter; ++i){
        curvePoints.push(deCasteljau(points, t));
        t += step;
    }

    for(var i = 0; i < curvePoints.length-1; ++i){
        auxDrawLine(curvePoints[i], curvePoints[i+1], "#ff1654", 2.5)
    }
}



function findCurveAndUpdate(pointClicked, newPoint){
    for (var i = 0; i < allBezierCurves.length; i++) {
        for(var j=0;j < allBezierCurves[i].length;j++){
            const element = allBezierCurves[i][j];
            if (insidePointRadius(element, pointClicked)){
                allBezierCurves[i].splice(j, 0, newPoint);
                draw();
                return;
            }
        }
    }
}

function findCurveAndDestroy(pointClicked){
    for (var i = 0; i < allBezierCurves.length; i++) {
        for(var j=0;j < allBezierCurves[i].length;j++){
            const element = allBezierCurves[i][j];
            if (insidePointRadius(element, pointClicked)){
                allBezierCurves.splice(i,1);
                draw();
                return;
            }
        }
    }
}

function insidePointRadius(el, clk){
    var v = {
        x: el[0] - clk.x,
        y: el[1] - clk.y
    };
    return (Math.sqrt(v.x * v.x + v.y * v.y) <= pointRadius);
}

function touchedAnyControlPoint(click){
    var touched = false;
    for (var i = 0; i < allBezierCurves.length; i++) {
        for(var j=0;j < allBezierCurves[i].length;j++){
            const element = allBezierCurves[i][j];
            if (insidePointRadius(element, click)){
                moveIndexI = i;
                moveIndexJ = j;
                touched = true;
            }
        }
    }
    return touched;
}

function auxDrawLine(orig, dest, color, width, control=0){
    var x = 0;
    var y = 1;
    if(control == 1){
        ctx.setLineDash([5, 3]);
    } else {
        ctx.setLineDash([]);
    }   
    ctx.beginPath();
    ctx.moveTo(orig[x], orig[y]);
    ctx.lineTo(dest[x], dest[y]);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
}

function clearCanvas(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function updateCurvesArray(){  
    if(curveBuff.length > 0){
        allBezierCurves.pop();
        allBezierCurves.push(curveBuff);
    }
}

function disableAllToolButtons(){
    btnClean.disabled = true;
    evalConfig.disabled = true;
    btnToolAdd.disabled = true;
    btnToolMovePoint.disabled = true;
    btnToolErasePoint.disabled = true;
    btnToolEraseCurve.disabled = true;
}

function enableAllToolButtons(){
    btnClean.disabled = false;
    evalConfig.disabled = false;
    btnToolAdd.disabled = false;
    btnToolMovePoint.disabled = false;
    btnToolErasePoint.disabled = false;
    btnToolEraseCurve.disabled = false;
}

window.onload = draw();

function draw(){
    clearCanvas();
    updateCurvesArray();
    var validBezierCurves = allBezierCurves.filter( (elem) => {
        return elem.length > 0;
    });
    if(validBezierCurves.length < 1){
        btnToolMovePoint.disabled = true;
        btnToolErasePoint.disabled = true; 
        btnToolEraseCurve.disabled = true; 

    }
    for(var i = 0; i < validBezierCurves.length; ++i){
        if(showCtrlPoints.checked){
            drawPoints(validBezierCurves[i]);
            drawBufferedPoint(newPointBuffer);
        }  
        if(showCtrlPoli.checked){
            drawControlPolygons(validBezierCurves[i], "#000000", 0.80);
        }   
        if(showCurves.checked){
            drawBezier(validBezierCurves[i], configurableEvaluation);
        }
    }
}

