import threading
import time
import datetime
import multiprocessing

from Config import MONGODB, MODELSTORE
from pymongo import MongoClient, ASCENDING, DESCENDING
from bson import ObjectId

from Dataset import getData, getGroundTruthLabels
from Algorithms.Models.CapsuleNetworksModel import CapsuleNetworksModel
from Algorithms.Models.SVMModel import SVMModel
from Algorithms.Models.MultiScaleCapsuleModel import MultiScaleCapsuleModel

class ModelRunner:
    def __init__(self):
        print("init")
        self.current_running_model = None
        self.running = False
        self.t1 = None
    
    def start(self):
        self.running = True
        self.resetAllRunningModels()
        self.t1 = threading.Thread(target = self.main, args = (lambda : self.running, ))
        try:
            self.t1.start()
        except (KeyboardInterrupt, SystemExit):
            self.running = False
            sys.exit()
    
    def stop(self):
        print("stopping")
        self.running = False
    
    def main(self, isRunning):
        while isRunning():
            self.loop()
            time.sleep(10)
    
    def loop(self):
        print("checking for queued & running models")
        if not self.isAModelRunning():
            self.current_running_model = self.getNextModelInQueue()

            if self.current_running_model is not None:
                print("A new model is running")
                self.setRunning(self.current_running_model)

                p = multiprocessing.Process(target=initiateModelRun, args=[self.current_running_model])
                p.start()
            else:
                print("No new model is running. Idling...")
    
    def resetAllRunningModels(self):
        conn = MongoClient(MONGODB["Host"], MONGODB["Port"])[MONGODB["Database"]]
        runningModels = conn[MODELSTORE["Collection"]].update_many({"Status": 2}, { '$set': {"Status": 1}})
    
    def isAModelRunning(self):
        conn = MongoClient(MONGODB["Host"], MONGODB["Port"])[MONGODB["Database"]]
        modelRunning = conn[MODELSTORE["Collection"]].find_one({"Status": 2})
        return modelRunning is not None
    
    def getNextModelInQueue(self):
        conn = MongoClient(MONGODB["Host"], MONGODB["Port"])[MONGODB["Database"]]
        nextModel = conn[MODELSTORE["Collection"]].find({"Status": 1}).sort([('Queued', ASCENDING)])

        if nextModel.count() == 0:
            return None
        
        return nextModel[0]
    
    def setRunning(self, model):
        conn = MongoClient(MONGODB["Host"], MONGODB["Port"])[MONGODB["Database"]]
        conn[MODELSTORE["Collection"]].update_one({"_id": model["_id"]}, {"$set": {"Status": 2, "Started": datetime.datetime.now()}})

def initiateModelRun(model):
    modelRun = ModelRun(model)
    modelRun.run()

class ModelRun:
    def __init__(self, model):
        self.model = model
        
    def setFinished(self):
        conn = MongoClient(MONGODB["Host"], MONGODB["Port"])[MONGODB["Database"]]
        conn[MODELSTORE["Collection"]].update_one({"_id": self.model["_id"]}, {"$set": {"Status": 3, "Finished": datetime.datetime.now()}})

    def epochCallback(self, epoch, max_epochs):
        conn = MongoClient(MONGODB["Host"], MONGODB["Port"])[MONGODB["Database"]]
        conn[MODELSTORE["Collection"]].update_one({"_id": self.model["_id"]}, {"$set": {"CurrentEpoch": epoch, "MaxEpoch": max_epochs}})
    
    def finishedCallback(self, scores, classification_map_datauri, classification_areas, confusion_map_datauri):
        conn = MongoClient(MONGODB["Host"], MONGODB["Port"])[MONGODB["Database"]]
        conn[MODELSTORE["Collection"]].update_one({"_id": self.model["_id"]}, {"$set": {
            "ClassificationPerformance": scores, 
            "ClassificationMapData": classification_map_datauri,
            "ClassificationAreas": classification_areas,
            "ConfusionMap": confusion_map_datauri
        }})

    def run(self):
        data = getData(self.model["DatasetID"])

        labels = self.model["ClassAssignments"]

        if self.model["UseGroundTruth"]:
            labels = getGroundTruthLabels(self.model["DatasetID"])

        if (self.model["ModelType"] == "capsule_networks"):
            running_model = CapsuleNetworksModel(
                data, 
                labels,
                self.model["ClassColors"],
                self.model["Parameters"],
                self.model["UseGroundTruth"],
                self.epochCallback, 
                self.finishedCallback
            )
        elif (self.model["ModelType"] == "svm"):
            running_model = SVMModel(
                data, 
                self.model["ClassAssignments"], 
                self.model["ClassColors"],
                self.model["Parameters"],
                self.epochCallback, 
                self.finishedCallback
            )
        elif (self.model["ModelType"] == "multiscale_capsule_networks"):
            running_model = MultiScaleCapsuleModel(
                data, 
                labels,
                self.model["ClassColors"],
                self.model["Parameters"],
                self.model["UseGroundTruth"],
                self.epochCallback, 
                self.finishedCallback
            )
        else:
            raise Exception(f"Model type '{self.model['ModelType']}' is not supported")
        
        
        running_model.prepare()
        running_model.run()
        self.setFinished()