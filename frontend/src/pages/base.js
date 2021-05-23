import NavBar from 'components/navbar'

function Base(props) {
    return(
        <>
            <NavBar></NavBar>
            {props.children}
        </>
    )
}

export default Base