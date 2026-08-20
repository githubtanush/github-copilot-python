from flask import Flask, render_template, jsonify, request
import sudoku_logic

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/new-game', methods=['GET'])
def new_game():
    difficulty = request.args.get('difficulty', 'medium')
    puzzle, solution = sudoku_logic.generate_puzzle(difficulty)
    return jsonify({
        'status': 'success',
        'difficulty': difficulty,
        'puzzle': puzzle,
        'solution': solution
    })

@app.route('/api/validate-move', methods=['POST'])
def validate_move():
    data = request.get_json() or {}
    board = data.get('board')
    row = data.get('row')
    col = data.get('col')
    num = data.get('num')

    if board is None or row is None or col is None or num is None:
        return jsonify({'status': 'error', 'message': 'Invalid payload'}), 400

    # Temporarily remove current cell value to validate against existing board
    original_val = board[row][col]
    board[row][col] = 0
    valid = sudoku_logic.is_safe(board, row, col, num)
    board[row][col] = original_val

    return jsonify({
        'status': 'success',
        'is_valid': valid
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)