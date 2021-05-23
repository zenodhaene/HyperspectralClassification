import numpy as np
import matplotlib as plt
import scipy.io as sio
import math
import os

from Algorithms.MultiScalePreprocessing import MultiScalePreprocessing
from Algorithms.NewModelUtilities import NewModelUtilities
import Algorithms.capsulelayers as capsulelayers
from Algorithms.ModelParameters import ModelParameters

from Config import DISTINCT_COLOR_LIST

import tensorflow as tf
from tensorflow.keras import layers, models, optimizers, callbacks
from tensorflow.keras import backend as K
from tensorflow.keras.utils import to_categorical

from keras.callbacks import Callback

class MultiScaleCapsuleModelParameters(ModelParameters):
    def __init__(self):
        super().__init__()
        self.add_slider("patch_radius_stream_0", 1, 1, 8, 1)
        self.add_slider("patch_radius_stream_1", 3, 1, 8, 1)
        self.add_slider("patch_radius_stream_2", 5, 1, 8, 1)
        self.add_slider("spatial_kernel_size_stream_0", 2, 2, 9, 1)
        self.add_slider("spatial_kernel_size_stream_1", 2, 2, 9, 1)
        self.add_slider("spatial_kernel_size_stream_2", 2, 2, 9, 1)
        self.add_slider("dim_capsule_primary_stream", 2, 2, 8, 1)
        self.add_slider("nchannels_primary_stream_0", 4, 2, 8, 1)
        self.add_slider("nchannels_primary_stream_1", 4, 2, 8, 1)
        self.add_slider("nchannels_primary_stream_2", 4, 2, 8, 1)
        self.add_slider("spectral_kernel_size", 16, 2, 50, 1)
        self.add_slider("training_samples_per_class", 50, 10, 10000, 1)
        self.add_slider("validation_samples_per_class", 50, 10, 10000, 1)

        self.add_slider("epochs", 10, 1, 100, 1)
        self.add_parameter("batch_size", 10, 1, 500)
        self.add_parameter("learning_rate", 0.001, 0.000001, 1.0)
        self.add_parameter("learning_rate_decay", 0.9, 0.001, 1.0)

class MultiScaleCapsuleModel:
    def __init__(self, data, labels, class_colors, parameters, use_ground_truth, epoch_callback, finish_callback):
        self.data = data
        self.labels = labels
        self.class_colors = class_colors
        if use_ground_truth:
            self.class_colors = DISTINCT_COLOR_LIST
        self.epoch_callback = epoch_callback
        self.finish_callback = finish_callback

        self.model_parameters = MultiScaleCapsuleModelParameters()
        self.parameters = self.model_parameters.get_parameters_initialized(parameters)

        self.preprocessing = MultiScalePreprocessing(data, labels, 
            int(self.parameters["training_samples_per_class"]), 
            int(self.parameters["validation_samples_per_class"]),
            use_ground_truth,
            [
                int(self.parameters["patch_radius_stream_0"]),
                int(self.parameters["patch_radius_stream_1"]), 
                int(self.parameters["patch_radius_stream_2"])
            ])
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
        y_train_trimmed = self.train_labels[:-(self.train_labels.shape[0] % self.batch_size) or None]
        y_validation_trimmed = self.validation_labels[:-(self.validation_labels.shape[0] % self.batch_size) or None]

        for i in range(len(self.train)):
            self.train[i] = self.train[i][:-(self.train[i].shape[0] % self.batch_size) or None]
            self.validation[i] = self.validation[i][:-(self.validation[i].shape[0] % self.batch_size) or None]
        
        # reshaping
        for i in range(len(self.train)):
            shape = self.train[i].shape
            self.train[i] = self.train[i].reshape(-1, shape[1], shape[2], shape[3], 1)
            shape = self.validation[i].shape
            self.validation[i] = self.validation[i].reshape(-1, shape[1], shape[2], shape[3], 1)

        self.y_train = to_categorical(y_train_trimmed.astype('float32'))
        self.y_validation = to_categorical(y_validation_trimmed.astype('float32'))

        input_shapes = [i.shape[1:] for i in self.train]
        self.model = MSCapsNet(input_shapes=input_shapes,
                    n_class=len(np.unique(np.argmax(self.y_train, 1))),
                    routings=self.routings,
                    batch_size=self.batch_size,
                    parameters=self.parameters)

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
        
        train(model=self.model, data=((self.train, self.y_train), (self.validation, self.y_validation)), args=args, epoch_callback=self.epoch_callback)

        self.evaluate_performance()

    def evaluate_performance(self):
        self.utilities = NewModelUtilities(self.model,
            self.preprocessing.test_batch_fetch,
            self.preprocessing.classify_batch_fetch,
            self.batch_size,
            self.preprocessing.get_all_data_shape(),
            "mscapsule"
        )

        scores = self.utilities.calculate_performance()
        print(scores)
        
        # classify entire dataset begin
        
        classification_map_datauri = self.utilities.calculate_classification_map(self.class_colors)
        classification_areas = self.utilities.calculate_areas(self.class_colors)
        
        # uncomment exactly one of these two blocks
        # above: calculates everything, remember to uncomment relevant code in calculate_performance
        # below: only calculate score on test set, remember to comment entire dataset code in calculate_performance, to avoid unnecessary computing

        # classification_map_datauri = ""
        # classification_areas = []

        # classify entire dataset end

        confusion_map_datauri = self.utilities.calculate_confusion_matrix()

        self.finish_callback(scores, classification_map_datauri, classification_areas, confusion_map_datauri)
    
