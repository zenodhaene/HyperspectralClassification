import React from 'react'

import { Rect, Transformer } from 'react-konva'

export default class ClassInstance extends React.Component {
    state = {
        instance: null
    }

    constructor(props) {
        super(props)

        this.shapeRef = React.createRef();
        this.transformerRef = React.createRef();
        this.state.instance = this.props.instance;
    }

    componentDidUpdate() {
        if (this.props.isSelected) {
            this.transformerRef.current.nodes([this.shapeRef.current])
            this.transformerRef.current.getLayer().batchDraw();
        }

        if (this.props.instance !== this.state.instance) {
            this.setState({
                instance: this.props.instance
            })
        }
    }

    render() {
        return(
            <>
                <Rect 
                    x={this.state.instance.x}
                    y={this.state.instance.y}
                    width={this.state.instance.width}
                    height={this.state.instance.height}
                    fill={this.state.instance.color}
                    ref={this.shapeRef}
                    onClick={this.props.onSelect}
                    onTap={this.props.onSelect}
                    draggable
                    onDragStart={this.props.onSelect}
                    onDragEnd={(e) => {
                        let newPos = this.state.instance
                        newPos.x = e.target.x()
                        newPos.y = e.target.y()
                        this.props.onChange(newPos)
                    }}
                    onTransformEnd={(e) => {
                        let node = this.shapeRef.current;
                        let scaleX = node.scaleX();
                        let scaleY = node.scaleY();

                        node.scaleX(1)
                        node.scaleY(1)
                        let newPos = this.state.instance
                        newPos.x = node.x()
                        newPos.y = node.y()
                        newPos.width = Math.max(10, node.width() * scaleX)
                        newPos.height = Math.max(10, node.height() * scaleY)
                        this.setState({
                            instance: newPos
                        })
                        this.props.onChange(newPos)
                    }}
                />
                { this.props.isSelected &&
                    <Transformer 
                        ref={this.transformerRef}
                        rotateEnabled={false}
                        boundBoxFunc={(oldbox, newbox) => {
                            if (newbox.width < 10 || newbox.height < 10) {
                                return oldbox;
                            }

                            return newbox;
                        }}
                    />            
                }
            </>
        )
    }
}