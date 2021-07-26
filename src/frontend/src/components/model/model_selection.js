import React from 'react'

import "styling/main.css"
import 'react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css';

// bootstrap components
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Spinner from 'react-bootstrap/Spinner'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'

import RangeSlider from 'react-bootstrap-range-slider'

import { GetModelTypes, GetParameterTypes } from 'backend/model'

export default class ModelSelection extends React.Component {
    state = {
        selectedModelType: null,
        modelTypes: null,
        modelParametersLoading: false,
        modelParameters: null
    }

    componentDidMount() {
        GetModelTypes((res) => {
            if (!res) {
                alert("Something went wrong fetching model types")
            } else {
                let selectedModelType = res.data.data[0]
                if (this.props.model !== null) {
                    selectedModelType = res.data.data[res.data.data.indexOf(this.props.model.model_type)]
                }

                this.setState({
                    modelTypes: res.data.data,
                    selectedModelType: selectedModelType
                })

                this.loadModelParameters(selectedModelType, this.props.model)
            }
        })
    }

    loadModelParameters = (selectedModel, previousModel) => {
        this.setState({
            modelParametersLoading: true
        })

        GetParameterTypes(selectedModel, (res) => {
            if (!res) {
                alert("Could not fetch model parameters")
            } else {
                let modelParameters = res.data.data
                for (let param in modelParameters) {
                    modelParameters[param].valueRef = React.createRef();

                    if (previousModel !== null && previousModel !== undefined) {
                        previousModel.parameters.forEach(p => {
                            if (p.name === modelParameters[param].parameter_name) {
                                modelParameters[param].default_value = p.value
                            }
                        })
                    }
                }

                this.setState({
                    modelParametersLoading: false,
                    modelParameters: modelParameters
                })
            }
        })
    }

    changeModelType = (e) => {
        this.setState({
            selectedModelType: e.target.value
        })

        this.loadModelParameters(e.target.value)
    }
    
    validateParameters = (e) => {
        let parameters = []
        for (let param in this.state.modelParameters) {
            let parameter = {};
            parameter.name = this.state.modelParameters[param].parameter_name;
            parameter.value = Number(this.state.modelParameters[param].valueRef.current.value);
            parameters.push(parameter);
        }

        this.props.runModel(parameters, this.state.selectedModelType)
    }

    render() {
        return (
            <Container>
                <h1>Model Selection</h1><br/>
                { this.state.modelTypes === null &&
                    <Spinner animation="border"/>
                }
                { this.state.modelTypes !== null &&
                    <Row noGutters>
                        {this.state.modelTypes.map((value) => {
                            return <Col sm="auto" key={value} style={{paddingRight: "10px"}}>
                                <Button variant={this.state.selectedModelType === value ? "primary" : "outline-primary"}
                                    disabled={this.state.modelParametersLoading || this.state.selectedModelType === value} 
                                    onClick={this.changeModelType} value={value}>
                                    {value.replace("_", " ")}
                                </Button>
                            </Col>
                        })}
                    </Row>
                }
                <h2 style={{"paddingTop": "25px"}}>Parameters</h2><br/>
                { (this.state.modelParametersLoading || this.state.modelTypes === null) &&
                    <Spinner animation="border" />
                }
                { this.state.modelParameters !== null && 
                    <Form>
                        <Form.Row>
                            { this.state.modelParameters.map((param, i) => {
                                if (param.parameter_type === "slider") {
                                    return <Col xs="12" md="4" lg="3" key={i} className="no-padding-left">
                                        <span key={param.parameter_name + "-label"}><b>{param.parameter_name}</b></span>
                                        <SliderComponent key={param.parameter_name + "-value"} param={param} />
                                    </Col>
                                } else if (param.parameter_type === "parameter") {
                                    return <Col xs="12" md="4" lg="3" key={i} className="no-padding-left">
                                        <span key={param.parameter_name + "-label"}><b>{param.parameter_name}</b></span>
                                        <ParameterComponent key={param.parameter_name + "-value"} param={param}/>
                                    </Col>
                                } else {
                                    return <></>
                                }
                            })}<br/>
                        </Form.Row>
                        <Form.Row style={{marginTop: "15px"}}>
                            <Col xs="12" md="4" lg="3">
                                <Button variant="primary" className="button-wide" onClick={this.validateParameters}>Run model</Button>
                            </Col>
                        </Form.Row>
                    </Form>
                }
            </Container>
        )
    }
}

const SliderComponent = (props) => {
    const [value, setValue] = React.useState(props.param.default_value);

    return <Form.Group key={"test"} as={Row}>
        <Col xs lg="auto" style={{padding: "0"}}>
            <RangeSlider
                value={value}
                onChange={e => setValue(e.target.value)}
                min={props.param.min_value} 
                max={props.param.max_value}
                step={props.param.step}>
            </RangeSlider>
        </Col>
        <Col xs lg="auto" style={{padding: "0", marginBottom: "15px"}}>
            <Form.Control type="number" value={value} onChange={e => setValue(e.target.value)} ref={props.param.valueRef}/>
        </Col>
    </Form.Group>
}

const ParameterComponent = (props) => {
    const [value, setValue] = React.useState(props.param.default_value);

    return <Form.Group key={"test"} as={Row} noGutters>
        <Col xs lg="auto">
            <Form.Control type="number" value={value} min={props.param.min_value} max={props.param.max_value} onChange={e => setValue(e.target.value)} ref={props.param.valueRef}/>
        </Col>
    </Form.Group>
}