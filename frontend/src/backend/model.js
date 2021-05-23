// configs
import MainConfig from 'config/main_config.json'
import BackendRoutes from 'config/backend_routes.json'

import axios from 'axios'

const path = require('path')

function GetModel(id, callback) {
    let url = path.join(MainConfig.SERVER_URL, BackendRoutes.MODEL_ROUTES.BASE, String(id));
    axios.get(url).then(res => {
        if (res.status !== 200) {
            callback(false, res);
        } else {
            callback(res);
        }
    }).catch(_ => {
        callback(false);
    })
}

function GetQueuedModels(howMany, callback) {
    let url = path.join(MainConfig.SERVER_URL, BackendRoutes.MODEL_ROUTES.BASE, BackendRoutes.MODEL_ROUTES.GET_QUEUED) + ("?how_many=" + String(howMany));
    axios.get(url).then(res => {
        if (res.status !== 200) {
            callback(false, res);
        } else {
            callback(res);
        }
    }).catch(_ => {
        callback(false);
    })
}

function GetFinishedModels(howMany, callback) {
    let url = path.join(MainConfig.SERVER_URL, BackendRoutes.MODEL_ROUTES.BASE, BackendRoutes.MODEL_ROUTES.GET_FINISHED) + ("?how_many=" + String(howMany));
    axios.get(url).then(res => {
        if (res.status !== 200) {
            callback(false, res);
        } else {
            callback(res);
        }
    }).catch(_ => {
        callback(false);
    })
}

function GetFilterParameters(callback) {
    let url = path.join(MainConfig.SERVER_URL, BackendRoutes.MODEL_ROUTES.BASE, BackendRoutes.MODEL_ROUTES.GET_FILTER_PARAMETERS);
    axios.get(url).then(res => {
        if (res.status !== 200) {
            callback(false, res);
        } else {
            callback(res);
        }
    }).catch(_ => {
        callback(false);
    })
}

function GetFilteredModels(howMany, page=0, dataset=null, architecture=null, sort=null, version=null, callback=null) {
    let url = path.join(MainConfig.SERVER_URL, BackendRoutes.MODEL_ROUTES.BASE, BackendRoutes.MODEL_ROUTES.GET_FILTERED)
    url += "?how_many=" + String(howMany) + "&page=" + String(page)
    if (dataset !== null) url += "&dataset=" + dataset;
    if (architecture !== null) url += "&architecture=" + architecture;
    if (sort !== null) url += "&sort=" + sort;
    if (version !== null) url += "&version_search_string=" + version

    axios.get(url).then(res => {
        if (res.status !== 200) {
            callback(false, res);
        } else {
            callback(res);
        }
    }).catch(_ => {
        callback(false);
    })
}

function GetModelTypes(callback) {
    let url = path.join(MainConfig.SERVER_URL, BackendRoutes.MODEL_ROUTES.BASE, BackendRoutes.MODEL_ROUTES.TYPES);
    axios.get(url).then(res => {
        if (res.status !== 200) {
            callback(false, res);
        } else {
            callback(res);
        }
    })
}

function GetParameterTypes(type, callback) {
    let url = path.join(MainConfig.SERVER_URL, BackendRoutes.MODEL_ROUTES.BASE, BackendRoutes.MODEL_ROUTES.GET_PARAMETER_TYPES, type);
    axios.get(url).then(res => {
        if (res.status !== 200) {
            callback(false, res);
        } else {
            callback(res)
        }
    })
}

export { GetModel, GetQueuedModels, GetFinishedModels, GetFilterParameters, GetFilteredModels, GetModelTypes, GetParameterTypes }