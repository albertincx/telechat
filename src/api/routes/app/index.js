const express = require('express');
const controller = require('../../controllers/app/app.controller');

const router = express.Router();

router.route('/application')
.get(controller.app);
router.route('/chatbot')
.get(controller.app);
module.exports = router;