def PrimaryCap(inputs, dim_capsule, n_channels, kernel_size, strides, padding, name):
    # output layer, reads convolutional but is the first capsule network
    # keras.layers.Conv1D: https://keras.io/api/layers/convolution_layers/convolution1d/
    # filters: defines the number of outputs of this layer
    # kernel_size: the size of the convolution window
    # strides: defines how many units our convolution window shifts after every operation
    # padding: presumably copies the edge values when a convolution window goes over the edge
    output = layers.Conv3D(filters = dim_capsule * n_channels, kernel_size = kernel_size, strides = strides, 
                          padding = padding, name=name)(inputs)
    
    # this layer reshapes the inputs into a given shape
    # the -1 in the shape below indicates that this value (for axis 0) needs to be calculated, based on the dim_capsule length
    # since dim_capsule is the length of the output vector of each capsule, axis 0 holds the different capsules
    # and is therefore likely n_channels long
    outputs = layers.Reshape(target_shape=[-1, dim_capsule], name=f"{name}_reshape")(output)
    
    return layers.Lambda(squash, name=f"{name}_squash")(outputs)

# helper method for the capsule network
def MSCapsNet(input_shapes, n_class, routings, batch_size, parameters):
    input_0 = layers.Input(shape=input_shapes[0], batch_size = batch_size)
    input_1 = layers.Input(shape=input_shapes[1], batch_size = batch_size)
    input_2 = layers.Input(shape=input_shapes[2], batch_size = batch_size)
    
    conv_0 = layers.Conv3D(filters=64, kernel_size=(
        int(parameters["spatial_kernel_size_stream_0"]), 
        int(parameters["spatial_kernel_size_stream_0"]), 
        int(parameters["spectral_kernel_size"])
    ), strides=(1, 1, 5), padding="valid", name="conv0")(input_0)
    conv_1 = layers.Conv3D(filters=64, kernel_size=(
        int(parameters["spatial_kernel_size_stream_1"]), 
        int(parameters["spatial_kernel_size_stream_1"]), 
        int(parameters["spectral_kernel_size"])
    ), strides=(1, 1, 5), padding="valid", name="conv1")(input_1)
    conv_2 = layers.Conv3D(filters=64, kernel_size=(
        int(parameters["spatial_kernel_size_stream_2"]), 
        int(parameters["spatial_kernel_size_stream_2"]), 
        int(parameters["spectral_kernel_size"])
    ), strides=(1, 1, 5), padding="valid", name="conv2")(input_2)
    
    conv_0_norm = layers.BatchNormalization(momentum=0.9, name="bn_0")(conv_0)
    conv_1_norm = layers.BatchNormalization(momentum=0.9, name="bn_1")(conv_1)
    conv_2_norm = layers.BatchNormalization(momentum=0.9, name="bn_2")(conv_2)
    
    conv_0_act = layers.Activation('relu', name="act0")(conv_0_norm)
    conv_1_act = layers.Activation('relu', name="act1")(conv_1_norm)
    conv_2_act = layers.Activation('relu', name="act2")(conv_2_norm)
    
    primarycaps_0 = PrimaryCap(conv_0_act, dim_capsule=int(parameters["dim_capsule_primary_stream"]), 
                                n_channels=int(parameters["nchannels_primary_stream_0"]), kernel_size=(3, 3, 3), 
                                strides=(1, 1, 1), padding="same", name="primarycaps_0")
    primarycaps_1 = PrimaryCap(conv_1_act, dim_capsule=int(parameters["dim_capsule_primary_stream"]), 
                                n_channels=int(parameters["nchannels_primary_stream_1"]), kernel_size=(3, 3, 3), 
                                strides=(1, 1, 1), padding="valid", name="primarycaps_1")
    primarycaps_2 = PrimaryCap(conv_2_act, dim_capsule=int(parameters["dim_capsule_primary_stream"]), 
                                n_channels=int(parameters["nchannels_primary_stream_2"]), kernel_size=(3, 3, 3), 
                                strides=(1, 1, 1), padding="valid", name="primarycaps_2")
    
    model_0 = models.Model(input_0, primarycaps_0)
    model_1 = models.Model(input_1, primarycaps_1)
    model_2 = models.Model(input_2, primarycaps_2)
    
    combined = layers.Concatenate(axis=1)([model_0.output, model_1.output, model_2.output])
    
    # capsule layer
    hsicaps = capsulelayers.CapsuleLayer(num_capsule=n_class, dim_capsule=2, routings=routings, name="hsicaps")(combined)
    
    # output layer
    outcaps = capsulelayers.Length(name="capsnet")(hsicaps)
    
    return models.Model([model_0.input, model_1.input, model_2.input], outcaps)

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

    return model

class EpochLogger(Callback):
    def __init__(self, max_epochs, callback):
        self.max_epochs = max_epochs
        self.callback = callback

    def on_epoch_end(self, epoch, logs=None):
        self.callback(epoch + 1, self.max_epochs)
