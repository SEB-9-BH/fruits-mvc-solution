const React = require('react')

function Index (props){
    const fruits = props.fruits
    return (
        <div>
            <h1>Index Page</h1>
            <ul>
                {
                   fruits.map((fruit) => {
                    return (<li>This is the <a href={`/fruits/${fruit.id}`}>{fruit.name}</a> of the color {fruit.color}</li>)
                   }) 
                }
            </ul>
        </div>
    )
}

module.exports = Index