const axios = require('axios').default
const { json } = require('express')
const testConfig = require('../testConfig')
const app = require('../../site/app').server
class TestSite {
    constructor() {
        this.url = `http://localhost:${testConfig.testSite.port}`
        this.singlePageHappyPath = `${this.url}/site/singlePageHappyPath.html`
        this.locator_test_page_1 = `${this.url}/site/locator-1.html`
        this.app = null
    }

    async launchApp() {
        return new Promise((resolve) => {
            try {
                this.app = app.listen(testConfig.testSite.port, () => {
                    resolve()
                })
            } catch (error) {
                console.log()
            }

        })
    }
    async closeApp() {
        return new Promise((resolve) => {
            this.app.close()

            resolve()
        })
    }
    async getMainPage() {
        let res = await axios.get(`${this.url}`)
        return res
    }
    /**
     * 
     * @param {'keydown'|'click'|'change'|'mouseover'|'submit'} event event name
     * @param {*} target the id of the target
     * @param {*} arg additional argument you want to parse in
     * @returns 
     */
    async sendOperation(event, target, arg = '') {
        let res = await axios.post(`${this.url}/operation`, {
            event: event,
            target: target,
            arg: JSON.stringify(arg)
        })

        return res
    }
    async callBluestoneTab(target) {

        let res = null
        await this.sendOperation('mouseover', target)
        res = await axios.post(`${this.url}/operation`, {
            event: 'keydown',
            target: target,
            arg: JSON.stringify({
                ctrlKey: true,
                key: 'q'
            })
        })

        return res
    }

    async sendSpy(param, value) {
        let res = await axios.get(`http://localhost:${testConfig.bluestone.port}/spy?${param}=${value}`)
        return res
    }
    async sendSpy2(params) {
        let paramsStr = ''
        try
        {
            for(let key in params)
                paramsStr += `${key}=${params.key}&`
            paramsStr = '?' + paramsStr.substring(0, paramsStr.length-1)
        } catch (error){
            
        }
        let res = await axios.get(`http://localhost:${testConfig.bluestone.port}/spy?${params}`)
        return res
    }
    

    async sendWorkflow(param, value) {
        let res = await axios.get(`http://localhost:${testConfig.bluestone.port}/workflow?${param}=${value}`)
        return res
    }
}
module.exports = TestSite