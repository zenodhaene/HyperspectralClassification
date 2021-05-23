import React from 'react'

import "styling/main.css"

import { Redirect } from 'react-router-dom';
import { Text } from 'react-native'

// bootstrap componenents
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import InputGroup from 'react-bootstrap/InputGroup'
import FormControl from 'react-bootstrap/FormControl'
import Button from 'react-bootstrap/Button'
import Spinner from 'react-bootstrap/Spinner'
import Form from 'react-bootstrap/Form'

// custom components
import Base from 'pages/base'

import { EditDataset, ConfirmDataset, GenerateThumbnail, GenerateGroundTruthImage } from 'backend/dataset'

export default class NewDatasetPage extends React.Component {
    state = {
        mapCenterLat: 37.7739,
        mapCenterLng: -122.4312,
        inputLatRefError: false,
        inputLngRefError: false,
        inputDatasetNameRefError: false,
        datatset: undefined,
        datasetId: -1,
        thumbnail: null,
        groundTruthImage: null,
        redirect: false,
        redirectUrl: null,
    }

    constructor(props) {
        super(props);
        this.googleMapRef = React.createRef();
        this.inputLatRef = React.createRef();
        this.inputLngRef = React.createRef();
        this.inputDatasetNameRef = React.createRef();
        this.inputDatasetResolutionRef = React.createRef();
        this.fileInputRef = React.createRef();
    }

    inputDatasetNameRefChanged = (event) => {
        if (this.state.inputDatasetNameRefError && event.target.value !== "") {
            this.setState({
                inputDatasetNameRefError: false
            })
        }
    }

    saveDataset = () => {
        const datasetNameInvalid = this.inputDatasetNameRef.current.value === "";

        if (datasetNameInvalid) {
            this.setState({
                inputDatasetNameRefError: true
            })
        } else {
            EditDataset(this.state.datasetId, this.inputDatasetNameRef.current.value, this.inputDatasetResolutionRef.current.value, (res, error) => {
                if (!res) {
                    alert("Something went wrong renaming the dataset");
                } else {
                    ConfirmDataset(this.state.datasetId, (success, res) => {
                        if (!success) {
                            alert("Something went wrong! Could not save your dataset");
                        } else {
                            this.setState({
                                redirect: true,
                                redirectUrl: "/datasets"
                            })
                        }
                    })
                }                
            })
        }
    }

    componentDidMount() {
        GenerateThumbnail(this.props.match.params.id, -1, (succeeded, errorRes) => {
            if (!succeeded) {
                alert("This dataset does not exist, rerouting you to the dashboard")
                this.setState({
                    redirect: true,
                    redirectUrl: "/dashboard"
                })
            } else {
                this.setState({
                    dataset: succeeded,
                    datasetId: this.props.match.params.id
                })

                if (succeeded.name !== null && succeeded.name.length !== 0) {
                    this.inputDatasetNameRef.current.value = succeeded.name
                }

                if (succeeded.resolution !== null) {
                    this.inputDatasetResolutionRef.current.value = succeeded.resolution
                }

                if (succeeded.ground_truth !== null) {
                    GenerateGroundTruthImage(succeeded.id, (succeeded, errorRes) => {
                        if (!succeeded) {
                            alert("Could not generate image for ground truth")
                        } else {
                            this.setState({
                                groundTruthImage: succeeded
                            })
                        }
                    })
                }
            }
        })
    }

    render() {

        if (this.state.redirect) {
            return <Redirect push={false} to={this.state.redirectUrl}></Redirect>
        }

        return (
            <Base>
                {this.state.dataset === undefined && 
                    <Container>
                        <Spinner />
                    </Container>
                }
                {this.state.dataset !== undefined &&
                    <Container>
                        <Form style={{display: "none"}} onChange={this.uploadGroundTruthData}>
                            <Form.Group>
                                <Form.File id="fileupload" label="Example file input" ref={this.fileInputRef} onChange={this.fileUpload}/>
                            </Form.Group>
                        </Form>
                        <h1>Dataset</h1>
                        <br/>

                        <Row>
                            <Col sm xl="6" style={{height: "80vh"}}>
                                <label htmlFor="dataset_name" className="span-underline">Give this dataset a name</label>
                                <InputGroup>
                                    <FormControl id="dataset_name"
                                        placeholder="Dataset name"
                                        aria-describedby="basic-addon2"
                                        ref={this.inputDatasetNameRef}
                                        isInvalid={this.state.inputDatasetNameRefError}
                                        onChange={this.inputDatasetNameRefChanged}/>
                                        
                                    <FormControl.Feedback type="invalid">
                                        Please fill in a valid name for you dataset
                                    </FormControl.Feedback>
                                </InputGroup>
                                {!this.state.inputDatasetNameRefError && <br/>}

                                <Row noGutters>
                                    <Col xs lg="6">
                                        <span className="span-underline">Dataset size</span><br/>
                                        <span>Dimensions: {this.state.dataset.dimension[0]} x {this.state.dataset.dimension[1]}</span><br/>
                                        <span>Spectral bands: {this.state.dataset.n_spectral_bands}</span><br/><br/>
                                    </Col>
                                    <Col xs lg="6">
                                        <label htmlFor="dataset_resolution" className="span-underline">Resolution</label>
                                        <InputGroup>
                                            <FormControl id="dataset_resolution"
                                                placeholder="Dataset resolution"
                                                aria-describedby="basic-addon2"
                                                ref={this.inputDatasetResolutionRef}/>

                                            <InputGroup.Append>
                                                <InputGroup.Text id="basic-addon2"><Text style={{fontSize: 15, lineHeight: 20}}>m</Text><Text style={{fontSize: 9, lineHeight:6}}>2</Text></InputGroup.Text>
                                            </InputGroup.Append>
                                                
                                            <FormControl.Feedback type="invalid">
                                                Please fill in a valid name for you dataset
                                            </FormControl.Feedback>
                                        </InputGroup>
                                    </Col>
                                </Row>

                                <span className="span-underline">False colour image</span>
                                <Container style={{backgroundImage: "url(" + this.state.dataset.thumbnail + ")", padding: "0"}} className="image-container">
                                    
                                </Container>
                            </Col>
                            <Col sm xl="6">
                                <h3>Ground Truth</h3>

                                { this.state.dataset.ground_truth === null && 
                                    <span style={{display: "inline-block", marginBottom: "25px"}}>No ground truth data available (add it by creating a new dataset)</span>
                                }

                                { this.state.groundTruthImage && 
                                    <Container style={{backgroundImage: "url(" + this.state.groundTruthImage + ")", padding: "0", marginBottom: "15px"}} className="image-container" />
                                }

                                <Button variant="outline-success" className="button-big" onClick={this.saveDataset}>
                                    Save dataset
                                </Button>
                            </Col>
                        </Row>
                    </Container>
                }
            </Base>
        )
    }
}