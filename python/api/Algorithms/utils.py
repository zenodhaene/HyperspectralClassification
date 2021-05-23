import numpy as np
import tensorflow as tf
import tensorflow_addons as tfa
import random

from PIL import Image, ImageColor
from os.path import join as pjoin

def draw_classification_map(labels, save_location=None, save_name=None, colors=None):
    """
    input
    - labels: an A x B matrix containing labels. Each class will get a unique color, 
      with class 0 assumed to be unclassified and given the color black
    - save_location: a location where the image should be saved
    - save_name: a name for the saved image file

    output
    - im: the PNG image that was generated
    - legend: dict containing the classes as key and the color as value
    """

    num_classes = len(np.unique(labels))

    if colors is None:
        legend = {}
        
        # assign black color to first class
        legend[0] = (0, 0, 0)

        # assign random colors for all other classes
        for i in range(num_classes - 1):
            legend[i+1] = (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))
    else:
        legend = colors
    
    im = Image.new("RGB", (labels.shape[1], labels.shape[0]))

    # numpy stores matrix row-major, PIL works column-major
    for i in range(labels.shape[1]):
        for j in range(labels.shape[0]):
            # translation between row-major and column-major
            im.putpixel((i, j), legend[labels[j][i]])
    
    if save_location:
        assert save_name is not None, "Please specifiy a name for the image"

        im.save(pjoin(save_location, save_name) + ".png")

    return im, legend


def calculate_kappa_score(predicted, actual):
    kappa = tfa.metrics.CohenKappa(num_classes=len(np.unique(actual)), sparse_labels=True)
    kappa.update_state(actual, predicted)

    return kappa.result().numpy()


def calculate_overall_accuracy(predicted, actual):
    oa = tf.keras.metrics.Accuracy()
    oa.update_state(actual, predicted)

    return oa.result().numpy() * 100


def calculate_average_accuracy(predicted, actual):
    unique_labels, unique_counts = np.unique(actual, return_counts=True)
    class_accuracies = np.zeros(len(unique_labels))

    for i in range(len(predicted)):
        if predicted[i] == actual[i]:
            class_accuracies[predicted[i]] += 1

    class_accuracies_percent = []

    for i, acc in enumerate(class_accuracies):
        class_accuracies_percent.append(acc / unique_counts[i])

    aa = np.sum(class_accuracies_percent) / len(unique_labels)
    return aa * 100