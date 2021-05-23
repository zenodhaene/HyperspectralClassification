import React from 'react'

import "styling/main.css"

import { Redirect } from 'react-router-dom';

// bootstrap components
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'
import Form from 'react-bootstrap/Form'
import FormControl from 'react-bootstrap/FormControl'
import InputGroup from 'react-bootstrap/InputGroup'
import Spinner from 'react-bootstrap/Spinner'

import { CirclePicker } from 'react-color'

// custom components
import Base from 'pages/base'
import ModelClass from 'components/model_class'
import FalseColorCanvas from 'components/false_color_canvas'
import ModelSelection from 'components/model/model_selection'

import { GetDataset, CreateModel, CreateModelWithGroundTruth, GenerateGroundTruthImage } from 'backend/dataset'

export default class ModelPage extends React.Component {
    state = {
        newClassModal: {
            open: false,
            selectedColor: "#FFFFFF",
            showColorInvalidError: false,
            showNameInvalidError: false,

            colorInvalidErrorText: null,
            nameInvalidErrorText: null,
        },
        dataset: null,
        previousModel: null,
        falseColorImage: null,
        classes: [],
        classInstances: [],
        modelVersion: -1,
        // will be filled in if the model is created from an existing one
        // this array will be cleared and copied to classInstances
        // when the datalayer renders
        classInstancesToConvert: [],
        showModelSelection: false,
        useGroundTruth: false,
        groundTruthImage: null
    }

    constructor(props) {
        super(props);

        this.colorCircleRef = React.createRef();
        this.newClassModalNameInputRef = React.createRef();
        this.colorTextInputRef = React.createRef();
        this.useGroundTruthCheckboxRef = React.createRef();
    }

    componentDidMount() {
        GetDataset(this.props.match.params.id, (res) => {
            if (!res) {
                alert("Something went wrong loading the dataset")
            } else {
                this.setState({
                    dataset: res
                }, () => {
                    if (this.props.location.state !== undefined && this.props.location.state.model !== undefined) {
                        this.setState({
                            previousModel: this.props.location.state.model
                        })
                        if (this.props.location.state.model.use_groundtruth) {
                            this.generateGroundTruthImage()
                        }
                    }
                })
            }
        });

        if (this.props.location.state !== undefined) {
            this.initializeFromModel(this.props.location.state.model)
        }
    }

    initializeFromModel = (model) => {
        let newClasses = []
        if (model.class_names !== null) {
            for (let i = 0; i < model.class_names.length; i++) {
                newClasses.push({
                    name: model.class_names[i],
                    pixelsSelected: 0,
                    pixelsNeeded: 50,
                    color: model.class_colors[i]
                })
            }
        }

        let instancesToConvert = []
        if (model.class_assignments !== null) {
            for (let i = 0; i < model.class_assignments.length; i++) {
                let ci = model.class_assignments[i]
                instancesToConvert.push({
                    className: model.class_names[ci.class_id],
                    color: model.class_colors[ci.class_id] + "55",
                    x: ci.x,
                    y: ci.y,
                    width: ci.width,
                    height: ci.height,
                    rotation: ci.rotation,
                })
            }
        }

        // size of class instances can't be determined as long as layer is not rendered
        this.setState({
            classes: newClasses,
            classInstancesToConvert: instancesToConvert,
            modelVersion: model.version,
            useGroundTruth: model.use_groundtruth
        })
    }

    openNewClassModal = () => {
        this.setState({
            newClassModal: {
                ...this.state.newClassModal,
                open: true
            }
        }, () => {
            this.colorCircleRef.current.props.colors.every((c, index) => {
                let pickedColor = false;

                this.state.classes.forEach(el => {
                    if (el.color.toLowerCase() === c.toLowerCase()) {
                        pickedColor = true;
                    }
                });

                if (!pickedColor) {
                    this.setState({
                        newClassModal: {
                            ...this.state.newClassModal,
                            selectedColor: c.toUpperCase()
                        }
                    });

                    this.colorTextInputRef.current.value = c.toUpperCase();

                    return false;
                }

                return true;
            })
        })
    }

    trashClass = (index) => {
        let newClasses = this.state.classes.slice();
        newClasses.splice(index, 1)

        this.setState({
            classes: newClasses
        })
    }

