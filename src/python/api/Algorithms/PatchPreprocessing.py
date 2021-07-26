import numpy as np

from Algorithms.Preprocessing import Preprocessing

class PatchPreprocessing(Preprocessing):
    def __init__(self, data, labels, n_train_samples, n_validation_samples, use_ground_truth, patch_radius):
        super().__init__(data, labels, n_train_samples, n_validation_samples, use_ground_truth)

        self.patch_radius = patch_radius
    
    """
    input: (targets, labels)
    - targets: (y, x)-pairs representing pixels in the test set
    - labels: class labels for the respective samples in targets

    output: (test_data, labels)
    - test_data: preprocessed test data
    - labels: class labels for the respective samples in test_data
    """
    def model_get_test_batch(self, targets, labels):
        test_data = self.model_preprocess_pre()

        for (y, x) in targets:
            test_data = self.model_preprocess_one(test_data, x, y)
        
        return self.model_preprocess_post(test_data, labels, shuffle=False)
    
    """
    input: (x, y)
    - x: x coordinate of the pixel whose validity is being tested
    - y: y coordinate of the pixels whose validity is being tested

    output: (valid)
    - valid: whether this pixel can be preprocessed correctly (could be False for pixels on the edge)
    """
    def is_valid_training_target(self, x, y):
        if y < self.patch_radius or y > self.data.shape[0] - self.patch_radius - 1:
            return False
        
        if x < self.patch_radius or x > self.data.shape[1] - self.patch_radius - 1:
            return False
        
        return True
    
    """
    input: ()

    output: (data)
    - data: the structure that the preprocessed data will take, for example an array of three empty arrays for three datastreams
    """
    def model_preprocess_pre(self):
        return []
    
    """
    input: (data, x, y)
    - data: the current data array, new sample should be appended
    - x: x coordinate of the target pixel
    - y: y coordinate of the target pixel

    output: (data)
    - data: the new data array, now including the sample with coordinates (y, x)
    """
    def model_preprocess_one(self, data, x, y):
        data.append(self.data[
            y - self.patch_radius:y + self.patch_radius + 1,
            x - self.patch_radius:x + self.patch_radius + 1,
            :
        ])
        
        return data
    
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
        j = 0
        while j < self.n_train_samples + self.n_validation_samples:
            (y, x) = targets[min(j, len(targets) - 1)]
            
            if j < min(self.n_train_samples, len(targets) / 2.0):
                data_train = self.model_preprocess_one(data_train, x, y)
            elif j >= min(self.n_train_samples, len(targets) / 2.0) and j < self.n_train_samples:
                # repick an earlier training sample
                chosen_sample = np.random.randint(len(data_train))
                data_train.append(data_train[chosen_sample])
            elif j < self.n_train_samples + min(self.n_validation_samples, len(targets) / 2.0):
                data_validation = self.model_preprocess_one(data_validation, x, y)
            else:
                # repick an earlier validation sample
                chosen_sample = np.random.randint(len(data_validation))
                data_validation.append(data_validation[chosen_sample])
            
            j += 1
        
        return (data_train, data_validation)
    
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
        if labels is not None:
            labels = np.array(labels)
        
        data = np.array(data)

        if shuffle:
            indices = np.arange(len(labels))
            np.random.shuffle(indices)

            if labels is not None:
                labels = labels[indices]
            
            data = data[indices]
        
        return (data, labels)
    
    """
    input: ()
    output: (shape)
    - shape: the shape of all the data after preprocessing
    """
    def get_all_data_shape(self):
        return [self.data.shape[0] - 2 * self.patch_radius, self.data.shape[1] - 2 * self.patch_radius]

    