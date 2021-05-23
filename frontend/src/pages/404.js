import React from 'react'

// bootstrap components

import Container from "react-bootstrap/Container"

export default class Page404 extends React.Component {

    render() {
        return (
            <Container>
                <h1>404 page not found</h1>
                <span>Woops! This link doesn't work (yet)</span>
            </Container>
        )
    }

    componentDidMount() {

    }
}