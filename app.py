from flask import Flask, render_template
import datetime

app = Flask(__name__)

@app.route('/')
def index():
    current_date = datetime.datetime.now().strftime("%B %d, %Y")
    return render_template('index.html', current_date=current_date)

def run():
    """Run the Cookie OS Flask application"""
    app.run(debug=True, host='localhost', port=5000)

if __name__ == '__main__':
    run()
