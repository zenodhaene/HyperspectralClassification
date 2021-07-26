// configs
import MainConfig from 'config/main_config.json'
import BackendRoutes from 'config/backend_routes.json'

import axios from 'axios'

const path = require('path')

function GetAllDatasets(callback) {
    let url = path.join(MainConfig.SERVER_URL, BackendRoutes.DATASET_ROUTES.BASE);

    axios.get(url).then(res => {
        if (res.status !== 200) {
            callback(false, res);
        } else {
            callback(res.data);
        }
    }).catch(_ => {
        callback(false);
    })
}

function GetDataset(id, callback) {
    let url = path.join(MainConfig.SERVER_URL, BackendRoutes.DATASET_ROUTES.BASE, String(id));

    axios.get(url).then(res => {
        if (res.status !== 200) {
            callback(false, res);
        } else {
            callback(res.data);
        }
    }).catch(e => {
        console.log(e);
        callback(false)
    })
}

function UploadDataset(file, datasetName, type, progressCallback, finishCallback) {
    let url = path.join(MainConfig.SERVER_URL, BackendRoutes.DATASET_ROUTES.BASE);
    let datasetId = null;
    let config = {
        headers: {
            'Content-Type': 'application/json'
        }
    }

    axios.post(url, {DatasetName: datasetName}, config).then(res => {
        if (res.status !== 201) {
            finishCallback(false);
            return;
        } else {
            datasetId = res.data.id;
        }

        if (datasetId == null) {
            finishCallback(false);
            return;
        }
    
        let formData = new FormData();
        formData.append('file', file);
        let config = {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: function(event) {
                let percentCompleted = Math.round((event.loaded * 100) / event.total);
                progressCallback(percentCompleted);
            }
        }
    
        axios.post(path.join(url, datasetId) + ("?type=" + String(type)), formData, config).then(res => {
            finishCallback(res);
        }).catch(_ => {
            finishCallback(false);
        })
    }).catch(_ => {
        finishCallback(false);
        return;
    });
}

function UploadGroundTruth(datasetId, file, type, progressCallback, finishCallback) {
    let url = path.join(MainConfig.SERVER_URL, BackendRoutes.DATASET_ROUTES.BASE, String(datasetId), BackendRoutes.DATASET_ROUTES.GROUNDTRUTH);
    let formData = new FormData();

    formData.append('file', file);
    let config = {
        headers: {
            'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: function(event) {
            let percentCompleted = Math.round((event.loaded * 100) / event.total);
            progressCallback(percentCompleted);
        }
    }

    axios.post(url + ("?type=" + String(type)), formData, config).then(res => {
        finishCallback(res);
    }).catch(e => {
        console.log(e)
        finishCallback(false);
    })
}

function EditDataset(id, newName, newResolution, callback) {
    let url = path.join(MainConfig.SERVER_URL, BackendRoutes.DATASET_ROUTES.BASE, id, BackendRoutes.DATASET_ROUTES.ID_EDIT);
    let config = {
        headers: {
            'Content-Type': 'application/json'
        }
    }
    axios.post(url, {Name: newName, Resolution: newResolution}, config).then(res => {
        if (res.status !== 200) {
            callback(false, res);
        } else {
            callback(res);
        }
    }).catch(_ => {
        callback(false);
    })
}

function ValidateDataset(id, callback) {

    let url = path.join(MainConfig.SERVER_URL, BackendRoutes.DATASET_ROUTES.BASE, id, BackendRoutes.DATASET_ROUTES.ID_VALIDATE);
    axios.get(url).then(res => {
        if (res.status !== 200) {
            callback(false, "invalid response code: " + res.status);
            return;
        }

        if (!res.data.success) {
            callback(false, res.data.message);
            return;
        }

        callback(res);
    })
}

