const { Browser, ElementHandle } = require('puppeteer-core')
const getBluestonePage = require('./help/getBluestonePage')
/**
 * @param {Browser} browser
 * @param {string} currentLocator
 * @param {string} targetLocator
 */
module.exports = async function (browser, targetLocator, currentLocator) {
    //sidebar is the id for the locatorDefinerpug
    let page = await getBluestonePage(browser)
    //find frame that pointes to temp folder. This is the place where we store html page
    let frame = page.frames().find(item => {
        return item.url().includes('/temp/')
    })
    let errorText = ''
    /** @type {Array<ElementHandle>} */
    let elements

    if (currentLocator.startsWith('/')) {
        try {
            elements = await frame.$x(currentLocator)
        } catch (error) {
            elements = []
        }


    }
    else {
        try {
            elements = await frame.$$(currentLocator)
        } catch (error) {
            elements = []
        }

    }
    if (elements.length == 0) {
        errorText = 'Cannot find locator specified. Please try something else'
    }
    else if (elements.length > 1) {
        errorText = 'More than 1 locator is found. Please try something else'
    }
    else {
        //check if two elements are of the same coordination
        let targetElement = await frame.$(targetLocator)
        let targettBox = await targetElement.boundingBox()
        let currentBox = await elements[0].boundingBox()
        //check if current element is within the target element.
        if (targettBox.height + targettBox.y < currentBox.height + currentBox.y ||
            targettBox.width + targettBox.x < currentBox.width + currentBox.x ||
            targettBox.x > currentBox.x ||
            targettBox.y > currentBox.y
        ) {
            errorText = 'The current element is not contained within target element'
        }

        //check if current element and target element has same inner text. This is important becasue we might use current value for text validation
        let targetText = await targetElement.evaluate(el => el.textContent);
        let currentText = await elements[0].evaluate(el => el.textContent);
        if (errorText == '' && targetText != currentText) {
            errorText = `Inner Text is different. The target locator has inner text "${targetText}" while the current locator has inner text "${currentText}"`
        }
    }
    return errorText



}