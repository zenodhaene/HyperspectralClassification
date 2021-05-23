/*
  This component displays the current status of the backend server. It displays:
  - whether the server is online or offline
  - whether the server is idle or busy
  - expected time until current job is finished
  - number of jobs in the queue

  server address is read from config file
*/

import React from 'react'

// backend
import { IsOnline, JobsInQueue } from 'backend/status'

export default class ServerActivity extends React.Component {

    constructor(props) {
        super(props);
        this.mounted = false;
    }

    // TODO
    state = {
        "server_status": "checking",
        "server_idle": false,
        "jobs_in_queue": -1,
        "remaining_time_current_job": 0
    }

    componentDidMount() {
        this.mounted = true;

        this.PeriodicalCheckIntervalId = null;
        this.CrudeCountdownIntervalId = null;

        this.startPeriodicalChecker();
    }

    componentWillUnmount() {
        this.mounted = false;
        if (this.PeriodicalCheckIntervalId != null) clearInterval(this.PeriodicalCheckIntervalId)
        if (this.CrudeCountdownIntervalId != null) clearInterval(this.CrudeCountdownIntervalId)
    }

    render() {
        return (
            <>
                <span>
                    Server status: &nbsp;
                    
                    <span className={`${this.state.server_status === "online" ? "success" : "failure"}`}>
                        {this.state.server_status}
                    </span>
                </span>&emsp;

                {this.state.server_status === "online" && this.state.jobs_in_queue >= 0 && this.renderJobStatus()}
            </>
        )
    }

    renderJobStatus() {
        return (
            <>
                <span>
                    Jobs in queue: {this.state.jobs_in_queue}
                </span>&emsp;

                {/* {this.state.jobs_in_queue > 0 && this.renderCurrentJobRemainingTime()} */}
            </>
        )
    }

    renderCurrentJobRemainingTime() {
        return (
            <>
                <span>
                    Remaining time for current job:&nbsp;
                    <span className="failure">
                        {Math.floor(this.state.remaining_time_current_job / 3600)}:
                        {('0' + Math.floor(this.state.remaining_time_current_job % 3600 / 60)).slice(-2)}:
                        {('0' + this.state.remaining_time_current_job % 60).slice(-2)}
                    </span>
                </span>&emsp;
            </>
        )
    }

    startPeriodicalChecker() {
        this.periodicalChecker();
        this.PeriodicalCheckIntervalId = setInterval(this.periodicalChecker.bind(this), 5000)
    }

    periodicalChecker() {
        if (this.mounted) {
            IsOnline((isOnline) => {
                if ((isOnline && this.state.server_status !== "online") || (!isOnline && this.state.server_status !== "offline")) {
                    this.setState({"server_status": isOnline ? "online" : "offline"})
                }
    
                if (isOnline) {
                    JobsInQueue((jobsInQueue, currentJobRemainingTime) => {
                        // check if the difference between state and server is over a minute
                        if (jobsInQueue !== this.state.jobs_in_queue || Math.abs(currentJobRemainingTime - this.state.remaining_time_current_job) > 15) {
                            this.setState({"jobs_in_queue": jobsInQueue, "remaining_time_current_job": currentJobRemainingTime})
                            if (this.CrudeCountdownIntervalId !== null) clearInterval(this.CrudeCountdownIntervalId);
                            this.startCrudeCountdown();
                        }
                    })
                }
            })
        }
    }

    startCrudeCountdown() {
        this.CrudeCountdownIntervalId = setInterval(
            () => {
                var remaining_time = this.state.remaining_time_current_job - 1
                this.setState({
                    "remaining_time_current_job": remaining_time
                })

                if(remaining_time === -1) {
                    clearInterval(this.CrudeCountdownIntervalId)
                }
            },
            1000
        )
    }
}