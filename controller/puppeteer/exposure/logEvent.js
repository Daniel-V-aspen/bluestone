const { RecordingStep, COMMAND_TYPE, WorkflowRecord } = require('../../record/class/index')

const jimp = require('jimp')
/**
 * 
 * @param {import('../../record/class/index').WorkflowRecord} recordRepo 
 * @param {import('puppeteer-core').Page} page
 * @param {import('socket.io').Server} io
 */
module.exports = function (recordRepo, page, io) {
    /**
     * Log browser event to the cache
     * @param {import('../../record/class').RecordingStep} eventDetail 
     */
    async function logEvent(eventDetail) {

        //goto command does not generate a locator, we w

        let picturePath = ''
        //handle screenshot
        if (page != null) {
            picturePath = recordRepo.getPicPath()
            page.screenshot({ path: picturePath, captureBeyondViewport: false })
                .then(() => {
                    if (eventDetail.command == COMMAND_TYPE.goto) return Promise.reject('GOTO')
                    return jimp.read(picturePath)
                })
                .then(pic => {

                    if (eventDetail.command == null) {
                        //for in-browser agent call
                        return pic.crop(recordRepo.ui.spy.browserSelection.x, recordRepo.ui.spy.browserSelection.y, recordRepo.ui.spy.browserSelection.width, recordRepo.ui.spy.browserSelection.height);
                    }
                    else {
                        //for ordinary event, just crop as usual
                        return pic.crop(eventDetail.pos.x, eventDetail.pos.y, eventDetail.pos.width, eventDetail.pos.height);
                    }

                })
                .then(pic => {
                    return pic.writeAsync(picturePath)
                })
                .catch(err => {
                    console.log(err)
                })
        }


        //if event command is null, call the in-browser console
        if (eventDetail.command == null) {
            recordRepo.spyBrowserSelectionPicPath = picturePath
            recordRepo.isRecording = false
            console.log('pause recording and call in-browser agent')
            //display mvt console
            page.evaluate("document.querySelector('#bluestone_inbrowser_console').style.display='block'")
            recordRepo.spyVisible = true

        }
        if (recordRepo.isRecording) {
            //If we don't have page element, this indicates that it is a non-UI operation,
            //we will not calculate timeout
            let timeoutMs = null
            if (page != null) {
                timeoutMs = Date.now() - recordRepo.ui.spy.browserSelection.lastOperationTime
            }
            eventDetail.timeoutMs = timeoutMs
            //calculate timeout by subtracting current time to the time from previous step

            eventDetail.targetPicPath = picturePath
            let event = new RecordingStep(eventDetail)

            recordRepo.addStep(event)
            console.log(JSON.stringify(recordRepo.steps))
            //update last operation time
        }

        setTimeout(() => {
            try {
                io.emit(WorkflowRecord.inbuiltEvent.refresh)
            } catch (error) {
                console.log(error)
            }
        }, 800);


    }
    return logEvent
}

