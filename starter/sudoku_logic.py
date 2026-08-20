import copy
import random
from typing import List, Tuple, Optional

SIZE = 9
EMPTY = 0

DIFFICULTY_LEVELS = {
    'easy': 45,
    'medium': 35,
    'hard': 28
}

Board = List[List[int]]

def create_empty_board() -> Board:
    """Creates a 9x9 empty grid."""
    return [[EMPTY for _ in range(SIZE)] for _ in range(SIZE)]

def is_safe(board: Board, row: int, col: int, num: int) -> bool:
    """Checks if placing num at board[row][col] is valid."""
    for x in range(SIZE):
        if board[row][x] == num or board[x][col] == num:
            return False
            
    start_row, start_col = 3 * (row // 3), 3 * (col // 3)
    for i in range(3):
        for j in range(3):
            if board[start_row + i][start_col + j] == num:
                return False
    return True

def find_empty_location(board: Board) -> Optional[Tuple[int, int]]:
    """Finds the next empty cell (row, col)."""
    for r in range(SIZE):
        for c in range(SIZE):
            if board[r][c] == EMPTY:
                return r, c
    return None

def solve_board(board: Board) -> bool:
    """Solves the board in-place using backtracking."""
    empty_pos = find_empty_location(board)
    if not empty_pos:
        return True
    row, col = empty_pos

    numbers = list(range(1, 10))
    random.shuffle(numbers)
    for num in numbers:
        if is_safe(board, row, col, num):
            board[row][col] = num
            if solve_board(board):
                return True
            board[row][col] = EMPTY
    return False

def count_solutions(board: Board, limit: int = 2) -> int:
    """Counts number of solutions up to limit to ensure uniqueness."""
    empty_pos = find_empty_location(board)
    if not empty_pos:
        return 1

    row, col = empty_pos
    count = 0
    for num in range(1, 10):
        if is_safe(board, row, col, num):
            board[row][col] = num
            count += count_solutions(board, limit)
            board[row][col] = EMPTY
            if count >= limit:
                break
    return count

def remove_cells_with_unique_solution(board: Board, clues: int) -> Board:
    """Removes numbers while maintaining a unique solvable solution."""
    puzzle = copy.deepcopy(board)
    cells = [(r, c) for r in range(SIZE) for c in range(SIZE)]
    random.shuffle(cells)

    current_clues = 81
    for r, c in cells:
        if current_clues <= clues:
            break
        temp = puzzle[r][c]
        puzzle[r][c] = EMPTY
        
        if count_solutions(copy.deepcopy(puzzle)) != 1:
            puzzle[r][c] = temp
        else:
            current_clues -= 1

    return puzzle

def generate_puzzle(difficulty: str = 'medium') -> Tuple[Board, Board]:
    """Generates both a uniquely solvable puzzle and its complete solution."""
    clues = DIFFICULTY_LEVELS.get(difficulty.lower(), 35)
    full_board = create_empty_board()
    solve_board(full_board)
    solution = copy.deepcopy(full_board)
    puzzle = remove_cells_with_unique_solution(full_board, clues)
    return puzzle, solution