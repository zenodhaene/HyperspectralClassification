import numpy as np
import math
import io
import base64
import matplotlib.pyplot as plt
import tensorflow as tf
import seaborn as sns

import Algorithms.utils as utils
from PIL import Image

class NewModelUtilities:
    def __init__(self, model, test_fetch_batch_method, fetch_batch_method, batch_size, data_shape, predict_type):
        self.model = model
        self.test_fetch_batch_method = test_fetch_batch_method
        self.test_y = []
        self.fetch_batch_method = fetch_batch_method
        self.batch_size = batch_size
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
            #"kappa": float(utils.calculate_kappa_score(self.class_predictions, self.test_y)),
            "overall_accuracy": float(utils.calculate_overall_accuracy(self.class_predictions, self.test_y)),
            "average_accuracy": float(utils.calculate_average_accuracy(self.class_predictions, self.test_y))
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
        if self.class_predictions is None:
            self.predict()
        
        return confusionmatrix2datauri(self.test_y, self.class_predictions)
    
    def predict_mscapsules(self):
        # for the test set
        self.y_pred = []
        
        batch_index = 0
        test_data = self.test_fetch_batch_method(batch_index, 1000)
        while test_data is not None:
            (test_x, test_y) = test_data
            for i in range(len(test_x)):
                rest = self.batch_size - test_x[i].shape[0] % self.batch_size
                test_x[i] = np.concatenate([test_x[i], np.zeros((rest, test_x[i].shape[1], test_x[i].shape[2], test_x[i].shape[3]))])
                test_x[i] = test_x[i].reshape(-1, test_x[i].shape[1], test_x[i].shape[2], test_x[i].shape[3], 1).astype('float32')

            self.y_pred.extend(self.model.predict(test_x, batch_size=self.batch_size)[:-rest])
            self.test_y.extend(test_y)

            batch_index += 1
            test_data = self.test_fetch_batch_method(batch_index, 1000)
        
        self.class_predictions = [np.argmax(y, axis=None, out=None) for y in self.y_pred]

        # for the entire dataset
        remaining = 1000000
        self.y_pred_all = []

        batch_index = 0
        while (remaining > 0):
            (data, remaining) = self.fetch_batch_method(batch_index, 1000)

            # top-most and bottom-most rows all have no valid pixels (due to patch size)
            if len(data[0]) > 0:
                for i in range(len(data)):
                    rest = self.batch_size - data[i].shape[0] % self.batch_size
                    data[i] = np.concatenate([data[i], np.zeros((rest, data[i].shape[1], data[i].shape[2], data[i].shape[3]))])
                    data[i] = data[i].reshape(-1, data[i].shape[1], data[i].shape[2], data[i].shape[3], 1).astype('float32')

                self.y_pred_all.extend(self.model.predict(data, batch_size=self.batch_size)[:-rest])
            
            print(f"Predictions: {len(self.y_pred_all)}, remaining: {remaining}")

            batch_index += 1
        
        self.y_pred_all = np.array(self.y_pred_all)
        self.class_predictions_all = np.array([np.argmax(y, axis=None, out=None) for y in self.y_pred_all])
    
    def predict_capsules(self):
        # for the test set
        self.y_pred = []
        
        batch_index = 0
        test_data = self.test_fetch_batch_method(batch_index, 1000)
        while test_data is not None:
            (test_x, test_y) = test_data
            rest = self.batch_size - test_x.shape[0] % self.batch_size
            test_x = np.concatenate([test_x, np.zeros((rest, test_x.shape[1], test_x.shape[2], test_x.shape[3]))])
            test_x = test_x.reshape(-1, test_x.shape[1], test_x.shape[2], test_x.shape[3], 1).astype('float32')

            self.y_pred.extend(self.model.predict(test_x, batch_size=self.batch_size)[:-rest])
            self.test_y.extend(test_y)

            batch_index += 1
            test_data = self.test_fetch_batch_method(batch_index, 1000)
        
        self.class_predictions = [np.argmax(y, axis=None, out=None) for y in self.y_pred]

        # for the entire dataset
        remaining = 1000000
        self.y_pred_all = []

        batch_index = 0
        while (remaining > 0):
            (data, remaining) = self.fetch_batch_method(batch_index, 1000)

            # top-most and bottom-most rows all have no valid pixels (due to patch size)
            if len(data) > 0:
                rest = self.batch_size - data.shape[0] % self.batch_size
                data = np.concatenate([data, np.zeros((rest, data.shape[1], data.shape[2], data.shape[3]))])
                data = data.reshape(-1, data.shape[1], data.shape[2], data.shape[3], 1).astype('float32')

                self.y_pred_all.extend(self.model.predict(data, batch_size=self.batch_size)[:-rest])
            
            print(f"Predictions: {len(self.y_pred_all)}, remaining: {remaining}")

            batch_index += 1
        
        self.y_pred_all = np.array(self.y_pred_all)
        self.class_predictions_all = np.array([np.argmax(y, axis=None, out=None) for y in self.y_pred_all])
    
    def predict_svm(self):
        # for test data
        y_pred = self.model.predict(self.test_x)
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
        elif self.predict_type == "mscapsule":
            self.predict_mscapsules()
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
    