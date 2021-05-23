import React from 'react'

import 'styling/boxed_element.css'

// Bootstrap components
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Image from 'react-bootstrap/Image'

export default class ModelDetailedProgress extends React.Component {
    state = {

    }

    componentDidMount() {
        console.log(this.props.data)
    }

    render() {
        return (
            <Container className="main-container-big" 
                style={ this.props.data.status === 2 ? 
                    { background: `linear-gradient(90deg, #FFC0CB ${Math.round(this.props.data.current_epoch / this.props.data.max_epoch * 100)}%, 
                        ${Math.round(this.props.data.current_epoch / this.props.data.max_epoch * 100)}%,
                        #FFFFFF ${100 - Math.round(this.props.data.current_epoch / this.props.data.max_epoch * 100)}%)` } : 
                    {}}>
                <Row className="align-items-center h-100">
                    <Col md="2" className="col-image">
                        <Image src="/square_default_image_large.png" fluid></Image>
                    </Col>
                    <Col className="col-statistics">
                        <span className="span-big">Dataset: {this.props.data.dataset_name}</span><br/>
                        <span className="span-big">Model: v{this.props.data.version}.{this.props.data.sub_version}</span><br/>
                        <span className="span-big">Status: {
                            this.props.data.status === 1 ? "queued" : "running"
                        }</span><br/>
                        {this.props.data.status === 1 &&
                            <span className="span-big">Position in queue: {this.props.data.position_in_queue < 1 ? "will be scheduled next!" : this.props.data.position_in_queue}
                            </span>
                        }
                        {this.props.data.status === 2 &&
                            <span className="span-big">Epoch: {this.props.data.current_epoch}/{this.props.data.max_epoch}</span>
                        }
                    </Col>
                    <Col md="auto" className="col-right">
                        {this.props.data.progress !== undefined && 
                            <span>Progress: {Math.round(this.props.data.progress)}%</span>
                        }
                        {this.props.data.position !== undefined && this.props.data.queueLength !== undefined &&
                            <span>In queue: {this.props.data.position}/{this.props.data.queueLength}</span>
                        }
                    </Col>
                </Row>
            </Container>
        )
    }
}