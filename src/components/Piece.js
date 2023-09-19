import React from "react";
import { polyfill } from "mobile-drag-drop";

polyfill({
  dragImageCenterOnTouch: true,
  // force apply is required to skip the drag delay on ipad
  forceApply: true,
});

function PoolLetter({
  pieceID,
  rowIndex,
  colIndex,
  letterInfo,
  dragToken,
  dispatchGameState,
}) {
  let className = "poolLetter";
  if (letterInfo) {
    if (letterInfo.isDragging) {
      className += " dragging";
    }
    if (letterInfo.border.top) {
      className += " borderTop";
    }
    if (letterInfo.border.bottom) {
      className += " borderBottom";
    }
    if (letterInfo.border.left) {
      className += " borderLeft";
    }
    if (letterInfo.border.right) {
      className += " borderRight";
    }
  }

  // closes over dispatchGameState, dragToken, pieceID, rowIndex, colIndex; but note rowIndex and colIndex don't have
  // the same meaning as for board letters.
  const eventHandlers = {
    onDragStart: (event) => {
      dragToken({
        event: event,
        pieceID: pieceID,
        dragArea: "pool",
        relativeTop: rowIndex,
        relativeLeft: colIndex,
      });
    },
    onDragEnd: (event) => {
      // according to the HTML spec, the drop event fires before the dragEnd event
      event.preventDefault();
      dispatchGameState({ action: "dragEnd" });
    },
    onDragEnter: (event) => {
      event.preventDefault();
    },
    onDragOver: (event) => {
      event.preventDefault();
    },
    onDrop: (event) => {
      event.preventDefault();
    },
  };

  return (
    <div
      id={`poolLetter-${pieceID}`}
      className={className}
      draggable="true"
      onDragStart={eventHandlers.onDragStart}
      onDragEnd={eventHandlers.onDragEnd}
      onDragEnter={eventHandlers.onDragEnter}
      onDragOver={eventHandlers.onDragOver}
      onDrop={eventHandlers.onDrop}
    >
      {letterInfo?.letter}
    </div>
  );
}

export function BoardSquare({
  rowIndex,
  colIndex,
  letterInfo,
  gameIsSolved,
  handleBoardDragEnter,
  handleBoardDrop,
  handleTouchStart,
  handleTouchEnd,
  dragToken,
  wasCanceledPrematurely,
  setWasCanceledPrematurely,
  dispatchGameState,
}) {
  let className = "boardLetter";
  if (letterInfo) {
    if (gameIsSolved) {
      className += " filled";
    }
    if (letterInfo.isDragging) {
      className += " dragging";
    }
    if (letterInfo.border.top) {
      className += " borderTop";
    }
    if (letterInfo.border.bottom) {
      className += " borderBottom";
    }
    if (letterInfo.border.left) {
      className += " borderLeft";
    }
    if (letterInfo.border.right) {
      className += " borderRight";
    }
    if (letterInfo.overlapping) {
      className += " overlapping";
    }
  }
  let eventHandlers = {
    onDrop: (event) => {
      event.preventDefault();
      handleBoardDrop({
        event: event,
        rowIndex: rowIndex,
        colIndex: colIndex,
      });
    },
    onDragEnd: (event) => {
      // according to the HTML spec, the drop event fires before the dragEnd event
      event.preventDefault();
      // only call the dispatcher if ios didn't force end the drag prematurely
      // otherwise just reset the state
      if (!wasCanceledPrematurely) {
        dispatchGameState({ action: "dragEnd" });
      } else {
        setWasCanceledPrematurely(false);
      }
    },
    onDragOver: (event) => {
      event.preventDefault();
    },
    onDragEnter: (event) => {
      event.preventDefault();
      handleBoardDragEnter({
        event: event,
        rowIndex: rowIndex,
        colIndex: colIndex,
      });
    },
    onDragStart: (event) => {
      dragToken({
        event: event,
        dragArea: "board",
        pieceID: letterInfo?.pieceID,
        relativeTop: letterInfo?.relativeTop,
        relativeLeft: letterInfo?.relativeLeft,
        boardTop: rowIndex,
        boardLeft: colIndex,
      });
    },
    onPointerDown: () => {
      handleTouchStart(letterInfo?.pieceID);
    },
    onPointerUp: handleTouchEnd,
    onPointerCancel: (event) => {
      // ios cancels the pointer event which then cancels the drag event,
      // so we need to catch that and stop the dispatcher from being called in the drag end handler.
      event.stopPropagation();
      event.preventDefault();
      // stopPropagation and preventDefault don't actually stop this
      // (but I left them in place in hopes that ios will follow standards in the future),
      // so track whether the drag was canceled prematurely via the state
      setWasCanceledPrematurely(true);
    },
    onPointerMove: (event) => {
      event.preventDefault();
    },
    onContextMenu: (event) => {
      event.preventDefault();
    },
  };

  return (
    <div
      className={className}
      draggable
      key={`${rowIndex}-${colIndex}`}
      onDragEnter={eventHandlers.onDragEnter}
      onDragOver={eventHandlers.onDragOver}
      onDrop={eventHandlers.onDrop}
      onDragStart={eventHandlers.onDragStart}
      onPointerDown={eventHandlers.onPointerDown}
      onPointerUp={eventHandlers.onPointerUp}
      onPointerCancel={eventHandlers.onPointerCancel}
      onPointerMove={eventHandlers.onPointerMove}
      onContextMenu={eventHandlers.onContextMenu}
    >
      {letterInfo?.letter}
    </div>
  );
}

export default function Piece({
  letters,
  pieceID,
  handlePoolDragEnter,
  dragToken,
  dropOnPool,
  draggedPieceIDs,
  dispatchGameState,
}) {
  let letterElements = [];
  const isDragging = draggedPieceIDs.includes(pieceID);
  for (let rowIndex = 0; rowIndex < letters.length; rowIndex++) {
    for (let colIndex = 0; colIndex < letters[rowIndex].length; colIndex++) {
      const letterStr = letters[rowIndex][colIndex];
      const letterInfo = letterStr
        ? {
            letter: letterStr,
            border: {
              top: !letters[rowIndex - 1]?.[colIndex],
              bottom: !letters[rowIndex + 1]?.[colIndex],
              left: !letters[rowIndex][colIndex - 1],
              right: !letters[rowIndex][colIndex + 1],
            },
            overlapping: false,
            isDragging,
          }
        : undefined;
      letterElements.push(
        <PoolLetter
          pieceID={pieceID}
          rowIndex={rowIndex}
          colIndex={colIndex}
          letterInfo={letterInfo}
          key={`${pieceID}-${rowIndex}-${colIndex}`}
          dragToken={dragToken}
          dispatchGameState={dispatchGameState}
        />
      );
    }
  }
  return (
    <div
      className="poolPiece"
      id={`poolPiece-${pieceID}`}
      style={{
        "--numRows": `${letters.length}`,
        "--numCols": `${letters[0].length}`,
      }}
      onDragEnter={(event) => {
        handlePoolDragEnter({
          event: event,
          targetPieceID: pieceID,
        });
      }}
      onDragEnd={(event) => {
        event.preventDefault();
      }}
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDrop={(event) => {
        event.preventDefault();
        dropOnPool({ event: event, targetPieceID: pieceID });
      }}
    >
      {letterElements}
    </div>
  );
}
