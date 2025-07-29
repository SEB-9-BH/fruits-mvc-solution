const React = require('react')
/*
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String
})
*/

function SignIn (props) {
    return(
        <div>
            <h1>Log In For The Greatest Of All Time</h1>
            <form action="/users/login" method="POST">
                Email: <input type="email" name="email" /><br/>
                Password: <input type="password" name="password" /><br/>
                <input type="submit" value="Submit to Login" />
            </form>
        </div>
    )
}

module.exports = SignIn