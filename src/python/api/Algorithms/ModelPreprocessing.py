import numpy as np
import math

class ModelPreprocessing:
    def __init__(self, data, class_areas, patch_radius, n_train_samples, n_validation_samples):
        self.data = data
        self.class_areas = class_areas
        self.patch_radius = patch_radius
        self.n_train_samples = n_train_samples
        self.n_validation_samples = n_validation_samples

        self.training_data = None
        self.training_labels = None
        self.validation_data = None
        self.validation_labels = None
        self.test_data = None
        self.test_labels = None
        self.all_data = None
    
    def get_training_data(self):
        if self.training_data is None:
            self.calculate_training_data()
        
        return (self.training_data, self.training_labels, self.validation_data, self.validation_labels)
    
    def get_test_data(self):
        if self.test_data is None:
            self.calculate_training_data()
        
        return (self.test_data, self.test_labels)
    
    def get_all_data(self):
        if self.all_data is None:
            self.calculate_all_data()
        
        return self.all_data
    
    def get_all_data_shape(self):
        return [self.data.shape[0] - 2 * self.patch_radius, self.data.shape[1] - 2 * self.patch_radius]
    
    def calculate_training_data(self):
        print("started preprocessing")

        data = []
        labels = []

        for area in self.class_areas:
            for x in range(area["X"], area["X"] + area["Width"]):
                for y in range(area["Y"], area["Y"] + area["Height"]):
                    if y < self.patch_radius or y > self.data.shape[0] - self.patch_radius - 1:
                        continue

                    if x < self.patch_radius or x > self.data.shape[1] - self.patch_radius - 1:
                        continue

                    patch = self.data[
                        y - self.patch_radius:y + self.patch_radius + 1,
                        x - self.patch_radius:x + self.patch_radius + 1,
                        :
                    ]

                    data.append(patch)
                    labels.append(area["ClassId"])
        
        indices = np.arange(len(labels))
        np.random.shuffle(indices)
        data_shuffled = np.array(data)[indices]
        labels_shuffled = np.array(labels)[indices]

        print(data_shuffled.shape)

        [tr_d, tr_l], [v_d, v_l], [te_d, te_l] = self.select_x_training_samples(data_shuffled, labels_shuffled, 
            self.n_train_samples, self.n_validation_samples)
        self.training_data = tr_d
        self.training_labels = tr_l
        self.validation_data = v_d
        self.validation_labels = v_l
        self.test_data = te_d
        self.test_labels = te_l
    
    def calculate_all_data(self):
        all_data = []

        for y in range(self.data.shape[0]):
            for x in range(self.data.shape[1]):
                if y < self.patch_radius or y > self.data.shape[0] - self.patch_radius - 1:
                    continue

                if x < self.patch_radius or x > self.data.shape[1] - self.patch_radius - 1:
                    continue
                
                patch = self.data[
                    y - self.patch_radius:y + self.patch_radius + 1,
                    x - self.patch_radius:x + self.patch_radius + 1,
                    :
                ]

                all_data.append(patch)
        
        self.all_data = np.array(all_data)
    
    def select_x_training_samples(self, dataset, labels, x_train, x_validation):
        classes, counts = np.unique(labels, return_counts=True)
        
        train = []
        train_labels = []
        
        validation = []
        validation_labels = []
        
        test = []
        test_labels = []
        
        for c in classes:
            samples_for_class = np.array([i for i,j in zip(dataset, labels) if j == c])
            
            training_samples = min(math.floor(samples_for_class.shape[0] * 0.8 - 1), x_train)
            validation_samples = min(samples_for_class.shape[0] - training_samples - 1, x_validation)

            # select x_train samples for the training set, x_validation for validation set, rest for test set
            indices = np.arange(samples_for_class.shape[0])
            np.random.shuffle(indices)
            samples_for_class = samples_for_class[indices]
            
            train.extend(samples_for_class[:training_samples])
            validation.extend(samples_for_class[training_samples:training_samples+validation_samples])
            test.extend(samples_for_class[training_samples+validation_samples:])
            
            train_labels.extend([c] * training_samples)
            validation_labels.extend([c] * (training_samples + validation_samples))
            test_labels.extend([c] * len(samples_for_class[training_samples + validation_samples:]))
        
        # one final shuffle
        indices = np.arange(len(train))
        np.random.shuffle(indices)
        train = np.array(train)[indices]
        train_labels = np.array(train_labels)[indices]
        
        indices = np.arange(len(validation))
        np.random.shuffle(indices)
        validation = np.array(validation)[indices]
        validation_labels = np.array(validation_labels)[indices]
        
        indices = np.arange(len(test))
        np.random.shuffle(indices)
        test = np.array(test)[indices]
        test_labels = np.array(test_labels)[indices]
        
        return [train, train_labels], [validation, validation_labels], [test, test_labels]