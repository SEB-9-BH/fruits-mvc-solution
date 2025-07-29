const React = require('react')

function Index (props){
    const fruits = props.fruits
    return (
        <div>
            <h1>Index Page</h1>
            <a href={`/fruits/new?token=${props.token}`}>Create A New Fruit</a>
            <ul>
                {
                   fruits.map((fruit) => {
                    return (<li>This is the <a href={`/fruits/${fruit.id}?token=${props.token}`}>{fruit.name}</a> of the color {fruit.color}</li>)
                   }) 
                }
            </ul>
        </div>
    )
}

module.exports = Index