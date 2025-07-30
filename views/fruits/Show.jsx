const React = require('react')
const Layout = require('../layouts/Layout')

function Show(props){
    return(
        <Layout fruit={props.fruit}>
            <h1>🍎 {props.fruit.name}</h1>
            
            <div className="fruit-card">
                <div className="fruit-name">{props.fruit.name}</div>
                <div className="fruit-color">Color: {props.fruit.color}</div>
                <div className={`fruit-status ${props.fruit.readyToEat ? 'ready' : 'not-ready'}`}>
                    {props.fruit.readyToEat ? '🍎 Ready to Eat' : '⏳ Not Ready Yet'}
                </div>
                
                <p className="mb-3">
                    The {props.fruit.name} is {props.fruit.color} and 
                    {props.fruit.readyToEat ? ' it is ready to eat!' : ' it is not ready to eat yet.'}
                </p>
                
                <div className="d-flex gap-2">
                    <a href={`/fruits?token=${props.token}`} className="btn btn-secondary">
                        ← Back to All Fruits
                    </a>
                    <a href={`/fruits/${props.fruit._id}/edit?token=${props.token}`} className="btn btn-primary">
                        ✏️ Edit {props.fruit.name}
                    </a>
                </div>
                
                <div className="mt-3">
                    <form action={`/fruits/${props.fruit._id}?_method=DELETE&token=${props.token}`} method="POST">
                        <button type="submit" className="btn btn-danger">
                            🗑️ Delete {props.fruit.name}
                        </button>
                    </form>
                </div>
            </div>
        </Layout>
    )
}

module.exports = Show