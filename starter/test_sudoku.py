import pytest
import sudoku_logic

def test_generate_puzzle_structure():
    puzzle, solution = sudoku_logic.generate_puzzle('easy')
    assert len(puzzle) == 9
    assert len(solution) == 9
    assert all(len(row) == 9 for row in puzzle)
    assert all(len(row) == 9 for row in solution)

def test_is_safe_valid_and_invalid():
    board = sudoku_logic.create_empty_board()
    board[0][0] = 5
    
    # Same row conflict
    assert sudoku_logic.is_safe(board, 0, 1, 5) is False
    # Valid position
    assert sudoku_logic.is_safe(board, 0, 1, 6) is True

def test_unique_solution_counter():
    board = sudoku_logic.create_empty_board()
    sudoku_logic.solve_board(board)
    assert sudoku_logic.count_solutions(board) == 1