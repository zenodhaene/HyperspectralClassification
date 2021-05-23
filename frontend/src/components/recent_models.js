import React from 'react'

import "styling/main.css"

import {Link} from 'react-router-dom'

// bootstrap components
import Button from 'react-bootstrap/Button'
import Spinner from 'react-bootstrap/Spinner'
import Container from 'react-bootstrap/Container'

// custom components
import ModelDetailed from 'components/model/model_detailed'

import { GetFinishedModels } from 'backend/model'

export default class RecentModels extends React.Component {
    state = {
        models: null,
        showViewMore: false,
    }

    temp_recent_models = [

    ]

    componentDidMount() {
        this.mounted = true;
        this.PeriodicalCheckIntervalId = null;
        
        GetFinishedModels(6, (res) => {
            if (!res) {
                alert("Could not fetch recent models")
            } else {
                this.setState({
                    models: res.data.slice(0, 5),
                    showViewMore: res.data.length > 5
                })
            }
        })

        this.PeriodicalCheckIntervalId = setInterval(this.periodicalChecker.bind(this), 5000)
    }

    periodicalChecker() {
        if (this.mounted) {
            GetFinishedModels(6, (res) => {
                if (!res) {
                    alert("Could not fetch recent models")
                } else {
                    this.setState({
                        models: res.data.slice(0, 5),
                        showViewMore: res.data.length > 5
                    })
                }
            })
        }
    }
    
    componentWillUnmount() {
        if (this.PeriodicalCheckIntervalId != null) clearInterval(this.PeriodicalCheckIntervalId)
    }

    render() {
        return (
            <Container>
                <h3>Your recent model results</h3>
                <ul className="ul-no-style">
                    {this.state.models != null && this.state.models.map((value, index) => {
                        return <ModelDetailed key={index} data={value} />
                    })}
                </ul>

                {this.state.models === null &&
                    <>
                        <br/>
                        <Spinner animation="border">
                            <span className="sr-only">Loading...</span>
                        </Spinner>
                    </>
                }
                { this.state.models !== null && this.state.models.length === 0 &&
                    <>
                        <br/>
                        <h5>No recent models</h5>
                    </>
                }
                { this.state.models !== null && this.state.showViewMore &&
                    <Link to="/models"><Button variant="outline-primary" className="button-big">View more</Button></Link>
                }
            </Container>
        )
    }
}