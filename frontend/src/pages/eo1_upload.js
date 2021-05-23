import React from 'react'

import { Redirect } from 'react-router-dom'

// bootstrap components
import Container from 'react-bootstrap/Container'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Col from 'react-bootstrap/Col'
import ProgressBar from 'react-bootstrap/ProgressBar'
import Spinner from 'react-bootstrap/Spinner'

import Base from 'pages/base'

import { UploadDataset, ValidateDataset } from 'backend/dataset'

export default class EO1UploadPage extends React.Component {
    state = {
        uploading: false,
        uploadProgress: 0,
        validating: false,
        validated: false,
        validateSuccess: false,
        validateErrorMessage: null,
        validateDimension: null,
        validateNSpectralBands: null,
        newDataset: null
    }

    constructor(props) {
        super(props)

        this.fileInputRef = React.createRef();
    }

    uploadNewDataset = () => {
        this.fileInputRef.current.click();
    }

    fileUpload = (e) => {
        this.setState({
            uploading: true,
            validating: false,
            validated: false,
            validateSuccess: false,
            validateErrorMessage: null,
            validateDimension: null,
            validateNSpectralBands: null,
            newDataset: {
                ...this.state.newDataset,
                file: e.target.files[0]
            }
        }, () => {
            UploadDataset(this.state.newDataset.file, null, 2, (progress) => {
                this.setState({
                    uploadProgress: progress
                })
            }, (succeeded) => {
                if (!succeeded) {
                    alert("Something went wrong! Could not upload dataset to server.")
                } else {
                    this.setState({
                        uploading: false,
                        uploadProgress: 0,
                        validating: true
                    })

                    this.fileValidate(succeeded.data.id)
                }
            })
        })
    }

    fileValidate = (id) => {
        ValidateDataset(id, (res, errorMessage) => {
            if (!res) {
                this.setState({
                    validated: true,
                    validateSuccess: false,
                    validateErrorMessage: errorMessage
                })
            } else {
                this.setState({
                    validating: false,
                    validatedId: id,
                    validated: true,
                    validateSuccess: true,
                    validateDimension: res.data["dimension"],
                    validateNSpectralBands: res.data["n_spectral_bands"],
                    validatedDataset: res.data
                })
            }
        })
    }

    saveDataset = () => {
        this.setState({
            redirectToDataset: true,
            redirectToDatasetUrl: "/dataset/" + this.state.validatedId
        })
    }

    render() {
        return (
            <Base>

                {this.state.redirectToDataset && 
                    <Redirect push={false} to={{pathname: this.state.redirectToDatasetUrl, state: {dataset: this.state.validatedDataset}}}></Redirect>
                }
            
                <Form style={{display: "none"}}>
                    <Form.Group>
                        <Form.File id="fileupload" label="Example file input" ref={this.fileInputRef} onChange={this.fileUpload}/>
                    </Form.Group>
                </Form>

                <Container>
                    <h1>Upload a dataset from Earth Observation 1</h1>
                    
                    <p>You can find datasets from the Earth Observation 1 satellite <a target="_blank" href="https://earthexplorer.usgs.gov/">here</a></p>
                    <p><b>NOTE: download the files in TF1 format!</b></p>

                    <Form.Row>
                        <Col xs lg="4">
                            <Button variant="primary" className="button-big" onClick={this.uploadNewDataset} 
                                disabled={this.state.uploading || this.state.validating}>Upload file
                            </Button>

                            {this.state.uploading && 
                                <>
                                    <span>Uploading datafile</span>
                                    <ProgressBar now={this.state.uploadProgress} label={`${this.state.uploadProgress}%`} />
                                </>
                            }

                            {this.state.validating &&
                                <>
                                    <span>Validating datafile</span><br/>
                                    <Spinner animation="border"></Spinner>
                                </>
                            }

                            {this.state.validated && !this.state.validateSuccess &&
                                <>
                                    <span>Error validating dataset, error: {this.state.validateErrorMessage}</span>
                                </>
                            }

                            {this.state.validated && this.state.validateSuccess && 
                                <>
                                    <span>Found valid data. Please confirm the information below and press confirm</span><br/><br/>
                                    <span>Key in datafile that contains the data: {this.state.validateKey}</span><br/>
                                    <span>Dimension (spatial): {this.state.validateDimension[0]} x {this.state.validateDimension[1]}</span><br/>
                                    <span>Number of spectral bands: {this.state.validateNSpectralBands}</span><br/><br/>
                                    <Button variant="outline-primary" className="button-big" onClick={this.saveDataset}>
                                        Confirm
                                    </Button>
                                </>
                            }
                        </Col>
                    </Form.Row>
                </Container>
            </Base>
        )
    }
}