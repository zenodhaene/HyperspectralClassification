import numpy as np
import math
import io
import base64
import matplotlib.pyplot as plt
import tensorflow as tf
import seaborn as sns

import Algorithms.utils as utils
from PIL import Image

class ModelUtilities:
    def __init__(self, model, x, y, batch_size, data, data_shape, predict_type):
        self.model = model
        self.x = x
        self.y = y
        self.batch_size = batch_size
        self.data = data
        self.data_shape = data_shape
        self.predict_type = predict_type

        self.y_pred = None
        self.class_predictions = None
        self.y_pred_all = None
        self.class_predictions_all = None
    
    def calculate_performance(self):
        if self.y_pred is None:
            self.predict()
        
        return {
            "kappa": float(utils.calculate_kappa_score(self.class_predictions, self.y)),
            "overall_accuracy": float(utils.calculate_overall_accuracy(self.class_predictions, self.y)),
            "average_accuracy": float(utils.calculate_average_accuracy(self.class_predictions, self.y))
        }
    
    def calculate_classification_map(self, hex_colors):
        if self.y_pred_all is None:
            self.predict()
        
        # create rgb array
        colors = []
        for c in hex_colors:
            c = c.lstrip('#')
            col = (int(c[0:2], base=16), int(c[2:4], base=16), int(c[4:6], base=16))
            colors.append(col)
                
        (im, legend) = utils.draw_classification_map(self.class_predictions_all.reshape(self.data_shape[0], -1), colors=colors)
        return pil2datauri(im)
    
    # class_colors to know which classes there are
    def calculate_areas(self, class_colors):
        result = []

        unique, counts = np.unique(self.class_predictions_all, return_counts=True)
        pixels = dict(zip(unique, counts))
        for i in range(len(class_colors)):
            if i in pixels.keys():
                result.append(int(pixels[i]))
            else:
                result.append(0)

        return result
    
    def calculate_confusion_matrix(self):
        if self.y_pred_all is None:
            self.predict()
        
        return confusionmatrix2datauri(self.y, self.class_predictions)
    
    def predict_capsules(self):
        # for test data
        x = self.x
        rest = self.batch_size - x.shape[0] % self.batch_size
        
        # pad with zero vectors to be a multiple of batch_size
        padded = np.concatenate([x, np.zeros((rest, x.shape[1], x.shape[2], x.shape[3]))])
        converted = padded.reshape(-1, x.shape[1], x.shape[2], x.shape[3], 1).astype('float32')

        y_pred = self.model.predict(converted, batch_size=self.batch_size)
        
        self.y_pred = y_pred[:-rest]
        self.class_predictions = [np.argmax(y, axis=None, out=None) for y in self.y_pred]

        # for all data samples
        x = self.data
        rest = self.batch_size - x.shape[0] % self.batch_size
        
        # pad with zero vectors to be a multiple of batch_size
        padded = np.concatenate([x, np.zeros((rest, x.shape[1], x.shape[2], x.shape[3]))])
        converted = padded.reshape(-1, x.shape[1], x.shape[2], x.shape[3], 1).astype('float32')

        y_pred = self.model.predict(converted, batch_size=self.batch_size)
        
        self.y_pred_all = y_pred[:-rest]
        self.class_predictions_all = np.array([np.argmax(y, axis=None, out=None) for y in self.y_pred_all])
    
    def predict_svm(self):
        # for test data
        y_pred = self.model.predict(self.x)
        self.y_pred = y_pred
        self.class_predictions = y_pred

        # for all data samples
        y_pred = self.model.predict(self.data)
        self.y_pred_all = y_pred
        self.class_predictions_all = y_pred
    
    def predict(self):
        if self.predict_type == "capsule":
            self.predict_capsules()
        elif self.predict_type == "svm":
            self.predict_svm()
        else:
            raise Exception(f"Prediction type '{self.predict_type}' not supported")


def pil2datauri(img):
    #converts PIL image to datauri
    data = io.BytesIO()
    img.save(data, "PNG")
    data64 = base64.b64encode(data.getvalue())
    return u'data:img/png;base64,' + data64.decode('utf-8')

def confusionmatrix2datauri(labels, classes):
    confusion_matrix = tf.math.confusion_matrix(labels, classes)
    plt.figure(figsize=(10, 8))
    sns.heatmap(confusion_matrix, annot=True, fmt='g')
    plt.xlabel("Prediction")
    plt.ylabel("Class label")
    
    b = io.BytesIO()
    plt.savefig(b, format='png')
    b.seek(0)
    data64 = base64.b64encode(b.read())
    return u'data:img/png;base64,' + data64.decode('utf-8')
    