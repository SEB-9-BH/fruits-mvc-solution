const React = require('react')
const Layout = require('../layouts/Layout')

function Edit (props) {
    const { name, _id, readyToEat, color } = props.fruit

    return(
        <Layout fruit={props.fruit}>
            <h1>✏️ Edit {name}</h1>
            
            <form action={`/fruits/${_id}?_method=PUT&token=${props.token}`} method="POST">
                <div className="form-group">
                    <label htmlFor="name">Fruit Name:</label>
                    <input 
                        type="text" 
                        id="name"
                        name="name" 
                        defaultValue={name}
                        placeholder="Enter fruit name..."
                        required 
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="color">Color:</label>
                    <input 
                        type="text" 
                        id="color"
                        name="color" 
                        defaultValue={color}
                        placeholder="Enter fruit color..."
                        required 
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="readyToEat">
                        {readyToEat ? (
                            <input 
                                type="checkbox" 
                                id="readyToEat"
                                name="readyToEat" 
                                defaultChecked 
                            />
                        ) : (
                            <input 
                                type="checkbox" 
                                id="readyToEat"
                                name="readyToEat" 
                            />
                        )}
                        Ready to Eat
                    </label>
                </div>
                
                <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary">
                        💾 Update Fruit
                    </button>
                    <a href={`/fruits/${_id}?token=${props.token}`} className="btn btn-secondary">
                        ← Back to {name}
                    </a>
                </div>
            </form>
        </Layout>
    )
}

module.exports = Edit