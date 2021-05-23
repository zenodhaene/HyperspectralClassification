import React from 'react'

import "styling/main.css"
import "styling/boxed_element.css"

// bootstrap components
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'

import { Link } from 'react-router-dom'

export default class Dataset extends React.Component {
    state = {
        redirect: false,
        redirectUrl: null
    }

    goToModelOverview = () => {
        console.log(this.props)
    }

    render() {
        if (this.state.redirect) {
            return <Link to="/models">{this.state.redirectUrl}</Link>
        }

        return(
            <Container className="main-container">
                <Row className="align-items-center h-100">
                    <Col md="4" className="col-image h-100" style={{margin: "0"}}>
                        { this.props.thumbnail === null &&
                            <Container className="box-image-container box-image-container-center" style={{backgroundImage: "url('/square_default_image_large.png')"}}></Container>
                        }
                        { this.props.thumbnail !== null &&
                            <Container className="box-image-container box-image-container-center" style={{backgroundImage: "url('" + this.props.thumbnail + "')"}}></Container>
                        }
                    </Col>
                    <Col>
                        <h4>{this.props.name}</h4>
                        <Link to={"/models?dataset=" + this.props.id}><Button variant="outline-secondary" className="button-wide margin-bottom">View models that use this dataset</Button></Link>
                        <Link to={"/model/" + this.props.id}>
                            <Button variant="outline-secondary" className="button-wide margin-bottom">Create new model from this dataset</Button>
                        </Link>
                        <Link to={"/dataset/" + this.props.id }>
                            <Button variant="outline-secondary" className="button-wide margin-bottom">Edit this dataset</Button>
                        </Link>
                    </Col>
                </Row>
            </Container>
        )
    }
}