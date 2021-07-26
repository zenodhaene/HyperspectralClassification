import re
import numpy as np
import tempfile
import time
import io
import base64

from flask import Blueprint
from flask import request, jsonify
from pymongo import MongoClient
from gridfs import GridFSBucket
from bson import ObjectId
from zipfile import ZipFile
from geotiff import GeoTiff
from io import StringIO
from os.path import join as pjoin
from tifffile import imread, TiffFile
from PIL import Image

from RequestErrors import requiredParameter, notFound
from RequestResponses import success, validDataset, imageResponse
from Config import MONGODB, DATASETSTORE

dataset_eo1_api = Blueprint('dataset_eo1_api', __name__)

@dataset_eo1_api.route("validate")
def validate():
    query_parameters = request.args

    id = query_parameters.get('id')

    if id is None:
        return requiredParameter('id')
    
    data = getData(id)

    if data is None:
        return notFound("dataset (file)", id)
    
    dimension = [data.shape[0], data.shape[1]]
    n_spectral_bands = data.shape[2]

    return validDataset(dimension, n_spectral_bands)

@dataset_eo1_api.route("generate_thumbnail")
def generate_thumbnail():
    query_parameters = request.args

    id = query_parameters.get('id')
    layer = query_parameters.get('layer')

    if id is None: return requiredParameter('id')
    if layer is None: return requiredParameter('layer')

    conn = MongoClient(MONGODB["Host"], MONGODB["Port"])[MONGODB["Database"]]
    dataset = conn[DATASETSTORE["Collection"]].find_one({"_id": ObjectId(id)})

    layer = int(layer)
    if layer == -1:
        layer = round(dataset["NSpectralBands"] / 2)
    
    layer_data = getZipLayer(dataset["File"], layer + 1)
    img = getLayerImage(layer_data, False)
    return imageResponse(pil2datauri(img))

@dataset_eo1_api.route("layer")
def getImageForLayer():
    query_parameters = request.args
    id = query_parameters.get('id')
    layer = query_parameters.get('layer')
    normalized = query_parameters.get('normalized')

    if id is None: return requiredParameter('id')
    if layer is None: return requiredParameter('layer')
    if normalized is None:
        normalized = False
    else:
        normalized = normalized.lower() == "true"
    
    layer = int(layer)

    conn = MongoClient(MONGODB["Host"], MONGODB["Port"])[MONGODB["Database"]]
    dataset = conn[DATASETSTORE["Collection"]].find_one({"_id": ObjectId(id)})

    layer_data = getZipLayer(dataset["File"], layer + 1)
    img = getLayerImage(layer_data, normalized)
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

def pil2datauri(img):
    #converts PIL image to datauri
    data = io.BytesIO()
    img.save(data, "PNG")
    data64 = base64.b64encode(data.getvalue())
    return u'data:img/png;base64,' + data64.decode('utf-8')

def getData(fileId):
    conn = MongoClient(MONGODB["Host"], MONGODB["Port"])[MONGODB["Database"]]
    fs = GridFSBucket(conn, bucket_name=DATASETSTORE["Bucket"], chunk_size_bytes=DATASETSTORE["ChunkSizeBytes"])

    grid_out = fs.open_download_stream(ObjectId(fileId))
    with ZipFile(grid_out) as z:
        # determine maximum band
        bandregex = r'^.*_B([\d]+)_.*$'
        band_nrs = []
        for f in z.namelist():
            m = re.match(bandregex, f)
            if m is not None:
                band_nrs.append(int(m.group(1)))
    
        band_nrs.sort()
        first_band = band_nrs[0]
        last_band = band_nrs[0] + 1
        while last_band in band_nrs:
            last_band += 1
        
        last_band -= 1
        
        # reading from a single layer isn't possible, extract all files to tmp directory
        with tempfile.TemporaryDirectory() as tmp:
            z.extractall(tmp)

            layers = []
            for i in np.arange(first_band, last_band + 1):
                l = getLayer(tmp, z, i)
                if l is None:
                    return None
                layers.append(l)

    layers = np.array(layers)
    layers = np.moveaxis(layers, 0, -1)

    return layers

def getZipLayer(fileId, layer):
    conn = MongoClient(MONGODB["Host"], MONGODB["Port"])[MONGODB["Database"]]
    fs = GridFSBucket(conn, bucket_name=DATASETSTORE["Bucket"], chunk_size_bytes=DATASETSTORE["ChunkSizeBytes"])

    grid_out = fs.open_download_stream(ObjectId(fileId))
    with ZipFile(grid_out) as z:
        # check if specified layer exists
        bandregex = r'^.*_B[\d]*' + str(layer) + r'_.*$'
        for f in z.namelist():
            m = re.match(bandregex, f)
            if m is not None:
                bandfilename = m.group(0)
                break
    
        if bandfilename is None:
            return None
        
        with tempfile.TemporaryDirectory() as tmp:
            z.extract(bandfilename, tmp)

            return getLayer(tmp, z, layer)

def getLayer(directory, zipfile, layer):
    bandregex = r'^.*_B[\d]*' + str(layer) + r'_.*$'
    bandfilename = None
    for f in zipfile.namelist():
        m = re.match(bandregex, f)
        if m is not None:
            bandfilename = m.group(0)
            break
    
    if bandfilename is None:
        return None
    
    tif = TiffFile(pjoin(directory, bandfilename))

    if not tif.is_geotiff:
        return None
    
    data = imread(pjoin(directory, bandfilename))

    # normalizing
    M = data.max()
    m = data.min()
    
    data = (data - m) / (M - m)

    # necessary, filehandle doesn't close fast enough
    tif._fh.close()

    return data