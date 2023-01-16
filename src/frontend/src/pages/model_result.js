import React from 'react'

import 'styling/main.css'

import { Redirect } from 'react-router-dom'

// bootstrap components
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Spinner from 'react-bootstrap/Spinner'
import Image from 'react-bootstrap/Image'
import Button from 'react-bootstrap/Button'
import Table from 'react-bootstrap/Table'
import Accordion from 'react-bootstrap/Accordion'
import Card from 'react-bootstrap/Card'

// custom components
import Base from 'pages/base'

// config
import MainConfig from 'config/main_config.json'

import { GetModel } from 'backend/model'
import { GetDataset } from 'backend/dataset'

export default class ModelResultPage extends React.Component {
    state = {
        model: null,
        dataset: null,
        classificationImage: null,
        confusionImage: null,
        redirect: false,
        redirectUrl: null,
        redirectState: null,
        currentView: "classification",
    }

    componentDidMount() {
        GetModel(this.props.match.params.id, (res) => {
            if (!res) {
                alert("Could not find this model")
            } else {
                this.setState({
                    model: res.data,
                    classificationImage: {
                        data: res.data.classification_map_data
                    },
                    confusionImage: {
                        data: res.data.confusion_map
                    }
                })

                GetDataset(res.data.dataset_id, (res) => {
                    if (!res) {
                        alert("Could not fetch dataset")
                    } else {
                        this.setState({
                            dataset: res
                        })
                    }
                })
            }
        })
    }

    createNewModel = () => {
        this.setState({
            redirect: true,
            redirectUrl: "/model/" + this.state.model.dataset_id,
            redirectState: {
                model: this.state.model
            },
        })
    }

    showClassificationMap = () => {
        this.setState({
            currentView: "classification"
        })
    }

    showConfusionMap = () => {
        this.setState({
            currentView: "confusion"
        })
    }

