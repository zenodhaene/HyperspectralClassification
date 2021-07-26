import React from 'react'

// bootstrap components
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

// custom components
import Base from 'pages/base'
import Dataset from 'components/dataset'

import { GetAllDatasets } from 'backend/dataset'

export default class DatasetsPage extends React.Component {
    state = {
        own_datasets: []
    }

    componentDidMount() {
        GetAllDatasets((res, error) => {
            if (!res) {
                alert("Something went wrong when fetching datasets");
            } else {
                this.setState({
                    own_datasets: res
                });
            }
        });
    }

    render() {
        return (
            <Base>
                <Container>
                    <Row>
                        <Col xs lg="6">
                            <h1>Your datasets</h1>
                            <Row className="overflow-auto" style={{"height": "85vh"}}>
                                {this.state.own_datasets.map((d, i) => {
                                    return <Dataset name={d.name} id={d.id} thumbnail={d.thumbnail} key={i} />
                                })}
                            </Row>
                        </Col>
                        <Col xs lg="6">
                            <h1>Common datasets</h1>
                            <Row className="overflow-auto" style={{"height": "85vh"}}>
                                <Dataset name="Indian Pines" thumbnail={null}></Dataset>
                                <Dataset name="Salinas" thumbnail={null}></Dataset>
                                <Dataset name="Pavia Center" thumbnail={null}></Dataset>
                                <Dataset name="Pavia University" thumbnail={null}></Dataset>
                                <Dataset name="Kennedy Space Center" thumbnail={null}></Dataset>
                            </Row>
                        </Col>
                    </Row>
                </Container>
            </Base>
        )
    }
}