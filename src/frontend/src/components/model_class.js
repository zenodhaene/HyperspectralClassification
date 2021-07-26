import React from 'react'

import "styling/main.css"
import "styling/boxed_element.css"

// bootstrap components
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'

export default class ModelClass extends React.Component {
    state = {

    }

    trash = () => {
        this.props.trashListener(this.props.nr - 1);
    }

    newInstance = () => {
        this.props.newInstanceListener(this.props.color, this.props.name)
    }

    render() {
        return(
            <Container className="container-no-padding">
                <Row noGutters className="modelclass-main-row align-items-center">
                    <Col xs lg="auto" className="modelclass-rank-container">
                        <span className="modelclass-rank">{this.props.nr}</span>
                    </Col>
                    <Col>
                        <Row noGutters  className="modelclass-inner-row align-items-center" style={{backgroundColor: this.props.color}}>
                            <Col>
                                <Container fluid>
                                    <span>{this.props.name}</span><br/>
                                    <span>Pixels selected: {this.props.pixelsSelected} / {this.props.pixelsNeeded}</span>
                                </Container>
                            </Col>
                            <Col xs lg="auto">
                                <Button variant="primary" onClick={this.newInstance}>New</Button>
                            </Col>
                            <Col xs lg="auto" className="button-trash">
                                <Button variant="danger" onClick={this.trash}>Trash</Button>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Container>
        )
    }
}