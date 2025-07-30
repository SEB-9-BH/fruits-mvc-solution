const React = require('react')
const Layout = require('../layouts/Layout')

function New (props) {
    return(
        <Layout>
            <h1>🍎 Add New Fruit</h1>
            
            <form action={`/fruits?token=${props.token}`} method="POST">
                <div className="form-group">
                    <label htmlFor="name">Fruit Name:</label>
                    <input 
                        type="text" 
                        id="name"
                        name="name" 
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
                        placeholder="Enter fruit color..."
                        required 
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="readyToEat">
                        <input 
                            type="checkbox" 
                            id="readyToEat"
                            name="readyToEat" 
                        />
                        Ready to Eat
                    </label>
                </div>
                
                <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary">
                        ➕ Create Fruit
                    </button>
                    <a href={`/fruits?token=${props.token}`} className="btn btn-secondary">
                        ← Back to All Fruits
                    </a>
                </div>
            </form>
        </Layout>
    )
}

module.exports = New