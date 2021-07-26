import React from 'react'
import { Stage, Layer, Image } from 'react-konva'

import "styling/main.css"

// bootstrap components
import Container from 'react-bootstrap/Container'
import Spinner from 'react-bootstrap/Spinner'
import Row from 'react-bootstrap/Row'
import Button from 'react-bootstrap/Button'
import InputGroup from 'react-bootstrap/InputGroup'
import FormControl from 'react-bootstrap/FormControl'

import { GetLayer, GetDataset } from 'backend/dataset'

import ClassInstance from 'components/class_instance'

export default class FalseColorCanvas extends React.Component {
    state = {
        width: 0,
        height: 0,
        layers: 0,
        image: {
            data: null,
            x: -1,
            y: -1,
            width: -1,
            height: -1,
            draw: false
        },
        layerInputRef: null,
        layerInputInvalid: false,
        currentLayer: null,
        instances: [],
        instancesToConvert: [],
        selectedClassInstance: -1,
    }
    
    constructor(props) {
        super(props)
        this.containerRef = React.createRef();
        this.layerInputRef = React.createRef();
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props === prevProps && this.state === prevState) return;
        
        if (this.props !== prevProps) {
            this.setState({
                instances: this.props.instances,
                instancesToConvert: this.props.instancesToConvert
            })
        }
    }

    componentDidMount() {
        this.updateWidth();

        GetDataset(this.props.datasetId, (res) => {
            if (!res) {
                alert("Something went wrong loading the dataset")
            } else {
                let defaultLayer = Math.floor(res["n_spectral_bands"] / 2);
                this.layerInputRef.current.value = defaultLayer;

                this.fetchLayer(defaultLayer)

                this.setState({
                    layers: res["n_spectral_bands"],
                })
            }
        })
    }

    fetchLayer(layer) {
        GetLayer(this.props.datasetId, layer, (res) => {
            if (!res) {
                alert("Could not render false color image")
            } else {
                let image = new window.Image();
                image.src = res.data;
                image.addEventListener('load', () => {
                    this.calculateImagePosition(image);
                })

                this.setState({
                    currentLayer: layer
                })
            }
        })
    }

    convertExistingInstances() {
        let widthRate = this.state.image.width / this.state.image.data.width;
        let heightRate = this.state.image.height / this.state.image.data.height;

        let instances = []
        for (let i in this.state.instancesToConvert) {
            let ci = this.state.instancesToConvert[i]
            instances.push({
                className: ci.className,
                color: ci.color,
                x: ci.x * widthRate + this.state.image.x,
                y: ci.y * heightRate + this.state.image.y,
                width: ci.width * widthRate,
                height: ci.height * heightRate,
                rotation: ci.rotation
            })
        }
        this.props.updateClassInstances(instances)
    }

    calculateImagePosition = (img) => {
        let widthRate = this.state.width / img.width;
        let heightRate = this.state.height / img.height;

        let rate = Math.min(widthRate, heightRate);

        this.setState({
            image: {
                ...this.state.image,
                data: img,
                x: (this.state.width - rate * img.width) / 2,
                y: (this.state.height - rate * img.height) / 2,
                width: img.width * rate,
                height: img.height * rate,
                draw: true
            }
        }, () => {
            this.props.reportImagePosition(this.state.image)

            if (this.state.instancesToConvert.length !== 0) {
                this.convertExistingInstances();
            }
        })
    }
    
    updateWidth() {
        this.setState({
            width: this.containerRef.current.clientWidth,
            height: this.containerRef.current.clientHeight
        });
    }
    
    changeLayer = () => {
        let newLayer = this.layerInputRef.current.value;

        if (newLayer < 0 || newLayer >= this.state.layers) {
            this.setState({
                layerInputInvalid: true
            })

            return;
        }

        this.setState({
            layerInputInvalid: false,
            image: {
                ...this.state.image,
                data: null,
                x: -1,
                y: -1,
                width: -1,
                height: -1,
                draw: false
            }
        });

        this.fetchLayer(newLayer);
    }

    deleteSelectedInstance = () => {
        if (this.state.selectedClassInstance !== -1) {
            let newInstances = this.state.instances.slice()
            newInstances.splice(this.state.selectedClassInstance, 1)

            this.props.updateClassInstances(newInstances)
            this.setState({
                selectedClassInstance: -1
            })
        }
    }

    render() {
        return(
            <Container>
                <Container className="px-0 false-color-image-container" ref={this.containerRef}>
                    { !this.state.image.draw &&
                        <Container className="false-color-loading-container">
                            <h3>Loading</h3>
                            <Spinner animation="border">
                                <span className="sr-only">Loading...</span>
                            </Spinner>
                        </Container>
                    }
                    { this.state.image.draw &&
                        <Stage 
                            width={this.state.width} 
                            height={this.state.height}
                            onClick={(e) => {
                                if (String(e.target.className) !== "Rect") this.setState({selectedClassInstance: -1})
                            }}>
                            <Layer>
                                <Image image={this.state.image.data} 
                                    x={this.state.image.x} 
                                    y={this.state.image.y}
                                    width={this.state.image.width}
                                    height={this.state.image.height}/>
                            </Layer>
                            <Layer>
                                {this.state.instances.map((instance, i) => {
                                    return <ClassInstance 
                                        key={i}
                                        instance={instance}
                                        isSelected={this.state.selectedClassInstance === i}
                                        onSelect={() => {
                                            this.setState({
                                                selectedClassInstance: i
                                            })
                                        }}
                                        onChange={(newpos) => {
                                            let newInstances = this.state.instances.slice()
                                            newInstances[i] = newpos
                                            instance = newpos
                                            this.props.updateClassInstances(newInstances)
                                        }}
                                    />
                                })}
                            </Layer>
                        </Stage>
                    }
                </Container>
                <Row noGutters className={this.state.layers === 0 ? 'hidden' : ''}>
                    <InputGroup className="mb-3">
                        <InputGroup.Prepend>
                            <InputGroup.Text>Layer (max {this.state.layers - 1})</InputGroup.Text>
                        </InputGroup.Prepend>
                        <FormControl
                            placeholder="Layer nr"
                            aria-label="Layer nr"
                            aria-describedby="basic-addon2"
                            type="number"
                            isInvalid={this.state.layerInputInvalid}
                            ref={this.layerInputRef}>
                        </FormControl>
                        <InputGroup.Append>
                            <Button variant="outline-secondary" onClick={this.changeLayer}>Change layer</Button>
                            <Button 
                                variant={this.state.selectedClassInstance === -1 ? "outline-secondary" : "danger"}
                                disabled={this.state.selectedClassInstance === -1}
                                onClick={this.deleteSelectedInstance}>
                                    Delete selected instance
                            </Button>
                        </InputGroup.Append>
                        <FormControl.Feedback type="invalid">The layer has to be between 0 and {this.state.layers - 1}</FormControl.Feedback>
                    </InputGroup>
                </Row>
                { this.state.selectedClassInstance !== -1 &&
                    <Row className="text-end">
                        <span style={{textAlign: "right", width: "100%", marginTop: "-16px"}}>
                            Selected instance class: {this.state.instances[this.state.selectedClassInstance].className}
                        </span>
                    </Row>
                }
            </Container>
        )
    }
}