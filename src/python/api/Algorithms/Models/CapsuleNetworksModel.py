import numpy as np
import matplotlib as plt
import scipy.io as sio
import math
import os

from Algorithms.PatchPreprocessing import PatchPreprocessing
from Algorithms.NewModelUtilities import NewModelUtilities
import Algorithms.capsulelayers as capsulelayers
from Algorithms.ModelParameters import ModelParameters

from Config import DISTINCT_COLOR_LIST

import tensorflow as tf
from tensorflow.keras import layers, models, optimizers, callbacks
from tensorflow.keras import backend as K
from tensorflow.keras.utils import to_categorical

from keras.callbacks import Callback

class CapsuleNetworksModelParameters(ModelParameters):
    def __init__(self):
        super().__init__()
        self.add_slider("patch_radius", 3, 1, 12, 1)
        self.add_slider("training_samples_per_class", 50, 10, 10000, 1)
        self.add_slider("validation_samples_per_class", 50, 10, 10000, 1)

        self.add_slider("epochs", 10, 1, 100, 1)
        self.add_parameter("batch_size", 10, 1, 500)
        self.add_parameter("learning_rate", 0.001, 0.000001, 1.0)
        self.add_parameter("learning_rate_decay", 0.9, 0.001, 1.0)

class CapsuleNetworksModel:
    def __init__(self, data, labels, class_colors, parameters, use_ground_truth, epoch_callback, finish_callback):
        self.data = data
        self.labels = labels
        self.class_colors = class_colors
        if use_ground_truth:
            self.class_colors = DISTINCT_COLOR_LIST
        self.epoch_callback = epoch_callback
        self.finish_callback = finish_callback

        self.model_parameters = CapsuleNetworksModelParameters()
        self.parameters = self.model_parameters.get_parameters_initialized(parameters)

        self.preprocessing = PatchPreprocessing(data, labels, 
            int(self.parameters["training_samples_per_class"]), 
            int(self.parameters["validation_samples_per_class"]),
            use_ground_truth,
            int(self.parameters["patch_radius"])
        )
        self.utilities = None

        # Comment this out on the server, this is to keep being able to use the computer while running a model
        gpus = tf.config.experimental.list_physical_devices('GPU')
        tf.config.experimental.set_virtual_device_configuration(gpus[0], [tf.config.experimental.VirtualDeviceConfiguration(memory_limit=4096)])

        (self.train, self.train_labels, self.validation, self.validation_labels) = self.preprocessing.get_training_data()

    
    def prepare(self):
        # parameters
        self.routings = 3
        self.batch_size = int(self.parameters["batch_size"])

        # reshape training and test size to multiples of batch_size
        x_train_trimmed = self.train[:self.train.shape[0] - self.train.shape[0] % self.batch_size]
        y_train_trimmed = self.train_labels[:self.train_labels.shape[0] - self.train_labels.shape[0] % self.batch_size]
        x_validation_trimmed = self.validation[:self.validation.shape[0] - self.validation.shape[0] % self.batch_size]
        y_validation_trimmed = self.validation_labels[:self.validation_labels.shape[0] - self.validation_labels.shape[0] % self.batch_size]

        self.x_train = x_train_trimmed.reshape(-1, self.train.shape[1], self.train.shape[2], self.train.shape[3], 1).astype('float32')
        self.x_validation = x_validation_trimmed.reshape(-1, self.validation.shape[1], self.validation.shape[2], self.validation.shape[3], 1).astype('float32')
        self.y_train = to_categorical(y_train_trimmed.astype('float32'))
        self.y_validation = to_categorical(y_validation_trimmed.astype('float32'))

        self.model = CapsNet(input_shape=self.x_train.shape[1:],
                    n_class=len(np.unique(np.argmax(self.y_train, 1))),
                    routings=self.routings,
                    batch_size=self.batch_size)

        print(self.model.summary())
    
    def run(self):
        # args (for now) copied from xifengguo implementation

        class Object(object):
            pass

        args = Object()

        args_values = {
            'save_dir': os.getcwd(),
            'lr': float(self.parameters["learning_rate"]),
            'lr_decay': float(self.parameters["learning_rate_decay"]),
            'batch_size': self.batch_size,
            'epochs': int(self.parameters["epochs"])
        }

        for key in args_values:
            setattr(args, key, args_values[key])
        
        train(model=self.model, data=((self.x_train, self.y_train), (self.x_validation, self.y_validation)), args=args, epoch_callback=self.epoch_callback)

        self.evaluate_performance()

    def evaluate_performance(self):
        # for now, evaluate performance on combination of train and validation set (pending a possible dedicated test set?)
        x_all = np.concatenate((self.train, self.validation))
        y_all = np.concatenate((self.train_labels, self.validation_labels))
        self.utilities = NewModelUtilities(self.model,
            self.preprocessing.test_batch_fetch,
            self.preprocessing.classify_batch_fetch,
            self.batch_size,
            self.preprocessing.get_all_data_shape(),
            "capsule"
        )

        scores = self.utilities.calculate_performance()
        classification_map_datauri = self.utilities.calculate_classification_map(self.class_colors)
        classification_areas = self.utilities.calculate_areas(self.class_colors)
        confusion_map_datauri = self.utilities.calculate_confusion_matrix()
        self.finish_callback(scores, classification_map_datauri, classification_areas, confusion_map_datauri)
    
