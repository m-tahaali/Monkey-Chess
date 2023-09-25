class AI {
    // Depth is an Integer Which Determines the number of moves AI looks forward
    // Color is the current Robot move that AI is playing as
    constructor(depth, color, board) {
        this.depth = depth
        this.color = color
        this.multiplier = color == "black" ? -1 : 1;
        this.board = board
        console.log(this.depth)
    }

    xyToPos(x, y) {
        return (x + 9).toString(36) + y
    }
    
    PosToxy(pos) {
        if (pos == "uninit") { return [0, 0] }
        return [pos.charCodeAt(0) - 96, parseInt(pos[1])];
    }

    calculateJump(position, color, tempboard = getBoard(), possible = []) {
        delete tempboard[position];
        const [x, y] = this.PosToxy(position);
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
                const newPosition = this.xyToPos(newX, newY);
                const piece = tempboard[newPosition];
                if (piece) {
                    const [jumpX, jumpY] = [x + 2 * i, y + 2 * j];
                    if (jumpX < 1 || jumpY < 1 || jumpX > 8 || jumpY > 8) {
                        continue;
                    }
                    const jumpPosition = this.xyToPos(jumpX, jumpY);
                    const jumpPiece = tempboard[jumpPosition];
                    if (!jumpPiece && !possible.includes(jumpPosition)) {
                        possible.push(jumpPosition);
                        this.calculateJump(jumpPosition, color, tempboard, possible);
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

    calculateMotion(type, position, AI = false, tempboard = this.board, prevTake = otherTake, didJump = false) {
        type = type.toLowerCase()
        let color = "";
        if (type != "bear") {
            color = type.substring(0, 5)
            type = type.substring(5)
        }
        position = position.toLowerCase()
        let possible = [];
        let [x, y] = this.PosToxy(position);
        let nX, nY, q, i, j, m, a;
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
                        [nX,nY] = [x + i, y + j];
                        if (nX > 0 && nY > 0 && nX < 9 && nY < 9 && !tempboard[this.xyToPos(nX, nY)]) {
                            possible.push(this.xyToPos(nX, nY));
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
                        if (tempboard[this.xyToPos(nX, nY)]) {
                            [nX, nY] = [x + 2 * i, y + 2 * j];
                            if (nX > 0 && nY > 0 && nX < 9 && nY < 9) {
                                q = tempboard[this.xyToPos(nX, nY)]
                                if (!AI && (!q || q.substring(0, 5) != color)) {
                                    possible.push(this.xyToPos(nX, nY));
                                }
                            }
                        } else if (!didJump) {
                            possible.push(this.xyToPos(nX, nY));
                        }
                    }
                }
            }
            if (AI) {
                this.calculateJump(position, color, tempboard, possible);
            }
            if (!didJump) {
                let npos = false;
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
                                if (tempboard[this.xyToPos(nX, nY)]) {
                                    [nX, nY] = [x + 2 * i, y + 2 * j];
                                    if (nX > 0 && nY > 0 && nX < 9 && nY < 9) {
                                        q = tempboard[this.xyToPos(nX, nY)]
                                        if (!q || q.substring(0, 5) != color) {
                                            if (AI) {
                                                possible.push(npos + this.xyToPos(nX, nY));
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
                        q = tempboard[this.xyToPos(nX, nY)]
                        if (!q || (i != 0 && j != 0 && q.substring(0, 5) != color)) {
                            possible.push(this.xyToPos(nX, nY));
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
                        q = tempboard[this.xyToPos(nX, nY)]
                        if (!q || q.substring(0, 5) != color) {
                            possible.push(this.xyToPos(nX, nY));
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
                            q = tempboard[this.xyToPos(nX, nY)]
                            if (!q || q.substring(0, 5) != color) {
                                possible.push(this.xyToPos(nX, nY));
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
                    if (!tempboard[this.xyToPos(nX, nY)]) {
                        [nX, nY] = [x + 2 * i, y + 2 * j];
                        if (nX > 0 && nY > 0 && nX < 9 && nY < 9) {
                            q = tempboard[this.xyToPos(nX, nY)]
                            if (!q || q.substring(0, 5) != color) {
                                possible.push(this.xyToPos(nX, nY));
                            }
                        }
                    }
                }
            }
        }
        if (type == "rook") {
            for (i = 1; i < 9; i++) {
                for (j = 1; j < 9; j++) {
                    q = tempboard[this.xyToPos(i, j)]
                    if (!q) {
                        possible.push(this.xyToPos(i, j));
                    }
                }
            }
            if (prevTake) {
                a = [[1, 0], [0, 1], [-1, 0], [0, -1]]
                for (i = 0; i < a.length; i++) {
                    [nX, nY] = [x + a[i][0], y + a[i][1]];
                    if (nX > 0 && nY > 0 && nX < 9 && nY < 9) {
                        q = tempboard[this.xyToPos(nX, nY)]
                        if (q && q.substring(0, 5) != color) {
                            possible.push(this.xyToPos(nX, nY));
                        }
                    }
                }
            }
        }
        return possible;
    }

    get relativeStrengths() {
        return {
            "bear": 0,
            "whitequeen": 90,
            "blackqueen": -90,
            "whitebananaking": 60,
            "blackbananaking": -60,
            "whiteking": 50,
            "blackking": -50,
            "whitefishqueen": 50,
            "blackfishqueen": -50,
            "whitemonkey": 30,
            "blackmonkey": -30,
            "whiteelephant": 20,
            "blackelephant": -20,
            "whiterook": 20,
            "blackrook": -20,
            "whitefish": 20,
            "blackfish": -20,
        }
    }

    analyzeBoard(board = this.board) {
        let shift = 0;
        if (board["blackjail2"] && board["blackjail1"]) {
            return -999;
        }
        if (board["whitejail2"] && board["whitejail1"]) {
            return 999;
        }
        for (const [pos, type] of Object.entries(board)) {
            if (!type) { continue; }
            if (!pos.includes("jail")) {
                shift += this.relativeStrengths[type];
            }
            if (type.substring(5) == "fish") {
                shift += Math.abs(parseInt(pos[1]) - (type.substring(0, 5) == "white" ? 1 : 8)) * 3
            }
        }
        return shift;
    }

    minimax(depth, board, otherTake, alpha, beta, isMaximizingPlayer) {
        if (depth === 0) {
            return this.analyzeBoard(board);
        }
        let moves = this.getAllMoves(board, otherTake, (isMaximizingPlayer ? "white" : "black"));

        if (isMaximizingPlayer) {
            let maxEval = -Infinity;
            for (let i = 0; i < moves.length; i++) {
                let move = moves[i];
                let [act, newBoard] = this.simulatemove(move[0], move[1], move[2], board);
                let posEval = this.minimax(depth - 1, newBoard, act == "take", alpha, beta, false);
                maxEval = Math.max(maxEval, posEval);
                alpha = Math.max(alpha, posEval);
                if (beta <= alpha) {
                    break;
                }
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (let i = 0; i < moves.length; i++) {
                let move = moves[i];
                let [act, newBoard] = this.simulatemove(move[0], move[1], move[2], board);
                let posEval = this.minimax(depth - 1, newBoard, act == "take", alpha, beta, true);
                minEval = Math.min(minEval, posEval);
                beta = Math.min(beta, posEval);
                if (beta <= alpha) {
                    break;
                }
            }
            return minEval;
        }
    }

    alphaBetaPruning(depth, board, otherTake, alpha, beta, isMaximizingPlayer) {
        let moves = this.getAllMoves(board, otherTake, (isMaximizingPlayer ? "white" : "black"));
        let bestMove;

        if (isMaximizingPlayer) {
            let maxEval = -Infinity;
            for (let i = 0; i < moves.length; i++) {
                let move = moves[i];
                let [act, newBoard] = this.simulatemove(move[0], move[1], move[2], board);
                let posEval = this.minimax(depth - 1, newBoard, act == "take", alpha, beta, false);
                if (posEval > maxEval) {
                    maxEval = posEval;
                    bestMove = move;
                }
                alpha = Math.max(alpha, posEval);
                if (beta <= alpha) {
                    break;
                }
            }
            return [maxEval, bestMove];
        } else {
            let minEval = Infinity;
            for (let i = 0; i < moves.length; i++) {
                let move = moves[i];
                let [act, newBoard] = this.simulatemove(move[0], move[1], move[2], board);
                let posEval = this.minimax(depth - 1, newBoard, act == "take", alpha, beta, true);
                if (posEval < minEval) {
                    minEval = posEval;
                    bestMove = move;
                }
                beta = Math.min(beta, posEval);
                if (beta <= alpha) {
                    break;
                }
            }
            return [minEval, bestMove];
        }
    }

    findBestMove(color, otherTake, depth = this.depth, board = this.board) {
        return this.alphaBetaPruning(depth, board, otherTake, -Infinity, Infinity, color == "white")
    }

    simulatemove(type, prevPos, newPos, board = this.board) {
        board = { ...board };
        let color = "gray"
        let act = "move"
        type = type.toLowerCase()
        if (type != "bear") {
            color = type.substring(0, 5)
            type = type.substring(5)
        }
        prevPos = prevPos.toLowerCase()
        newPos = newPos.toLowerCase()
        if (type == "monkey" && prevPos == newPos) {
            return ["move", board]
        }
        if (board[newPos] && board[newPos] != "bear" && !board[newPos].includes(color)) {
            act = "take";
        }
        if (board[newPos] && (board[newPos].includes("king") || board[newPos].includes("queen")) && !board[newPos].includes("fish") && !board[newPos].includes(color)) {
            if (board[color + "jail1"]) {
                board[color + "jail2"] = board[newPos];
                board[newPos] = board[prevPos];
                delete board[prevPos];
                return ["win", board];
            }
            if (board[color + "jail2"]) {
                board[color + "jail1"] = board[newPos];
                board[newPos] = board[prevPos];
                delete board[prevPos];
                return ["win", board];
            }
            board[color + "jail" + (Math.floor(Math.random() * 2) + 1)] = board[newPos];
        }
        if (type == "monkey" & newPos.includes("jail")) {
            board[newPos.substring(10)] = board[prevPos];
            board[prevPos] = color + "king";
            delete board[newPos.substring(0, 10)];
        } else {
            board[newPos] = board[prevPos]
            delete board[prevPos]
        }
        if (type == "fish" && (newPos[1] == (color == "black" ? "1" : "8"))) {
            board[newPos] = color + "fishqueen";
        }
        return [act, board]
    }

    getAllPieces(board = this.board, color = this.color) {
        let pieces = [];
        for (const [pos, type] of Object.entries(board)) {
            if (!type) {
                continue;
            }
            if (type == "bear" || type.includes(color)) {
                pieces.push([type, pos])
            }
        }
        return pieces
    }

    getAllMoves(board = this.board, otherTake = false, color = this.color, pieces = this.getAllPieces(board, color)) {
        let moves = [];
        for (let i = 0; i < pieces.length; i++) {
            let possibleMoves = this.calculateMotion(pieces[i][0], pieces[i][1], true, board, otherTake)
            for (let j = 0; j < possibleMoves.length; j++) {
                moves.push([pieces[i][0], pieces[i][1], possibleMoves[j]])
            }
        }
        return moves;
    }

    playRandomTurn(board = this.board, otherTake = false) {
        board = { ...board };
        let act;
        let move = this.getAllMoves(board, otherTake);
        move = move[Math.floor(Math.random() * moves.length)];
        [act, board] = this.simulatemove(move[0], move[1], move[2], board)
        return [act, move, board];
    }

    playEducatedTurn(board = this.board, otherTake = false) {
        board = { ...board };
        let act;
        let moves = this.getAllMoves(board, otherTake);
        let move;
        let shift;
        let tboard;
        for (let i = 0; i < moves.length; i++) {
            let [vact, vboard] = this.simulatemove(moves[i][0], moves[i][1], moves[i][2], board);
            let analysis = this.multiplier * this.analyzeBoard(vboard);
            if (!shift || analysis > shift) {
                shift = analysis;
                act = vact;
                tboard = vboard;
                move = moves[i];
            }
        }
        board = tboard;
        return [act, move, board];
    }

    playMinimaxTurn(board = this.board, otherTake = false) {
        board = { ...board };
        let [posEval, move] = this.findBestMove(this.color, otherTake, this.depth, board);
        console.log(posEval, move);
        let [act, newBoard] = this.simulatemove(move[0], move[1], move[2])
        return [act, move, newBoard];
    }
}