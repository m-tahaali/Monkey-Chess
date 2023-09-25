btns = document.querySelectorAll(".control .btn");
game = document.getElementsByClassName("game")[0];
board = document.getElementsByClassName("board")[0];
side = document.getElementsByClassName("side")[0];
currentPlayer = document.getElementsByClassName("current")[0];
infoPopup = document.getElementById("infoPopup");
Dialogue = document.getElementById("Dialogue");
whiteTurn = true;
selfTake = false;
otherTake = false;
bearTake = false;
askJail = false;
jump = false;
passandplay = false;
let gameAI;

function executeAITurn(vboard, Take = false, end = false) {
    document.querySelectorAll(".board .piece").forEach((e) => {
        board.removeChild(e);
    })
    for (const [pos, type] of Object.entries(vboard)) {
        createPiece(type, pos);
    }
    if (end) {
        showWin(whiteTurn ? "white" : "black");
        return;
    }
    whiteTurn = !whiteTurn;
    jump = false;
    selfTake = false;
    otherTake = Take;
    currentPlayer.classList.add(whiteTurn ? "white" : "black");
    currentPlayer.classList.remove(whiteTurn ? "black" : "white");
    currentPlayer.innerText = "Your Move";
}

async function AITakeRandomTurn() {
    gameAI.board = getBoard();
    let [act, move, vboard] = gameAI.playRandomTurn(gameAI.board, otherTake);
    executeAITurn(vboard, act == "take", act == "win");
}

async function AITakeEducatedTurn() {
    gameAI.board = getBoard();
    let [act, move, vboard] = gameAI.playEducatedTurn(gameAI.board, otherTake);
    executeAITurn(vboard, act == "take", act == "win");
}

async function AITakeMinimaxTurn() {
    currentPlayer.innerText = "AI Turn";
    gameAI.board = getBoard();
    console.time("AI Taking Turn");
    const worker = new Worker('worker.js');
    worker.postMessage({
        gameAI: gameAI,
        otherTake: otherTake
    })
    worker.addEventListener('message', (event) => {
        const result = event.data;
        console.timeEnd("AI Taking Turn");
        executeAITurn(result[2], result[0] == "take", result[0] == "win");
    });
}

function showInfoModal() {
    infoPopup.classList.remove("hidden");
}

function showDialogue(title, content) {
    Dialogue.querySelector(".title span").innerText = title;
    if (content instanceof HTMLElement) {
        Dialogue.querySelector(".content").innerHTML = content.innerHTML;
    } else {
        Dialogue.querySelector(".content").innerHTML = content;
    }
    Dialogue.classList.remove("hidden");
}

function createButton(id, value) {
    let e = document.createElement("button");
    e.classList.add("btn");
    e.innerHTML = value;
    e.id = id
    return e;
}

function getBoard() {
    let pieces = {};
    document.querySelectorAll(".piece").forEach((p) => {
        pieces[p.getAttribute("position")] = p.getAttribute("type")
    })
    return pieces;
}

function showPlayOptions() {
    let e = document.createElement("div")
    let x = document.createElement("div")
    x.appendChild(createButton("pnp", "Pass & Play"))
    x.appendChild(createButton("pwb", "Play with Bot"))
    x.style.display = "flex";
    x.style.justifyContent = "space-around";
    e.appendChild(x);
    showDialogue("Play Options", e);
    document.getElementById("pnp").onclick = () => { passandplay = true; startgame(false); closePopup(); }
    document.getElementById("pwb").onclick = () => { passandplay = false; startgame(false); closePopup(); }
}

function closePopup() {
    document.querySelectorAll(".popup").forEach((e) => {
        e.classList.add("hidden");
    })
}

if (!localStorage.getItem('visitedBefore')) {
    showInfoModal();
    localStorage.setItem('visitedBefore', true);
}

function xyToPos(x, y) {
    return (x + 9).toString(36) + y
}

function PosToxy(pos) {
    if (pos == "uninit") { return [0, 0] }
    return [pos.charCodeAt(0) - 96, parseInt(pos[1])];
}

function toggleChess() {
    side.classList.toggle("mob-hidden")
    game.classList.toggle("mob-hidden")
}

function showWin(color) {
    document.querySelectorAll(".board .piece").forEach((e) => {
        e.onclick = null;
    })
    showDialogue("Wohoo!", (color == "black" ? "Black" : "White") + " Won!");
    hideAllMotion();
}

