
class auditoryDto {
  constructor(id, request, requestDB, responseDB){
    var currentDate = new Date().toISOString();
    this.id = id;
    this.request  = request;

    this.requestDB = requestDB;
    this.responseDB = responseDB;

    this.registerDate = currentDate;
    this.responseDate = currentDate;
  }

  setRespose(resp) {
    var currentDate = new Date().toISOString();
    this.response  = resp;
    this.responseDate = currentDate;
  }

};

module.exports = auditoryDto;