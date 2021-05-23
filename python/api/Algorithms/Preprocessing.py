import numpy as np
import math

class Preprocessing:
    def __init__(self, data, labels, n_train_samples, n_validation_samples, use_ground_truth):
        self.data = data
        self.labels = labels
        self.n_train_samples = n_train_samples
        self.n_validation_samples = n_validation_samples
        self.use_ground_truth = use_ground_truth

        self.training_data = None
        self.training_labels = None
        self.validation_data = None
        self.validation_labels = None

        # test data is handled in batches
        self.test_targets = None
        self.test_labels = None

        # classifying entire dataset is handled in batches
        self.all_data = None
    
    def get_training_data(self):
        if self.training_data is None:
            self.calculate_training_data()
        
        return (self.training_data, self.training_labels, self.validation_data, self.validation_labels)
    
    def get_valid_training_targets_per_class(self):
        result = {}

        if self.use_ground_truth:
            for y in range(self.labels.shape[0]):
                for x in range(self.labels.shape[1]):
                    if self.labels[y][x] == 0:
                        continue
                    
                    if not self.is_valid_training_target(x, y):
                        continue
                    
                    if (self.labels[y][x] - 1) not in result.keys():
                        result[self.labels[y][x] - 1] = []
                    
                    result[self.labels[y][x] - 1].append((y, x))
        else:
            for area in self.labels:
                for x in range(area["X"], area["X"] + area["Width"]):
                    for y in range(area["Y"], area["Y"] + area["Height"]):
                        if not self.is_valid_training_target(x, y):
                            continue
                        
                        if area["ClassId"] not in result.keys():
                            result[area["ClassId"]] = []
                        
                        result[area["ClassId"]].append((y, x))
        
        return result

    
    def calculate_training_data(self):
        print("started_preprocessing")
        training_targets = self.get_valid_training_targets_per_class()

        data_train = self.model_preprocess_pre()
        data_validation = self.model_preprocess_pre()

        labels_train = []
        labels_validation = []

        targets_test = []
        labels_test = []

        for c in training_targets:
            targets = training_targets[c]
            indices = np.arange(len(targets))
            np.random.shuffle(indices)
            targets = np.array(targets)[indices]

            (data_train, data_validation) = self.model_preprocess(targets, data_train, data_validation)

            labels_train.extend([c] * self.n_train_samples)
            labels_validation.extend([c] * self.n_validation_samples)

            if len(targets) < self.n_train_samples + self.n_train_samples:
                targets_test.extend([targets[-1]])
                labels_test.extend([c])
            else:
                targets_test.extend(targets[self.n_train_samples + self.n_validation_samples:])
                labels_test.extend([c] * len(targets[self.n_train_samples + self.n_validation_samples:]))
        
        # shuffle data for train and validation
        (data_train, labels_train) = self.model_preprocess_post(data_train, labels_train, shuffle=True)
        (data_validation, labels_validation) = self.model_preprocess_post(data_validation, labels_validation, shuffle=True)

        # shuffle test data
        indices_test = np.arange(len(labels_test))
        np.random.shuffle(indices_test)
        targets_test = np.array(targets_test)[indices_test]
        labels_test = np.array(labels_test)[indices_test]

        self.training_data = data_train
        self.validation_data = data_validation
        self.training_labels = labels_train
        self.validation_labels = labels_validation
        self.test_targets = targets_test
        self.test_labels = labels_test

    def test_batch_fetch(self, batch, batch_size):
        if (batch * batch_size > len(self.test_targets)):
            return None
        
        targets = self.test_targets[batch * batch_size:min((batch + 1) * batch_size, len(self.test_targets))]
        test_labels = self.test_labels[batch * batch_size:min((batch + 1) * batch_size, len(self.test_labels))]

        return self.model_get_test_batch(targets, test_labels)
    
    def classify_batch_fetch(self, batch, batch_size):
        data = self.model_preprocess_pre()

        for i in range(batch * batch_size, batch * batch_size + batch_size):
            y = math.floor(i / self.data.shape[1])
            x = math.floor(i % self.data.shape[1])

            if not self.is_valid_training_target(x, y):
                continue

            data = self.model_preprocess_one(data, x, y)
            
        (data, labels) = self.model_preprocess_post(data, None, shuffle=False)

        return (data, (self.data.shape[0] * self.data.shape[1]) - (batch * batch_size))
    
    """
    input: (targets, labels)
    - targets: (y, x)-pairs representing pixels in the test set
    - labels: class labels for the respective samples in targets

    output: (test_data, labels)
    - test_data: preprocessed test data
    - labels: class labels for the respective samples in test_data
    """
    def model_get_test_batch(self, targets, labels):
        raise NotImplementedError("This method needs to be implemented by the specific model")
    
    """
    input: (x, y)
    - x: x coordinate of the pixel whose validity is being tested
    - y: y coordinate of the pixels whose validity is being tested

    output: (valid)
    - valid: whether this pixel can be preprocessed correctly (could be False for pixels on the edge)
    """
    def is_valid_training_target(self, x, y):
        raise NotImplementedError("This method needs to be implemented by the specific model")
    
    """
    input: ()

    output: (data)
    - data: the structure that the preprocessed data will take, for example an array of three empty arrays for three datastreams
    """
    def model_preprocess_pre(self):
        raise NotImplementedError("This method needs to be implemented by the specific model")
    
    """
    input: (data, x, y)
    - data: the current data array, new sample should be appended
    - x: x coordinate of the target pixel
    - y: y coordinate of the target pixel

    output: (data)
    - data: the new data array, now including the sample with coordinates (y, x)
    """
    def model_preprocess_one(self, data, x, y):
        raise NotImplementedError("This method needs to be implemented by the specific model")
    
    """
    input: (targets, data_train, data_validation)
    - targets: (y, x)-pairs valid for being selected for train and validation set
    - data_train: the structure returned by model_preprocess_pre for the training data, new samples should be appended
    - data_validation: the structure returned by model_preprocess_pre for the validation data, new samples should be appended

    output: (data_train, data_validation)
    - data_train: the filled data structure with training data
    - data_validation: the filled data structure with validation data
    """
    def model_preprocess(self, targets, data_train, data_validation):
        raise NotImplementedError("This method needs to be implemented by the specific model")
    
    """
    input: (data, labels, shuffle)
    - data: the preprocessed data structure
    - labels: the corresponding labels for the data structure
    - shuffle: whether the data (and labels) should be shuffled

    output: (data, labels)
    - data: the postprocessed data structure
    - labels: the postprocessed labels, optionally shuffled in the same way as the data
    """
    def model_preprocess_post(self, data, labels, shuffle=False):
        raise NotImplementedError("This method needs to be implemented by the specific model")
    
    """
    input: ()
    output: (shape)
    - shape: the shape of all the data after preprocessing
    """
    def get_all_data_shape(self):
        raise NotImplementedError("This method needs to be implemented by the specific model")
    