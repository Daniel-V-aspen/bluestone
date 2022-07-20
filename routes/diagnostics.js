var express = require('express');
const { Browser } = require('puppeteer-core');
const UI = require('../controller/ui')
var router = express.Router();
router.get('/steps', async function (req, res) {
    /**@type {UI} */
    let ui = req.app.locals.ui
    res.json(JSON.stringify(ui.backend.steps))
})
router.get('/userSelection', async function (req, res) {
    /**@type {UI} */
    let ui = req.app.locals.ui
    res.json(JSON.stringify(ui.operation.spy.userSelection))
})
router.get('/operationGroup', async function (req, res) {
    /**@type {UI} */
    let ui = req.app.locals.ui
    res.json(JSON.stringify(ui.backend.operationGroup))
})
router.get('/backend-operation', async function (req, res) {
    /**@type {UI} */
    let ui = req.app.locals.ui

    res.json(ui.operation.browserSelection)
})
router.get('/page-count', async function (req, res) {
    let count = -1
    if (req.app.locals.puppeteerControl.page) {
        /**@type {Browser} */
        let browser = req.app.locals.puppeteerControl.browser
        count = (await browser.pages()).length
    }
    res.json({ value: count })
})
router.get('/html-queue', async function (req, res) {
    res.json(req.app.locals.workflow.htmlCaptureStatus.__queue)
})
router.get('/ui/operation', async function (req, res) {
    /**@type {UI} */
    let ui = req.app.locals.ui
    res.json(ui.operation.spy)

})
router.get('/operation-backend/:key', async function (req, res) {
    /**@type {UI} */
    let ui = req.app.locals.ui
    let data = ui.operation.backend[req.params.key]
    try{
        res.json(data)
    } catch (error) {
        console.log(error)
    }
})
router.get('/spy-validation', async function (req, res) {
    /**@type {UI} */
    let ui = req.app.locals.ui
    res.json(JSON.stringify(ui.operation.spy.validation))
})
router.get('/spy/:key', async function (req, res) {
    /**@type {UI} */
    let ui = req.app.locals.ui
    let data = ui.operation.spy[req.params.key]
    try{
        res.json(data)
    } catch (error) {
        console.log(error)
    }
})


module.exports = router;
