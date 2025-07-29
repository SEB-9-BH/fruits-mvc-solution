const React = require('react')
/*
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String
})
*/

function SignUp (props) {
    return(
        <div>
            <h1>Sign Up For The Greatest Of All Time</h1>
            <form action="/users" method="POST">
                Name: <input type="text" name="name" /><br/>
                Email: <input type="email" name="email" /><br/>
                Password: <input type="password" name="password" /><br/>
                <input type="submit" value="Submit to Register" />
            </form>
        </div>
    )
}

module.exports = SignUp