    newClassInstance = (color, className) => {
        this.setState({
            classInstances: [
                ...this.state.classInstances,
                {
                    className: className,
                    color: color,
                    x: 0,
                    y: 0,
                    width: 50,
                    height: 50
                }
            ]
        })
    }

    updateClassInstances = (newInstances) => {
        this.setState(() => ({
            classInstances: newInstances,
            classInstancesToConvert: []
        }), () => {
            this.updatePixelCounts()
        })
    }

    updatePixelCounts = () => {
        let cis = this.extractClassInstances(this.extractClassNames())
        let newClasses = []
        for (let i = 0; i < this.state.classes.length; i++) {
            let c = this.state.classes[i]
            c.pixelsSelected = 0
            newClasses.push(c)
        }

        for (let i = 0; i < cis.length; i++) {
            let ci = cis[i]
            newClasses[ci.class_id].pixelsSelected += ci.width * ci.height
        }

        this.setState({
            classes: newClasses
        })
    }

    showModelSelection = () => {
        this.setState({
            showModelSelection: true
        })
    }

    runModel = (parameters, modelType) => {
        let classNames = this.extractClassNames();
        let classInstances = this.extractClassInstances(classNames);
        let classColors = this.extractClassColors();

        if (this.state.useGroundTruth) {
            CreateModelWithGroundTruth(this.props.match.params.id, this.state.modelVersion, modelType, parameters, (res) => {
                if (!res) {
                    alert("Something went wrong when creating the model")
                } else {
                    this.setState({
                        redirect: true,
                        redirectUrl: "/dashboard"
                    })
                }
            })
        } else {
            CreateModel(this.props.match.params.id, classNames, classColors, classInstances, this.state.modelVersion, modelType, parameters, (res) => {
                if (!res) {
                    alert("Something went wrong when creating the model")
                } else {
                    this.setState({
                        redirect: true,
                        redirectUrl: "/dashboard"
                    })
                }
            })
        }
    }

    extractClassNames = () => {
        let result = []
        this.state.classes.forEach(c => {
            result.push(c.name)
        })

        return result;
    }

    extractClassColors = () => {
        let result = []

        this.state.classes.forEach(c => {
            result.push(c.color)
        });

        return result;
    }

    extractClassInstances = (classNames) => {
        let result = []
        let fci = this.state.falseColorImage;

        this.state.classInstances.forEach(ci => {
            let resolutionScaleX = fci.width / fci.data.width;
            let resolutionScaleY = fci.height / fci.data.height;
            let startX = Math.max(0, Math.floor((ci.x - fci.x) / resolutionScaleX));
            let startY = Math.max(0, Math.floor((ci.y - fci.y) / resolutionScaleY));
            let endX = Math.min(fci.data.width, Math.floor((ci.x + ci.width - fci.x) / resolutionScaleX));
            let endY = Math.min(fci.data.height, Math.floor((ci.y + ci.height - fci.y) / resolutionScaleY));

            let index = classNames.indexOf(ci.className)

            result.push({
                class_id: index,
                x: startX,
                y: startY,
                width: endX - startX,
                height: endY - startY,
                rotation: 0.0
            })
        })

        return result;
    }

    changeFalseColorImagePosition = (imagePos) => {
        this.setState(() => ({
            falseColorImage: imagePos
        }))
    }

    onGroundTruthChanged = () => {
        this.setState({
            useGroundTruth: this.useGroundTruthCheckboxRef.current.checked
        })

        if (this.useGroundTruthCheckboxRef.current.checked && this.state.groundTruthImage === null) {
            this.generateGroundTruthImage()
        }
    }

    generateGroundTruthImage = () => {
        GenerateGroundTruthImage(this.state.dataset.id, (res) => {
            if (!res) {
                alert("Could not generate ground truth image")
            } else {
                this.setState({
                    groundTruthImage: res
                })
            }
        })
    }

