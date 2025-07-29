const express = require('express');
const router = express.Router();
const viewController = require('./viewController.js')
const dataController = require('./dataController.js')
const authDataController = require('../auth/dataController.js')
// add routes
// Index
router.get('/', authDataController.auth
    /* check if the token exists in the header or the query, set req.user and res.locals.data.token */ , 
    dataController.index
    /*grab and save the logged in user's fruits */, 
    viewController.index
    /* display the logged in users fruits and also the link to the new page with the token*/
);
// New
router.get('/new', authDataController.auth, viewController.newView );
// Delete
router.delete('/:id', dataController.destroy, viewController.redirectHome);
// Update
router.put('/:id', dataController.update, viewController.redirectShow);
// Create
router.post('/', dataController.create, viewController.redirectHome);
// Edit
router.get('/:id/edit', dataController.show, viewController.edit);
// Show
router.get('/:id', dataController.show, viewController.show);
// export router
module.exports = router;