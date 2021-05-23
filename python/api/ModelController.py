from flask import Blueprint
from flask import request, jsonify

from RequestResponses import data
from Config import MONGODB, DATASETSTORE

from Algorithms.Models.CapsuleNetworksModel import CapsuleNetworksModelParameters
from Algorithms.Models.SVMModel import SVMModelParameters
from Algorithms.Models.MultiScaleCapsuleModel import MultiScaleCapsuleModelParameters

model_api = Blueprint('model_api', __name__)

@model_api.route("/")
def getAllModelTypes():
    return data([
        "capsule_networks",
        "svm",
        "multiscale_capsule_networks"
    ])

@model_api.route("capsule_networks/parameters")
def capsuleNetworksGetParameters():
    model_params = CapsuleNetworksModelParameters()
    return data(model_params.get_parameters())

@model_api.route("svm/parameters")
def svmGetParameters():
    model_params = SVMModelParameters()
    return data(model_params.get_parameters())

@model_api.route("multiscale_capsule_networks/parameters")
def multiscaleCapsuleNetworks():
    model_params = MultiScaleCapsuleModelParameters()
    return data(model_params.get_parameters())