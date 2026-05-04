from flask import Flask, render_template, jsonify, request
import datetime

app = Flask(__name__)
processes = []


def get_next_pid():
    return len(processes) + 1


@app.route('/')
def index():
    current_date = datetime.datetime.now().strftime("%B %d, %Y")
    return render_template('index.html', current_date=current_date, processes=processes)


@app.route('/processes', methods=['GET'])
def processes_list():
    return jsonify({"processes": processes})


@app.route('/processes', methods=['POST'])
def add_process():
    data = request.get_json(silent=True) or {}
    name = data.get('name', '').strip()
    try:
        burst_time = int(data.get('burst_time', 0))
        memory_size = int(data.get('memory_size', 0))
    except (TypeError, ValueError):
        burst_time = 0
        memory_size = 0

    if not name or burst_time <= 0 or memory_size <= 0:
        return jsonify({"error": "Invalid process name, burst time, or memory size."}), 400

    process = {
        "pid": get_next_pid(),
        "name": name,
        "burst_time": burst_time,
        "original_burst_time": burst_time,
        "memory_size": memory_size,
        "state": "Ready"
    }
    processes.append(process)
    return jsonify({"process": process}), 201


@app.route('/processes/reset', methods=['POST'])
def reset_processes():
    processes.clear()
    return jsonify({"success": True}), 200


def run():
    """Run the Cookie OS Flask application"""
    app.run(debug=True, host='localhost', port=5000)

if __name__ == '__main__':
    run()