function createPiece(type, position) {
    type = type.toLowerCase()
    position = position.toLowerCase()
    let p = document.createElement("span");
    p.classList.add("piece");
    p.setAttribute("type", type);
    p.setAttribute("position", position);
    p.onclick = () => { if (!jump && (type == "bear" || type.substring(0, 5) == (whiteTurn ? "white" : "black") && board.getAttribute("player") == (whiteTurn ? "white" : "black"))) { hideAllMotion(); calculateMotion(p.getAttribute("type"), p.getAttribute("position")).forEach((e) => { showMotion(p.getAttribute("type"), p.getAttribute("position"), e) }) } };
    board.appendChild(p);
}

function resetBoard() {
    document.querySelectorAll(".board .piece").forEach((e) => {
        board.removeChild(e)
    })
    board.removeAttribute("player")
    btns[0].innerText = "Play";
    btns[0].onclick = () => { showPlayOptions() };
    /*btns[0].innerText = "Pass & Play";
    btns[0].onclick = () => { passandplay = true; startgame() };*/
    btns[1].innerText = "Info";
    btns[1].onclick = () => { showInfoModal(); };
    currentPlayer.classList.add("hidden")
    hideAllMotion();
}


function calculateJump(position, color, tempboard = getBoard(), possible = []) {
    delete tempboard[position];
    const [x, y] = PosToxy(position);
    for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {
            if (!(i || j)) {
                if (!possible.includes(position)) {
                    possible.push(position);
                }
                continue;
            }
            const [newX, newY] = [x + i, y + j];
            if (newX < 1 || newY < 1 || newX > 8 || newY > 8) {
                continue;
            }
            const newPosition = xyToPos(newX, newY);
            const piece = tempboard[newPosition];
            if (piece) {
                const [jumpX, jumpY] = [x + 2 * i, y + 2 * j];
                if (jumpX < 1 || jumpY < 1 || jumpX > 8 || jumpY > 8) {
                    continue;
                }
                const jumpPosition = xyToPos(jumpX, jumpY);
                const jumpPiece = tempboard[jumpPosition];
                if (!jumpPiece && !possible.includes(jumpPosition)) {
                    possible.push(jumpPosition);
                    calculateJump(jumpPosition, color, tempboard, possible);
                } else if (jumpPiece && jumpPiece.substring(0, 5) !== color && !possible.includes(jumpPosition)) {
                    possible.push(jumpPosition);
                }
            }
        }
    }
    if (possible.length == 1) {
        possible = [];
    }
    return possible;
}

