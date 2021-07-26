import React from 'react'

import 'styling/main.css'

import { Link } from 'react-router-dom'

// bootstrap components
import Container from 'react-bootstrap/Container'
import Button from 'react-bootstrap/Button'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

// custom components
import Base from 'pages/base'

export default class DatasetTypesPage extends React.Component {
    state = {

    }

    render() {
        return (
            <Base>
                <Container>
                    <h1>Supported datatypes</h1><br/>
                    <Row noGutters>
                        <Col xs lg="4">
                            <Link to="/datasettypes/matlab"><Button className="button-big" variant="outline-secondary">Matlab file</Button></Link>
                        </Col>
                        <Col xs lg="4">
                            
                        </Col>
                        <Col xs lg="4">
                            
                        </Col>
                    </Row>
                </Container>
            </Base>
        )
    }
}