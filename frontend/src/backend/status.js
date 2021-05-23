// configs
import MainConfig from 'config/main_config.json'
import BackendRoutes from 'config/backend_routes.json'

import axios from 'axios'

const path = require('path')

function IsOnline(callback) {
    axios.get(path.join(MainConfig.SERVER_URL, BackendRoutes.STATUS_ROUTES.PING))
        .then(res => {
            callback(res.data === "pong")
        }).catch(_ => {
            callback(false)
        })
}

function JobsInQueue(callback) {
    axios.get(path.join(MainConfig.SERVER_URL, BackendRoutes.MODEL_ROUTES.BASE, BackendRoutes.MODEL_ROUTES.GET_SERVER_INFORMATION))
        .then(res => {
            callback(res.data.models_in_queue, 3600)
        }).catch(_ => {
            callback(false, null);
        })
}

export { IsOnline, JobsInQueue }