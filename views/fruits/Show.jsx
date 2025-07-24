const React = require('react')

const styles = {
    backgroundColor: 'red',
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'column'
}
const h1Styles = {
    backgroundColor: 'black',
    color: 'ghostwhite',
    textAlign: 'center'
}

function Show(props){
    return(
        <div style={styles}>
            <h1 style={h1Styles}>{props.fruit.name}</h1>
            <a href='/fruits'>Go back to Index Page</a>
            <p>
                The {props.fruit.name} is {props.fruit.color} and 
                {props.fruit.readyToEat? 'It is ready to eat': 'It is not ready to eat'}
            </p>
              <form action={`/fruits/${props.fruit._id}?_method=DELETE`} method="POST">
                <input type="submit" value={`Delete this ${props.fruit.name}`}/>
            </form>
            <div>
            <a href={`/fruits/${props.fruit._id}/edit`}><button>{`Edit this ${props.fruit.name}`}</button></a>
            </div>
        </div>
    )
}

module.exports = Show