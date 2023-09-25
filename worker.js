importScripts('ai.js');

self.addEventListener('message', (event) => {
    const data = event.data;
    const gameAI = new AI(data.gameAI.depth,data.gameAI.color,data.gameAI.board)
    const result = gameAI.playMinimaxTurn(gameAI.board, data.otherTake);
    self.postMessage(result);
});