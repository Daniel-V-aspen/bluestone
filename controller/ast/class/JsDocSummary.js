class JsDocEntry {
    /**
     * This class contains summary information for all method in bluestone-func.js
     * @param {string} filePath 
     * @param {string} libraryName 
     * @param {string} methodName 
     * @param {string} methodDescription 
     * @param {import('./JsDocTag')} jsDocTag 
     */
    constructor(filePath, libraryName, methodName, methodDescription, jsDocTag) {
        this.filePath = filePath
        this.libraryName = libraryName
        this.methodName = methodName
        this.methodDescription = methodDescription
        this.jsDocTag = jsDocTag
    }
}

class JsDocSummary {
    constructor() {
        /** @type {Array<JsDocEntry>} */
        this.repo = []
    }
    /**
     * add entry to js doc summary
     * @param {JsDocEntry} entry 
     */
    add(entry) {
        this.repo.push(entry)
    }
}

module.exports = { JsDocSummary, JsDocEntry }