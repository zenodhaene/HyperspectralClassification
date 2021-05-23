import scipy.io as sio
import numpy as np
import math
import io
import base64

from flask import Blueprint
from flask import request, jsonify
from pymongo import MongoClient
from bson import ObjectId
from gridfs import GridFSBucket
from sklearn import preprocessing
from PIL import Image

from RequestErrors import notFound, requiredParameter, outOfBounds, invalid
from RequestResponses import success, validDataset, invalidDataset_noUniqueKey, invalidDataset_noKey, imageResponse, valid
from Config import MONGODB, DATASETSTORE, MATLABDATASETSTORE
from Helpers import GetColor

dataset_matlab_api = Blueprint('dataset_matlab_api', __name__)

@dataset_matlab_api.route("validate")
def validate():
    query_parameters = request.args

    id = query_parameters.get('id')

    if id is None:
        return requiredParameter('id')
    
    data = getData(id)

    if data is None:
        return notFound("dataset (file)", id)

    dimension = None
    n_spectral_bands = None
    datakey_in_file = None

    for k in data.keys():
        if not k.startswith("__"):
            if dimension is not None:
                return invalidDataset_noUniqueKey()
            
            np_obj = np.array(data[k])
            dimension = [np_obj.shape[0], np_obj.shape[1]]
            n_spectral_bands = np_obj.shape[2]
            datakey_in_file = k
    
    if dimension is None:
        return invalidDataset_noKey()
    
    layer = round(n_spectral_bands / 2)
    layerImg = getLayerImage(data[datakey_in_file][:,:, layer], True)
    datauri = pil2datauri(layerImg)

    return validDataset(dimension, n_spectral_bands, datakey_in_file)

@dataset_matlab_api.route("layer")
def getLayer():
    query_parameters = request.args

    id = query_parameters.get('id')
    layer = query_parameters.get('layer')
    normalized = query_parameters.get('normalized')

    if (id is None): return requiredParameter('id')
    if (layer is None): return requiredParameter('layer')
    if (normalized is None):
        normalized = False
    else:
        normalized = normalized.lower() == "true"

    layer = int(layer)

    conn = MongoClient(MONGODB["Host"], MONGODB["Port"])[MONGODB["Database"]]
    fs = GridFSBucket(conn, bucket_name=DATASETSTORE["Bucket"], chunk_size_bytes=DATASETSTORE["ChunkSizeBytes"])

    matlabDetails = conn.MatlabDatasets.find_one({'Dataset': ObjectId(id)})
    if matlabDetails is None:
        return notFound("MatlabDataset", id)

    datafile = conn.Datasets.find_one({'_id': ObjectId(id)})
    if datafile is None:
        return notFound("Dataset", id)

    f = fs.find({"_id": datafile['File']})
    if f.count() < 1:
        return notFound("dataset (file)", id)
    
    grid_out = fs.open_download_stream(ObjectId(datafile['File']))
    mat = sio.loadmat(grid_out)
    
    l = mat[matlabDetails['KeyInDatafile']]

    if (l.shape[2] <= layer): 
        return outOfBounds("layer", layer, l.shape[2] - 1)

    data = l[:,:,layer]
    img = getLayerImage(data, normalized)
    return imageResponse(pil2datauri(img))

@dataset_matlab_api.route("generate_thumbnail")
def generateThumbnail():
    query_parameters = request.args

    # dataset id, not matlab specific
    id = query_parameters.get('id')
    layer = query_parameters.get('layer')
    if (id is None): return requiredParameter('id')
    if (layer is None): return requiredParameter('layer')

    conn = MongoClient(MONGODB["Host"], MONGODB["Port"])[MONGODB["Database"]]

    dataset = conn[DATASETSTORE["Collection"]].find_one({"_id": ObjectId(id)})
    mdataset = conn[MATLABDATASETSTORE["Collection"]].find_one({"Dataset": ObjectId(id)})

    layer = int(layer)
    if layer == -1:
        layer = round(dataset["NSpectralBands"] / 2)

    data = getData(dataset["File"], key=mdataset["KeyInDatafile"])
    img = getLayerImage(data[:,:,layer], False)
    return imageResponse(pil2datauri(img))