    render() {
        if (this.state.redirect) {
            return <Redirect push to={{pathname: this.state.redirectUrl, state: this.state.redirectState}} />
        }

        return (
            <Base>
                <Container>
                    <h1>Model result</h1><br/>
                    <Row noGutters style={{height: "85vh"}}>
                        <Col xs lg="auto">
                            {this.state.model === null && 
                                <Spinner />
                            }
                            {this.state.model !== null &&
                                <>
                                    <Accordion defaultActiveKey="0">
                                        <Card>
                                            <Accordion.Toggle as={Card.Header} eventKey="0">
                                                Performance
                                            </Accordion.Toggle>
                                            <Accordion.Collapse eventKey="0">
                                                <Card.Body>
                                                    {Object.entries(this.state.model.classification_performance).map(([key, value]) => {
                                                        return <Row key={key}>
                                                            <Col><b>{key.replace("_", " ")}</b></Col>
                                                            <Col xs lg="auto">{value.toFixed(2)}</Col>
                                                        </Row>
                                                    })}
                                                </Card.Body>
                                            </Accordion.Collapse>
                                        </Card>
                                        <Card>
                                            <Accordion.Toggle as={Card.Header} eventKey="1">
                                                Areas
                                            </Accordion.Toggle>
                                            <Accordion.Collapse eventKey="1">
                                                <Card.Body>
                                                    { this.state.model.classification_areas === null &&
                                                        <span>No area data available</span>
                                                    }
                                                    { (this.state.model.classification_areas !== null && this.state.model.classification_areas.length > 0) &&
                                                        <Table striped bordered hover size="sm">
                                                            <thead>
                                                                <tr>
                                                                    <th>Name</th>
                                                                    { (this.state.dataset !== null && this.state.dataset.resolution <= 0) &&
                                                                        <th>Area (pixels)</th>
                                                                    }
                                                                    { (this.state.dataset === null || this.state.dataset.resolution > 0) &&
                                                                        <th>Area</th>
                                                                    }
                                                                    <th>Unit</th>
                                                                    <th>Color</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {this.state.model.classification_areas.map((value, index) => {
                                                                    var backgroundColor = MainConfig.DISTINCT_COLOR_LIST[index];
                                                                    if (this.state.model.class_colors !== null && index < this.state.model.class_colors.length) {
                                                                        var backgroundColor = this.state.model.class_colors[index]
                                                                    }

                                                                    if (this.state.dataset === null || this.state.dataset.resolution <= 0) {
                                                                        if (this.state.model.class_names !== null && this.state.model.class_names[index] !== null) {
                                                                            return (<tr key={index}>
                                                                                <th>{this.state.model.class_names[index]}</th>
                                                                                <th>{value}</th>
                                                                                <th>Pixels</th>
                                                                                <th style={{backgroundColor: backgroundColor}}></th>
                                                                            </tr>)
                                                                        } else {
                                                                            return (<tr key={index}>
                                                                                <th>Class {index}</th>
                                                                                <th>{value}</th>
                                                                                <th>Pixels</th>
                                                                                <th style={{backgroundColor: backgroundColor}}></th>
                                                                            </tr>)
                                                                        }
                                                                        
                                                                    } else {
                                                                        let area = (value * this.state.dataset.resolution).toFixed(2)
                                                                        let suffix = "m"
                                                                        if (area > 10000) {
                                                                            area = (area / 1000000).toFixed(2)
                                                                            suffix = "km"
                                                                        }

                                                                        if (this.state.model.class_names !== null && this.state.model.class_names[index] !== null) {
                                                                            return (<tr key={index}>
                                                                                <th>{this.state.model.class_names[index]}</th>
                                                                                <th>{area}</th>
                                                                                <th>{suffix}^2</th>
                                                                                <th style={{backgroundColor: backgroundColor}}></th>
                                                                            </tr>)
                                                                        } else {
                                                                            return (<tr key={index}>
                                                                                <th>Class {index}</th>
                                                                                <th>{area}</th>
                                                                                <th>{suffix}^2</th>
                                                                                <th style={{backgroundColor: backgroundColor}}></th>
                                                                            </tr>)
                                                                        }
                                                                    }
                                                                })}
                                                            </tbody>
                                                        </Table>
                                                    }
                                                </Card.Body>
                                            </Accordion.Collapse>
                                        </Card>
                                        <Card>
                                            <Accordion.Toggle as={Card.Header} eventKey="2">
                                                    Parameters
                                            </Accordion.Toggle>
                                            <Accordion.Collapse eventKey="2">
                                                <Card.Body>
                                                    <Table striped bordered hover size="sm">
                                                        <thead>
                                                            <tr>
                                                                <th>Name</th>
                                                                <th>Value</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {this.state.model.parameters.map((key, value) => {
                                                                return (<tr key={value}>
                                                                    <th>{key.name}</th>
                                                                    <th>{key.value}</th>
                                                                </tr>)
                                                            })}
                                                        </tbody>
                                                    </Table>
                                                </Card.Body>
                                            </Accordion.Collapse>
                                        </Card>
                                    </Accordion>
                                    <br/>
                                    <u><h3>Change View</h3></u>
                                    <Button className="button-wide" variant={this.state.currentView === "classification" ? "primary" : "outline-primary"} 
                                        onClick={this.showClassificationMap} disabled={this.state.currentView === "classification"}>
                                        Classification map
                                    </Button><br/>
                                    <Button className="button-wide" variant={this.state.currentView === "confusion" ? "primary" : "outline-primary"} 
                                        onClick={this.showConfusionMap} disabled={this.state.currentView === "confusion"} style={{"marginTop": "5px"}}>
                                        Confusion map
                                    </Button>
                                </>
                            }
                            <Row style={{"paddingTop": "40px"}}>
                                <Button className="button-wide" variant="success" onClick={this.createNewModel}>
                                    Create new model
                                </Button>
                            </Row>
                        </Col>
                        <Col>
                            { (this.state.classificationImage !== null && this.state.currentView === "classification") &&
                                <Container className="image-container" style={{height: "700px"}}>
                                    <Image className="image-fit image-pixelated-scaling" src={this.state.classificationImage.data}/>
                                </Container>
                            }
                            { (this.state.confusionImage !== null && this.state.currentView === "confusion") &&
                                <Container className="image-container" style={{height: "700px"}}>
                                    <Image className="image-fit" src={this.state.confusionImage.data}/>
                                </Container>
                            }
                        </Col>
                    </Row>
                </Container>
            </Base>
        )
    }
}