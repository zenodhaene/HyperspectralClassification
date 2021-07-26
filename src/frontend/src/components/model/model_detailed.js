import React from 'react'

import 'styling/boxed_element.css'

import { Redirect } from 'react-router-dom'

// Bootstrap components
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

export default class ModelDetailed extends React.Component {
    state = {
        redirect: false,
        redirectUrl: null,
        redirectState: undefined,
    }
    
    createModelFromModel = () => {
        this.setState({
            redirect: true,
            redirectUrl: "/model/result/" + this.props.data.id
        })
    }

    render() {
        if (this.state.redirect) {
            return <Redirect push to={{pathname: this.state.redirectUrl, state: this.state.redirectState}}/>
        }

        // <Image src="/square_default_image_large.png" fluid></Image>

        return (
            <Container className="main-container link-container" onClick={this.createModelFromModel}>
                <Row className="align-items-center">
                    <Col md="3" className="col-image">
                        <Container className="box-image-container box-image-container-left" style={{backgroundImage: "url(" + this.props.data.thumbnail + ")", height: "10vh", marginTop: "0"}}>

                        </Container>
                    </Col>
                    <Col className="col-statistics">
                        <span><b>Dataset:</b> {this.props.data.dataset_name}</span><br/>
                        <span><b>Model:</b> v{this.props.data.version}.{this.props.data.sub_version}</span><br/>
                        <span><b>Overall Accuracy:</b> {this.props.data.classification_performance.overall_accuracy.toFixed(2)}%</span>
                    </Col>
                </Row>
            </Container>
        )
    }
}