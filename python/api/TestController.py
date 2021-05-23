from flask import Blueprint
from flask import request, jsonify

from RequestResponses import success
from Config import MONGODB, DATASETSTORE

from ModelRunner import ModelRunner

test_api = Blueprint('test_api', __name__)

@test_api.route("queue_next_model")
def queueNextModel():
    runner = ModelRunner()
    runner.loop()

    return success("OK")