function ValidateGroundTruth(datasetId, callback) {
    let url = path.join(MainConfig.SERVER_URL, BackendRoutes.DATASET_ROUTES.BASE, String(datasetId), BackendRoutes.DATASET_ROUTES.ID_GROUNDTRUTH_VALIDATE);
    axios.get(url).then(res => {
        if (res.status !== 200) {
            callback(false, "Invalid response code: " + res.status);
            return;
        } else {
            callback(res);
        }
    }).catch(_ => {
        callback(false);
    })
}

function ConfirmDataset(id, callback) {
    let url = path.join(MainConfig.SERVER_URL, BackendRoutes.DATASET_ROUTES.BASE, id, BackendRoutes.DATASET_ROUTES.ID_CONFIRM);
    axios.get(url).then(res => {
        if (res.status !== 200) {
            callback(false, res);
            return;
        }

        callback(true, res);
    })    
}

function GetLayer(id, layer, callback) {
    let url = path.join(MainConfig.SERVER_URL, BackendRoutes.DATASET_ROUTES.BASE, id, BackendRoutes.DATASET_ROUTES.ID_LAYER, String(layer));
    axios.get(url).then(res => {
        if (res.status !== 200) {
            callback(false, res);
            return;
        }

        callback(res);
    })
}

function CreateModel(id, classNames, classColors, classInstances, version, modelType, parameters, callback) {
    let url = path.join(MainConfig.SERVER_URL, BackendRoutes.DATASET_ROUTES.BASE, id, BackendRoutes.DATASET_ROUTES.CREATE_MODEL);
    let config = {
        headers: {
            'Content-Type': 'application/json'
        }
    }
    axios.post(url, {class_names: classNames, class_colors: classColors, class_assignments: classInstances,
            version: version, parameters: parameters, model_type: modelType}, config).then(res => {
        if (res.status !== 201) {
            callback(false, res);
        } else {
            callback(res);
        }
    }).catch(_ => {
        callback(false);
    })
}

function CreateModelWithGroundTruth(id, version, modelType, parameters, callback) {
    let url = path.join(MainConfig.SERVER_URL, BackendRoutes.DATASET_ROUTES.BASE, id, BackendRoutes.DATASET_ROUTES.CREATE_MODEL_GROUNDTRUTH);
    let config = {
        headers: {
            'Content-Type': 'application/json'
        }
    }

    axios.post(url, {version: version, parameters: parameters, model_type: modelType}, config).then(res => {
        if (res.status !== 201) {
            callback(false, res);
        } else {
            callback(res)
        }
    }).catch(_ => {
        callback(false);
    })
}

function GenerateThumbnail(id, layer, callback) {
    let url = path.join(MainConfig.SERVER_URL, BackendRoutes.DATASET_ROUTES.BASE, id, BackendRoutes.DATASET_ROUTES.ID_GENERATE_THUMBNAIL);
    let config = {
        headers: {
            'Content-Type': 'application/json'
        }
    }

    axios.post(url, {layer: layer}, config).then(res => {
        if (res.status !== 200) {
            callback(false, res);
        } else {
            callback(res.data);
        }
    }).catch(_ => {
        callback(false);
    })
}

function GenerateGroundTruthImage(id, callback) {
    let url = path.join(MainConfig.SERVER_URL, BackendRoutes.DATASET_ROUTES.BASE, id, BackendRoutes.DATASET_ROUTES.ID_GROUND_TRUTH_IMAGE)
    let config = {
        headers: {
            'Content-Type': 'application/json'
        }
    }

    axios.get(url, config).then(res => {
        if (res.status !== 200) {
            callback(false, res);
        } else {
            callback(res.data);
        }
    }).catch(_ => {
        callback(false)
    })
}

export { GetAllDatasets, GetDataset, UploadDataset, UploadGroundTruth, ValidateDataset, ConfirmDataset, 
    EditDataset, GetLayer, CreateModel, GenerateThumbnail, ValidateGroundTruth, GenerateGroundTruthImage,
    CreateModelWithGroundTruth }