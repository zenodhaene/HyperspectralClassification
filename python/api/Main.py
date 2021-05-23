import flask
import signal
from ModelRunner import ModelRunner

from flask import jsonify
from MatlabDataset import dataset_matlab_api
from EO1Dataset import dataset_eo1_api
from ModelController import model_api
from TestController import test_api

app = flask.Flask(__name__)
app.config["DEBUG"] = True

app.register_blueprint(dataset_matlab_api, url_prefix='/dataset/matlab')
app.register_blueprint(dataset_eo1_api, url_prefix='/dataset/eo1')

app.register_blueprint(model_api, url_prefix='/model')

app.register_blueprint(test_api, url_prefix='/test')

@app.route("/", methods=['GET'])
def test():
    return jsonify({
        "message": "Main route is working!"
    })

if __name__ == "__main__":
    runner = ModelRunner()
    runner.start()

    def test(_1, _2):
        runner.stop()
        exit(0)
    
    signal.signal(signal.SIGINT, test)

    try:
        app.run(port=5002, use_reloader=False)
    except (KeyboardInterrupt, SystemExit):
        print("interrupted")