def PrimaryCap(inputs, dim_capsule, n_channels, kernel_size, strides, padding):
    # output layer, reads convolutional but is the first capsule network
    # keras.layers.Conv1D: https://keras.io/api/layers/convolution_layers/convolution1d/
    # filters: defines the number of outputs of this layer
    # kernel_size: the size of the convolution window
    # strides: defines how many units our convolution window shifts after every operation
    # padding: presumably copies the edge values when a convolution window goes over the edge
    output = layers.Conv3D(filters = dim_capsule * n_channels, kernel_size = kernel_size, strides = strides, 
                        padding = padding, name="primarycap_3D")(inputs)
    
    # this layer reshapes the inputs into a given shape
    # the -1 in the shape below indicates that this value (for axis 0) needs to be calculated, based on the dim_capsule length
    # since dim_capsule is the length of the output vector of each capsule, axis 0 holds the different capsules
    # and is therefore likely n_channels long
    outputs = layers.Reshape(target_shape=[-1, dim_capsule], name="primarycap_reshape")(output)
    
    return layers.Lambda(squash, name='primarycap_squash')(outputs)

# helper method for the capsule network
def CapsNet(input_shape, n_class, routings, batch_size):
    # input_shape: shape of 1 data sample, so 2D [bands, label]
    # routings: the number of routing iterations
    # batch_size: the size of the batches
    
    # defining the input
    x = layers.Input(shape=input_shape, batch_size=batch_size)
    print(x.shape)
    conv1 = layers.Conv3D(filters=64, kernel_size=(2, 2, 5), strides=(1, 1, 1), padding="valid", name="conv1")(x)
    conv1_norm = layers.BatchNormalization(momentum=0.9, name="bn1")(conv1)
    conv1_act = layers.Activation('relu', name='act1')(conv1_norm)
    
    primarycaps = PrimaryCap(conv1_act, dim_capsule=2, n_channels=6, kernel_size=(1, 1, 3), strides=(1, 1, 1), padding="valid")
    
    # the capsule layer
    hsicaps = capsulelayers.CapsuleLayer(num_capsule=n_class, dim_capsule=2, routings=routings, name="hsicaps")(primarycaps)
    
    # this layer replaces each capsule with its length (perhaps not necessary because TensorFlow)
    out_caps = capsulelayers.Length(name="capsnet")(hsicaps)
    
    return models.Model(x, out_caps)

# copied from mnist capsnet by xifengguo
def margin_loss(y_true, y_pred):
    """
    Margin loss for Eq.(4). When y_true[i, :] contains not just one `1`, this loss should work too. Not test it.
    :param y_true: [None, n_classes]
    :param y_pred: [None, num_capsule]
    :return: a scalar loss value.
    """
    
    # return tf.reduce_mean(tf.square(y_pred))
    L = y_true * tf.square(tf.maximum(0., 0.9 - y_pred)) + \
        0.5 * (1 - y_true) * tf.square(tf.maximum(0., y_pred - 0.1))

    return tf.reduce_mean(tf.reduce_sum(L, 1))

def squash(vectors, axis=-1):
    """
    The non-linear activation used in Capsule. It drives the length of a large vector to near 1 and small vector to 0
    :param vectors: some vectors to be squashed, N-dim tensor
    :param axis: the axis to squash
    :return: a Tensor with same shape as input vectors
    """
    s_squared_norm = tf.reduce_sum(tf.square(vectors), axis, keepdims=True)
    scale = s_squared_norm / (1 + s_squared_norm) / tf.sqrt(s_squared_norm + K.epsilon())
    return scale * vectors

# training the model

def train(model, data, args, epoch_callback):
    # model: the CapsNet model
    # data: contains training and test data, in the shape ((x_train, y_train), (x_test, y_test))
    # args: parameters for the model
    
    (x_train, y_train), (x_test, y_test) = data
    
    # callbacks, to create checkpoints. Copied from mnist capsnet by xifengguo
    log = callbacks.CSVLogger(args.save_dir + '/log.csv')
    checkpoint = callbacks.ModelCheckpoint(args.save_dir + '/weights-{epoch:02d}.h5', monitor='val_capsnet_acc',
                                        save_best_only=True, save_weights_only=True, verbose=1)
    lr_decay = callbacks.LearningRateScheduler(schedule=lambda epoch: args.lr * (args.lr_decay ** epoch))
    
    model.compile(optimizer=optimizers.Adam(lr=args.lr),
                loss=[margin_loss, 'mse'],
                metrics={'capsnet': 'accuracy'})
    
    epoch_logger = EpochLogger(args.epochs, epoch_callback)
    
    # we train without data augmentation
    model.fit(x_train, y_train, batch_size=args.batch_size, epochs=args.epochs,
            validation_data=[x_test, y_test], callbacks=[log, checkpoint, lr_decay, epoch_logger])
    
    # model.save_weights(args.save_dir + "/trained_model.h5")
    # print('Trained model saved to \'%s/trained_model.h5\'' % args.save_dir)

    return model

class EpochLogger(Callback):
    def __init__(self, max_epochs, callback):
        self.max_epochs = max_epochs
        self.callback = callback

    def on_epoch_end(self, epoch, logs=None):
        self.callback(epoch + 1, self.max_epochs)
