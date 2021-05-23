import React from 'react'

import "styling/main.css"

import { Link } from 'react-router-dom'

// bootstrap components
import Button from 'react-bootstrap/Button'

export default class NewModelButtons extends React.Component {
    state = {
        
    }

    render() {
        return (
            <>
                <h3>Create a new model</h3>
                <Link to="/datasettypes"><Button variant="outline-secondary" className="button-big" onClick={this.uploadNewDataset}>Upload new dataset</Button></Link>
                <Link to="/datasets"><Button variant="outline-secondary" className="button-big">Uploaded datasets</Button></Link>
                <Link to="/eo1"><Button variant="outline-secondary" className="button-big">Earth Observation 1</Button></Link>
            </>
        )
    }
}