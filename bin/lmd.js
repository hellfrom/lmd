/**
 * LMD
 *
 * @author  Mikhail Davydov
 * @licence MIT
 */


new (require(__dirname + '/lmd_builder.js'))((function () {
    var modes = ['watch'];

    return modes.indexOf(process.argv[2]) >= 0 ?  {
        mode: process.argv[2],
        config: process.argv[3],
        output: process.argv[4],
        version: process.argv[5]
    } : {
        mode: 'main',
        config: process.argv[2],
        output: process.argv[3],
        version: process.argv[4]
    };
})());