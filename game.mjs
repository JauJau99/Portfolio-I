// HTML interaksjon -----------------------------------------------------------
const canvas = document.getElementById("canvas");
const brush = canvas.getContext("2d");

// GAME VARIABLES -------------------------------------------------------------
const MIN_SPEED = 2;
const MAX_SPEED = 4;

const PADDLE_PADDING = 10;
const PADDLE_WIDTH = 20;
const PADDLE_HEIGHT = 75;

const NPC_SPEED = 3;
let npcFrozenUntil = 0;

const CENTER = canvas.width / 2;

//ball speedup
const SPEEDUP = 1.06; //+6% per paddle treff
const MAX_BALL_SPEED = 9; //Max hastighet

let leftScore = 0; //Spiller
let rightScore = 0; //NPC

//game timer
const GAME_DURATION_S = 90;//game time (sek)
const GAME_DURATION_MS = GAME_DURATION_S * 1000;
let endTime = 0;
let gameOver = false;

const MAX_DEFLECT_ANGLE = Math.PI / 3;

const ball = {
  x: 310,
  y: 230,
  radius: 10,
  color: "#FFFFFF",
  speedX: 0,
  speedY: 0,
};

const paddle = {
  x: PADDLE_PADDING,
  y: 0,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT,
  color: "#daff33",
};

const npcPaddle = {
  x: canvas.width - PADDLE_PADDING - PADDLE_WIDTH,
  y: 0,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT,
  color: "#ff33e4ff",
};

const pitch = {
  x: 0,
  y: 0,
  width: canvas.width,
  height: canvas.height,
  color: "#000",
};

// GAME ENGINE ----------------------------------------------------------------
function update() {
  const now = Date.now();
  if (!gameOver && now >= endTime){
    gameOver = true; // frys spillet
  }

  if (!gameOver){
    moveBall(ball);
    movePaddle(npcPaddle);
    keepBallOnPitch(ball);
    dealWithCollision(paddle, ball);
    dealWithCollision(npcPaddle, ball);
  }

  draw();
  requestAnimationFrame(update);
}

function draw() {
  clearCanvas();
  drawPitch(pitch);
  drawScore();
  drawTimer();
  drawBall(ball);
  drawPaddle(paddle);
  drawPaddle(npcPaddle);

  if (gameOver){
    drawGameOver();
  }
}

function init() {
  centerVerticallyItemIn(paddle, canvas);
  centerVerticallyItemIn(npcPaddle, canvas);
  giveBallRandomSpeed(ball);

  endTime = Date.now() + GAME_DURATION_MS;
  update();
}

init();

// GAME FUNCTIONS -------------------------------------------------------------
function movePaddle(paddle) {
  if (paddle === npcPaddle && Date.now() < npcFrozenUntil){ //frys npc
    return;
  }

  let delta = ball.y - (paddle.y + paddle.height * 0.5);
  if (delta < 0) {
    paddle.y -= NPC_SPEED;
  } else {
    paddle.y += NPC_SPEED;
  }

  //hold paddlen innenfor banen
  if (paddle.y < 0) paddle.y = 0;
  const maxY = canvas.height - paddle.height;
  if (paddle.y > maxY) paddle.y = maxY;
}

function keepBallOnPitch(ball) {
  const leftBorder = ball.radius;
  const rightBorder = canvas.width - ball.radius;
  const topBorder = 0 + ball.radius;
  const bottomBorder = canvas.height - ball.radius;

  //mål til høyre (ball ut venstre)
  if (ball.x < leftBorder){
    rightScore += 1;
    putBallInCenterOfPitch(ball);
    giveBallRandomSpeed(ball);
    return; //Ferdig
  }

  //mål til venstre (ball ut høyre)
  if (ball.x > rightBorder){
    leftScore += 1;
    putBallInCenterOfPitch(ball);
    giveBallRandomSpeed(ball);
    return;
  }

  if (ball.y <= topBorder || ball.y >= bottomBorder) {
    ball.speedY *= -1;
  }
}

function putBallInCenterOfPitch(ball) {
  ball.x = canvas.width * 0.5;
  ball.y = canvas.height * 0.5;
}

function giveBallRandomSpeed(ball) {
  ball.speedX = randomNumberBetween(MAX_SPEED, MIN_SPEED);
  ball.speedY = randomNumberBetween(MAX_SPEED, MIN_SPEED);

  if (Math.random() < 0.5) ball.speedX *= -1;
  if (Math.random() < 0.5) ball.speedY *= -1;
}

