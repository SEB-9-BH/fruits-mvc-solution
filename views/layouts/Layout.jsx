const React = require('react')

function Layout(props){
 return(
    <html>
        <head>
            <title>{!props.fruit.name?'Hello From Fruits': props.fruit.name}</title>
            <link rel="stylesheet" href="/styles.css" />
        </head>
        <body>
            {props.children}
        </body>
    </html>
 )
}

module.exports = Layout