const path = require('path')
const mkdirp = require('@fibjs/mkdirp')

exports.setupDevEnv = () => {
    const logRoot = path.resolve(__dirname, '../backends/tmp/logs')
    mkdirp(logRoot)

    // console.add({
    //     type: "console",
    //     // levels: [ console.LOG, console.INFO ]
    // })

    console.add({
        type: "file",
        levels: [
            // console.INFO,
            console.ERROR
        ],
        // 必选项，指定日志输出文件，可使用 s% 指定插入日期位置，不指定则添加在结尾
        path: path.resolve(logRoot, "./errlog_%s.log"),
        // 选项，可选值为 "day", "hour", "minute", "###k", "###m", "###g"，缺省为 "1m"
        split: "1m",
        // 选项，可选范围为 2-128，缺省为 128
        count: 10
    })
    console.add({
        type: "file",
        levels: [ console.LOG, console.INFO ],
        // 必选项，指定日志输出文件，可使用 s% 指定插入日期位置，不指定则添加在结尾
        path: path.resolve(logRoot, "./log_%s.log"),
        // 选项，可选值为 "day", "hour", "minute", "###k", "###m", "###g"，缺省为 "1m"
        split: "1m",
        // 选项，可选范围为 2-128，缺省为 128
        count: 10
    })
}