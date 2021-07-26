import React from 'react'

// bootstrap components
import Spinner from 'react-bootstrap/Spinner'

// custom components
import ModelDetailedProgress from 'components/model/model_detailed_progress'

import { GetQueuedModels } from 'backend/model'

export default class QueuedModels extends React.Component {
    state = {
        models: null,
        showViewMore: false,
    }

    componentDidMount() {
        this.mounted = true;
        this.PeriodicalCheckIntervalId = null;

        GetQueuedModels(6, (res) => {
            if (!res) {
                alert("Could not fetch queued models")
            } else {
                this.setState({
                    models: res.data.slice(0, 5),
                    showViewMore: res.data.length > 5
                })
            }
        })

        this.PeriodicalCheckIntervalId = setInterval(this.periodicalChecker.bind(this), 5000)
    }

    componentWillUnmount() {
        if (this.PeriodicalCheckIntervalId != null) clearInterval(this.PeriodicalCheckIntervalId)
    }

    periodicalChecker() {
        if (this.mounted) {
            GetQueuedModels(6, (res) => {
                if (!res) {
                    alert("Could not fetch queued models")
                } else {
                    this.setState({
                        models: res.data.slice(0, 5),
                        showViewMore: res.data.length > 5
                    })
                }
            })
        }
    }

    render() {
        return (
            <>
                <h3>Queued Models</h3>
                <ul className="ul-no-style">
                    {this.state.models != null && this.state.models.map((value, index) => {
                        return <ModelDetailedProgress key={index} data={value} />
                    })}

                    {this.state.models === null &&
                        <>
                            <br/>
                            <Spinner animation="border">
                                <span className="sr-only">Loading...</span>
                            </Spinner>
                        </>
                    }

                    {this.state.models !== null && this.state.models.length === 0 && 
                        <>
                            <br/>
                            <h5>No models in queue</h5>
                        </>
                    }

                    {/* {this.state.models !== null && this.state.showViewMore &&
                        // TODO
                        <Link to="/404"><Button variant="outline-primary" className="button-big">View more</Button></Link>
                    } */}
                </ul>
            </>
        )
    }
}