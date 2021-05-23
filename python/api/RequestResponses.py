import flask
from flask import jsonify

def success(message):
    return jsonify({
        "success": True,
        "message": message
    })

def valid(message):
    return jsonify({
        "success": True,
        "valid": True,
        "message": message
    })

def data(data):
    return jsonify({
        "success": True,
        "data": data
    })

def validDataset(dimension, n_spectral_bands, datakey_in_file=None):
    print(dimension)
    print(n_spectral_bands)
    print(datakey_in_file)

    data = {
        "success": True,
        "dimension": dimension,
        "n_spectral_bands": n_spectral_bands
    }

    if datakey_in_file is not None:
        data["datakey_in_file"] = datakey_in_file
    
    return jsonify(data)

def invalidDataset_noUniqueKey():
    return jsonify({
        "success": False,
        "message": "The data key was not unique"
    })

def invalidDataset_noKey():
    return jsonify({
        "success": False,
        "message": "No valid key was found in the dataset"
    })

def imageResponse(pngdata):
    return pngdata