function calculateMotion(type, position, AI = false, tempboard = getBoard(), prevTake = otherTake, didJump = jump) {
    type = type.toLowerCase()
    color = "";
    if (type != "bear") {
        color = type.substring(0, 5)
        type = type.substring(5)
    }
    position = position.toLowerCase()
    possible = [];
    [x, y] = PosToxy(position);
    if (type == "bear") {
        if (position == "uninit") {
            for (const p of ["e4", "e5", "d4", "d5"]) {
                if (!tempboard[p]) {
                    possible.push(p)
                }
            }
        } else {
            for (i = -1; i < 2; i++) {
                for (j = -1; j < 2; j++) {
                    if (i == 0 && j == 0) { continue; }
                    [nX, nY] = [x + i, y + j];
                    if (nX > 0 && nY > 0 && nX < 9 && nY < 9 && !tempboard[xyToPos(nX, nY)]) {
                        possible.push(xyToPos(nX, nY));
                    }
                }
            }
        }
    }
    if (type == "monkey") {
        for (i = -1; i < 2; i++) {
            for (j = -1; j < 2; j++) {
                if (i == 0 && j == 0) { continue; }
                [nX, nY] = [x + i, y + j];
                if (nX > 0 && nY > 0 && nX < 9 && nY < 9) {
                    if (tempboard[xyToPos(nX, nY)]) {
                        [nX, nY] = [x + 2 * i, y + 2 * j];
                        if (nX > 0 && nY > 0 && nX < 9 && nY < 9) {
                            q = tempboard[xyToPos(nX, nY)]
                            if (!AI && (!q || q.substring(0, 5) != color)) {
                                possible.push(xyToPos(nX, nY));
                            }
                        }
                    } else if (!didJump) {
                        possible.push(xyToPos(nX, nY));
                    }
                }
            }
        }
        if (AI) {
            calculateJump(position, color, tempboard, possible);
        }
        if (didJump) {
            if (!document.querySelector(".piece[type='" + color + "king'][position='" + position + "']")) {
                possible.push(position)
            }
        }
        if (!didJump) {
            npos = false;
            if (position == "a4" && tempboard["blackjail2"] && tempboard["blackjail2"] == color + "bananaking") {
                npos = "blackjail2";
            }
            if (position == "a5" && tempboard["blackjail1"] && tempboard["blackjail1"] == color + "bananaking") {
                npos = "blackjail1";
            }
            if (position == "h4" && tempboard["whitejail2"] && tempboard["whitejail2"] == color + "bananaking") {
                npos = "whitejail2";
            }
            if (position == "h5" && tempboard["whitejail1"] && tempboard["whitejail1"] == color + "bananaking") {
                npos = "whitejail1";
            }
            if (npos) {
                for (i = -1; i < 2; i++) {
                    for (j = -1; j < 2; j++) {
                        if (i == 0 && j == 0) { continue; }
                        [nX, nY] = [x + i, y + j];
                        if (nX > 0 && nY > 0 && nX < 9 && nY < 9) {
                            if (tempboard[xyToPos(nX, nY)]) {
                                [nX, nY] = [x + 2 * i, y + 2 * j];
                                if (nX > 0 && nY > 0 && nX < 9 && nY < 9) {
                                    q = tempboard[xyToPos(nX, nY)]
                                    if (!q || q.substring(0, 5) != color) {
                                        if (AI) {
                                            possible.push(npos + xyToPos(nX, nY));
                                        } else {
                                            possible.push(npos);
                                        }

                                    }
                                }
                                break;
                            }
                        }
                    }
                }
            }
        }
    }
    if (type == "fish") {
        for (i = -1; i < 2; i++) {
            for (j = (color == "black" ? -1 : 0); j < (color == "black" ? 1 : 2); j++) {
                [nX, nY] = [x + i, y + j];
                if (nX > 0 && nY > 0 && nX < 9 && nY < 9) {
                    q = tempboard[xyToPos(nX, nY)]
                    if (!q || (i != 0 && j != 0 && q.substring(0, 5) != color)) {
                        possible.push(xyToPos(nX, nY));
                    }
                }
            }
        }
    }
    if (type.includes("king")) {
        for (i = -1; i < 2; i++) {
            for (j = -1; j < 2; j++) {
                if (i == 0 && j == 0) { continue; }
                [nX, nY] = [x + i, y + j];
                if (nX > 0 && nY > 0 && nX < 9 && nY < 9) {
                    q = tempboard[xyToPos(nX, nY)]
                    if (!q || q.substring(0, 5) != color) {
                        possible.push(xyToPos(nX, nY));
                    }
                }
            }
        }
    }
    if (type.includes("queen")) {
        for (i = -1; i < 2; i++) {
            for (j = -1; j < 2; j++) {
                if (i == 0 && j == 0) { continue; }
                m = 1;
                do {
                    [nX, nY] = [x + m * i, y + m * j];
                    if (nX > 0 && nY > 0 && nX < 9 && nY < 9) {
                        q = tempboard[xyToPos(nX, nY)]
                        if (!q || q.substring(0, 5) != color) {
                            possible.push(xyToPos(nX, nY));
                        }
                        if (q) {
                            break;
                        }
                    }
                    m++;
                } while (nX > 0 && nY > 0 && nX < 9 && nY < 9);
            }
        }
    }
    if (type == "elephant") {
        for (i = -1; i < 2; i += 2) {
            for (j = -1; j < 2; j += 2) {
                [nX, nY] = [x + i, y + j];
                if (!tempboard[xyToPos(nX, nY)]) {
                    [nX, nY] = [x + 2 * i, y + 2 * j];
                    if (nX > 0 && nY > 0 && nX < 9 && nY < 9) {
                        q = tempboard[xyToPos(nX, nY)]
                        if (!q || q.substring(0, 5) != color) {
                            possible.push(xyToPos(nX, nY));
                        }
                    }
                }
            }
        }
    }
    if (type == "rook") {
        for (i = 1; i < 9; i++) {
            for (j = 1; j < 9; j++) {
                q = tempboard[xyToPos(i, j)]
                if (!q) {
                    possible.push(xyToPos(i, j));
                }
            }
        }
        if (prevTake) {
            a = [[1, 0], [0, 1], [-1, 0], [0, -1]]
            for (i = 0; i < a.length; i++) {
                [nX, nY] = [x + a[i][0], y + a[i][1]];
                if (nX > 0 && nY > 0 && nX < 9 && nY < 9) {
                    q = tempboard[xyToPos(nX, nY)]
                    if (q && q.substring(0, 5) != color) {
                        possible.push(xyToPos(nX, nY));
                    }
                }
            }
        }
    }
    return possible;
}

