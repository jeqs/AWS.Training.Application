const sqsManager = require("./../utilities/sqsManager");
const daoManager = require("./../utilities/daoManager");
const util = require("./../utilities/common");
const AWS = require("aws-sdk");

const auditoryDto = require("./../contracts/auditoryDto");
const capacitacionTable = process.env.TABLA_CAPACITACION;
const asistenciaTable = process.env.TABLA_ASISTENCIA;
const personasTable = process.env.TABLA_PERSONAS;
const sqsAuditory = process.env.QUEUE_AUDITORY;

module.exports.handler = async (event, context) => {
  try {

    // Datos de entrada
    var data = JSON.parse(event.body); 
    var msgId = context.awsRequestId;

    // Registra auditoria datos de request
    var params = { TableName: asistenciaTable, Item: data };
    util.insertLog("Objeto para BD: " + JSON.stringify(params));

    // Envia datos a la cola
    var infoAuditory = new auditoryDto(msgId, data);
    var resultAudit = await sqsManager.sendMessage(context, infoAuditory, sqsAuditory);

    // Log resultado envio a la cola
    util.insertLog("Result envío SQS Auditoria: " + JSON.stringify(resultAudit));
    
    // var dbRegion = context.invokedFunctionArn.split(":")[3];
    // var documentClient = new AWS.DynamoDB.DocumentClient({ region: dbRegion });

    const paramsPersona = {
      TableName: personasTable,
      Key: {
        identificacion: data.identificacionpersona,
      },
    };

    // Log request resultado envio a la cola
    infoAuditory = new auditoryDto(msgId, data, paramsPersona);
    resultAudit = await sqsManager.sendMessage(context, infoAuditory, sqsAuditory);
    util.insertLog("Result envío SQS Auditoria Request Dynamo: " + JSON.stringify(resultAudit));

    // Enviar consulta de Persona a BD
    const dataPersona = await daoManager.get(context, paramsPersona);

    infoAuditory = new auditoryDto(msgId, data, paramsPersona, dataPersona);
    resultAudit = await sqsManager.sendMessage(context, infoAuditory, sqsAuditory);
    util.insertLog("Result envío SQS Auditoria Response Dynamo: " + JSON.stringify(resultAudit));

    // Registrar asistencia
    if (dataPersona.estado == 'activo') {
      
      const paramsCapacitacion = {
        TableName: capacitacionTable,
        Key: {
          id: data.identificacioncapacitacion,
        },
      };

      // Log request resultado envio a la cola
      infoAuditory = new auditoryDto(msgId, data, paramsCapacitacion);
      resultAudit = await sqsManager.sendMessage(context, infoAuditory, sqsAuditory);
      util.insertLog("Result envío SQS Auditoria Request Dynamo: " + JSON.stringify(resultAudit));

      // Enviar consulta de Persona a BD
      const dataCapacitacion = await daoManager.get(context, paramsCapacitacion);

      infoAuditory = new auditoryDto(msgId, data, paramsCapacitacion, dataCapacitacion);
      resultAudit = await sqsManager.sendMessage(context, infoAuditory, sqsAuditory);
      util.insertLog("Result envío SQS Auditoria Response Dynamo: " + JSON.stringify(resultAudit));

      if (dataCapacitacion.estado == 'programado') {

          // Enviar Asistencia a BD
          const response = await daoManager.register(context, params);
          util.insertLog("Result Insert BD: " + JSON.stringify(response));

          // Enviar resultados de envio hacia la BD
          infoAuditory.setRespose(response);
          var resultAudit = await sqsManager.sendMessage(context,infoAuditory,sqsAuditory);

          return response;
      }
      else
      {
        return util.cargaMensaje(500, "No es posible registrar la asistencia, estado de la capacitacion es: " + dataCapacitacion.estado);
      }
    }
    else
    {
      return util.cargaMensaje(500, "No es posible registrar la asistencia, estado de la persona es: " + dataPersona.estado);
    }
    
  } catch (err) {
    util.insertLog("Error en asistenciasControllerHandler: " + err);
    return util.cargaMensaje(500, "" + err);
  }
};


/*
[7:16] Luis Alfonso Ruge (Invitado)
    

var AWS = require("aws-sdk");
const documentClient = new AWS.DynamoDB.DocumentClient({​​​​​​​​region:'us-east-2'}​​​​​​​​);


const paramsFil = {​​​​​​​​
    TableName: 'TablaP01',
    FilterExpression: '#user = :user',
    ExpressionAttributeNames: {​​​​​​​​
        '#user': 'usuario',
    }​​​​​​​​,
    ExpressionAttributeValues: {​​​​​​​​
        ':user': 'sambonda',
    }​​​​​​​​,
}​​​​​​​​;
var resultFil= await documentClient.scan(paramsFil, function(err, data) {​​​​​​​​
        if (err) {​​​​​​​​
            console.error(JSON.stringify(err));
        }​​​​​​​​ else {​​​​​​​​
            console.log('Resultado Filtro')
            console.log(data);
        }​​​​​​​​
    }​​​​​​​​).promise();


	
Escaneo de tabla, sin filtro y con límite de registros.


var AWS = require("aws-sdk");
const documentClient = new AWS.DynamoDB.DocumentClient({​​​​​​​​region:'us-east-2'}​​​​​​​​);


var paramsEsc = {​​​​​​​​
    TableName: 'TablaP01',
    Limit:100
}​​​​​​​​;
console.log(paramsEsc) //var resultEsc=
var resultEsc= await documentClient.scan(paramsEsc).promise();
console.log('Resultado Escaneo')
console.log(resultEsc)


	
Consulta estricta por ID


var AWS = require("aws-sdk");
const documentClient = new AWS.DynamoDB.DocumentClient({​​​​​​​​region:'us-east-2'}​​​​​​​​);

var paramsGet = {​​​​​​​​
    TableName : "TablaP01",
    Key: {​​​​​​​​
        id:'e2208e8d-fbd5-4b51-a86d-048049c97ce8'
    }​​​​​​​​
}​​​​​​​​;
try {​​​​​​​​
    const data = await documentClient.get(paramsGet).promise()
    console.log(data)
    return data
  }​​​​​​​​ catch (err) {​​​​​​​​
      console.log(err)
    return err
  }​​​​​​​​


 */