    render() {
        if (this.state.redirect) {
            return <Redirect push={false} to={this.state.redirectUrl}></Redirect>
        }

        return (
            <Base>
                {!this.state.showModelSelection && 
                    <Container className="full-height">
                        <Row>
                            <Col xs lg="7">
                                <h1>{this.state.dataset === null ? "" : this.state.dataset.name}</h1>
                                { (this.state.dataset !== null && !this.state.useGroundTruth) &&
                                    <FalseColorCanvas 
                                        datasetId={this.props.match.params.id} 
                                        instances={this.state.classInstances}
                                        instancesToConvert={this.state.classInstancesToConvert}
                                        updateClassInstances={this.updateClassInstances}
                                        reportImagePosition={this.changeFalseColorImagePosition}/>

                                }
                                { (this.state.dataset === null || (this.state.useGroundTruth && this.state.groundTruthImage === null)) && 
                                    <Spinner animation="border">
                                        <span className="sr-only">Loading...</span>
                                    </Spinner>
                                }
                                { (this.state.useGroundTruth && this.state.groundTruthImage !== null) &&
                                    <Container style={{backgroundImage: "url(" + this.state.groundTruthImage + ")", padding: "0", marginBottom: "15px"}} className="image-container" />
                                }
                            </Col>
                            <Col xs lg="5">
                                <h1>Classes</h1>

                                { this.state.dataset !== null && this.state.dataset.ground_truth !== null &&
                                    <Form.Group controlId="test">
                                        <Form.Check ref={this.useGroundTruthCheckboxRef} checked={this.state.useGroundTruth} 
                                            type="checkbox" label="Use ground truth instead" onChange={this.onGroundTruthChanged} />
                                    </Form.Group>
                                }

                                { !this.state.useGroundTruth &&
                                    <Container className="scrollbox" style={{height: (this.state.dataset === null || this.state.dataset.ground_truth === null) ? "75vh" : "70.9vh"}}>
                                        {this.state.classes.length === 0 && <span>No classes here! Add one by clicking the button below</span>}
                                        {this.state.classes.map((value, index) => {
                                            return <ModelClass key={index} 
                                                        nr={index + 1}
                                                        name={value.name}
                                                        pixelsSelected={value.pixelsSelected}
                                                        pixelsNeeded={value.pixelsNeeded}
                                                        color={value.color + "55"}
                                                        newInstanceListener={this.newClassInstance}
                                                        trashListener={this.trashClass}
                                                    />
                                        })}
                                    </Container>
                                }
                                
                                <Row noGutters>
                                    <Col xs lg={this.state.useGroundTruth ? "12" : "6"} className="left-column">
                                        <Button className="button-wide left-button" variant="outline-success" onClick={this.showModelSelection}>Run model</Button>
                                    </Col>
                                    { !this.state.useGroundTruth &&
                                        <Col xs lg="6" className="right-column">
                                            <Button className="button-wide right-button" 
                                                    variant="outline-primary" 
                                                    onClick={this.openNewClassModal}>
                                                Add new class
                                            </Button>
                                        </Col>
                                    }
                                </Row>
                            </Col>
                        </Row>
                    </Container>
                }
                {this.state.showModelSelection && 
                    <ModelSelection runModel={this.runModel} model={this.state.previousModel} />
                }

                {this.renderModal()}
            </Base>
        )
    }

    newClassModalClose = () => {
        this.setState({
            newClassModal: {
                ...this.state.newClassModal,
                selectedColor: "#FFFFFF",
                open: false,
                showColorInvalidError: false,
                showNameInvalidError: false,
                colorInvalidErrorText: null,
                nameInvalidErrorText: null
            }
        })
    }

    colorCirclePickerChanged = (event) => {
        this.setState({
            newClassModal: {
                ...this.state.newClassModal,
                selectedColor: event.hex
            }
        })

        this.colorTextInputRef.current.value = event.hex.toUpperCase();
    }

    addClass = () => {
        if (this.colorTextInputRef.current.value.length === 0 || !this.isColor(this.colorTextInputRef.current.value)) {
            this.setState({
                newClassModal: {
                    ...this.state.newClassModal,
                    showColorInvalidError: true,
                    colorInvalidErrorText: "Please provide a valid color. It should be in hex notation!"
                }
            })

            return;
        }

        if (this.newClassModalNameInputRef.current.value.length === 0) {
            this.setState({
                newClassModal: {
                    ...this.state.newClassModal,
                    showNameInvalidError: true,
                    nameInvalidErrorText: "Please provide a name for this class"
                }
            })

            return;
        }

        if (this.checkAlreadyPicked()) return;

        this.setState({
            classes: [
                ...this.state.classes,
                {
                    name: this.newClassModalNameInputRef.current.value,
                    pixelsSelected: 0,
                    pixelsNeeded: 50,
                    color: this.state.newClassModal.selectedColor
                }
            ]
        })

        this.newClassModalClose();
    }

