import 'styling/main.css';

import React from 'react'
import Base from 'pages/base'

// bootstrap components
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

// custom components
import ServerActivity from 'components/server_activity'
import RecentModels from 'components/recent_models'
import QueuedModels from 'components/queued_models'
import NewModelButtons from 'components/new_model_buttons'

export default class Dashboard extends React.Component {
    componentDidMount() {
        
    }

    render() {
        return(
            <Base>
                <Container>
                    <h1>Dashboard</h1>
                </Container><br/>
                
                <Container fluid>
                    <Row>
                        <Col xs lg="3">
                            <RecentModels />
                        </Col>
                        <Col xs lg="6">
                            <ServerActivity></ServerActivity><br/>
                            <QueuedModels></QueuedModels>
                        </Col>
                        <Col xs lg="3">
                            <NewModelButtons />
                        </Col>
                    </Row>
                </Container>
            </Base>
        )
    }
}