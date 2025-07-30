const React = require('react')
const Layout = require('../layouts/Layout')

function Index (props){
    const fruits = props.fruits
    return (
        <Layout>
            <h1>🍎 All Fruits</h1>
            
            <div className="d-flex justify-between align-center mb-3">
                <h2>Your Fruit Collection</h2>
                <a href={`/fruits/new?token=${props.token}`} className="btn btn-primary">
                    ➕ Add New Fruit
                </a>
            </div>
            
            {fruits.length === 0 ? (
                <div className="text-center">
                    <p>No fruits yet! Add your first fruit to get started.</p>
                    <a href={`/fruits/new?token=${props.token}`} className="btn btn-primary">
                        Add Your First Fruit
                    </a>
                </div>
            ) : (
                <div className="fruits-grid">
                    {fruits.map((fruit) => (
                        <div key={fruit._id} className="fruit-card">
                            <div className="fruit-name">{fruit.name}</div>
                            <div className="fruit-color">Color: {fruit.color}</div>
                            <div className={`fruit-status ${fruit.readyToEat ? 'ready' : 'not-ready'}`}>
                                {fruit.readyToEat ? '🍎 Ready to Eat' : '⏳ Not Ready Yet'}
                            </div>
                            <div className="d-flex gap-2">
                                <a href={`/fruits/${fruit._id}?token=${props.token}`} className="btn btn-secondary">
                                    👁️ View
                                </a>
                                <a href={`/fruits/${fruit._id}/edit?token=${props.token}`} className="btn btn-primary">
                                    ✏️ Edit
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Layout>
    )
}

module.exports = Index