function initBoardMovement() {
    document.querySelectorAll(".board .motion").forEach((e) => {
        board.removeChild(e)
    })
    for (i = 1; i < 9; i++) {
        for (j = 1; j < 9; j++) {
            p = document.createElement("span");
            p.classList.add("motion")
            p.setAttribute("position", xyToPos(i, j));
            p.classList.add("hidden");
            board.appendChild(p);
        }
    }
    x = ["whitejail1", "whitejail2", "blackjail1", "blackjail2"];
    for (i = 0; i < x.length; i++) {
        p = document.createElement("span");
        p.classList.add("motion");
        p.setAttribute("position", x[i]);
        p.classList.add("hidden");
        board.appendChild(p);
    }
}

function hideAllMotion() {
    document.querySelectorAll(".board .motion").forEach((e) => {
        e.classList.add("hidden");
        e.onclick = null;
    })
}

function showMotion(type, prevPos, position, stopJumps = false) {
    type = type.toLowerCase()
    prevPos = prevPos.toLowerCase()
    position = position.toLowerCase()
    p = document.querySelector(".board .motion[position='" + position + "']")
    if (!p) { return false }
    p.classList.remove("hidden");
    p.onclick = () => { movePiece(type, prevPos, position, stopJumps) };
    return true;
}

function movePiece(type, prevPos, newPos, stopJumps = false, AI = false) {
    hideAllMotion()
    let endgame = false;
    askJail = false;
    type = type.toLowerCase()
    prevPos = prevPos.toLowerCase()
    newPos = newPos.toLowerCase()
    piece = document.querySelector(".piece[type='" + type + "'][position='" + prevPos + "']")
    if (!piece) {
        return false;
    }
    document.querySelectorAll(".piece[position='" + newPos + "']").forEach((e) => {
        if (e != piece && !e.getAttribute("position").includes("jail")) {
            if (e.getAttribute("type") == "bear") {
                bearTake = true;
            } else {
                bearTake = false;
            }
            if (e.getAttribute("type").includes("king") || e.getAttribute("type").substring(5) == "queen") {
                askJail = true;
                if (document.querySelector(".piece[position='" + type.substring(0, 5) + "jail1" + "']")) {
                    e.setAttribute("position", type.substring(0, 5) + "jail2")
                    showWin(type.substring(0, 5));
                    selfTake = true;
                    endgame = true;
                }
                else if (document.querySelector(".piece[position='" + type.substring(0, 5) + "jail2" + "']")) {
                    e.setAttribute("position", type.substring(0, 5) + "jail1")
                    showWin(type.substring(0, 5));
                    selfTake = true;
                    endgame = true;
                }
                else if (AI) {
                    askJail = false;
                    e.setAttribute("position", type.substring(0, 5) + "jail" + (Math.floor(Math.random() * 2) + 1));
                } else {
                    showMotion(e.getAttribute("type"), newPos, type.substring(0, 5) + "jail1");
                    showMotion(e.getAttribute("type"), newPos, type.substring(0, 5) + "jail2");
                }
            } else {
                board.removeChild(e)
            }
            selfTake = true;
        }
    });
    piece.setAttribute("position", newPos);
    if (type == "whitemonkey" || type == "blackmonkey") {
        if (newPos.includes("jail")) {
            newPos = newPos.substring(0, 10);
            k = document.querySelector(".piece[position='" + newPos + "'][type='" + type.substring(0, 5) + "bananaking']")
            k.setAttribute("type", type.substring(0, 5) + "king")
            outsquares = { "blackjail1": "a5", "blackjail2": "a4", "whitejail1": "h5", "whitejail2": "h4" }
            k.setAttribute("position", outsquares[newPos])
            piece.setAttribute("position", outsquares[newPos])
            jump = true;
            calculateMotion(type, outsquares[newPos]).forEach((e) => { showMotion(type, outsquares[newPos], e, true) });
            return true;
        }
        [pX, pY] = PosToxy(prevPos);
        [nX, nY] = PosToxy(newPos);
        if (((nX - pX) ** 2 > 1 || (nY - pY) ** 2 > 1) && !selfTake && !stopJumps) {
            jump = true;
            if (!AI) {
                calculateMotion(type, newPos).forEach((e) => { showMotion(type, newPos, e) });
                return true;
            }
            return false;
        }
    }
    if ((type == "blackfish" && newPos[1] == "1") || (type == "whitefish" && newPos[1] == "8")) {
        piece.setAttribute("type", type + "queen");
    }
    if (askJail) {
        jump = true;
        return true;
    }
    jump = false;
    otherTake = bearTake ? false : selfTake;
    selfTake = false;
    whiteTurn = !whiteTurn;
    currentPlayer.classList.add(whiteTurn ? "white" : "black");
    currentPlayer.classList.remove(whiteTurn ? "black" : "white");
    if (endgame) {
        return true;
    }
    if (passandplay) {
        board.setAttribute("player", whiteTurn ? "white" : "black");
    } else if (!AI) {
        AITakeMinimaxTurn();
    }
    return true;
}