    checkAlreadyPicked() {
        let colorAlreadyPicked = false;
        let classIndexColor = -1;
        let nameAlreadyPicked = false;
        let classIndexName = -1;

        this.state.classes.forEach((c, index) => {
            if (c.color.toUpperCase() === this.colorTextInputRef.current.value.toUpperCase()) {
                classIndexColor = index;
                colorAlreadyPicked = true;
            }

            if (c.name.toUpperCase() === this.newClassModalNameInputRef.current.value.toUpperCase()) {
                classIndexName = index;
                nameAlreadyPicked = true;
            }
        });

        this.setState({
            newClassModal: {
                ...this.state.newClassModal,
                showColorInvalidError: colorAlreadyPicked,
                colorInvalidErrorText: colorAlreadyPicked ? "This color already belongs to class " + (classIndexColor + 1) + ", please pick a different color" : null,
                showNameInvalidError: nameAlreadyPicked,
                nameInvalidErrorText: nameAlreadyPicked ? "This name already belongs to class " + (classIndexName + 1) + ", please pick a different name" : null
            }
        });

        return (colorAlreadyPicked || nameAlreadyPicked);
    }

    colorTextInputChange = (event) => {
        if (this.colorTextInputRef.current.value !== "" && !this.colorTextInputRef.current.value.startsWith("#")) {
            this.colorTextInputRef.current.value = "#" + this.colorTextInputRef.current.value;
        }

        let validColor = this.isColor(this.colorTextInputRef.current.value) || this.colorTextInputRef.current.value === "";

        this.setState({
            newClassModal: {
                ...this.state.newClassModal,
                selectedColor: this.colorTextInputRef.current.value,
                showColorInvalidError: !validColor,
                colorInvalidErrorText: "Please provide a valid color. It should be in hex notation!"
            }
        })
    }

    isColor (strColor){
        var s = new Option().style;
        s.color = strColor;
        var test1 = s.color === strColor;
        var test2 = /^#(?:[0-9a-fA-F]{3}){1,2}$/i.test(strColor);
        if(test1 === true || test2 === true){
            return true;
        } else{
            return false;
        }
    }

    renderModal = () => {
        return(
            <Modal show={this.state.newClassModal.open} onHide={this.newClassModalClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Add new class</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row className="align-items-center">
                        <Col xs lg="auto">
                            <span className="number-big">1</span>
                        </Col>
                        <Col>
                            <InputGroup className="mb-2 input-group-margin-fix">
                                <FormControl id="name"
                                    placeholder="Name"
                                    aria-label="name"
                                    aria-describedby="basic-addon2"
                                    ref={this.newClassModalNameInputRef}
                                    isInvalid={this.state.newClassModal.showNameInvalidError}
                                    />

                                    <FormControl.Feedback type="invalid">
                                        {this.state.newClassModal.nameInvalidErrorText}
                                    </FormControl.Feedback>
                            </InputGroup>
                            <InputGroup className="mb-2">
                                <FormControl id="color"
                                    aria-label="color"
                                    aria-describedby="basic-addon2"
                                    style={{backgroundColor: this.state.newClassModal.selectedColor + "AA"}}
                                    ref={this.colorTextInputRef}
                                    onChange={this.colorTextInputChange}
                                    isInvalid={this.state.newClassModal.showColorInvalidError}
                                    />

                                    <FormControl.Feedback type="invalid">
                                        {this.state.newClassModal.colorInvalidErrorText}
                                    </FormControl.Feedback>
                            </InputGroup>
                        </Col>
                    </Row>

                    <Row className="justify-content-md-center color-circle-picker">
                        <CirclePicker ref={this.colorCircleRef} onChange={this.colorCirclePickerChanged}/>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="success" onClick={this.addClass}>Add class</Button>
                    <Button variant="outline-danger" onClick={this.newClassModalClose}>Cancel</Button>
                </Modal.Footer>
            </Modal>
        )
    }
}