function dealWithCollision(paddle, ball) {
  const paddleTop = paddle.y;
  const paddleBottom = paddle.y + paddle.height;
  const isRightSide = paddle.x > CENTER;

  let paddleBorder = paddle.x + paddle.width + ball.radius;
  if (isRightSide){
    paddleBorder = paddle.x - ball.radius;
  }

  let changeVector = false;
  const verticalOverlap =
    (ball.y + ball.radius) >= paddleTop &&
    (ball.y - ball.radius) <= paddleBottom;

  if (verticalOverlap) {
    if (isRightSide) {
      changeVector = ball.x >= paddleBorder;
    } else {
      changeVector = ball.x <= paddleBorder;
    }
  }

  if (changeVector){
    ball.x = isRightSide ? paddle.x - ball.radius : paddle.x + paddle.width + ball.radius;

    const centerY = paddle.y + paddle.height* 0.5;
    let hit = (ball.y - centerY) / (paddle.height * 0.5);
    if (hit > 1) hit = 1;
    if (hit < -1) hit = -1;

    const angle = hit * MAX_DEFLECT_ANGLE;
    const dirX  = isRightSide ? -1 : 1;

    let speed = Math.hypot(ball.speedX, ball.speedY) * SPEEDUP;
    if (speed > MAX_BALL_SPEED) speed = MAX_BALL_SPEED;

    ball.speedX = Math.cos(angle) * speed * dirX;
    ball.speedY = Math.sin(angle) * speed;
  }
}

function moveBall(ball) {
  ball.x = ball.x + ball.speedX;
  ball.y = ball.y + ball.speedY;
}

// Draw -----------------------------------------------------------------------
function drawBall(ball) {
  brush.beginPath();
  brush.fillStyle = ball.color;
  brush.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
  brush.fill();
}

function drawPaddle(paddle) {
  brush.fillStyle = paddle.color;
  brush.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

function drawPitch(pitch) {
  brush.fillStyle = pitch.color;
  brush.fillRect(pitch.x, pitch.y, pitch.width, pitch.height);

  brush.fillStyle = "white";
  brush.fillRect(pitch.width * 0.5, 0, 4, pitch.height);
}

//Draw HUD-----------------------------------------------------------------
//Scoreboard
function drawScore(){
  brush.font = "bold 36px monospace";
  brush.textBaseline = "top";
  brush.lineWidth = 3;
  brush.strokeStyle = "black";
  brush.fillStyle = "#fff";

  //Venstre score
  brush.textAlign = "left";
  brush.strokeText(String(leftScore), 24, 16);
  brush.fillText(String(leftScore), 24, 16);

  //Høyre score
  brush.textAlign = "right";
  brush.strokeText(String(rightScore), canvas.width - 24, 16);
  brush.fillText(String(rightScore), canvas.width - 24, 16);
}

//Timer
function drawTimer(){
  const remainingMs = gameOver ? 0 : Math.max(0, endTime - Date.now());
  const text = `Time: `+ formatTime(remainingMs);

  brush.font = "bold 20px monospace";
  brush.textBaseline = "top";
  brush.textAlign = "center";
  brush.lineWidth = 1;
  brush.strokeStyle = "black";
  brush.fillStyle = "#fff";
  brush.strokeText(text, canvas.width / 1.5, 16);
  brush.fillText(text,  canvas.width / 1.5, 16);
}

//"GAME OVER" text
function drawGameOver(){
  brush.font = "bold 48px monospace";
  brush.textAlign = "center";
  brush.textBaseline = "middle";
  brush.lineWidth = 6;
  brush.strokeStyle = "black";
  brush.fillStyle = "#ff3333";
  brush.strokeText("GAME OVER", canvas.width / 2, canvas.height / 2);
  brush.fillText("GAME OVER",  canvas.width / 2, canvas.height / 2);
}

// UTILITY FUNCTIONS ----------------------------------------------------------

canvas.addEventListener("mousemove", onMouseMove);
window.addEventListener("keydown", onKeyDown);

//cheat keys
function onKeyDown(e){
  const k = e.key;

  //L = frys NPC i 2 sek
  if (k === "l" || k === "L"){
    npcFrozenUntil = Date.now() + 2000; //1sek = 1000
  }
  //C =teleporter venstrepaddle etter ballen
  else if (k === "c" || k === "C"){
    paddle.y = Math.max(0, Math.min(
      ball.y - paddle.height * 0.5,
      canvas.height - paddle.height
    ));
  }
  //+ = +5px
  else if (k === "+"){
    ball.radius += 5;
  }
  //- = -5px (men ikke mindrer en 2px)
  else if (k === "-"){
    ball.radius = Math.max(2, ball.radius - 5);
  }
}

function onMouseMove(event) {
  paddle.y = event.offsetY;
}

function randomNumberBetween(max, min) {
  return Math.round(Math.random() * (max - min)) + min;
}

function centerVerticallyItemIn(item, target) {
  item.y = target.height * 0.5 - item.height * 0.5;
}

function clearCanvas() {
  brush.clearRect(0, 0, canvas.width, canvas.height);
}

function inBounds(value, min, max) {
  return value >= min && value <= max;
}

function formatTime(ms){
  const secs = Math.max(0, Math.ceil(ms / 1000));
  return String(secs);
}
