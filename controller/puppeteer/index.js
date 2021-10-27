const puppeteer = require('puppeteer-core')
const config = require('../../config')
const logEvent = require('./exposure/logEvent')
const isRecording = require('./exposure/isRecordng')
const logCurrentElement = require('./exposure/logCurrentElement')
const isSpyVisible = require('./exposure/isSpyVisible')
const setSpyVisible = require('./exposure/setSpyVisible')
const ElementSelector = require('../../ptLibrary/class/ElementSelector')
const captureHtml = require('./exposure/captureHtml')
const path = require('path')
const fs = require('fs').promises
const { RecordingStep, WorkflowRecord } = require('../record/class')
const { getLocator, setLocatorStatus } = require('./exposure/LocatorManager')
const injectModuleScriptBlock = require('./help/injectModuleScriptBlock')
const singlefileScript = require('single-file/cli/back-ends/common/scripts')
const captureScreenshot = require('./exposure/captureScreenshot')
const checkUrlBlackList = require('./help/checkUrlBlacklist')
/**
 * Create a new puppeteer browser instance
 * @param {import('../record/class/index').WorkflowRecord} record
 * @param {import('socket.io').Server} io
 */

const ConstStr = {
    'bluestone-locator': 'bluestone-locator', //This is attribute we used to store locator mapping info
}
/**
 * 
 * @param {import('../record/class').WorkflowRecord} record 
 * @param {*} io 
 * @param {string} url 
 * @returns 
 */
async function startRecording(record, io, url = null) {
    const browser = await puppeteer.launch(config.puppeteer)
    const page = await browser.newPage();


    //update io for record
    record.puppeteer.setIO(io)
    record.puppeteer.setBrowser(browser)
    record.puppeteer.setPage(page)
    //inject event watcher and expose supporting function
    let eventRecorderPath = path.join(__dirname, './injection/eventRecorder.js')
    await injectModuleScriptBlock(page, eventRecorderPath)

    //inject singlepage
    const injectedScript = await singlefileScript.get(config.puppeteer);
    await page.evaluateOnNewDocument(injectedScript)



    await page.exposeFunction('logEvent', logEvent(record, browser, page, io))
    await page.exposeFunction('isRecording', isRecording(record))
    await page.exposeFunction('logCurrentElement', logCurrentElement(record, page))
    await page.exposeFunction('getLocator', getLocator(record))
    await page.exposeFunction('setLocatorStatus', setLocatorStatus(record))
    await page.exposeFunction('isSpyVisible', isSpyVisible(record))
    await page.exposeFunction('setSpyVisible', setSpyVisible(record))
    await page.exposeFunction('captureHtml', captureHtml(page, record))
    await page.exposeFunction('captureScreenshot', captureScreenshot(page, record))


    await page.setBypassCSP(true)


    if (url != null) await page.goto(url)
    let eventStep = new RecordingStep({ command: 'goto', target: url })
    eventStep.parameter = url
    eventStep.finalLocator = 'FAKE locator to avoid check'
    eventStep.finalLocatorName = 'FAKE locator name to avoid check'
    logEvent(record)(eventStep)

    await page.setRequestInterception(true)

    page.on('request', async request => {
        if (request.isNavigationRequest()) {
            let isRecording = record.isRecording
            await page.waitForTimeout(1000);
            if (checkUrlBlackList(request.url())) {
                await request.abort('aborted')
            }
            else if (record.htmlCaptureStatus.isHtmlCaptureOngoing) {
                //stop capture if navigation pending
                record.isRecording = false


                while (record.htmlCaptureStatus.isHtmlCaptureOngoing && record.picCapture.isCaptureOngoing) {
                    await new Promise(resolve => { setTimeout(resolve, 500) })
                }
                await request.abort('aborted')
                record.navigation.initialize(request.url(), request.method(), request.postData(), request.headers(), isRecording)

                await page.goto(request.url())
            }
            else if (record.navigation.isPending) {
                //handle navigation
                let data = record.navigation.getCurrentNavigationData()
                request.continue(data)
                record.navigation.complete()
                //resume the capture
                record.isRecording = record.navigation.isRecording
            }
            else {
                request.continue()
            }


        } else {
            request.continue();
        }
    })



    return { browser, page }
}
/**
 * Close the puppeteer browser
 * @param {import('puppeteer').Browser} browser 
 */
async function endRecording(browser) {
    await browser.close()
}

/**
 * switch in-browser spy
 * @param {import('puppeteer').Page} page 
 */
async function hideSpy(page, isSpyVisible) {
    if (isSpyVisible == true) return

    //if spy is invisible, set attribute
    //the fist time we run it, page object may not be ready

    await page.bringToFront()


}

module.exports = { startRecording, endRecording, hideSpy, }