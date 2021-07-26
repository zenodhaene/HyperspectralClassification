import flask
from flask import jsonify

def requiredParameter(requiredParameter):
    return jsonify({
        "success": False,
        "error": f"required parameter {requiredParameter} not found in request arguments"
    })

def notFound(datatype, id):
    return jsonify({
        "success": False,
        "error": f"datatype {datatype} with id {id} was not found"
    })

def outOfBounds(obj, i, max):
    return jsonify({
        "success": False,
        "error": f"{obj} {i} is out of bounds, max: {max}"
    })

def invalid(message):
    return jsonify({
        "success": False,
        "valid": False,
        "message": message
    })