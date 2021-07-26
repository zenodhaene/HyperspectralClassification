import React from 'react'

// bootstrap components
import Container from 'react-bootstrap/Container'
import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Spinner from 'react-bootstrap/Spinner'
import Button from 'react-bootstrap/Button'

import Base from 'pages/base'
import ModelDetailed from 'components/model/model_detailed'

import { GetFilterParameters, GetFilteredModels } from 'backend/model'

export default class ModelOverviewPage extends React.Component {
    state = {
        models: null,
        filterParameters: null,
        searchFilters: {
            datasetId: null,
            architecture: null,
            sort: "finished_descending",
            version: null,
            page: 1,
        },
        filter_metadata: null
    }

    componentDidMount() {
        const query = new URLSearchParams(this.props.location.search);
        const dataset = query.get('dataset')

        if (dataset !== null) {
            this.setState({
                searchFilters: {
                    ...this.state.searchFilters,
                    datasetId: dataset
                }
            }, () => {
                this.search();
            })
        } else {
            this.search();
        }

        GetFilterParameters((res) => {
            if (!res) {
                alert("Could not find filter parameters");
            } else {
                this.setState({
                    filterParameters: {
                        ...res.data,
                        sort: "finished_descending",
                    }
                })
            }
        })
    }

    render() {
        return (
            <Base>
                <Container>
                    <h1>Models</h1>

                    {this.state.filterParameters !== null &&
                        this.renderFilters()
                    }

                    {this.state.models === null &&
                        <Spinner animation="border"/>
                    }

                    {(this.state.models !== null && this.state.models.length > 0) && 
                        <>
                            <Row>
                                <span>
                                    Showing results {(this.state.filter_metadata.current_page - 1) * this.state.filter_metadata.results_per_page + 1}-
                                    {Math.min(this.state.filter_metadata.current_page * this.state.filter_metadata.results_per_page, this.state.filter_metadata.total_results)}. 
                                    Total results: {this.state.filter_metadata.total_results}
                                </span>
                            </Row>
                            <Form.Row>
                                {this.state.models.map((model) => {
                                    return (
                                        <Col xs="12" lg="6" key={model.id}>
                                            <ModelDetailed data={model}/>
                                        </Col>
                                    )
                                })}
                            </Form.Row>
                        </>
                    }

                    {(this.state.models !== null && this.state.models.length === 0) &&
                        <h3>No models for filter criteria</h3>
                    }

                    {(this.state.filter_metadata !== null && this.state.filter_metadata.total_pages > 1) &&
                        this.renderPages()
                    }
                </Container>
            </Base>
        )
    }

    search = () => {

        this.setState({
            models: null,
            filter_metadata: null
        })

        GetFilteredModels(10, this.state.searchFilters.page === null ? 0 : this.state.searchFilters.page - 1, 
            this.state.searchFilters.datasetId, this.state.searchFilters.architecture, 
            this.state.searchFilters.sort, this.state.searchFilters.version, (res) => {
            if (!res) {
                alert("Could not fetch models")
            } else {
                this.setState({
                    models: res.data.models,
                    filter_metadata: {
                        total_results: res.data.total_results,
                        results_per_page: res.data.results_per_page,
                        current_page: res.data.current_page + 1,
                        total_pages: res.data.total_pages
                    }
                })
            }
        })
    }

    datasetChanged = (e) => {
        let datasetId = e.target.value
        if (e.target.value === "All") datasetId = null;

        this.setState({
            searchFilters: {
                ...this.state.searchFilters,
                datasetId: datasetId
            }
        }, () => {
            this.search();
        })
    }

    architectureChanged = (e) => {
        let architecture = e.target.value;
        if (e.target.value === "All") architecture = null;

        this.setState({
            searchFilters: {
                ...this.state.searchFilters,
                architecture: architecture
            }
        }, () => {
            this.search();
        })
    }

    sortChanged = (e) => {
        this.setState({
            searchFilters: {
                ...this.state.searchFilters,
                sort: e.target.value
            }
        }, () => {
            this.search();
        })
    }

    searchVersionChanged = (e) => {
        this.setState({
            searchFilters: {
                ...this.state.searchFilters,
                version: e.target.value
            }
        }, () => {
            this.search()
        })
    }

    changePage = (e) => {
        let page = parseInt(e.target.textContent)
        this.setState({
            searchFilters: {
                ...this.state.searchFilters,
                page: page
            }
        }, () => {
            this.search()
        })
    }