resetBoard()

function startgame(online) {
    game.classList.remove("mob-hidden");
    side.classList.add("mob-hidden");
    initBoardMovement();
    resetBoard()
    currentPlayer.classList.remove("hidden")
    currentPlayer.classList.add("white")
    currentPlayer.classList.remove("black")
    whiteTurn = true;
    selfTake = false;
    otherTake = false;
    bearTake = false;
    askJail = false;
    jump = false;
    if (online) {
        btns[0].innerText = "Offer Draw";
        btns[0].onclick = () => { showDialogue("Error", "Feature Not Implemented") };
        btns[1].innerText = "Resign";
        btns[1].onclick = () => { showDialogue("Error", "Feature Not Implemented") };
    } else {
        btns[0].innerText = "Restart";
        btns[0].onclick = () => { startgame(false); };
        btns[1].innerText = "Home Page";
        btns[1].onclick = resetBoard;
    }
    createPiece("bear", "uninit")
    createPiece("whiterook", "a1")
    createPiece("whitefish", "a2")
    createPiece("whitemonkey", "b1")
    createPiece("whitefish", "b2")
    createPiece("whitefish", "c1")
    createPiece("whiteelephant", "c2")
    createPiece("whitequeen", "d1")
    createPiece("whitefish", "d2")
    createPiece("whitebananaking", "e1")
    createPiece("whitefish", "e2")
    createPiece("whitefish", "f1")
    createPiece("whiteelephant", "f2")
    createPiece("whitemonkey", "g1")
    createPiece("whitefish", "g2")
    createPiece("whiterook", "h1")
    createPiece("whitefish", "h2")

    createPiece("blackrook", "a8")
    createPiece("blackfish", "a7")
    createPiece("blackmonkey", "b8")
    createPiece("blackfish", "b7")
    createPiece("blackfish", "c8")
    createPiece("blackelephant", "c7")
    createPiece("blackqueen", "d8")
    createPiece("blackfish", "d7")
    createPiece("blackbananaking", "e8")
    createPiece("blackfish", "e7")
    createPiece("blackfish", "f8")
    createPiece("blackelephant", "f7")
    createPiece("blackmonkey", "g8")
    createPiece("blackfish", "g7")
    createPiece("blackrook", "h8")
    createPiece("blackfish", "h7")

    if (passandplay) {
        board.setAttribute("player", "white");
        currentPlayer.innerText = "Current Player";
    } else {
        let Sc = ["white", "black"][Math.floor(Math.random() * 2)]
        board.setAttribute("player", Sc);
        currentPlayer.innerText = "Your Move";
        gameAI = new AI(3, Sc == "white" ? "black" : "white", getBoard());
        if (Sc == "black") {
            AITakeMinimaxTurn();
            currentPlayer.classList.add("white");
            currentPlayer.classList.remove("black");
        }
    }
}