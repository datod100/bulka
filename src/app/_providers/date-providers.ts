import { Injectable } from '@angular/core';
import { NgbDateAdapter, NgbDateStruct, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { toInteger, padNumber, isNumber } from '@ng-bootstrap/ng-bootstrap/util/util';
import * as moment from 'moment';

@Injectable()
export class NgbDateNativeAdapter extends NgbDateAdapter<Date> {
  fromModel(date: Date): NgbDateStruct {
    return (date && date.getFullYear) ? {year: date.getFullYear(), month: date.getMonth()+1, day: date.getDate()} : null;
  }

  toModel(date: NgbDateStruct): Date {
    if (date){
      var dt = new Date();
      dt.setUTCFullYear(date.year, date.month-1, date.day);
      return dt;
    }else{
      return null;
    }
  }
}

@Injectable()
export class NgbDateCustomParserFormatter extends NgbDateParserFormatter {
  constructor(){
    super();
    moment.locale('en-il');
  }

  parse(value: string): NgbDateStruct {
    var date = moment(value,"DD/MM/YYYY");
    if (date.isValid()){
      let newdate = {day: date.date(), month: date.month()+1, year: date.year()};
      return newdate;
    }else{
      return null;
    }
  }

  format(date: NgbDateStruct): string {
    return date ?
        `${isNumber(date.day) ? padNumber(date.day) : ''}/${isNumber(date.month) ? padNumber(date.month) : ''}/${date.year}` :
        '';
  }
}