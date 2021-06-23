const sqsManager = require("./../utilities/sqsManager");
const daoManager = require("./../utilities/daoManager");
const util = require("./../utilities/common");

const auditoryDto = require("./../contracts/auditoryDto");
const capacitacionTable = process.env.TABLA_CAPACITACION;
const sqsAuditory = process.env.QUEUE_AUDITORY;

module.exports.handler = async (event, context) => {
  try {

    // Datos de entrada
    var data = JSON.parse(event.body); 
    var msgId = context.awsRequestId;

    // Registra auditoria datos de request
    var params = { TableName: capacitacionTable, Item: data };
    util.insertLog("Objeto para BD: " + JSON.stringify(params));

    // Envia datos a la cola
    var infoAuditory = new auditoryDto(msgId, data);
    var resultAudit = await sqsManager.sendMessage(context,infoAuditory,sqsAuditory);

    // Log resultado envio a la cola
    util.insertLog("Result envío SQS Auditoria: " + JSON.stringify(resultAudit));

    // Enviar a BD
    const response = await daoManager.register(context, params);
    util.insertLog("Result Insert BD: " + JSON.stringify(response));

    // Enviar resultados de envio hacia la BD
    infoAuditory.setRespose(response);
    var resultAudit = await sqsManager.sendMessage(context,infoAuditory,sqsAuditory);

    return response;
  } catch (err) {
    util.insertLog("Error en capacitacionesControllerHandler: " + err);
    return util.cargaMensaje(500, "" + err);
  }
};
