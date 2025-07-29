const viewController = {
  signUp(req, res, next){
    res.render('/auth/SignUp')
  },
  signIn(req, res, next){
    res.render('/auth/SignIn')
  },
  apiAuth(req, res, next){
    res.json({user: req.user, token: res.locals.data.token})
  }
}

module.exports = viewController