    renderFilters = () => {
        return (
            <Form>
                <Form.Row>
                    <Col>
                        <Form.Group>
                            <Form.Label>Dataset</Form.Label>
                            <Form.Control as="select" custom onChange={this.datasetChanged}>
                                <option>All</option>
                                {this.state.filterParameters.dataset_ids.map((dataset_id, i) => {
                                    return <option key={dataset_id} value={dataset_id}>
                                        {this.state.filterParameters.dataset_names[i]}
                                    </option>
                                })}
                            </Form.Control>
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label>Architecture</Form.Label>
                            <Form.Control as="select" custom onChange={this.architectureChanged}>
                                <option>All</option>
                                {this.state.filterParameters.architectures.map((architecture) => {
                                    return <option key={architecture} value={architecture}>
                                        {architecture.replace("_", " ")}
                                    </option>
                                })}
                            </Form.Control>
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label>Sort</Form.Label>
                            <Form.Control as="select" custom onChange={this.sortChanged}>
                                <option value="finished_descending">Finished (descending)</option>
                                <option value="finished_ascending">Finished (ascending)</option>
                                {/* <option>Overall Accuracy (descending)</option>
                                <option>Overall Accuracy (ascending)</option>
                                <option>Average Accuracy (descending)</option>
                                <option>Average Accuracy (ascending)</option> */}
                            </Form.Control>
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label>Search version</Form.Label>
                            <Form.Control placeholder="Example: v1.7, v7, 1.7, 1, .7" onChange={this.searchVersionChanged}></Form.Control>
                        </Form.Group>
                    </Col>
                </Form.Row>
            </Form>
        )
    }

    renderPages = () => {
        if (this.state.filter_metadata.total_pages <= 10) {
            return (
                <Row className="d-flex justify-content-center" style={{paddingTop: "10px"}}>
                    {Array(this.state.filter_metadata.total_pages).fill(null).map((_, index) => {
                        return <Button key={index+1} style={{marginLeft: "2px", marginRight: "2px"}} onClick={this.changePage} 
                            disabled={index + 1 === this.state.filter_metadata.current_page}>
                            {index+1}
                        </Button>
                    })}
                </Row>
            )
        } else if (this.state.filter_metadata.current_page >= 5 && this.state.filter_metadata.current_page <= this.state.filter_metadata.total_pages - 5) {
            return (
                <Row className="d-flex justify-content-center" style={{paddingTop: "10px"}}>
                    <Button key={1} style={{marginLeft: "2px", marginRight: "2px"}} onClick={this.changePage}>
                        1
                    </Button>
                    <span>...</span>
                    <Button key={this.state.filter_metadata.current_page - 2} style={{marginLeft: "2px", marginRight: "2px"}} onClick={this.changePage}>
                        {this.state.filter_metadata.current_page - 2}
                    </Button>
                    <Button key={this.state.filter_metadata.current_page - 1} style={{marginLeft: "2px", marginRight: "2px"}} onClick={this.changePage}>
                        {this.state.filter_metadata.current_page - 1}
                    </Button>
                    <Button key={this.state.filter_metadata.current_page} style={{marginLeft: "2px", marginRight: "2px"}} disabled onClick={this.changePage}>
                        {this.state.filter_metadata.current_page}
                    </Button>
                    <Button key={this.state.filter_metadata.current_page + 1} style={{marginLeft: "2px", marginRight: "2px"}} onClick={this.changePage}>
                        {this.state.filter_metadata.current_page + 1}
                    </Button>
                    <Button key={this.state.filter_metadata.current_page + 2} style={{marginLeft: "2px", marginRight: "2px"}} onClick={this.changePage}>
                        {this.state.filter_metadata.current_page + 2}
                    </Button>
                    <span>...</span>
                    <Button key={this.state.filter_metadata.total_pages} style={{marginLeft: "2px", marginRight: "2px"}} onClick={this.changePage}>
                        {this.state.filter_metadata.total_pages}
                    </Button>
                </Row>
            )
        } else if (this.state.filter_metadata.current_page < 5) {
            return (
                <Row className="d-flex justify-content-center" style={{paddingTop: "10px"}}>
                    {Array(5).fill(null).map((_, index) => {
                        return <Button key={index+1} style={{marginLeft: "2px", marginRight: "2px"}} 
                                        disabled={this.state.filter_metadata.current_page === index + 1} onClick={this.changePage}>
                            {index+1}
                        </Button>
                    })}
                    <span>...</span>
                    <Button key={this.state.filter_metadata.total_pages} style={{marginLeft: "2px", marginRight: "2px"}} onClick={this.changePage}>
                        {this.state.filter_metadata.total_pages}
                    </Button>
                </Row>
            )
        } else if (this.state.filter_metadata.current_page > this.state.filter_metadata.total_pages - 5) {
            return (
                <Row className="d-flex justify-content-center" style={{paddingTop: "10px"}}>
                    <Button key={1} style={{marginLeft: "2px", marginRight: "2px"}} onClick={this.changePage}>
                        1
                    </Button>
                    <span>...</span>
                    {Array(5).fill(null).map((_, index) => {
                        return <Button key={this.state.filter_metadata.total_pages - 5 + index + 1} 
                                        style={{marginLeft: "2px", marginRight: "2px"}} onClick={this.changePage}
                                        disabled={this.state.filter_metadata.current_page === this.state.filter_metadata.total_pages - 5 + index + 1}>
                            {this.state.filter_metadata.total_pages - 5 + index + 1}
                        </Button>
                    })}
                </Row>
            )
        }
    }
}