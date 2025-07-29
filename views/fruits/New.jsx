const React = require('react')

function New (props) {
    return(
        <div>
            <h1>New Fruit Page</h1>
            <a href={`/fruits?token=${props.token}`}>Go back to Index Page</a>
            <form action={`/fruits?token=${props.token}`} method="POST">
                Name: <input type="text" name="name" /><br/>
                Color: <input type="text" name="color" /><br/>
                Is Ready To Eat: <input type="checkbox" name="readyToEat" /><br/>
                <input type="submit" value="Create Fruit" />
            </form>
        </div>
    )
}

module.exports = New