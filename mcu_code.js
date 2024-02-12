module.exports = function(RED) {
    function McuFunctionNode(config) {
        RED.nodes.createNode(this,config);
        console.log(config);
    }
    RED.nodes.registerType("mcu_function",McuFunctionNode);
}