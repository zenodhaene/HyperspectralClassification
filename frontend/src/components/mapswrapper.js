import React from 'react'

import "styling/main.css"

import MainConfig from 'config/main_config.json'

import { Polygon, Map, GoogleApiWrapper } from 'google-maps-react'

class MapsWrapper extends React.Component {

    state = {
        center: {
            lat: 37.773972,
            lng: -122.431297
        },
        polygon: [
            {lat: 37.8040, lng: -122.4654},
            {lat: 37.8040, lng: -122.4012},
            {lat: 37.7451, lng: -122.4012},
            {lat: 37.7451, lng: -122.4654}
        ]
    }

    constructor(props) {
        super(props)

        this.setState({
            center: {
                lat: props.center.lat,
                lng: props.center.lng
            }
        });

        this.lat = props.center.lat;
        this.lng = props.center.lng;
    }

    componentDidUpdate = () => {
        if (this.lat.toFixed(4) !== this.props.center.lat.toFixed(4) || this.lng.toFixed(4) !== this.props.center.lng.toFixed(4)) {
            this.lat = this.props.center.lat;
            this.lng = this.props.center.lng;
            this.setState({
                center: this.props.center
            })
        }
    }
    
    centerMoved = (_, map) => {
        this.lat = map.center.lat();
        this.lng = map.center.lng();
        this.props.onCenterChange(this.lat, this.lng);
    }

    render() {
        const style = {
            width: '100%',
            height: '100%'
        }

        const containerStyle = {
            position: 'relative',  
            width: '100%',
            height: '450px',
            marginBottom: '10px'
        }

        return (
            <Map 
                google={this.props.google} 
                zoom={12} 
                style={style} 
                containerStyle={containerStyle}
                center={this.state.center}
                onCenterChanged={this.centerMoved}>

                <Polygon
                    paths={this.state.polygon}
                    strokeColor="#0000FF"
                    strokeOpacity={0.8}
                    strokeWeight={2}
                    fillColor="#0000FF"
                    fillOpacity={0.35} />
            </Map>
        )
    }
}

export default GoogleApiWrapper({
    apiKey: MainConfig.GOOGLE_MAPS_API_KEY
})(MapsWrapper);