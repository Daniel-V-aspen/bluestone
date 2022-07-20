const puppeteer = require('puppeteer')
const bluestoneFunc = require('../../../ptLibrary/bluestone-func')
const puppeteerSupport = require('../support/puppeteer')
const TestSite = require('../support/testSite.support')
let Bluestone = require('../support/bluestoneBackend')
let siteBackend = new TestSite()
let bluestoneBackend = new Bluestone()
let testConfig = require('../testConfig')
let fs = require('fs').promises
const fsCb = require('fs')
const path = require('path')
const assert = require('assert')
const { background } = require('jimp')
const locator = puppeteerSupport.Locator.Operation
describe('Smoke Test - Operation Page', () => {
    const suite = this;
    beforeEach(async function () {
        this.timeout(60000)
        siteBackend = new TestSite()
        await siteBackend.launchApp()
        bluestoneBackend = new Bluestone()
        await bluestoneBackend.launchApp()
    })
    afterEach(function (done) {
        this.timeout(120000)
        siteBackend.closeApp()
            .then(() => {
                return bluestoneBackend.stopRecording()
            })
            .then(() => {
                return bluestoneBackend.closeApp()
            })
            .then(() => {
                done()
            })
            .catch(err => {
                console.log(err)
            })
    })
    after(function (done) {
        this.timeout(12000);

        let directory = path.join(__dirname, '../../../public/temp/componentPic')
        fsCb.readdir(directory, (err, files) => {
            if (err) throw err;
            let deleteQueue = []
            for (const file of files) {
                if (file == '.placeholder') continue

                deleteQueue.push(fs.unlink(path.join(directory, file)))
            }
            //wait until all delete is done
            Promise.all(deleteQueue)
                .then(() => {
                    done()
                })
                .catch(err => {
                    console.log(err)
                })



        });
    })
    it('should launch bluestone test environment', async function () {
        this.timeout(999999)
        let happyPathPage = testConfig.testSite.page.happypath
        await bluestoneBackend.startRecording(siteBackend.singlePageHappyPath)
        await siteBackend.sendOperation('click', happyPathPage.header)
        await siteBackend.sendOperation('change', happyPathPage.text_input_first_name, 'Wix')
        await siteBackend.sendOperation('change', happyPathPage.text_input_last_name, 'Woo')
        await siteBackend.sendOperation('click', happyPathPage.button_submit_form)
        await new Promise(resolve => setTimeout(resolve, 500))
        await siteBackend.callBluestoneTab(happyPathPage.header)

        await new Promise(resolve => setTimeout(resolve, 999999))


    })
    it('should change selector in the backend once selector value is changed in the bluestone console', async function () {
        this.timeout(39999)
        let happyPathPage = testConfig.testSite.page.happypath
        await bluestoneBackend.startRecording(siteBackend.singlePageHappyPath)
        await siteBackend.sendOperation('click', happyPathPage.header)
        await siteBackend.sendOperation('change', happyPathPage.text_input_first_name, 'Wix')
        await siteBackend.sendOperation('change', happyPathPage.text_input_last_name, 'Woo')
        await siteBackend.sendOperation('click', happyPathPage.button_submit_form)
        await new Promise(resolve => setTimeout(resolve, 500))
        await siteBackend.callBluestoneTab(happyPathPage.header)
        // await new Promise(resolve => setTimeout(resolve, 999999))

        const browser = await puppeteer.launch(puppeteerSupport.config);
        const page = await browser.newPage();
        await bluestoneFunc.goto.func(page, bluestoneBackend.operationUrl)
        await bluestoneFunc.waitElementExists.func(page, puppeteerSupport.Locator.Operation['First Dropdown'], 21467);
        await bluestoneFunc.click.func(page, puppeteerSupport.Locator.Operation['First Dropdown']);
        await bluestoneFunc.waitElementExists.func(page, puppeteerSupport.Locator.Operation['Verify Button'], 3000);
        await bluestoneFunc.click.func(page, puppeteerSupport.Locator.Operation['Verify Button']);

        await new Promise(resolve => setTimeout(resolve, 1500))
        let data = await bluestoneBackend.getBackendOperation()
        assert.deepEqual(data.data.currentSelector, '5566', 'The selector value does not change')

    })

    it('UI Operation, Smoke test add step happy path change argument', async function () {
        this.timeout(39999)
        let happyPathPage = testConfig.testSite.page.happypath
        await bluestoneBackend.startRecording(siteBackend.singlePageHappyPath)
        await siteBackend.sendOperation('click', happyPathPage.header)
        await siteBackend.sendOperation('change', happyPathPage.text_input_first_name, 'Wix')
        await siteBackend.sendOperation('change', happyPathPage.text_input_last_name, 'Woo')
        await siteBackend.sendOperation('click', happyPathPage.button_submit_form)
        await new Promise(resolve => setTimeout(resolve, 500))
        await siteBackend.callBluestoneTab(happyPathPage.header)

        const browser = await puppeteer.launch(puppeteerSupport.config);
        const page = await browser.newPage();
        await bluestoneFunc.goto.func(page, bluestoneBackend.operationUrl)
        
        //Change operation Group using UI        
        await bluestoneFunc.click.func(page, puppeteerSupport.Locator.Operation.DropDnMenu1)
        await bluestoneFunc.click.func(page, puppeteerSupport.Locator.Operation.DropDnMenu1_Verify)
        await new Promise(resolve => setTimeout(resolve, 500))
        let userSelection = await bluestoneBackend.getUserSelection()
        assert.deepEqual(userSelection['currentGroup'], 'assert', `The current operation was not added in the UI Operation`)

        //Change operation using UI   
        await bluestoneFunc.click.func(page, puppeteerSupport.Locator.Operation.DropDnMenu2)
        await bluestoneFunc.click.func(page, puppeteerSupport.Locator.Operation.DropDnMenu1_TxtEqual)
        await new Promise(resolve => setTimeout(resolve, 500))
        userSelection = await bluestoneBackend.getUserSelection()
        assert.deepEqual(userSelection['currentOperation'], 'testTextEqual', `The current group was not added in the UI Operation`)

        //Changin Argument txt using UI
        await bluestoneFunc.click.func(page, puppeteerSupport.Locator.Operation.argumentInput_0)
        await bluestoneFunc.change.func(page, puppeteerSupport.Locator.Operation.argumentInput_0, 'Test')
        await bluestoneFunc.keydown.func(page, 'Enter')
        await new Promise(resolve => setTimeout(resolve, 500))
        userSelection = await bluestoneBackend.getUserSelection()
        assert.deepEqual(userSelection['currentArgument'][0], 'Test', `The Argument 0 must be updated`)

        await bluestoneFunc.click.func(page, puppeteerSupport.Locator.Operation.btn_AddStep)
        
        await new Promise(resolve => setTimeout(resolve, 500))
        let step = await bluestoneBackend.getSteps()

        assert.deepEqual(step.data[step.data.length-1].command, 'testTextEqual', 'The testTextEqual step was not added')
        //assert.deepEqual(step.data[step.data.length-1].functionAst.params[2].pugType, 'Test', `The Argument 0 must be added in the step`)
    })

    it('UI Operation Spy Current Group should change accourding with the selected group', async function () {
        this.timeout(39999)
        let happyPathPage = testConfig.testSite.page.happypath
        await bluestoneBackend.startRecording(siteBackend.singlePageHappyPath)
        await siteBackend.sendOperation('click', happyPathPage.header)
        await siteBackend.sendOperation('change', happyPathPage.text_input_first_name, 'Wix')
        await siteBackend.sendOperation('change', happyPathPage.text_input_last_name, 'Woo')
        await siteBackend.sendOperation('click', happyPathPage.button_submit_form)
        await new Promise(resolve => setTimeout(resolve, 500))
        await siteBackend.callBluestoneTab(happyPathPage.header)

        const browser = await puppeteer.launch(puppeteerSupport.config);
        const page = await browser.newPage();
        await bluestoneFunc.goto.func(page, bluestoneBackend.operationUrl)
        //await bluestoneFunc.change.func(page, puppeteerSupport.Locator.Operation.DropDnMenu1, 'Verify')
        
        let operationGroup = await bluestoneBackend.getOperationGroup()
        let operationLst = Object.keys(operationGroup)
        for (let i = 0; i< operationLst.length; i++)
        {
            let group = operationLst[i]
            await siteBackend.sendSpy('currentGroup',group)
            await new Promise(resolve => setTimeout(resolve, 500))
            let userSelection = await bluestoneBackend.getUserSelection()
            assert.deepEqual(userSelection['currentGroup'], group, `The current group was not added in the UI Operation`)
        }
    })

    it('UI Operation Spy Current Operation should change accourding with the selected operation', async function () {
        this.timeout(39999)
        let happyPathPage = testConfig.testSite.page.happypath
        await bluestoneBackend.startRecording(siteBackend.singlePageHappyPath)
        await siteBackend.sendOperation('click', happyPathPage.header)
        await siteBackend.sendOperation('change', happyPathPage.text_input_first_name, 'Wix')
        await siteBackend.sendOperation('change', happyPathPage.text_input_last_name, 'Woo')
        await siteBackend.sendOperation('click', happyPathPage.button_submit_form)
        await new Promise(resolve => setTimeout(resolve, 500))
        await siteBackend.callBluestoneTab(happyPathPage.header)

        const browser = await puppeteer.launch(puppeteerSupport.config);
        const page = await browser.newPage();
        await bluestoneFunc.goto.func(page, bluestoneBackend.operationUrl)
        //await bluestoneFunc.change.func(page, puppeteerSupport.Locator.Operation.DropDnMenu1, 'Verify')
        
        let operationGroup = await bluestoneBackend.getOperationGroup()
        let operationLst = Object.keys(operationGroup)

        for (let i = 0; i< operationLst.length; i++)
        {
            let group = operationLst[i]
            await siteBackend.sendSpy('currentGroup',group)
            for (let j = 0; j<operationGroup[group].operations.length; j++)
            {
                let operation = operationGroup[group].operations[j].name
                await siteBackend.sendSpy('currentOperation',operation)
                await new Promise(resolve => setTimeout(resolve, 500))
                let userSelection = await bluestoneBackend.getUserSelection()
                assert.deepEqual(userSelection['currentOperation'], operation, `The current operation was not added in the UI Operation`)
            }
        }
    })

    it('UI Operation Add step without target', async function () {
        this.timeout(999999)
        let happyPathPage = testConfig.testSite.page.happypath
        await bluestoneBackend.startRecording(siteBackend.singlePageHappyPath)
        await siteBackend.sendOperation('click', happyPathPage.header)
        await siteBackend.sendOperation('change', happyPathPage.text_input_first_name, 'Wix')
        await siteBackend.sendOperation('change', happyPathPage.text_input_last_name, 'Woo')
        await siteBackend.sendOperation('click', happyPathPage.button_submit_form)
        await new Promise(resolve => setTimeout(resolve, 500))
        await siteBackend.callBluestoneTab(happyPathPage.header)

        const browser = await puppeteer.launch(puppeteerSupport.config);
        const page = await browser.newPage();
        await bluestoneFunc.goto.func(page, bluestoneBackend.operationUrl)

        await bluestoneFunc.waitElementExists.func(page, puppeteerSupport.Locator.Operation['txtSelector'], 21467);
        await bluestoneFunc.change.func(page, puppeteerSupport.Locator.Operation['txtSelector'], '')
        await bluestoneFunc.keydown.func(page,'Enter')

        await new Promise(resolve => setTimeout(resolve, 500))
        let data = await bluestoneBackend.getBackendOperation()

        //Send Group 0
        let operationGroup = await bluestoneBackend.getOperationGroup()
        let operationLst = Object.keys(operationGroup)
        await siteBackend.sendSpy('currentGroup',operationLst[0])
        await new Promise(resolve => setTimeout(resolve, 500))

        //Send Group 0 Operation 0
        let operation = operationGroup[operationLst[0]].operations[0].name
        await siteBackend.sendSpy('currentOperation',operation)
        await new Promise(resolve => setTimeout(resolve, 500))

        //Add step
        await siteBackend.sendSpy('btnAddStep','')
        await new Promise(resolve => setTimeout(resolve, 500))

        //Maybe should be a message that there is no target, right now there is no validation

    })

    it('UI Operation Add step without operation group', async function () {
        this.timeout(13999)
        let happyPathPage = testConfig.testSite.page.happypath
        await bluestoneBackend.startRecording(siteBackend.singlePageHappyPath)
        await siteBackend.sendOperation('click', happyPathPage.header)
        await siteBackend.sendOperation('change', happyPathPage.text_input_first_name, 'Wix')
        await siteBackend.sendOperation('change', happyPathPage.text_input_last_name, 'Woo')
        await siteBackend.sendOperation('click', happyPathPage.button_submit_form)
        await new Promise(resolve => setTimeout(resolve, 500))
        await siteBackend.callBluestoneTab(happyPathPage.header)

        const browser = await puppeteer.launch(puppeteerSupport.config);
        const page = await browser.newPage();
        await bluestoneFunc.goto.func(page, bluestoneBackend.operationUrl)

        await new Promise(resolve => setTimeout(resolve, 500))

        //Add step
        await siteBackend.sendSpy('btnAddStep','')
        await new Promise(resolve => setTimeout(resolve, 500))

        let validation = await bluestoneBackend.getSpyKey('validation')
        
        await new Promise(resolve => setTimeout(resolve, 500))
        assert.deepEqual(validation.btnAddStep,'Please input group info', 'Error related with the operation missing')
    })

    it('UI Operation Add step without operation', async function () {
        this.timeout(19999)
        let happyPathPage = testConfig.testSite.page.happypath
        await bluestoneBackend.startRecording(siteBackend.singlePageHappyPath)
        await siteBackend.sendOperation('click', happyPathPage.header)
        await siteBackend.sendOperation('change', happyPathPage.text_input_first_name, 'Wix')
        await siteBackend.sendOperation('change', happyPathPage.text_input_last_name, 'Woo')
        await siteBackend.sendOperation('click', happyPathPage.button_submit_form)
        await new Promise(resolve => setTimeout(resolve, 500))
        await siteBackend.callBluestoneTab(happyPathPage.header)

        const browser = await puppeteer.launch(puppeteerSupport.config);
        const page = await browser.newPage();
        await bluestoneFunc.goto.func(page, bluestoneBackend.operationUrl)

        await new Promise(resolve => setTimeout(resolve, 500))

    
        let operationGroup = await bluestoneBackend.getOperationGroup()
        let operationLst = Object.keys(operationGroup)
        for (let i = 0; i< operationLst.length; i++)
        {
            let group = operationLst[i]
            await siteBackend.sendSpy('currentGroup',group)
            await new Promise(resolve => setTimeout(resolve, 500))
            let userSelection = await bluestoneBackend.getUserSelection()
            //Add step
            await siteBackend.sendSpy('btnAddStep','')
            await new Promise(resolve => setTimeout(resolve, 500))

            let validation = await bluestoneBackend.getSpyKey('validation')

            assert.deepEqual(validation.btnAddStep,'Please input operation info', 'Error related with the operation missing')
        }
    })

    it('UI Operation Add step without argument (No validation)', async function () {
        this.timeout(999999)
        let happyPathPage = testConfig.testSite.page.happypath
        await bluestoneBackend.startRecording(siteBackend.singlePageHappyPath)
        await siteBackend.sendOperation('click', happyPathPage.header)
        await siteBackend.sendOperation('change', happyPathPage.text_input_first_name, 'Wix')
        await siteBackend.sendOperation('change', happyPathPage.text_input_last_name, 'Woo')
        await siteBackend.sendOperation('click', happyPathPage.button_submit_form)
        await new Promise(resolve => setTimeout(resolve, 500))
        await siteBackend.callBluestoneTab(happyPathPage.header)

        const browser = await puppeteer.launch(puppeteerSupport.config);
        const page = await browser.newPage();
        await bluestoneFunc.goto.func(page, bluestoneBackend.operationUrl)

        await new Promise(resolve => setTimeout(resolve, 500))

        //Send Operation Group
        let operationGroup = await bluestoneBackend.getOperationGroup()
        let operationLst = Object.keys(operationGroup)
        let group = operationLst[0]
        await siteBackend.sendSpy('currentGroup',group)

        //Send Operation
        let operation = operationGroup[group].operations[0].name
        await siteBackend.sendSpy('currentOperation',operation)

        await siteBackend.sendSpy2({'currentArgument' : '', 'currentArgumentIndex' : 0})

        //Add step
        await new Promise(resolve => setTimeout(resolve, 500))
        await siteBackend.sendSpy('btnAddStep','')
    })

    //Workflows Add
    //Add step without target .- not validation
    //Add step without operation group .- Done
    //Add step without operation .- Done
    //Add step without argument .- No Validation



    it('UI Operation Run step happy Path', async function () {
        this.timeout(999999)
        let happyPathPage = testConfig.testSite.page.happypath
        await bluestoneBackend.startRecording(siteBackend.singlePageHappyPath)
        await siteBackend.sendOperation('click', happyPathPage.header)
        await siteBackend.sendOperation('change', happyPathPage.text_input_first_name, 'Wix')
        await siteBackend.sendOperation('change', happyPathPage.text_input_last_name, 'Woo')
        await siteBackend.sendOperation('click', happyPathPage.button_submit_form)
        await new Promise(resolve => setTimeout(resolve, 500))
        await siteBackend.callBluestoneTab(happyPathPage.header)

        const browser = await puppeteer.launch(puppeteerSupport.config);
        const page = await browser.newPage();
        await bluestoneFunc.goto.func(page, bluestoneBackend.operationUrl)

        await new Promise(resolve => setTimeout(resolve, 500))

        //Send Operation Group
        let operationGroup = await bluestoneBackend.getOperationGroup()
        let operationLst = Object.keys(operationGroup)
        let group = operationLst[0]
        await siteBackend.sendSpy('currentGroup',group)

        //Send Operation
        let operation = operationGroup[group].operations[0].name
        await siteBackend.sendSpy('currentOperation',operation)

        //Run step
        await new Promise(resolve => setTimeout(resolve, 500))
        await bluestoneFunc.click.func(page, puppeteerSupport.Locator.Operation.btn_Run)
        
        await new Promise(resolve => setTimeout(resolve, 500))
        await new Promise(resolve => setTimeout(resolve, 500))
        await new Promise(resolve => setTimeout(resolve, 500))
        await new Promise(resolve => setTimeout(resolve, 500))
        await new Promise(resolve => setTimeout(resolve, 500))
        await new Promise(resolve => setTimeout(resolve, 500))
        await new Promise(resolve => setTimeout(resolve, 500))
        await new Promise(resolve => setTimeout(resolve, 500))
        await new Promise(resolve => setTimeout(resolve, 500))
        await new Promise(resolve => setTimeout(resolve, 500))
        await new Promise(resolve => setTimeout(resolve, 500))
        await new Promise(resolve => setTimeout(resolve, 500))
        await new Promise(resolve => setTimeout(resolve, 500))
        await new Promise(resolve => setTimeout(resolve, 500))
        await new Promise(resolve => setTimeout(resolve, 500))
        await new Promise(resolve => setTimeout(resolve, 500))
        await new Promise(resolve => setTimeout(resolve, 500))
        await new Promise(resolve => setTimeout(resolve, 500))
        await new Promise(resolve => setTimeout(resolve, 500))
        await new Promise(resolve => setTimeout(resolve, 500))
    })
    //Workflows Run
    //Run step without target
    //Run step without operation group
    //Run step without operation
    //Run step without argument

    //Run Step Fail
    //Run Step pass

    it('UI Operation stop recording and continue recording when press cancel btn', async function () {
        this.timeout(999999)
        let happyPathPage = testConfig.testSite.page.happypath
        await bluestoneBackend.startRecording(siteBackend.singlePageHappyPath)
        await siteBackend.sendOperation('click', happyPathPage.header)
        await siteBackend.sendOperation('change', happyPathPage.text_input_first_name, 'Wix')
        await siteBackend.sendOperation('change', happyPathPage.text_input_last_name, 'Woo')
        await siteBackend.sendOperation('click', happyPathPage.button_submit_form)

        await new Promise(resolve => setTimeout(resolve, 500))
        let isRecording = await bluestoneBackend.getOperationKey('isRecording')
        assert.deepEqual(isRecording, true, 'Blustone should be recording')

        await siteBackend.callBluestoneTab(happyPathPage.header)
        const browser = await puppeteer.launch(puppeteerSupport.config);
        const page = await browser.newPage();
        await bluestoneFunc.goto.func(page, bluestoneBackend.operationUrl)
        
        await new Promise(resolve => setTimeout(resolve, 1000))
        isRecording = await bluestoneBackend.getOperationKey('isRecording')
        assert.deepEqual(isRecording, false, 'Blustone shouldnt be recording')
        
        await bluestoneFunc.click.func(page, puppeteerSupport.Locator.Operation.btn_Cancel)
        await new Promise(resolve => setTimeout(resolve, 1000))
        isRecording = await bluestoneBackend.getOperationKey('isRecording')
        assert.deepEqual(isRecording, true, 'Blustone should be recording')
        //Validate come back to happy path page
    })


    it('UI Operation test', async function () {
        this.timeout(999999)
        let happyPathPage = testConfig.testSite.page.happypath
        await bluestoneBackend.startRecording(siteBackend.singlePageHappyPath)
        await siteBackend.sendOperation('click', happyPathPage.header)
        await siteBackend.sendOperation('change', happyPathPage.text_input_first_name, 'Wix')
        await siteBackend.sendOperation('change', happyPathPage.text_input_last_name, 'Woo')
        await siteBackend.sendOperation('click', happyPathPage.button_submit_form)

        await new Promise(resolve => setTimeout(resolve, 500))
        let isRecording = await bluestoneBackend.getOperationKey('isRecording')
        assert.deepEqual(isRecording, true, 'Blustone should be recording')

        await siteBackend.callBluestoneTab(happyPathPage.header)
        const browser = await puppeteer.launch(puppeteerSupport.config);
        const page = await browser.newPage();
        await bluestoneFunc.goto.func(page, bluestoneBackend.operationUrl)
        await new Promise(resolve => setTimeout(resolve, 500))
        await new Promise(resolve => setTimeout(resolve, 500))
        await new Promise(resolve => setTimeout(resolve, 500))
        await new Promise(resolve => setTimeout(resolve, 500))
        await new Promise(resolve => setTimeout(resolve, 500))
        await new Promise(resolve => setTimeout(resolve, 500))
        await new Promise(resolve => setTimeout(resolve, 500))
        await new Promise(resolve => setTimeout(resolve, 500))
        await new Promise(resolve => setTimeout(resolve, 500))
        await new Promise(resolve => setTimeout(resolve, 500))
        await new Promise(resolve => setTimeout(resolve, 500))
        await new Promise(resolve => setTimeout(resolve, 500))
        await new Promise(resolve => setTimeout(resolve, 500))
        await new Promise(resolve => setTimeout(resolve, 500))
        await new Promise(resolve => setTimeout(resolve, 500))
        await new Promise(resolve => setTimeout(resolve, 500))
        await new Promise(resolve => setTimeout(resolve, 500))
        await new Promise(resolve => setTimeout(resolve, 500))
        await new Promise(resolve => setTimeout(resolve, 500))
        await new Promise(resolve => setTimeout(resolve, 500))






     
        
        await new Promise(resolve => setTimeout(resolve, 1000))
        isRecording = await bluestoneBackend.getOperationKey('isRecording')
        assert.deepEqual(isRecording, false, 'Blustone shouldnt be recording')
        
        await bluestoneFunc.click.func(page, puppeteerSupport.Locator.Operation.btn_Cancel)
        await new Promise(resolve => setTimeout(resolve, 1000))
        isRecording = await bluestoneBackend.getOperationKey('isRecording')
        assert.deepEqual(isRecording, true, 'Blustone should be recording')
        //Validate come back to happy path page
    })

    it('UI Workflow smoke test edit step', async function () {
        this.timeout(15000)
        let happyPathPage = testConfig.testSite.page.happypath
        await bluestoneBackend.startRecording(siteBackend.singlePageHappyPath)
        await siteBackend.sendOperation('click', happyPathPage.header)
        await siteBackend.sendOperation('change', happyPathPage.text_input_first_name, 'Wix')
        await siteBackend.sendOperation('change', happyPathPage.text_input_last_name, 'Woo')
        await siteBackend.sendOperation('click', happyPathPage.button_submit_form)
        await new Promise(resolve => setTimeout(resolve, 500))
        //Open Operation
        await siteBackend.callBluestoneTab(happyPathPage.header)
        const browser = await puppeteer.launch(puppeteerSupport.config);
        const page = await browser.newPage();
        await bluestoneFunc.goto.func(page, bluestoneBackend.operationUrl)
        await new Promise(resolve => setTimeout(resolve, 1000))

        //Go to Workflow
        let steps = await bluestoneBackend.getSteps()
        await bluestoneFunc.click.func(page, puppeteerSupport.Locator.Operation.btn_WorkFlow)
        await new Promise(resolve => setTimeout(resolve, 1000))

        //Edit step 1
        await bluestoneFunc.click.func(page, puppeteerSupport.Locator.Workflow.btn_EditStep1)
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        //Verify data step 1
        let userSelection = await bluestoneBackend.getUserSelection()
        let operationData = await bluestoneBackend.getBackendOperation()

        assert.deepEqual(userSelection['currentOperation'], steps.data[1].command, `The current operation was not selected in UI Workflow`)
        assert.deepEqual(operationData.data.currentSelector, steps.data[1].target, 'The selector value in Operation doesnt match with the value in step')

        //Change Step 1
        await siteBackend.sendSpy('currentGroup','assert')
        await new Promise(resolve => setTimeout(resolve, 500))
        await siteBackend.sendSpy('currentOperation','testTextEqual')
        await new Promise(resolve => setTimeout(resolve, 500))
        await siteBackend.sendSpy('btnAddStep','')
        await new Promise(resolve => setTimeout(resolve, 500))

        //Verify Step was added
        steps = await bluestoneBackend.getSteps()
        assert.deepEqual(steps.data[steps.data.length-1].command, 'testTextEqual', 'The testTextEqual step was not added')


    })
})