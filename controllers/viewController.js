const RESOURCE_PATH = '/fruits'
const viewController = {
  index(req, res, next){
    res.render('fruits/Index', res.locals.data)
  },
  show(req, res, next){
    res.render('fruits/Show', res.locals.data)
  },
  edit(req, res, next){
    res.render('fruits/Edit', res.locals.data)
  },
  newView(req, res, next){
    res.render('fruits/New')
  },
  redirectHome(req, res, next){
    res.redirect(RESOURCE_PATH)
  },
  redirectShow(req, res, next){
    res.redirect(RESOURCE_PATH + `/${req.params.id}`)
  }
}

module.exports = viewController