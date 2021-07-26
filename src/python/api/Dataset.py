from pymongo import MongoClient
from bson import ObjectId
from Config import MONGODB, DATASETSTORE, MATLABDATASETSTORE

from MatlabDataset import getData as matlabGetData
from MatlabDataset import getGroundTruthLabels as matlabGetGroundTruthLabels
from EO1Dataset import getData as eo1GetData

def getData(datasetId, key=None):
    conn = MongoClient(MONGODB["Host"], MONGODB["Port"])[MONGODB["Database"]]
    dataset = conn[DATASETSTORE["Collection"]].find_one({'_id': ObjectId(datasetId)})

    if dataset is None:
        return None
    
    data = None
    if dataset["DatafileType"] == 1:        
        data = matlabGetData(dataset["File"], datasetId)
    elif dataset["DatafileType"] == 2:
        data = eo1GetData(dataset["File"])
    
    return data

def getGroundTruthLabels(datasetId):
    conn = MongoClient(MONGODB["Host"], MONGODB["Port"])[MONGODB["Database"]]
    dataset = conn[DATASETSTORE["Collection"]].find_one({'_id': ObjectId(datasetId)})

    if dataset is None:
        return None
    
    groundTruthLabels = None
    if dataset["DatafileType"] == 1:
        groundTruthLabels = matlabGetGroundTruthLabels(dataset["GroundTruth"], dataset["Dimension"])
    
    return groundTruthLabels