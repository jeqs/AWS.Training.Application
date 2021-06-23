const sqsManager = require("./../utilities/sqsManager");
const util = require("./../utilities/common")

const messageRequestDto = require("./../contracts/messageRequestDto");
const auditoryDto = require("./../contracts/auditoryDto");
const sqsAuditory = process.env.QUEUE_AUDITORY;

module.exports.handler = async (event, context) => {
    var data = JSON.parse(event.body);
    var msgId = context.awsRequestId;  
  
    try {       
        var infoRequest = new messageRequestDto();
        if(!infoRequest.isLoad(data)){
          return util.cargaClientResponse(400,"Invalid Request!", data);
        }

        var infoAuditory = new auditoryDto(msgId,"Init", infoRequest, {});        
        var resultAudit = await sqsManager.sendMessage(context, infoAuditory, sqsAuditory);
        util.insertLog("Result envío SQS Auditoria: " + JSON.stringify(resultAudit));

        return util.cargaClientResponse(200,"Solicitud recibida", data);
    } catch (err) {
      util.insertLog("Error en testAuditoryControllerHandler: " + err);
      return util.cargaClientResponse(500,"" + err, data);
    }   
};