@dataset_matlab_api.route("validate_groundtruth")
def validateGroundTruth():
    query_parameters = request.args

    id = query_parameters.get('id')
    if (id is None): return requiredParameter('id')

    conn = MongoClient(MONGODB["Host"], MONGODB["Port"])[MONGODB["Database"]]
    dataset = conn[DATASETSTORE["Collection"]].find_one({"_id": ObjectId(id)})
    
    groundTruthLabels = getGroundTruthLabels(dataset["GroundTruth"], dataset["Dimension"])

    if groundTruthLabels is None:
        return invalid(f"Ground truth data file is invalid. The labels need the dimension {dataset['Dimension']}")
    else:
        return valid("Ground truth data file is valid")

@dataset_matlab_api.route("generate_ground_truth_image")
def generateGroundTruthImage():
    query_parameters = request.args

    # dataset id, not matlab specific
    id = query_parameters.get('id')
    if (id is None): return requiredParameter('id')

    conn = MongoClient(MONGODB["Host"], MONGODB["Port"])[MONGODB["Database"]]
    dataset = conn[DATASETSTORE["Collection"]].find_one({"_id": ObjectId(id)})

    groundTruthLabels = getGroundTruthLabels(dataset["GroundTruth"], dataset["Dimension"])

    img = getGroundTruthImage(groundTruthLabels)
    return imageResponse(pil2datauri(img))

def getLayerImage(data, normalized):
    M = data.max()
    m = data.min()

    if (normalized):
        data = (data - m) / (M - m)
    else:
        data = np.floor((data - m) / (M - m) * 255)
    
    img = Image.fromarray(np.uint8(data), 'L')
    return img

def getGroundTruthImage(labels):
    im = Image.new("RGB", (labels.shape[1], labels.shape[0]))
    
    for i in range(labels.shape[1]):
        for j in range(labels.shape[0]):
            if (labels[j][i] == 0):
                # translation between row-major and column-major
                im.putpixel((i, j), (0, 0, 0))
            else:
                im.putpixel((i, j), GetColor(labels[j][i] - 1))
                
    
    return im

def pil2datauri(img):
    #converts PIL image to datauri
    data = io.BytesIO()
    img.save(data, "PNG")
    data64 = base64.b64encode(data.getvalue())
    return u'data:img/png;base64,' + data64.decode('utf-8')

def getData(fileId, datasetId=None, key=None):
    conn = MongoClient(MONGODB["Host"], MONGODB["Port"])[MONGODB["Database"]]
    fs = GridFSBucket(conn, bucket_name=DATASETSTORE["Bucket"], chunk_size_bytes=DATASETSTORE["ChunkSizeBytes"])

    if datasetId is not None:
        mdataset = conn[MATLABDATASETSTORE["Collection"]].find_one({"Dataset": ObjectId(datasetId)})
        if mdataset is None:
            return None
        
        key = mdataset["KeyInDatafile"]
        f = fs.find({"_id": ObjectId(fileId)})

        if f.count() < 1:
            return None
    
    grid_out = fs.open_download_stream(ObjectId(fileId))
    mat = sio.loadmat(grid_out)

    if key is None:
        return mat
    
    return np.array(mat[key])

def getGroundTruthLabels(groundTruthId, desiredDimension):
    conn = MongoClient(MONGODB["Host"], MONGODB["Port"])[MONGODB["Database"]]
    fs = GridFSBucket(conn, bucket_name=DATASETSTORE["Bucket"], chunk_size_bytes=DATASETSTORE["ChunkSizeBytes"])

    grid_out = fs.open_download_stream(ObjectId(groundTruthId))
    mat = sio.loadmat(grid_out)

    for k in mat.keys():
        if not k.startswith("__"):
            np_obj = np.array(mat[k])
            if np_obj.shape[0] == desiredDimension[0] and np_obj.shape[1] == desiredDimension[1]:
                return np_obj
            else:
                print(f"Dimensions not equal: {np_obj.shape} vs {desiredDimension}")

    return None