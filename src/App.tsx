import React from "react";
import { useImmerReducer } from "use-immer";

import "./App.css";

const frameNumbers = ["", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
interface Frame {
  rollNumber: number;
  total: number;
  firstRoll: number;
  secondRoll: number;
  currentPinsDown: number;
  strike: boolean;
  spare: boolean;
}

const frameInitialState: Frame = {
  rollNumber: 1,
  total: 0,
  firstRoll: 0,
  secondRoll: 0,
  currentPinsDown: 0,
  strike: false,
  spare: false,
};

const framesInitialState = Array(10).fill({ ...frameInitialState });

interface Player {
  playerNumber: number | null;
  score: number;
  frames: Frame[];
}

const playerInitialState: Player = {
  playerNumber: null,
  score: 0,
  frames: [...framesInitialState],
};

interface Game {
  players: Player[];
  currentPlayer: Player;
  currentFrameNumber: number;
  winner: string;
}

const gameInitialState: Game = {
  players: [],
  currentPlayer: {
    playerNumber: null,
    score: 0,
    frames: [],
  },
  winner: "",
  currentFrameNumber: 1,
};

type GameActionType =
  | "addPlayer"
  | "recordStrike"
  | "recordSpare"
  | "addToScore"
  | "callWinner"
  | "nextFrame"
  | "nextPlayer"
  | "nextRoll"
  | "addFirstPlayer"
  | "addToStrike"
  | "addToSpare";
interface GameAction {
  type: GameActionType;
  pinsDown?: number;
  playerNumber?: number;
  spareIndex?: number;
  strikeIndex?: number;
}

const gameReducer = (state: Game, action: GameAction) => {
  switch (action.type) {
    case "addPlayer":
      {
        state.players.push({
          ...playerInitialState,
          playerNumber: state.players.length + 1,
        });
      }
      break;
    case "recordStrike":
      {
        console.log("STRIKE", action);
        let currentFrame =
          state.players[action.playerNumber! - 1].frames[
            state.currentFrameNumber
          ];
        currentFrame.firstRoll = 10;
        currentFrame.total = 10;
        currentFrame.rollNumber = 2;
      }
      break;
    case "recordSpare":
      {
        console.log("SPARE", action);
        if (!action.playerNumber) {
          return console.log("player Number not recieved. CASE: recordSpare");
        }
        let currentFrame =
          state.players[(action.playerNumber! - 1) as number].frames[
            state.currentFrameNumber
          ];
        currentFrame.total = 10;
        currentFrame.rollNumber = 2;
      }
      break;
    case "addToScore":
      {
        if (!action.playerNumber) {
          return console.log("player Number not recieved. CASE: addToScore");
        }
        let currentFrame =
          state.players[action.playerNumber! - 1].frames[
            state.currentFrameNumber - 1
          ];
        console.log("currentFrame", currentFrame);
        if (currentFrame.rollNumber === 1) {
          currentFrame.firstRoll = action.pinsDown!;
          currentFrame.total = action.pinsDown!;
        } else if (currentFrame.rollNumber === 2) {
          currentFrame.secondRoll = currentFrame.firstRoll + action.pinsDown!;
          currentFrame.total = currentFrame.firstRoll + action.pinsDown!;
        }
      }
      break;
    case "callWinner":
      {
        state.winner = `Player ${action.playerNumber}`;
      }
      break;
    case "nextFrame":
      {
        let currentPlayer = state.players[action.playerNumber! - 1];
        let currentFrame = currentPlayer.frames[state.currentFrameNumber - 1];
        let previousFrameTotal = 0;

        if (state.currentFrameNumber >= 2)
          previousFrameTotal =
            currentPlayer.frames[state.currentFrameNumber - 2].total;

        currentFrame.total =
          previousFrameTotal + currentFrame.firstRoll + currentFrame.secondRoll;

        state.currentFrameNumber++;
      }
      break;
    case "nextPlayer":
      {
        if (!action.playerNumber) {
          return console.log("player Number not recieved. CASE: nextPlayer");
        }

        let isLastInLine = action.playerNumber === state.players.length - 1;
        if (isLastInLine) state.currentPlayer = state.players[0];
        else state.currentPlayer = state.players[action.playerNumber++];
      }
      break;
    case "nextRoll":
      {
        let currentFrame =
          state.players[(action.playerNumber! - 1) as number].frames[
            state.currentFrameNumber - 1
          ];
        currentFrame.rollNumber++;
      }
      break;
    case "addFirstPlayer":
      {
        console.log("state", state);
        state.players.push({
          ...playerInitialState,
          playerNumber: state.players.length + 1,
        });

        state.currentPlayer = state.players[0];
      }
      break;
    case "addToStrike":
      {
        let currentFrame =
          state.players[state.currentPlayer.playerNumber as number].frames[
            action.strikeIndex as number
          ];
        currentFrame.total += action.pinsDown!;
        if (currentFrame.rollNumber === 1)
          currentFrame.firstRoll = action.pinsDown!;
        else if (currentFrame.rollNumber === 2)
          currentFrame.secondRoll = action.pinsDown!;
      }
      break;
    case "addToStrike": {
      state.players[state.currentPlayer.playerNumber as number].frames[
        action.spareIndex as number
      ].total += action.pinsDown!;
      state.players[state.currentPlayer.playerNumber as number].frames[
        state.currentFrameNumber
      ].firstRoll = action.pinsDown!;
    }
  }
};

function App() {
  const [game, gameDispatch] = useImmerReducer(gameReducer, gameInitialState);

  const getMinOfRange = (currentPins: number) => 10 - currentPins;

  const calculateWinner = (): number => {
    let winnerScore = 0;
    let winner = -1;
    game.players.forEach((player) => {
      if (player.score > winnerScore) winner = player.playerNumber as number;
    });

    return winner;
  };

  const roll = (min: number, max: number): number => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min);
  };

  const getPreviousStrikes = (): number => {
    if (game.currentFrameNumber === 1) return -1;

    if (game.currentPlayer.frames[game.currentFrameNumber - 1].strike)
      return game.currentFrameNumber - 1;
    else if (
      game.currentPlayer.frames[game.currentFrameNumber - 2].strike &&
      game.currentPlayer.frames.length >= 2
    )
      return game.currentFrameNumber - 2;
    else return -1;
  };

  const getPreviousSpares = (): number => {
    if (game.currentPlayer.frames.length < 1) return -1;

    if (game.currentPlayer.frames[game.currentFrameNumber - 1].spare)
      return game.currentFrameNumber - 1;
    else return -1;
  };

  const handleAddPlayer = () => {
    if (game.players.length === 0) gameDispatch({ type: "addFirstPlayer" });
    else gameDispatch({ type: "addPlayer" });
  };

  const handleRoll = () => {
    if (game.currentFrameNumber > 9) return;

    let currentFrame =
      game.players[game.currentPlayer.playerNumber! - 1].frames[
        game.currentFrameNumber - 1
      ];
    if (currentFrame.rollNumber > 2) return;

    const strikeIndex = getPreviousStrikes();
    const spareIndex = getPreviousSpares();

    let min = 0;

    if (currentFrame.total > 0) min = getMinOfRange(currentFrame.total);

    const pinsDown = roll(min, 10);

    if (pinsDown === 10 && currentFrame.rollNumber === 1)
      gameDispatch({
        type: "recordStrike",
        playerNumber: game.currentPlayer.playerNumber as number,
        pinsDown,
      });
    else if (pinsDown === 10 && currentFrame.rollNumber === 2)
      gameDispatch({
        type: "recordSpare",
        playerNumber: game.currentPlayer.playerNumber as number,
        pinsDown,
      });
    else if (strikeIndex !== -1)
      gameDispatch({ type: "addToStrike", strikeIndex, pinsDown });
    else if (spareIndex !== -1)
      gameDispatch({ type: "addToSpare", spareIndex, pinsDown });
    else
      gameDispatch({
        type: "addToScore",
        playerNumber: game.currentPlayer.playerNumber as number,
        pinsDown,
      });

    let isLastPlayer = game.currentPlayer.playerNumber === game.players.length;

    if (
      currentFrame.rollNumber === 2 &&
      isLastPlayer &&
      game.currentFrameNumber === 10
    ) {
      let winnerNumber = calculateWinner();
      return gameDispatch({ type: "callWinner", playerNumber: winnerNumber });
    } else if (currentFrame.rollNumber === 2 && isLastPlayer)
      return gameDispatch({
        type: "nextFrame",
        playerNumber: game.currentPlayer.playerNumber as number,
      });
    else if (currentFrame.rollNumber === 2)
      return gameDispatch({
        type: "nextPlayer",
        playerNumber: game.currentPlayer.playerNumber as number,
      });

    gameDispatch({
      type: "nextRoll",
      playerNumber: game.currentPlayer.playerNumber as number,
    });
  };

  return (
    <div>
      <h1>Bowling Time</h1>
      <button onClick={handleAddPlayer}>Add player</button>

      <button onClick={handleRoll}>Roll</button>

      <table>
        {game.players.length > 0 && (
          <tr>
            {frameNumbers.map((frameNumber) => (
              <th>{frameNumber}</th>
            ))}
          </tr>
        )}
        <tbody>
          {game.players.map(({ playerNumber, frames }) => (
            <tr>
              <p>{`Player ${playerNumber}`}</p>
              {frames.map((frame) => (
                <td>
                  <p>{`First Roll ${frame.firstRoll}`}</p>
                  <p>{`Second Roll ${frame.secondRoll}`}</p>
                  <p>{`Total ${frame.total}`}</p>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
