import numpy as np
import matplotlib as plt
import scipy.io as sio
import math
import os

from Algorithms.ModelPreprocessing import ModelPreprocessing
from Algorithms.ModelUtilities import ModelUtilities
from Algorithms.ModelParameters import ModelParameters

import tensorflow as tf
from tensorflow.keras import layers, models, optimizers, callbacks
from tensorflow.keras import backend as K
from tensorflow.keras.utils import to_categorical

from keras.callbacks import Callback
from sklearn.svm import SVC
from sklearn.decomposition import KernelPCA

class SVMModelParameters(ModelParameters):
    def __init__(self):
        super().__init__()
        self.add_slider("training_samples_per_class", 50, 10, 10000, 1)
        self.add_slider("validation_samples_per_class", 50, 10, 10000, 1)
        
        self.add_parameter("kernelpca_ncomponents", 150, 10, 200)
        self.add_parameter("kernelpca_degree", 3, 2, 7)
        self.add_parameter("svm_c", 1.0, 0.0, 100.0)

class SVMModel:
    def __init__(self, data, class_areas, class_colors, parameters, epoch_callback, finish_callback):
        self.data = data
        self.class_areas = class_areas
        self.class_colors = class_colors
        self.epoch_callback = epoch_callback
        self.finish_callback = finish_callback

        self.model_parameters = SVMModelParameters()
        self.parameters = self.model_parameters.get_parameters_initialized(parameters)

        self.preprocessing = ModelPreprocessing(data, class_areas, 0, int(self.parameters["training_samples_per_class"]), 
            int(self.parameters["validation_samples_per_class"]))
        self.utilities = None

        (self.train, self.train_labels, self.validation, self.validation_labels) = self.preprocessing.get_training_data()
        (self.test, self.test_labels) = self.preprocessing.get_test_data()

        # reshape features to have only 2 dimensions
        layer_1 = KernelPCA(n_components=int(self.parameters["kernelpca_ncomponents"]), kernel='poly', degree=int(self.parameters["kernelpca_degree"]))
        self.train = self.incremental_transform(layer_1, self.train.reshape(self.train.shape[0], -1))
        self.validation = self.incremental_transform(layer_1, self.validation.reshape(self.validation.shape[0], -1))
        self.test = self.incremental_transform(layer_1, self.test.reshape(self.test.shape[0], -1))

        print(self.train.shape)
        print(self.train_labels.shape)
        print(self.validation.shape)
        print(self.validation_labels.shape)
        print(self.test.shape)
        print(self.test_labels.shape)
        
        self.all_data = self.preprocessing.get_all_data()
        self.all_data = self.incremental_transform(layer_1, self.all_data.reshape(self.all_data.shape[0], -1))

        print(self.all_data.shape)
    
    def incremental_transform(self, layer, data):
        transformed_data = []
        padding = 1000 - data.shape[0] % 1000
        for i in range(math.floor(data.shape[0] / 1000)):
            transformed = layer.fit_transform(data[1000 * i:1000 * (i+1)])
            transformed_data.extend(transformed)
        
        # last iteration
        transformed = layer.fit_transform(np.concatenate([data[-(data.shape[0] % 1000):], np.zeros((padding, data.shape[1]))]))
        transformed_data.extend(transformed[:-padding])

        return np.array(transformed_data)

    
    def prepare(self):
        self.model = SVC(kernel='rbf', gamma='scale', C=int(self.parameters["svm_c"]), cache_size=1024*7)
    
    def run(self):        
        train(model=self.model, data=((self.train, self.train_labels), (self.validation, self.validation_labels)), epoch_callback=self.epoch_callback)

        self.evaluate_performance()
        pass

    def evaluate_performance(self):
        self.utilities = ModelUtilities(self.model,
            self.test,
            self.test_labels,
            None, 
            self.all_data,
            self.preprocessing.get_all_data_shape(),
            "svm"
        )

        scores = self.utilities.calculate_performance()
        classification_map_datauri = self.utilities.calculate_classification_map(self.class_colors)
        classification_areas = self.utilities.calculate_areas(self.class_colors)
        confusion_map_datauri = self.utilities.calculate_confusion_matrix()
        self.finish_callback(scores, classification_map_datauri, classification_areas, confusion_map_datauri)

# training the model
def train(model, data, epoch_callback):
    (x_train, y_train), (x_test, y_test) = data
    model.fit(x_train, y_train)
    return model