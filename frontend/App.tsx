import React, { useState, useEffect } from 'react';
import { RefreshCw, User, Cpu, Info, AlertTriangle, Shield, CheckCircle2, History } from 'lucide-react';
import { Player, GameMode, RuleSet, Position } from './types';
import { BOARD_SIZE } from './constants';
import { checkWin, checkForbiddenMove } from './services/gomokuLogic';
import { getAIMove } from './services/geminiService';

// Initialize empty board
const createEmptyBoard = (): Player[][] =>
  Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(Player.None));

const App: React.FC = () => {
  // --- State ---
  const [board, setBoard] = useState<Player[][]>(createEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>(Player.Black);
  const [winner, setWinner] = useState<Player | null>(null);
  const [winningLine, setWinningLine] = useState<Position[] | null>(null);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.PvAI);
  const [ruleSet, setRuleSet] = useState<RuleSet>(RuleSet.Free);
  const [lastMove, setLastMove] = useState<Position | null>(null);
  const [message, setMessage] = useState<string>("黑方先行");
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [forbiddenWarning, setForbiddenWarning] = useState<string | null>(null);

  // --- Effects ---

  // CPU Turn Handler
  useEffect(() => {
    if (
      !isGameOver &&
      gameMode === GameMode.PvAI &&
      currentPlayer === Player.White &&
      !isAiThinking
    ) {
      const makeAiMove = async () => {
        setIsAiThinking(true);
        // setMessage("電腦思考中..."); // Optional: Show thinking text
        try {
          const move = await getAIMove(board, ruleSet);
          
          handleMove(move.row, move.col, true); 
        } catch (error) {
          console.error("CPU Move failed", error);
        } finally {
          setIsAiThinking(false);
        }
      };
      
      makeAiMove();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlayer, isGameOver, gameMode, board]);

  // --- Game Logic ---

  const resetGame = () => {
    setBoard(createEmptyBoard());
    setCurrentPlayer(Player.Black);
    setWinner(null);
    setWinningLine(null);
    setIsGameOver(false);
    setLastMove(null);
    setMessage("黑方先行");
    setForbiddenWarning(null);
    setIsAiThinking(false);
  };

  const handleMove = (row: number, col: number, isAi = false) => {
    if (isGameOver || board[row][col] !== Player.None) return;
    if (isAiThinking && !isAi) return; // Prevent user moving while AI thinks

    const player = currentPlayer;

    // Check Forbidden Move (Only for Black in Forbidden Mode)
    if (ruleSet === RuleSet.Forbidden && player === Player.Black) {
      const forbiddenReason = checkForbiddenMove(board, row, col);
      if (forbiddenReason) {
        setForbiddenWarning(forbiddenReason);
        // Clear warning after 3 seconds
        setTimeout(() => setForbiddenWarning(null), 3000);
        return; 
      }
    }
    setForbiddenWarning(null);

    // Execute Move
    const newBoard = board.map((r) => [...r]);
    newBoard[row][col] = player;
    setBoard(newBoard);
    setLastMove({ row, col });

    // Check Win
    const { won, line } = checkWin(newBoard, { row, col }, player, ruleSet);

    if (won) {
      setWinner(player);
      setWinningLine(line);
      setIsGameOver(true);
      setMessage(`${player === Player.Black ? '黑方' : '白方'} 獲勝！`);
    } else {
      const nextPlayer = player === Player.Black ? Player.White : Player.Black;
      setCurrentPlayer(nextPlayer);
      if (!isGameOver) {
         setMessage(nextPlayer === Player.Black ? "輪到黑方" : "輪到白方");
      }
    }
  };

  // --- Render Helpers ---

  // Generate grid intersections
  const renderCell = (row: number, col: number) => {
    const isBlack = board[row][col] === Player.Black;
    const isWhite = board[row][col] === Player.White;
    const isLastMove = lastMove?.row === row && lastMove?.col === col;
    const isWinningPiece = winningLine?.some((p) => p.row === row && p.col === col);

    // Grid lines logic
    const isTop = row === 0;
    const isBottom = row === BOARD_SIZE - 1;
    const isLeft = col === 0;
    const isRight = col === BOARD_SIZE - 1;
    
    // Center dot (Tengen) and star points
    const isStarPoint = 
      (row === 3 && col === 3) || (row === 3 && col === 11) ||
      (row === 7 && col === 7) ||
      (row === 11 && col === 3) || (row === 11 && col === 11);

    return (
      <div
        key={`${row}-${col}`}
        className="relative w-full h-full flex items-center justify-center cursor-pointer select-none"
        onClick={() => handleMove(row, col)}
      >
        {/* Horizontal Line */}
        <div className={`absolute h-[1px] bg-slate-800 pointer-events-none 
          ${isLeft ? 'w-1/2 right-0' : isRight ? 'w-1/2 left-0' : 'w-full'}`} 
        />
        
        {/* Vertical Line */}
        <div className={`absolute w-[1px] bg-slate-800 pointer-events-none 
          ${isTop ? 'h-1/2 bottom-0' : isBottom ? 'h-1/2 top-0' : 'h-full'}`} 
        />

        {/* Star Point */}
        {isStarPoint && !isBlack && !isWhite && (
          <div className="absolute w-1.5 h-1.5 bg-slate-900 rounded-full pointer-events-none"></div>
        )}

        {/* Pieces */}
        {isBlack && (
          <div className={`w-[85%] h-[85%] rounded-full bg-gradient-to-br from-gray-800 to-black shadow-lg z-10 
            ${isLastMove ? 'ring-2 ring-red-500 ring-offset-1 ring-offset-transparent' : ''}
            ${isWinningPiece ? 'ring-4 ring-green-500 animate-pulse' : ''}
          `}>
             {isLastMove && <div className="w-1.5 h-1.5 bg-red-500 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-80"></div>}
          </div>
        )}
        {isWhite && (
          <div className={`w-[85%] h-[85%] rounded-full bg-gradient-to-br from-white to-gray-200 shadow-lg z-10 border border-gray-300
            ${isLastMove ? 'ring-2 ring-red-500 ring-offset-1 ring-offset-transparent' : ''}
            ${isWinningPiece ? 'ring-4 ring-green-500 animate-pulse' : ''}
          `}>
             {isLastMove && <div className="w-1.5 h-1.5 bg-red-500 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-80"></div>}
          </div>
        )}

        {/* Hover Effect (Preview) */}
        {!isGameOver && !isBlack && !isWhite && !isAiThinking && (
           <div className={`absolute w-[60%] h-[60%] rounded-full opacity-0 hover:opacity-40 transition-opacity z-20 
             ${currentPlayer === Player.Black ? 'bg-black' : 'bg-white'}`}>
           </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col items-center py-6 px-4">
      {/* Header */}
      <header className="mb-6 text-center">
        <h1 className="text-4xl font-bold text-stone-800 mb-2 tracking-wide font-serif">五子棋 (Gomoku)</h1>
        <p className="text-stone-600">Zen Logic Strategy</p>
      </header>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start w-full max-w-6xl justify-center">
        
        {/* Game Board Container */}
        <div className="flex-shrink-0 relative">
          {/* Wood Board Frame */}
          <div className="p-3 bg-[#c7863f] rounded-lg shadow-2xl shadow-stone-500/50 border-b-8 border-r-8 border-[#915f2a]">
             {/* Inner Grid Area */}
            <div 
              className="wood-texture grid w-[90vw] h-[90vw] max-w-[500px] max-h-[500px] sm:max-w-[600px] sm:max-h-[600px] shadow-inner"
              style={{ 
                gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`, 
                gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)` 
              }}
            >
              {Array.from({ length: BOARD_SIZE }).map((_, r) =>
                Array.from({ length: BOARD_SIZE }).map((_, c) => renderCell(r, c))
              )}
            </div>
          </div>

          {/* Alert Toast for Forbidden Move */}
          {forbiddenWarning && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white px-6 py-4 rounded-lg shadow-xl z-50 flex items-center gap-3 animate-bounce">
              <AlertTriangle size={24} />
              <span className="font-bold">{forbiddenWarning}</span>
            </div>
          )}
        </div>

        {/* Sidebar Controls */}
        <div className="w-full lg:w-80 flex flex-col gap-6">
          
          {/* Status Panel */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-stone-200">
            <h2 className="text-xl font-bold text-stone-700 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5" /> 遊戲狀態
            </h2>
            
            <div className="text-center mb-6">
              <div className={`text-2xl font-bold py-2 rounded-lg transition-colors
                ${isGameOver ? 'text-amber-600' : 'text-stone-800'}
              `}>
                {message}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className={`flex flex-col items-center p-3 rounded-lg border-2 
                ${currentPlayer === Player.Black ? 'border-stone-800 bg-stone-100' : 'border-transparent'}
              `}>
                <div className="w-8 h-8 rounded-full bg-black shadow mb-2"></div>
                <span className="font-bold text-stone-800">黑方 (先手)</span>
                <span className="text-xs text-stone-500">玩家</span>
              </div>
              <div className={`flex flex-col items-center p-3 rounded-lg border-2 
                ${currentPlayer === Player.White ? 'border-stone-400 bg-stone-100' : 'border-transparent'}
              `}>
                <div className="w-8 h-8 rounded-full bg-white border border-gray-300 shadow mb-2"></div>
                <span className="font-bold text-stone-800">白方</span>
                <span className="text-xs text-stone-500">{gameMode === GameMode.PvAI ? '電腦 (CPU)' : '玩家 2'}</span>
              </div>
            </div>
          </div>

          {/* Settings Panel */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-stone-200">
             <h2 className="text-xl font-bold text-stone-700 mb-4 flex items-center gap-2">
              <Cpu className="w-5 h-5" /> 設定
            </h2>

            {/* Mode Selection */}
            <div className="mb-4">
              <label className="text-sm font-semibold text-stone-500 mb-2 block">對戰模式</label>
              <div className="flex bg-stone-100 p-1 rounded-lg">
                <button
                  onClick={() => { setGameMode(GameMode.PvAI); resetGame(); }}
                  className={`flex-1 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-all
                    ${gameMode === GameMode.PvAI ? 'bg-white shadow text-stone-800' : 'text-stone-500 hover:text-stone-700'}
                  `}
                >
                  <Cpu size={16} /> 人機對戰
                </button>
                <button
                   onClick={() => { setGameMode(GameMode.PvP); resetGame(); }}
                   className={`flex-1 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-all
                    ${gameMode === GameMode.PvP ? 'bg-white shadow text-stone-800' : 'text-stone-500 hover:text-stone-700'}
                  `}
                >
                  <User size={16} /> 雙人對戰
                </button>
              </div>
            </div>

             {/* Rule Selection */}
             <div className="mb-6">
              <label className="text-sm font-semibold text-stone-500 mb-2 block">規則設定</label>
              <div className="flex bg-stone-100 p-1 rounded-lg">
                <button
                  onClick={() => { setRuleSet(RuleSet.Free); resetGame(); }}
                  className={`flex-1 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-all
                    ${ruleSet === RuleSet.Free ? 'bg-white shadow text-green-700' : 'text-stone-500 hover:text-stone-700'}
                  `}
                >
                  <CheckCircle2 size={16} /> 自由規則
                </button>
                <button
                   onClick={() => { setRuleSet(RuleSet.Forbidden); resetGame(); }}
                   className={`flex-1 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-all
                    ${ruleSet === RuleSet.Forbidden ? 'bg-white shadow text-red-700' : 'text-stone-500 hover:text-stone-700'}
                  `}
                >
                  <Shield size={16} /> 禁手規則
                </button>
              </div>
              <p className="text-xs text-stone-400 mt-2">
                {ruleSet === RuleSet.Free ? '雙方無限制，連五即勝。適合休閒。' : '黑棋有禁手限制 (禁雙三、雙四、長連)。更具競技性。'}
              </p>
            </div>

            <button
              onClick={resetGame}
              className="w-full bg-stone-800 hover:bg-stone-900 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg active:scale-95 transform"
            >
              <RefreshCw size={18} /> 重新開始
            </button>
          </div>

          {/* Legend/Help (Mobile usually hides this, but good for desktop) */}
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-900 text-sm">
            <h3 className="font-bold mb-2 flex items-center gap-2"><History size={16}/> 術語速查</h3>
            <ul className="space-y-1 list-disc list-inside opacity-80">
              <li><span className="font-semibold">活三</span>: 兩端未堵的三連</li>
              <li><span className="font-semibold">活四</span>: 下一步必勝的棋形</li>
              <li><span className="font-semibold">禁手</span>: 黑方走出的必勝或犯規棋形 (僅禁手模式)</li>
            </ul>
          </div>

        </div>
      </div>
      
      <footer className="mt-12 text-stone-400 text-sm">
        Zen Gomoku © {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default App;
