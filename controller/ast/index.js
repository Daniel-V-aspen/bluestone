const fs = require('fs').promises
const acorn = require("acorn");
const walk = require("./lib/walk")
const extract = require('extract-comments')
const { JsDocSummary, JsDocEntry } = require('./class/JsDocSummary')
const doctrine = require("doctrine");
const path = require('path')
const FunctionAST = require('./class/Function')
const BsFunc = require('./class/BsFunc')
const Locator = require('../locator/class/Locator')
class AST {
    /**
     * 
     * @param {string} locatorPath the path of the locator summary
     */
    constructor(locatorPath, funcPath) {
        this.__locatorPath = locatorPath
        /** @type {Array<FunctionAST>} */
        this.__funcRepo = []
    }
    /**
     * Push current func ast to the repo
     * @param {FunctionAST} funcAst 
     */
    __addFuncAstToRepo(funcAst) {
        //get rid of function whose id is similar to what we try to add
        this.__funcRepo = this.__funcRepo.filter(item => {
            return item.name != funcAst.name
        })
        this.__funcRepo.push(funcAst)
    }
    get funcRepo() {
        return this.__funcRepo
    }
    getFunction(name) {
        let func = this.__funcRepo.find(item => {
            return item.name == name
        })
        return func
    }
    /**
     * @param {string} funcPath
     * Based on the bluestone-func.js, parse function information
     * 
     */
    async loadFunctions(funcPath) {
        let jsStr = (await fs.readFile(funcPath)).toString()
        let ast = acorn.parse(jsStr, { ecmaVersion: 2020 })

        let bsFunction = require(funcPath)
        let functionKeys = Object.keys(bsFunction)

        let requireInfo = await this.__getRequireInfo(ast, funcPath)



        for (let i = 0; i < functionKeys.length; i++) {
            let funcName = functionKeys[i]
            //extract dynamic function info
            let mainFunc = bsFunction[funcName].func
            let locators = bsFunction[funcName].locators

            //extract static function info for current call
            let funcStaicInfo = await this.__getBsFuncInfo(ast, funcName)
            //Based on the static library and method name, correlate dynamic info
            let methodDetail = requireInfo.repo.find(info => {
                return info.libraryName == funcStaicInfo.libraryName && info.methodName == funcStaicInfo.methodName
            })



            let functionAst = new FunctionAST(funcPath, funcName, methodDetail.methodDescription, methodDetail.jsDocTag, locators, mainFunc)
            this.__addFuncAstToRepo(functionAst)



        }

    }

    /**
     * Get all require inforamtion
     * @param {acorn.Node} ast 
     * @param {string} funcPath
     * @returns {JsDocSummary}
     */
    async __getRequireInfo(ast, funcPath) {
        let result = walk(ast, (node, ancestor) => {
            return (node.type == 'CallExpression') && node.callee.name == 'require' && node.arguments[0].type == 'Literal'
        })
        let jsFolder = path.dirname(funcPath)
        let jsDocSummary = new JsDocSummary()
        for (let i = 0; i < result.length; i++) {
            let item = result[i]
            let libraryName = item.ancestors[1].id.name
            let filePath = path.join(jsFolder, item.node.arguments[0].value)
            if (!filePath.toLowerCase().endsWith('.js')) {
                filePath += '.js'
            }
            let funcJs = (await fs.readFile(filePath))
            funcJs = funcJs.toString()

            const commentObj = extract(funcJs, {})


            commentObj.forEach(comment => {
                //only worry about the comment for the export function
                if (comment.type != 'BlockComment' || comment.code.context == null || comment.code.context.receiver != 'exports') {
                    return
                }
                let methodName = comment.code.context.name
                let standardizedCommentStr = comment.value.split("\r\n").join('\n')
                let commentAST = doctrine.parse(standardizedCommentStr, { unwrap: true })

                //rearrange the parameter string so that it will align with the order
                commentAST = this.__rearrangeJsDocSequence(comment.code.value, commentAST)


                let methodDescription = commentAST.description

                let jsDocEntry = new JsDocEntry(filePath, libraryName, methodName, methodDescription, commentAST.tags)
                jsDocSummary.add(jsDocEntry)

            })
        }

        return jsDocSummary
    }

    /**
     * Based on the bluestone function static info, return library name and method name
     * @param {*} ast 
     * @param {string} funcName 
     * @returns {BsFunc}
     */
    async __getBsFuncInfo(ast, funcName) {
        //extract static function info
        let currentNodeList = walk(ast, (node, ancestors) => {
            let parentAncestorIndex = ancestors.length - 2
            return node.type == 'Identifier' && node.name == funcName && ancestors[parentAncestorIndex].type == 'Property'
        })
        if (currentNodeList.length != 1) {
            throw "Cannot find node specified. Need fix!"
        }


        let currentNode = currentNodeList[0]
        //get current function signature
        //go to parent node
        let parentNodeIndex = currentNode.ancestors.length - 2
        let parentNode = currentNode.ancestors[parentNodeIndex]
        let funcNode = parentNode.value.properties.find(item => { return item.key.name == 'func' })

        let libraryName = funcNode.value.object.name
        let methodName = funcNode.value.property.name
        let bsFunc = new BsFunc(libraryName, methodName)
        return bsFunc

    }
    /**
     * Rearrange jsdoc sequence based on function signature. If jsdoc does not allign with number of function signature, return error
     * @param {string} funcSignature 
     * @param {doctrine.Annotation} commentAST
     * @returns {doctrine.Annotation}
     */
    __rearrangeJsDocSequence(funcSignature, commentAST) {
        let parameterStr = funcSignature.replace(/.*\(/g, '').replace(/\).*/g, '')
        let parameters = parameterStr.split(',')
        let reArrangedTag = []
        let paramTags = commentAST.tags.filter(item => { return item.title == 'param' })
        //conduct parameter count check
        if (parameters.length != paramTags.length) {
            throw `number of elements from function: ${funcSignature} does not match number of params in jsDoc.`
        }

        //rearrange the parameters
        parameters.forEach(item => {
            let tag = commentAST.tags.find(tag => { return tag.name == item.trim() })
            reArrangedTag.push(tag)
        })



        commentAST.tags = reArrangedTag
        return commentAST

    }
}

module.exports = AST