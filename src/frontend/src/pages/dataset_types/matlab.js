import React from 'react'

import { Redirect } from 'react-router-dom'

// bootstrap components
import Container from 'react-bootstrap/Container'
import Button from 'react-bootstrap/Button'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'
import ProgressBar from 'react-bootstrap/ProgressBar'
import Spinner from 'react-bootstrap/Spinner'

// custom components
import Base from 'pages/base'

import { UploadDataset, UploadGroundTruth, ValidateDataset, ValidateGroundTruth } from 'backend/dataset'

export default class MatlabDatasetTypePage extends React.Component {
    state = {
        uploading: false,
        uploadProgress: 0,
        validating: false,
        newDataset: {
            file: null
        },
        validated: false,
        validatedId: null,
        validateSuccess: false,
        validateErrorMessage: null,
        validateKey: null,
        validateDimension: null,
        validateNSpectralBands: null,
        validatedDataset: null,
        redirectToDataset: false,
        redirectToDatasetUrl: null,

        groundTruth: {
            validating: false,
            validated: false,
            validateSuccess: false,
            validateErrorMessage: null,
            validateKey: null,
            uploading: false,
            uploadProgress: 0,
            file: null
        }
    }

    constructor(props) {
        super(props);
        this.fileInputRef = React.createRef();
        this.fileInputRefGroundTruth = React.createRef();
    }

    uploadNewDataset = () => {
        this.fileInputRef.current.click();
    }

    uploadGroundTruth = () => {
        this.fileInputRefGroundTruth.current.click();
    }

    fileUpload = (e) => {
        this.setState({
            validated: false,
            validateSuccess: false,
            validateErrorMessage: null,
            validateKey: null,
            validateDimension: null,
            validateNSpectralBands: null,
            uploading: true,
            newDataset: {
                ...this.state.newDataset,
                file: e.target.files[0]
            }
        }, () => {
            UploadDataset(this.state.newDataset.file, null, 1, (progress) => {
                this.setState({
                    uploadProgress: progress
                })
            }, (succeeded) => {
                if (!succeeded) {
                    alert("Something went wrong! Could not upload dataset to server.");
                } else {
                    this.setState({
                        uploading: false,
                        uploadProgress: 0,
                        validating: true
                    });
                    this.fileValidate(succeeded.data.id);
                }
            })
        });
    }

    fileUploadGroundTruth = (e) => {
        this.setState({
            groundTruth: {
                ...this.state.groundTruth,
                validated: false,
                validateSuccess: false,
                validateErrorMessage: null,
                validateKey: null,
                uploading: true,
                file: e.target.files[0]
            }
        }, () => {
            UploadGroundTruth(this.state.validatedId, this.state.groundTruth.file, 1, (progress) => {
                this.setState({
                    groundTruth: {
                        ...this.state.groundTruth,
                        uploadProgress: progress
                    }
                })
            }, (succeeded) => {
                if (!succeeded) {
                    alert("Something went wrong! Could not upload ground truth datafile to server.")
                } else {
                    this.setState({
                        groundTruth: {
                            ...this.state.groundTruth,
                            uploading: false,
                            uploadProgress: 0,
                            validating: true
                        }
                    });
                    this.ValidateGroundTruth(succeeded.data.id)
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
                });
            } else {
                this.setState({
                    validating: false,
                    validatedId: id,
                    validated: true,
                    validateSuccess: true,
                    validateKey: res.data["datakey_in_file"],
                    validateDimension: res.data["dimension"],
                    validateNSpectralBands: res.data["n_spectral_bands"],
                    validatedDataset: res.data
                });
            }
        })
    }

    ValidateGroundTruth = (id) => {
        ValidateGroundTruth(id, (res, errorMessage) => {
            console.log(res)
            if (res.data["valid"]) {
                this.setState({
                    groundTruth: {
                        ...this.state.groundTruth,
                        validating: false,
                        validated: true,
                        validateSuccess: true
                    }
                })
            } else {
                this.setState({
                    groundTruth: {
                        ...this.state.groundTruth,
                        validating: false,
                        validated: true,
                        validateSuccess: false,
                        validateErrorMessage: res.data.message
                    }
                })
            }
        })
    }

    saveDataset = (e) => {
        this.setState({
            redirectToDataset: true,
            redirectToDatasetUrl: "/dataset/" + this.state.validatedId
        });
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
                    <Form.Group>
                        <Form.File id="fileupload" label="Example file input" ref={this.fileInputRefGroundTruth} onChange={this.fileUploadGroundTruth}/>
                    </Form.Group>
                </Form>
                <Container>
                    <h1>Matlab file</h1><br/>

                    <Form.Row>
                        <Col xs lg="4">
                            <h5>Hyperspectral image data</h5>
                        </Col>
                        <Col xs lg="4">
                            <h5>Ground truth data (optional)</h5>
                        </Col>
                    </Form.Row>

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
                                    <Button variant="outline-primary" className="button-big" onClick={this.saveDataset} disabled={this.state.groundTruth.validating || 
                                        (this.state.groundTruth.validated && !this.state.groundTruth.validateSuccess)}>
                                        Confirm
                                    </Button>
                                </>
                            }

                        </Col>

                        <Col xs lg="4">
                            <Button variant="primary" className="button-big" onClick={this.uploadGroundTruth} disabled={this.state.validatedId === null}>
                                Upload file
                            </Button>

                            {this.state.groundTruth.uploading && 
                                <>
                                    <span>Uploading ground truth datafile</span>
                                    <ProgressBar now={this.state.groundTruth.uploadProgress} label={`${this.state.groundTruth.uploadProgress}%`} />
                                </>
                            }

                            {this.state.groundTruth.validating &&
                                <>
                                    <span>Validating ground truth datafile</span><br/>
                                    <Spinner animation="border"></Spinner>
                                </>
                            }

                            {this.state.groundTruth.validated && !this.state.groundTruth.validateSuccess &&
                                <>
                                    <span>
                                        Error validating ground truth data, error: {this.state.groundTruth.validateErrorMessage}. 
                                        Please choose another ground truth file or refresh the page
                                    </span>
                                </>
                            }

                            {this.state.groundTruth.validated && this.state.groundTruth.validateSuccess && 
                                <>
                                    <span>Found valid ground truth data</span><br/><br/>
                                </>
                            }

                        </Col>
                    </Form.Row>
                </Container>
            </Base>
        )
    }
}