import {Route, Switch} from 'react-router-dom'
import Dashboard from 'pages/dashboard'
import Base from 'pages/base'
import Page404 from 'pages/404'
import DatasetsPage from 'pages/datasets'
import DatasetPage from 'pages/dataset'
import DatasetTypesPage from 'pages/dataset_types'
import MatlabDatasetTypePage from 'pages/dataset_types/matlab'
import ModelPage from 'pages/model'
import ModelResultPage from 'pages/model_result'
import ModelOverviewPage from 'pages/model_overview'
import EO1UploadPage from 'pages/eo1_upload'

function AppRouter() {
    return (
        <Switch>
          <Route exact path='/' component={Base}/>
          <Route path='/dashboard' component={Dashboard}/>
          <Route path='/datasets' component={DatasetsPage} />
          <Route path='/dataset/:id' component={DatasetPage} />
          <Route path='/dataset' component={DatasetPage} />
          <Route path='/datasettypes/matlab' component={MatlabDatasetTypePage} />
          <Route path='/datasettypes' component={DatasetTypesPage} />
          <Route path='/models' component={ModelOverviewPage} />
          <Route path='/model/result/:id' component={ModelResultPage} />
          <Route path='/model/:id' component={ModelPage} />
          <Route path='/eo1' component={EO1UploadPage} />
          <Route path='/404' component={Page404} />
        </Switch>
    )
}

export default AppRouter